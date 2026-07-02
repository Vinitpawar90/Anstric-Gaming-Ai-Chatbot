import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { Stat } from '@/types';
import { Upload, MessageSquare, UserPlus, FileEdit, Loader2, RefreshCw, Users, FileText, Bot, Clock } from 'lucide-react';
import { userService } from '@/services/userService';
import { documentService } from '@/services/documentService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const AdminOverview: React.FC = () => {
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
    const [stats, setStats] = useState<Stat[]>([]);
    const [documentStats, setDocumentStats] = useState({ total: 0, ready: 0, processing: 0, failed: 0 });

    // Load data on mount
    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Load users and documents in parallel
            const [users, documents] = await Promise.allSettled([
                userService.getAllUsers(),
                documentService.getDocuments({ limit: 1000 }),
            ]);

            // Calculate stats from real data
            const userCount = users.status === 'fulfilled' ? users.value.length : 0;
            const activeUsers = users.status === 'fulfilled'
                ? users.value.filter(u => userService.getUserStatus(u.last_login) === 'active').length
                : 0;

            const docData = documents.status === 'fulfilled' ? documents.value : { documents: [], total: 0 };
            const docCount = docData.total;
            const docStats = {
                total: docCount,
                ready: docData.documents.filter(d => d.status === 'ready').length,
                processing: docData.documents.filter(d => d.status === 'processing').length,
                failed: docData.documents.filter(d => d.status === 'failed').length,
            };
            setDocumentStats(docStats);

            // Build stats array
            const calculatedStats: Stat[] = [
                {
                    id: 'stat-1',
                    title: 'Total Users',
                    value: userCount,
                    change: 0,
                    trend: 'neutral',
                    icon: 'Users',
                },
                {
                    id: 'stat-2',
                    title: 'Total Documents',
                    value: docCount,
                    change: 0,
                    trend: 'up',
                    icon: 'FileText',
                },
                {
                    id: 'stat-3',
                    title: 'Active Users',
                    value: activeUsers,
                    change: 0,
                    trend: 'up',
                    icon: 'Users',
                },
                {
                    id: 'stat-4',
                    title: 'Ready Documents',
                    value: docStats.ready,
                    change: 0,
                    trend: 'up',
                    icon: 'FileText',
                },
            ];
            setStats(calculatedStats);

            // Documents are handled above


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

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <DashboardHeader title="Overview" user={user} />
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Overview" user={user} />

            <div className="p-6 lg:p-8 space-y-8">
                {/* Refresh Button */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadDashboardData()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <StatCard key={stat.id} stat={stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="xl:col-span-2 glass rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-6">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/admin/knowledge-base" className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                                <Upload className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="text-sm font-semibold text-foreground">Upload Document</h3>
                                <p className="text-xs text-muted-foreground mt-1">Add new knowledge</p>
                            </Link>

                            <Link to="/admin/user-management" className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                                <UserPlus className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="text-sm font-semibold text-foreground">Add User</h3>
                                <p className="text-xs text-muted-foreground mt-1">Invite team member</p>
                            </Link>

                            <Link to="/admin/analytics" className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                                <MessageSquare className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="text-sm font-semibold text-foreground">View Analytics</h3>
                                <p className="text-xs text-muted-foreground mt-1">Usage insights</p>
                            </Link>

                            <Link to="/admin/agents" className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                                <Bot className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="text-sm font-semibold text-foreground">Manage Agents</h3>
                                <p className="text-xs text-muted-foreground mt-1">Configure AI agents</p>
                            </Link>
                        </div>
                    </div>

                    {/* Knowledge Health */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-foreground mb-6">Knowledge Health</h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Ready</span>
                                    <span className="text-2xl font-bold text-green-700 dark:text-green-400">{documentStats.ready}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Documents ready for use</p>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Processing</span>
                                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{documentStats.processing}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Being processed</p>
                            </div>

                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-red-700 dark:text-red-400">Failed</span>
                                    <span className="text-2xl font-bold text-red-700 dark:text-red-400">{documentStats.failed}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Need attention</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
