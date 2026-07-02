import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import agentService from '@/services/agentService';
import documentService, { Document } from '@/services/documentService';
import { CreateAgentDto, UpdateAgentDto, TrainingStatusResponse, ANSTRIC_GAMING_DEFAULT_PROMPT } from '@/types/agent.types';
import { ArrowLeft, Loader2, Bot, BookOpen, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { FormData, FormErrors, ActiveTab } from './types';
import AgentConfigForm from './components/AgentConfigForm';
import TrainingProgressPanel from './components/TrainingProgressPanel';
import DocumentPicker from './components/DocumentPicker';
import StatusBadge from './components/StatusBadge';

// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FORM_DATA: FormData = {
    name: '',
    description: '',
    provider: 'groq',
    model: '',
    temperature: 0.7,
    system_prompt: ANSTRIC_GAMING_DEFAULT_PROMPT,
    is_active: true,
};

// ─────────────────────────────────────────────────────────────────────────────

const AgentFormPage: React.FC = () => {
    const { user: authUser } = useAuth();
    const user = authUser ? {
        id: authUser.id.toString(),
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        avatar: authUser.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${authUser.email}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        joinedDate: authUser.created_at || new Date().toISOString(),
        status: 'active' as const,
    } : null;

    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);

    // ── Tab ───────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<ActiveTab>('config');

    // ── Config form state ─────────────────────────────────────────────────────
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({});

    // ── Training tab state ────────────────────────────────────────────────────
    const [documents, setDocuments] = useState<Document[]>([]);
    const [linkedDocIds, setLinkedDocIds] = useState<number[]>([]);
    const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState<TrainingStatusResponse | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Bootstrap ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            setIsFetching(true);
            try {
                const modelsData = await agentService.getProviderModels();
                const grouped: Record<string, string[]> = {};
                modelsData.forEach((item: any) => {
                    if (!grouped[item.provider]) grouped[item.provider] = [];
                    grouped[item.provider].push(item.model_name);
                });
                setAvailableModels(grouped);

                if (isEditMode && id) {
                    await loadAgent(parseInt(id), grouped);
                } else if (grouped['groq']?.length > 0) {
                    setFormData(prev => ({ ...prev, model: grouped['groq'][0] }));
                }
            } catch {
                toast.error('Failed to initialize provider models');
            } finally {
                setIsFetching(false);
            }
        };
        init();
    }, [id, isEditMode]);

    // Auto-select first model when provider changes
    useEffect(() => {
        if (availableModels[formData.provider]?.length > 0 &&
            !availableModels[formData.provider].includes(formData.model)) {
            setFormData(prev => ({ ...prev, model: availableModels[formData.provider][0] }));
        }
    }, [formData.provider, availableModels]);

    // Load training data when tab becomes active
    useEffect(() => {
        if (activeTab === 'training' && isEditMode && id) {
            loadTrainingData(parseInt(id));
        }
    }, [activeTab]);

    // Cleanup polling on unmount
    useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

    // ── Loaders ───────────────────────────────────────────────────────────────
    const loadAgent = async (agentId: number, models?: Record<string, string[]>) => {
        try {
            const agent = await agentService.getAgent(agentId);
            setFormData({
                name: agent.name,
                description: agent.description || '',
                provider: agent.provider,
                model: agent.model,
                temperature: Number(agent.temperature ?? 0.7),
                system_prompt: agent.system_prompt,
                is_active: Boolean(agent.is_active),
            });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load agent');
            navigate('/admin/agents');
        }
    };

    const loadTrainingData = async (agentId: number) => {
        // Stale-While-Revalidate: If we already have docs, don't show the main spinner
        // This makes the UI feel instant while we refresh in the background
        if (documents.length === 0) {
            setIsLoadingDocs(true);
        }

        try {
            const [docsResult, linkedResult, statusResult] = await Promise.allSettled([
                documentService.getDocuments({ status: 'ready', limit: 200 }),
                agentService.getAgentDocuments(agentId),
                agentService.getTrainingStatus(agentId),
            ]);

            if (docsResult.status === 'fulfilled') setDocuments(docsResult.value.documents);
            if (linkedResult.status === 'fulfilled') {
                const ids = linkedResult.value.map((d: any) => d.id);
                setLinkedDocIds(ids);
                // Only reset selected if they haven't been touched yet or are empty
                if (selectedDocIds.length === 0) {
                    setSelectedDocIds(ids);
                }
            }
            if (statusResult.status === 'fulfilled') {
                setTrainingStatus(statusResult.value);
                const s = statusResult.value.status;
                if (s === 'pending' || s === 'in-progress') startPolling(agentId);
            }
        } catch {
            toast.error('Failed to load training data');
        } finally {
            setIsLoadingDocs(false);
        }
    };

    // ── Polling ───────────────────────────────────────────────────────────────
    const startPolling = (agentId: number) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
            try {
                const status = await agentService.getTrainingStatus(agentId);
                setTrainingStatus(status);
                if (status.status === 'completed' || status.status === 'failed') {
                    clearInterval(pollingRef.current!);
                    pollingRef.current = null;
                    setIsTraining(false);
                    if (status.status === 'completed') toast.success('Agent training completed!');
                    else toast.error('Training failed. Check error details.');
                }
            } catch (error) {
                console.error('Polling error (ignoring to retry later):', error);
                // Do not clear the interval on network failures here, 
                // so the user can recover if it's transient
            }
        }, 3000);
    };

    // ── Handlers ──────────────────────────────────────────────────────────────
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Agent name is required';
        if (!formData.provider) newErrors.provider = 'Provider is required';
        if (!formData.model) newErrors.model = 'Model is required';
        if (formData.temperature < 0 || formData.temperature > 1)
            newErrors.temperature = 'Temperature must be between 0 and 1';
        if (!formData.system_prompt.trim()) newErrors.system_prompt = 'System prompt is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) { toast.error('Please fix the errors in the form'); return; }
        try {
            setIsLoading(true);
            if (isEditMode && id) {
                const updateData: UpdateAgentDto = {
                    name: formData.name, description: formData.description,
                    provider: formData.provider, model: formData.model,
                    temperature: formData.temperature, system_prompt: formData.system_prompt,
                    is_active: formData.is_active ? 1 : 0,
                };
                await agentService.updateAgent(parseInt(id), updateData);
                toast.success('Agent updated successfully');
            } else {
                const createData: CreateAgentDto = {
                    name: formData.name, description: formData.description,
                    provider: formData.provider,
                    model: formData.model, temperature: formData.temperature,
                    system_prompt: formData.system_prompt, is_active: formData.is_active ? 1 : 0,
                };
                await agentService.createAgent(createData);
                toast.success('Agent created successfully');
            }
            navigate('/admin/agents');
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} agent`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleTrain = async () => {
        if (!id || selectedDocIds.length === 0) return;
        try {
            setIsTraining(true);
            await agentService.trainAgent(parseInt(id), { documentIds: selectedDocIds });
            toast.success('Training started! Tracking progress…');
            const status = await agentService.getTrainingStatus(parseInt(id));
            setTrainingStatus(status);
            startPolling(parseInt(id));
        } catch (err: any) {
            setIsTraining(false);
            toast.error(err.response?.data?.message || 'Failed to start training');
        }
    };

    const handleRetrain = async () => {
        if (!id) return;
        try {
            setIsTraining(true);
            await agentService.retrainAgent(parseInt(id));
            toast.success('Retraining started…');
            const status = await agentService.getTrainingStatus(parseInt(id));
            setTrainingStatus(status);
            startPolling(parseInt(id));
        } catch (err: any) {
            setIsTraining(false);
            toast.error(err.response?.data?.message || 'Failed to retrain agent');
        }
    };

    const handleUnlinkDocument = async (docId: number) => {
        if (!id) return;
        try {
            await agentService.unlinkAgentDocument(parseInt(id), docId);

            // Remove from linked docs
            setLinkedDocIds(prev => prev.filter(d => d !== docId));

            // Uncheck safely if checked
            setSelectedDocIds(prev => prev.filter(d => d !== docId));

            toast.success('Document unlinked successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to unlink document');
        }
    };

    const handleClearTraining = async () => {
        if (!id) return;
        if (!window.confirm("Are you sure you want to completely clear the training for this agent? All documents will be unlinked and knowledge will be wiped.")) {
            return;
        }
        try {
            setIsTraining(true);
            await agentService.clearAgentTraining(parseInt(id));
            toast.success('Agent training cleared successfully!');
            // Refresh data
            await loadTrainingData(parseInt(id));
            setSelectedDocIds([]);
            setLinkedDocIds([]);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to clear training');
        } finally {
            setIsTraining(false);
        }
    };

    const isActivelyTraining = trainingStatus?.status === 'pending' || trainingStatus?.status === 'in-progress';

    // ── Loading state ─────────────────────────────────────────────────────────
    if (isFetching) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Agent Management" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading agent…</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader title="Agent Management" user={user} />

            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/agents')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Agents</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                {isEditMode ? 'Edit Agent' : 'Create New Agent'}
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                {isEditMode ? 'Update your AI assistant configuration' : 'Configure your new AI assistant'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs — edit mode only */}
                {isEditMode && (
                    <div className="flex gap-1 mb-6 p-1 bg-secondary/20 rounded-xl border border-border/50 w-fit">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'config'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                        >
                            <Settings className="w-4 h-4" />
                            Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('training')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'training'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Training
                            {trainingStatus && <StatusBadge status={trainingStatus.status} />}
                        </button>
                    </div>
                )}

                {/* Config Tab */}
                {activeTab === 'config' && (
                    <AgentConfigForm
                        formData={formData}
                        errors={errors}
                        isLoading={isLoading}
                        isEditMode={isEditMode}
                        availableModels={availableModels}
                        onInputChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/admin/agents')}
                    />
                )}

                {/* Training Tab */}
                {activeTab === 'training' && isEditMode && (
                    <div className="max-w-5xl space-y-6">
                        {trainingStatus && (
                            <TrainingProgressPanel
                                trainingStatus={trainingStatus}
                                isTraining={isTraining}
                                onRetrain={handleRetrain}
                            />
                        )}
                        <DocumentPicker
                            documents={documents}
                            selectedDocIds={selectedDocIds}
                            linkedDocumentIds={linkedDocIds}
                            isLoadingDocs={isLoadingDocs}
                            isTraining={isTraining}
                            isActivelyTraining={isActivelyTraining ?? false}
                            onToggleDoc={(docId) =>
                                setSelectedDocIds(prev =>
                                    prev.includes(docId) ? prev.filter(d => d !== docId) : [...prev, docId]
                                )
                            }
                            onSelectAll={() => setSelectedDocIds(documents.map(d => d.id))}
                            onDeselectAll={() => setSelectedDocIds([])}
                            onTrain={handleTrain}
                            onClearTraining={handleClearTraining}
                            onUnlinkDoc={handleUnlinkDocument}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentFormPage;
