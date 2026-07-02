import { useState, useEffect } from 'react';
import { onboardingService, UserOnboardingStatus } from '@/services/onboardingService';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type StatusFilter = 'all' | 'completed' | 'in_progress' | 'not_started';

export default function OnboardingStatus() {
    const [users, setUsers] = useState<UserOnboardingStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<StatusFilter>('all');
    const { toast } = useToast();

    useEffect(() => {
        loadUsersStatus();
    }, []);

    const loadUsersStatus = async () => {
        try {
            setIsLoading(true);
            const data = await onboardingService.getAllUsersStatus();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load onboarding status:', error);
            toast({
                title: 'Error',
                description: 'Failed to load user onboarding status',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (user: UserOnboardingStatus) => {
        if (user.is_complete) {
            return (
                <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                </Badge>
            );
        }
        if (user.progress_percentage > 0) {
            return (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    <Clock className="w-3 h-3 mr-1" />
                    In Progress
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-muted-foreground">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Started
            </Badge>
        );
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        if (filter === 'completed') return user.is_complete;
        if (filter === 'in_progress') return !user.is_complete && user.progress_percentage > 0;
        if (filter === 'not_started') return user.progress_percentage === 0;
        return true;
    });

    const stats = {
        total: users.length,
        completed: users.filter(u => u.is_complete).length,
        inProgress: users.filter(u => !u.is_complete && u.progress_percentage > 0).length,
        notStarted: users.filter(u => u.progress_percentage === 0).length,
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div key="total" className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div key="completed" className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div key="in-progress" className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <div key="not-started" className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Not Started</p>
                    <p className="text-2xl font-bold text-muted-foreground">{stats.notStarted}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <Select value={filter} onValueChange={(v: StatusFilter) => setFilter(v)}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="not_started">Not Started</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Completed</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.user_id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-32">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Progress value={user.progress_percentage} className="h-2" />
                                                <span className="text-xs text-muted-foreground">
                                                    {user.progress_percentage}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {user.completed_sections?.length || 0} / {user.total_sections || 0} sections
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(user)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {user.started_at
                                            ? formatDistanceToNow(new Date(user.started_at), { addSuffix: true })
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {user.completed_at
                                            ? formatDistanceToNow(new Date(user.completed_at), { addSuffix: true })
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
