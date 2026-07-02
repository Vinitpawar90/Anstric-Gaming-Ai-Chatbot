import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageCircle, ChevronDown, Maximize2, Send, Loader2,
    Brain, Bot, CheckCircle2, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import chatService, { ChatMessage, ChatSessionWithSummary } from '@/services/chatService';
import agentService from '@/services/agentService';
import { Agent } from '@/types/agent.types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

// ─── Provider color helper ────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
    groq: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400',
    openai: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    anthropic: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
    cohere: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
};
const getProviderColor = (p: string) =>
    PROVIDER_COLORS[p?.toLowerCase()] ?? 'from-primary/20 to-primary/10 border-primary/30 text-primary';

// ─── Mini Agent Selector (compact — fits inside the small widget header) ──────

interface MiniAgentSelectorProps {
    agents: Agent[];
    selectedAgent: Agent | null;
    onSelect: (agent: Agent) => void;
}

const MiniAgentSelector: React.FC<MiniAgentSelectorProps> = ({ agents, selectedAgent, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Only 1 agent — just show the name, no dropdown needed
    if (agents.length <= 1) {
        return (
            <span className="text-sm font-semibold text-primary-foreground truncate max-w-[160px]">
                {selectedAgent?.name ?? 'Anstric Gaming'}
            </span>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(p => !p)}
                className="flex items-center gap-1.5 text-primary-foreground hover:text-white transition-colors"
                title="Switch agent"
            >
                <span className="text-sm font-semibold truncate max-w-[140px]">
                    {selectedAgent?.name ?? 'Select Agent'}
                </span>
                <ChevronDown className={cn('w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 z-[100] rounded-xl border border-border/60 bg-background/98 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        Available Agents ({agents.length}/3)
                    </p>
                    <div className="p-1.5 space-y-0.5">
                        {agents.map(agent => {
                            const isSelected = selectedAgent?.id === agent.id;
                            return (
                                <button
                                    key={agent.id}
                                    onClick={() => { onSelect(agent); setIsOpen(false); }}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-100',
                                        isSelected
                                            ? 'bg-primary/10 border border-primary/20'
                                            : 'hover:bg-secondary/40 border border-transparent'
                                    )}
                                >
                                    <div className={cn(
                                        'w-7 h-7 rounded-md flex items-center justify-center bg-gradient-to-br border flex-shrink-0',
                                        getProviderColor(agent.provider)
                                    )}>
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className={cn('text-xs font-semibold truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                                                {agent.name}
                                            </p>
                                            {isSelected && <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground truncate capitalize">
                                            {agent.provider} · {agent.model.split('/').pop()}
                                        </p>
                                    </div>
                                    {/* Training badge */}
                                    {agent.training_status === 'completed' && agent.embedded_sources_count > 0 ? (
                                        <span className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-500 flex-shrink-0">
                                            <Zap className="w-2.5 h-2.5" /> Ready
                                        </span>
                                    ) : agent.training_status === 'completed' && agent.embedded_sources_count === 0 ? (
                                        <span className="text-[9px] text-destructive flex-shrink-0">
                                            No Data
                                        </span>
                                    ) : (
                                        <span className="text-[9px] text-amber-500 flex-shrink-0 capitalize">
                                            {agent.training_status}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main ChatbotWidget ───────────────────────────────────────────────────────

export const ChatbotWidget: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Widget open/close
    const [isOpen, setIsOpen] = useState(false);

    // Multi-agent state
    const [allAgents, setAllAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    // Chat state
    const [question, setQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSwitchingAgent, setIsSwitchingAgent] = useState(false);
    const [activeSession, setActiveSession] = useState<ChatSessionWithSummary | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load all agents when widget first opens
    useEffect(() => {
        if (isOpen && allAgents.length === 0) {
            initializeWidget();
        }
    }, [isOpen]);

    // When selected agent changes, reload sessions for it
    useEffect(() => {
        if (selectedAgent && isOpen) {
            loadSessionsForAgent(selectedAgent.id);
        }
    }, [selectedAgent?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isSending]);

    const initializeWidget = async () => {
        try {
            setIsLoading(true);
            const agents = await agentService.getAllActiveAgents();
            if (agents.length === 0) {
                setIsLoading(false);
                return;
            }
            setAllAgents(agents);
            setSelectedAgent(agents[0]);
            // loadSessionsForAgent fires from the selectedAgent useEffect
        } catch (err) {
            console.error('Failed to initialize chat widget:', err);
            setIsLoading(false);
        }
    };

    const loadSessionsForAgent = async (agentId: number) => {
        try {
            setIsSwitchingAgent(true);
            setMessages([]);
            setActiveSession(null);

            const sessions = await chatService.getSessions(agentId);

            if (sessions.length > 0) {
                const recentSession = sessions[0];
                setActiveSession(recentSession);
                const history = await chatService.getSessionHistory(recentSession.id);
                setMessages(history);
            } else {
                const newSession = await chatService.createSession(agentId);
                setActiveSession(newSession);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to load sessions for agent:', error);
        } finally {
            setIsSwitchingAgent(false);
            setIsLoading(false);
        }
    };

    const handleAgentSelect = (agent: Agent) => {
        if (agent.id === selectedAgent?.id) return;
        setSelectedAgent(agent);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !activeSession || !selectedAgent || isSending) return;

        const userMessageContent = question.trim();
        setQuestion('');
        setIsSending(true);

        // Optimistically add user message
        const tempUserMessage: ChatMessage = {
            id: Date.now(),
            session_id: activeSession.id,
            role: 'user',
            content: userMessageContent,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            const messageHistory = (messages || []).map(m => ({ role: m.role, content: m.content }));

            const response = await chatService.sendMessage(selectedAgent.id, {
                messages: [
                    ...messageHistory,
                    { role: 'user', content: userMessageContent }
                ],
                sessionId: activeSession.id.toString(),
                sourceSelection: 'auto',
                searchStrategy: 'simple_hybrid'
            });

            // Replace temp ID with real DB ID
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
        } catch (error: any) {
            console.error('Failed to send message:', error);

            let errorMsg = error.response?.data?.message || 'Failed to send message';
            if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
                errorMsg = 'The AI is taking longer than expected. Please try again.';
            }
            toast.error(errorMsg);

            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
            setQuestion(userMessageContent);
        } finally {
            setIsSending(false);
        }
    };

    const handleFullScreen = () => {
        if (!user) return;
        navigate(`/${user.role}/ask`);
    };

    const noAgentsConfigured = !isLoading && allAgents.length === 0;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div
                className={cn(
                    "w-[380px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right mb-4 pointer-events-auto flex flex-col",
                    isOpen
                        ? "opacity-100 scale-100 h-[560px] translate-y-0"
                        : "opacity-0 scale-95 h-0 translate-y-12 pointer-events-none"
                )}
            >
                {/* Header — contains agent selector dropdown */}
                <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-white/20 flex-shrink-0">
                            <Brain className="w-4 h-4" />
                        </div>
                        {/* Agent selector inline */}
                        <MiniAgentSelector
                            agents={allAgents}
                            selectedAgent={selectedAgent}
                            onSelect={handleAgentSelect}
                        />
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {isSwitchingAgent && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-foreground/70 mr-1" />
                        )}
                        <button
                            onClick={handleFullScreen}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                            title="Open full screen"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 backdrop-blur-sm">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm">Connecting...</span>
                        </div>
                    ) : noAgentsConfigured ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
                                <Brain className="w-6 h-6 text-amber-500" />
                            </div>
                            <h3 className="font-semibold mb-1 text-sm">Not Set Up Yet</h3>
                            <p className="text-xs text-muted-foreground">
                                No AI agents have been configured. Contact your administrator.
                            </p>
                        </div>
                    ) : isSwitchingAgent ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="text-sm">Loading {selectedAgent?.name}'s conversations...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                                <Brain className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-1 text-sm">
                                {selectedAgent ? `Chat with ${selectedAgent.name}` : 'How can I help?'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Ask me about company policies, documents, or workflows.
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-full mb-4",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-card border border-border text-foreground rounded-bl-none"
                                        )}
                                    >
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isSending && (
                                <div className="flex justify-start w-full">
                                    <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                        <span className="text-xs text-muted-foreground">
                                            {selectedAgent?.name ?? 'AI'} is thinking...
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-card border-t border-border flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={
                                noAgentsConfigured
                                    ? 'No agents configured...'
                                    : selectedAgent
                                        ? `Ask ${selectedAgent.name}...`
                                        : 'Type your question...'
                            }
                            disabled={isSending || isLoading || isSwitchingAgent || noAgentsConfigured}
                            className="flex-1 bg-white border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!question.trim() || isSending || isLoading || isSwitchingAgent || noAgentsConfigured}
                            className={cn(
                                "p-2.5 rounded-xl transition-all shadow-sm",
                                question.trim() && !isSending && !isSwitchingAgent && !noAgentsConfigured
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(o => !o)}
                className={cn(
                    "pointer-events-auto flex items-center justify-center w-14 h-14 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 z-50",
                    isOpen
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/20"
                )}
                aria-label={isOpen ? "Close chat" : "Open chat"}
            >
                {isOpen ? (
                    <ChevronDown className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-7 h-7" />
                )}
            </button>
        </div>
    );
};
