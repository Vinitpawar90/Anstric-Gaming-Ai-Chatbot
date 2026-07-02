import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import agentService from '@/services/agentService';
import { Agent } from '@/types/agent.types';
import { Plus, Loader2, AlertCircle, Trash2, Bot, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DeleteDialogProps {
    agent: Agent | null;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ agent, onConfirm, onCancel, isDeleting }) => {
    if (!agent) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Delete Agent
                        </h3>
                        <p className="text-muted-foreground">
                            Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const AgentListPage: React.FC = () => {
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
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await agentService.getAgents();
            setAgents(data);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to load agents';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNew = () => {
        navigate('/admin/agents/new');
    };

    const handleEdit = (agentId: number) => {
        navigate(`/admin/agents/${agentId}/edit`);
    };

    const handleDeleteClick = (agent: Agent) => {
        setAgentToDelete(agent);
    };

    const handleDeleteConfirm = async () => {
        if (!agentToDelete) return;

        try {
            setIsDeleting(true);
            await agentService.deleteAgent(agentToDelete.id);
            toast.success('Agent deleted successfully');
            setAgents(agents.filter(a => a.id !== agentToDelete.id));
            setAgentToDelete(null);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to delete agent';
            toast.error(errorMsg);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setAgentToDelete(null);
    };

    // Compute agent status from is_active and training_status
    const getAgentStatus = (agent: Agent): string => {
        if (agent.training_status === 'in-progress') {
            return 'training';
        }
        return agent.is_active ? 'active' : 'inactive';
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { label: 'Active', className: 'bg-green-500/10 text-green-500' },
            training: { label: 'Training', className: 'bg-yellow-500/10 text-yellow-500' },
            inactive: { label: 'Inactive', className: 'bg-gray-500/10 text-gray-500' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const canCreateAgent = true;

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Agent Management" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading agents...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && agents.length === 0) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Agent Management" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Failed to Load</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={loadAgents}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader title="Agent Management" user={user} />

            <div className="flex-1 p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">AI Agents</h2>
                        <p className="text-muted-foreground mt-1">
                            Manage your AI assistants
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {agents.length} / 3 slots used
                            </span>
                        </p>
                    </div>

                    {agents.length < 3 && (
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            New Agent
                        </button>
                    )}
                </div>

                {/* Empty State */}
                {agents.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No agents yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Get started by creating your first AI agent
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Create Your First Agent
                        </button>
                    </div>
                ) : (
                    /* Agent List Table */
                    <div className="glass rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                            Agent
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                            Provider & Model
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                            Created
                                        </th>
                                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agents.map((agent) => (
                                        <tr
                                            key={agent.id}
                                            onClick={() => handleEdit(agent.id)}
                                            className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <Bot className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">
                                                            {agent.name}
                                                        </div>
                                                        {agent.description && (
                                                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                                {agent.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="text-sm font-medium text-foreground capitalize">
                                                        {agent.provider}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {agent.model}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(getAgentStatus(agent))}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {formatDate(agent.created_at)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(agent);
                                                        }}
                                                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                                                        title="Delete agent"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                agent={agentToDelete}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default AgentListPage;
