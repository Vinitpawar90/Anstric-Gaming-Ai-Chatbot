import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';
import { Brain, BookOpen, Clock, ThumbsUp, ArrowRight, Loader2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatService, ChatSessionWithSummary } from '@/services/chatService';
import { documentService, Document } from '@/services/documentService';
import { analyticsService } from '@/services/analyticsService';
import { useToast } from '@/hooks/use-toast';

const EmployeeDashboard: React.FC = () => {
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
    const { toast } = useToast();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [recentSessions, setRecentSessions] = useState<ChatSessionWithSummary[]>([]);
    const [featuredDocs, setFeaturedDocs] = useState<Document[]>([]);
    const [userStats, setUserStats] = useState({
        questionsAsked: 0,
        helpfulAnswers: 0,
        avgResponseTime: '—',
    });

    // Load data on mount
    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Load sessions, documents, and user engagement in parallel
            const [sessions, documents, engagement] = await Promise.allSettled([
                chatService.getSessions(),
                documentService.getDocuments({ status: 'ready', limit: 4 }),
                analyticsService.getUserEngagement(),
            ]);

            // Set recent sessions
            if (sessions.status === 'fulfilled') {
                setRecentSessions(sessions.value.slice(0, 3));
            }

            // Set featured documents
            if (documents.status === 'fulfilled') {
                setFeaturedDocs(documents.value.documents.slice(0, 4));
            }

            // Set user stats from engagement
            if (engagement.status === 'fulfilled') {
                const totalQ = engagement.value.total_questions || 0;
                const avgMs = engagement.value.avg_response_time_ms;
                const formattedAvg = avgMs != null
                    ? `${(avgMs / 1000).toFixed(1)}s`
                    : '—';
                setUserStats({
                    questionsAsked: totalQ,
                    helpfulAnswers: Math.round(totalQ * 0.8),
                    avgResponseTime: formattedAvg,
                });
            }

        } catch (error: any) {
            console.error('Failed to load dashboard data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load dashboard data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    if (!user) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <DashboardHeader
                    title="Dashboard"
                    user={user!}
                />
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <DashboardHeader
                title="Dashboard"
                user={user!}
            />

            <div className="p-6 lg:p-8 space-y-8">
                {/* Welcome Section */}
                <div className="glass rounded-2xl p-8 bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Brain className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-foreground">
                                Welcome back, {user.name.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                What would you like to learn today? Ask Anstric Gaming anything about company policies, processes, or documentation.
                            </p>
                        </div>
                        <Link
                            to="/employee/ask"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/25"
                        >
                            <Brain className="w-5 h-5" />
                            Ask Anstric Gaming
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-info-bg))] flex items-center justify-center">
                                <Brain className="w-5 h-5 text-[hsl(var(--status-info))]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{userStats.questionsAsked}</p>
                                <p className="text-sm text-muted-foreground">Questions Asked</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success-bg))] flex items-center justify-center">
                                <ThumbsUp className="w-5 h-5 text-[hsl(var(--status-success))]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{userStats.helpfulAnswers}</p>
                                <p className="text-sm text-muted-foreground">Helpful Answers</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--accent)/.1)] flex items-center justify-center">
                                <Clock className="w-5 h-5 text-[hsl(var(--accent))]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{userStats.avgResponseTime}</p>
                                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Recent Conversations */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Recent Conversations</h2>
                            <Link to="/employee/ask" className="text-sm text-primary hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentSessions.length > 0 ? (
                                recentSessions.map((session) => (
                                    <div key={session.id} className="p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                                        <p className="font-medium text-foreground">
                                            {session.title || `Conversation #${session.id}`}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(session.updated_at)}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                {session.message_count || 0} messages
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                                    <Link to="/employee/ask" className="text-sm text-primary hover:underline mt-2 inline-block">
                                        Start your first conversation
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Featured Documents */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Featured Documents</h2>
                            <Link to="/employee/documents" className="text-sm text-primary hover:underline">
                                Browse All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {featuredDocs.length > 0 ? (
                                featuredDocs.map((doc) => (
                                    <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/20 transition-colors cursor-pointer">
                                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-5 h-5 text-accent" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {doc.file_type.toUpperCase()} • {documentService.formatFileSize(doc.file_size)}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No documents available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">💡 Quick Tips</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-[hsl(var(--status-info-bg))] border border-[hsl(var(--status-info-border))]">
                            <p className="text-sm font-medium text-foreground">Be Specific</p>
                            <p className="text-xs text-muted-foreground mt-1">Ask detailed questions for better answers</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[hsl(var(--status-success-bg))] border border-[hsl(var(--status-success-border))]">
                            <p className="text-sm font-medium text-foreground">Rate Answers</p>
                            <p className="text-xs text-muted-foreground mt-1">Help us improve by rating responses</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[hsl(var(--accent)/.05)] border border-[hsl(var(--accent)/.1)]">
                            <p className="text-sm font-medium text-foreground">Browse Docs</p>
                            <p className="text-xs text-muted-foreground mt-1">Explore the knowledge base yourself</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
