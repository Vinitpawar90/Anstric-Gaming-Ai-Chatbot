import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Search, Mail, Loader2, RefreshCw, Trash2, User as UserIcon } from 'lucide-react';
import { userService, User } from '@/services/userService';
import InviteUserModal from '@/components/invitations/InviteUserModal';
import PendingInvitations from '@/components/invitations/PendingInvitations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const UserManagement: React.FC = () => {
    const { user: authUser } = useAuth();
    const currentUser = authUser ? {
        id: authUser.id.toString(),
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        avatar: authUser.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${authUser.email}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        joinedDate: authUser.created_at || new Date().toISOString(),
        status: 'active' as const,
    } : null;
    const { toast } = useToast();

    // User state
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');

    // Modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error: any) {
            console.error('Failed to load users:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load users',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Filter users based on search and role
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Calculate stats
    const userStats = {
        total: users.length,
        admins: users.filter((u) => u.role === 'admin').length,
        employees: users.filter((u) => u.role === 'employee').length,
        active: users.filter((u) => userService.getUserStatus(u.last_login) === 'active').length,
    };

    const handleDeleteUser = async () => {
        if (!deleteUserId) return;

        setIsDeleting(true);
        try {
            await userService.deleteUser(deleteUserId);
            toast({
                title: 'User deleted',
                description: 'The user has been removed successfully.',
            });
            loadUsers(); // Refresh list
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete user',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
            setDeleteUserId(null);
        }
    };

    const getStatusBadge = (user: User) => {
        const status = userService.getUserStatus(user.last_login);
        return status === 'active' ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                Active
            </span>
        ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20">
                Inactive
            </span>
        );
    };

    const getRoleBadge = (role: User['role']) => {
        return role === 'admin' ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Admin
            </span>
        ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/30 text-foreground border border-border">
                Employee
            </span>
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'User',
            render: (u: User) => (
                <div className="flex items-center gap-3">
                    <img
                        src={userService.getAvatarUrl(u.name)}
                        alt={u.name}
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (u: User) => getRoleBadge(u.role),
        },
        {
            key: 'phone_number',
            label: 'Phone',
            render: (u: User) => (
                <span className="text-sm text-muted-foreground">
                    {u.phone_number || '—'}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Joined',
            render: (u: User) => (
                <span className="text-sm">
                    {new Date(u.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (u: User) => getStatusBadge(u),
        },
        {
            key: 'last_login',
            label: 'Last Active',
            render: (u: User) => (
                <span className="text-sm text-muted-foreground">
                    {userService.formatLastActive(u.last_login)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (u: User) => (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDeleteUserId(u.id);
                        setShowDeleteDialog(true);
                    }}
                    disabled={u.id === (currentUser ? parseInt(currentUser.id) : -1)} // Can't delete yourself
                >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
            ),
        },
    ];

    const handleInviteSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="min-h-screen">
            <DashboardHeader title="User Management" user={currentUser} />

            <div className="p-6 lg:p-8 space-y-6">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1 w-full">
                        <div className="flex items-center gap-2 px-4 h-[46px] rounded-xl bg-secondary/20 border border-border w-full sm:w-96">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm focus:outline-none flex-1"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'employee')}
                            className="px-4 h-[46px] rounded-xl bg-secondary/20 border border-border text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admins</option>
                            <option value="employee">Employees</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => loadUsers()}
                            disabled={isLoading}
                            className="rounded-xl h-[46px] w-[46px]"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        {/* 
                        <Button
                            className="rounded-xl h-[46px] px-6 shadow-lg shadow-primary/25"
                            onClick={() => setShowInviteModal(true)}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Invite User
                        </Button>
                        */}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{userStats.total}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Admins</p>
                        <p className="text-2xl font-bold text-primary mt-1">{userStats.admins}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Employees</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{userStats.employees}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Active (7 days)</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{userStats.active}</p>
                    </div>
                </div>

                {/* Tabs for Users and Invitations - Hidden for now */}
                <Tabs defaultValue="users" className="space-y-4">
                    {/* 
                    <TabsList>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
                    </TabsList>
                    */}
                    <TabsContent value="users">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">No users found</h3>
                                <p className="text-muted-foreground mt-1">
                                    {searchQuery ? 'Try a different search term' : 'No users registered yet'}
                                </p>
                                {/* 
                                <Button
                                    onClick={() => setShowInviteModal(true)}
                                    className="mt-4"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Invite User
                                </Button>
                                */}
                            </div>
                        ) : (
                            <DataTable
                                data={filteredUsers}
                                columns={columns}
                                onRowClick={() => {}}
                            />
                        )}
                    </TabsContent>

                    {/* 
                    <TabsContent value="invitations">
                        <PendingInvitations refreshTrigger={refreshTrigger} />
                    </TabsContent>
                    */}
                </Tabs>
            </div>

            {/* Invite Modal */}
            <InviteUserModal
                open={showInviteModal}
                onOpenChange={setShowInviteModal}
                onSuccess={handleInviteSuccess}
            />

            {/* Delete User Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                            The user will lose access to the platform.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UserManagement;
