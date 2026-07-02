import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import {
    TrendingUp,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Users,
    BarChart3,
} from 'lucide-react';
import {
    analyticsService,
    BehaviorInsights,
    RetentionMetrics,
    PopularQuestion,
} from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Analytics: React.FC = () => {
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
    const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
    const [popularTopics, setPopularTopics] = useState<PopularQuestion[]>([]);

    // Load analytics data on mount
    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = useCallback(async () => {
        try {
            setIsLoading(true);

            // Load all analytics data in parallel
            const [retention, topics] = await Promise.allSettled([
                analyticsService.getRetentionMetrics(),
                analyticsService.getPopularTopics(10),
            ]);

            // Handle popular topics
            if (topics.status === 'fulfilled') {
                setPopularTopics(topics.value);
            }

            // Handle retention metrics
            if (retention.status === 'fulfilled') {
                setRetentionMetrics(retention.value);
            }

        } catch (error: any) {
            console.error('Failed to load analytics:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load analytics data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Column definitions
    const popularQuestionsColumns = [
        {
            key: 'question',
            label: 'Topic',
            render: (item: PopularQuestion) => (
                <div>
                    <p className="font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                </div>
            ),
        },
        {
            key: 'count',
            label: 'Frequency',
            render: (item: PopularQuestion) => (
                <span className="font-semibold text-primary">{item.count}</span>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <DashboardHeader title="Analytics & Insights" user={user} />
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Analytics & Insights" user={user} />

            <div className="p-6 lg:p-8 space-y-8">
                {/* Refresh Button */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadAnalytics()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Retention Metrics Cards */}
                {retentionMetrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Daily Active Users</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{retentionMetrics.daily_active_users}</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Weekly Active Users</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{retentionMetrics.weekly_active_users}</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">App Stickiness (DAU/MAU)</p>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{(retentionMetrics.stickiness || 0).toFixed(1)}%</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">User Growth (WoW)</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{(retentionMetrics.wow_growth > 0 ? '+' : '')}{(retentionMetrics.wow_growth || 0).toFixed(1)}%</p>
                        </div>
                    </div>
                )}

                {/* Overview Section */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Popular Topics Summary</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Most frequently discussed topics across conversations
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {popularTopics.length > 0 ? (
                                popularTopics.slice(0, 3).map((topic, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-secondary/20">
                                        <span className="text-sm truncate mr-2">{topic.question}</span>
                                        <span className="text-sm font-semibold text-primary">{topic.count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4 col-span-3">
                                    No topic data available yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold text-foreground">All Popular Topics</h2>
                    </div>
                    {popularTopics.length > 0 ? (
                        <DataTable data={popularTopics} columns={popularQuestionsColumns} />
                    ) : (
                        <div className="text-center py-12 glass rounded-2xl">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No topic data yet</h3>
                            <p className="text-muted-foreground mt-1">
                                Topics will appear as users interact with the platform
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
