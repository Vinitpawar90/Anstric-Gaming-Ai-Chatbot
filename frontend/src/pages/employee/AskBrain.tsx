import React, { useState, useEffect, useRef } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';
import {
    Send, Brain, Clock, Sparkles, Loader2, AlertCircle,
    Copy, Check, ChevronDown, Bot, Zap, CheckCircle2
} from 'lucide-react';
import chatService, { ChatMessage, ChatSessionWithSummary, SendMessageResponse } from '@/services/chatService';
import agentService from '@/services/agentService';
import { Agent } from '@/types/agent.types';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SourceDocuments } from '@/components/chat/SourceDocuments';
import MessageRating from '@/components/chat/MessageRating';
import { cn } from '@/lib/utils';

// ─── Agent Selector Dropdown ──────────────────────────────────────────────────

interface AgentSelectorProps {
    agents: Agent[];
    selectedAgent: Agent | null;
    onSelect: (agent: Agent) => void;
    isLoading?: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
    groq: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400',
    openai: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    anthropic: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
    cohere: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
};

const getProviderColor = (provider: string) =>
    PROVIDER_COLORS[provider.toLowerCase()] || 'from-primary/20 to-primary/10 border-primary/30 text-primary';

const AgentSelector: React.FC<AgentSelectorProps> = ({ agents, selectedAgent, onSelect, isLoading }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (agents.length === 0 && !isLoading) return null;

    // If only 1 agent, just show the name without dropdown
    if (agents.length === 1 && selectedAgent) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/20 border border-border/40">
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br border', getProviderColor(selectedAgent.provider))}>
                    <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium text-foreground">{selectedAgent.name}</span>
                <span className="text-xs text-muted-foreground capitalize">({selectedAgent.provider})</span>
            </div>
        );
    }

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 text-left',
                    'bg-secondary/10 hover:bg-secondary/20 border-border/40 hover:border-primary/30',
                    isOpen && 'bg-secondary/20 border-primary/30 shadow-sm shadow-primary/10'
                )}
            >
                {selectedAgent ? (
                    <>
                        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br border flex-shrink-0', getProviderColor(selectedAgent.provider))}>
                            <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">{selectedAgent.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize leading-none">{selectedAgent.provider} · {selectedAgent.model.split('/').pop()}</p>
                        </div>
                    </>
                ) : (
                    <span className="text-sm text-muted-foreground">Select an agent...</span>
                )}
                <ChevronDown className={cn('w-4 h-4 text-muted-foreground ml-1 flex-shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 z-50 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2">
                        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                            Available Agents ({agents.length}/3)
                        </p>
                        <div className="space-y-1">
                            {agents.map((agent) => {
                                const isSelected = selectedAgent?.id === agent.id;
                                return (
                                    <button
                                        key={agent.id}
                                        onClick={() => { onSelect(agent); setIsOpen(false); }}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                                            isSelected
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'hover:bg-secondary/40 border border-transparent'
                                        )}
                                    >
                                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br border flex-shrink-0', getProviderColor(agent.provider))}>
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={cn('text-sm font-semibold truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                                                    {agent.name}
                                                </p>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground truncate capitalize">
                                                {agent.provider} · {agent.model.split('/').pop()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            {agent.training_status === 'completed' && agent.embedded_sources_count > 0 ? (
                                                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                                                    <Zap className="w-3 h-3" /> Trained
                                                </span>
                                            ) : agent.training_status === 'completed' && agent.embedded_sources_count === 0 ? (
                                                <span className="flex items-center gap-1 text-[10px] font-medium text-destructive">
                                                    No Data
                                                </span>
                                            ) : agent.training_status === 'in-progress' ? (
                                                <span className="flex items-center gap-1 text-[10px] font-medium text-yellow-500">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Training
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground capitalize">{agent.training_status}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main AskBrain Page ───────────────────────────────────────────────────────

const AskBrain: React.FC = () => {
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

    const [question, setQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agentNotConfigured, setAgentNotConfigured] = useState(false);

    // Multi-agent state
    const [allAgents, setAllAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isSwitchingAgent, setIsSwitchingAgent] = useState(false);

    // Chat state
    const [sessions, setSessions] = useState<ChatSessionWithSummary[]>([]);
    const [activeSession, setActiveSession] = useState<ChatSessionWithSummary | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageMetadata, setMessageMetadata] = useState<Map<number, SendMessageResponse>>(new Map());
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize: load all active agents
    useEffect(() => {
        initializeChat();
    }, []);

    // When agent changes (user picks from dropdown)
    useEffect(() => {
        if (selectedAgent) {
            loadSessionsForAgent(selectedAgent.id);
        }
    }, [selectedAgent?.id]);

    // Load messages when active session changes
    useEffect(() => {
        if (activeSession?.id) {
            loadMessages(activeSession.id);
        }
    }, [activeSession?.id]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending, activeSession?.id]);

    const initializeChat = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const agents = await agentService.getAllActiveAgents();

            if (agents.length === 0) {
                setAgentNotConfigured(true);
                setIsLoading(false);
                return;
            }

            setAllAgents(agents);
            // Auto-select the first agent
            setSelectedAgent(agents[0]);
            // Sessions will load via the useEffect that watches selectedAgent.id

        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to initialize chat';
            setError(errorMsg);
            toast.error(errorMsg);
            setIsLoading(false);
        }
    };

    const loadSessionsForAgent = async (agentId: number) => {
        try {
            setIsSwitchingAgent(true);
            setMessages([]);
            setActiveSession(null);
            setMessageMetadata(new Map());

            const data = await chatService.getSessions(agentId);
            setSessions(data);

            if (data.length > 0) {
                setActiveSession(data[0]);
            } else {
                await createNewSession(agentId);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to load conversations';
            toast.error(errorMsg);
        } finally {
            setIsSwitchingAgent(false);
            setIsLoading(false);
        }
    };

    const handleAgentSelect = (agent: Agent) => {
        if (agent.id === selectedAgent?.id) return;
        setSelectedAgent(agent);
        // loadSessionsForAgent is triggered by the useEffect
    };

    const loadMessages = async (sessionId: number) => {
        try {
            const history = await chatService.getSessionHistory(sessionId);
            setMessages(history);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load messages');
        }
    };

    const createNewSession = async (agentId?: number) => {
        const idToUse = agentId || selectedAgent?.id;
        if (!idToUse) return;

        try {
            setIsCreatingSession(true);
            const newSession = await chatService.createSession(idToUse);
            setSessions(prev => [newSession, ...prev]);
            setActiveSession(newSession);
            setMessages([]);
            toast.success('New conversation started');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create conversation');
        } finally {
            setIsCreatingSession(false);
        }
    };

    const handleDeleteSession = async (sessionId: number) => {
        try {
            await chatService.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));

            if (activeSession?.id === sessionId) {
                const remaining = sessions.filter(s => s.id !== sessionId);
                if (remaining.length > 0) {
                    setActiveSession(remaining[0]);
                } else if (selectedAgent) {
                    await createNewSession(selectedAgent.id);
                }
            }
            toast.success('Conversation deleted');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete conversation');
        }
    };

    const handleSendMessage = async (directQuestion?: string) => {
        const userMessageContent = (directQuestion || question).trim();
        if (!userMessageContent || !activeSession || !selectedAgent) return;

        if (!directQuestion) setQuestion('');
        setIsSending(true);

        const tempUserMessage: ChatMessage = {
            id: Date.now(),
            session_id: activeSession.id,
            role: 'user',
            content: userMessageContent,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            const messageHistory = (messages || []).map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await chatService.sendMessage(selectedAgent.id, {
                messages: [
                    ...messageHistory,
                    { role: 'user', content: userMessageContent }
                ],
                sessionId: activeSession.id.toString(),
                sourceSelection: 'auto',
                searchStrategy: 'simple_hybrid'
            });

            setMessages(prev => prev.map(m =>
                m.id === tempUserMessage.id ? { ...m, id: response.userMessageId } : m
            ));

            const aiMessage: ChatMessage = {
                id: response.assistantMessageId,
                session_id: activeSession.id,
                role: 'assistant',
                content: response.response,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, aiMessage]);

            if (response.sources || response.metadata) {
                setMessageMetadata(prev => new Map(prev).set(aiMessage.id, response));
            }

            const data = await chatService.getSessions(selectedAgent.id);
            setSessions(data);

        } catch (err: any) {
            let errorMsg = err.response?.data?.message || 'Failed to send message';
            if (err.code === 'ECONNABORTED' || err.response?.status === 504) {
                errorMsg = 'The request timed out. The AI is taking longer than expected. Please try again.';
            }
            toast.error(errorMsg);
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
            if (!directQuestion) setQuestion(userMessageContent);
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSendMessage();
    };

    const handleCopyMessage = async (content: string, messageId: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    const suggestedQuestions = [
        "What is Anstric Games Private Limited?",
        "What types of games does Anstric Games build?",
        "What is Anstric IDE?",
        "What technologies are used?",
        "What is Border Game?",
        "What is the vision of Anstric Games?",
    ];

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Ask Anstric Gaming" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading conversations...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── No Agents ────────────────────────────────────────────────────────────
    if (agentNotConfigured) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Ask Anstric Gaming" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md px-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mx-auto flex items-center justify-center mb-6">
                            <Brain className="w-10 h-10 text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">AI Assistant Not Ready Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            The AI assistant hasn't been configured by your administrator yet.
                            Please check back later or contact your admin to set up the knowledge base.
                        </p>
                        <div className="glass rounded-xl p-4 text-left">
                            <p className="text-sm font-medium text-foreground mb-2">What happens next?</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Admin creates an AI agent</li>
                                <li>• Knowledge documents are uploaded</li>
                                <li>• Agent is trained on company data</li>
                                <li>• You can start asking questions!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (error && sessions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col">
                <DashboardHeader title="Ask Anstric Gaming" user={user} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Failed to Load</h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={initializeChat}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main Chat ────────────────────────────────────────────────────────────
    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            <DashboardHeader title="Ask Anstric Gaming" user={user} />

            <div className="flex-1 flex overflow-hidden">
                {/* Conversation Sidebar */}
                <ConversationSidebar
                    sessions={sessions}
                    activeSessionId={activeSession?.id || null}
                    onSelectSession={setActiveSession}
                    onCreateNew={() => createNewSession()}
                    onDelete={handleDeleteSession}
                    isCreating={isCreatingSession}
                />

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">

                    {/* Agent Selector Bar */}
                    <div className="relative z-20 flex items-center gap-3 px-6 py-3 border-b border-border/60 bg-background/80 backdrop-blur-sm">
                        <span className="text-sm text-muted-foreground font-medium">Talking to:</span>
                        <AgentSelector
                            agents={allAgents}
                            selectedAgent={selectedAgent}
                            onSelect={handleAgentSelect}
                        />
                        {isSwitchingAgent && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Switching agent...
                            </div>
                        )}
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                        <div className="max-w-4xl mx-auto w-full">
                            {/* Hero Section - Only show when no messages */}
                            {messages.length === 0 && !isSwitchingAgent && (
                                <>
                                    <div className="text-center mb-8">
                                        <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                                            <Brain className="w-10 h-10" />
                                        </div>
                                        <h1 className="text-3xl font-bold text-foreground">
                                            {selectedAgent ? `Chat with ${selectedAgent.name}` : 'How can I help you today?'}
                                        </h1>
                                        <p className="text-muted-foreground mt-2">
                                            Ask me anything about company policies, processes, or documentation
                                        </p>
                                    </div>

                                    {/* Suggested Questions */}
                                    <div className="mb-8">
                                        <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Suggested questions
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestedQuestions.map((q, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSendMessage(q)}
                                                    className="px-4 py-2 rounded-full bg-secondary/30 hover:bg-secondary/50 text-sm text-foreground transition-colors"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Switching Agent Overlay */}
                            {isSwitchingAgent && (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground text-sm">Loading {selectedAgent?.name}'s conversations...</p>
                                </div>
                            )}

                            {/* Conversation History */}
                            {!isSwitchingAgent && (messages || []).length > 0 && (
                                <div className="space-y-6 mb-8">
                                    {(messages || []).map((message) => (
                                        <div key={message.id} className="glass rounded-2xl p-6 space-y-4">
                                            {message.role === 'user' ? (
                                                <div className="flex items-start gap-3">
                                                    <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full" />
                                                    <div>
                                                        <p className="font-medium text-foreground">{message.content}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {formatRelativeTime(message.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                        <Brain className="w-4 h-4 text-primary-foreground" />
                                                    </div>
                                                    <div className="flex-1">
                                                        {/* AI Response with Markdown */}
                                                        <div className="prose prose-sm max-w-none dark:prose-invert text-foreground/90">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {message.content}
                                                            </ReactMarkdown>
                                                        </div>

                                                        {/* Source Documents */}
                                                        {messageMetadata.get(message.id)?.sources && (
                                                            <SourceDocuments sources={messageMetadata.get(message.id)!.sources!} />
                                                        )}

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-4 mt-4">
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {messageMetadata.get(message.id)?.metadata?.response_time
                                                                    ? `${messageMetadata.get(message.id)!.metadata!.response_time}s`
                                                                    : 'Just now'}
                                                            </span>

                                                            <div className="flex items-center gap-2 ml-auto">
                                                                <button
                                                                    onClick={() => handleCopyMessage(message.content, message.id)}
                                                                    className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                                                    title="Copy to clipboard"
                                                                >
                                                                    {copiedMessageId === message.id ? (
                                                                        <Check className="w-4 h-4 text-green-500" />
                                                                    ) : (
                                                                        <Copy className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                                <MessageRating
                                                                    messageId={message.id}
                                                                    currentRating={message.feedback as 'up' | 'down' | null}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Thinking indicator */}
                                    {isSending && (
                                        <div className="glass rounded-2xl p-6">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                    <Brain className="w-4 h-4 text-primary-foreground" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    <span className="text-muted-foreground">
                                                        {selectedAgent?.name ?? 'AI'} is thinking...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-6 lg:p-8 border-t border-border bg-background/50 backdrop-blur-sm">
                        <div className="max-w-4xl mx-auto w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="glass rounded-2xl p-2 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder={selectedAgent ? `Ask ${selectedAgent.name} anything...` : 'Type your question here...'}
                                        className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
                                        disabled={isSending || isSwitchingAgent}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!question.trim() || isSending || isSwitchingAgent}
                                        className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskBrain;
