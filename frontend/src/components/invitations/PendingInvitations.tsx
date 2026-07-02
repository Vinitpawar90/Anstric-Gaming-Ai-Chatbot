import { useState, useEffect } from 'react';
import { invitationService, Invitation } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Trash2, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

interface PendingInvitationsProps {
    refreshTrigger?: number;
}

export default function PendingInvitations({ refreshTrigger }: PendingInvitationsProps) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadInvitations();
    }, [refreshTrigger]);

    const loadInvitations = async () => {
        try {
            setIsLoading(true);
            const data = await invitationService.getPendingInvitations();
            setInvitations(data);
        } catch (error) {
            console.error('Failed to load invitations:', error);
            toast({
                title: 'Error',
                description: 'Failed to load pending invitations',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = async (invitation: Invitation) => {
        if (!invitation.invitation_link) return;

        try {
            await navigator.clipboard.writeText(invitation.invitation_link);
            setCopiedId(invitation.id);
            toast({
                title: 'Copied!',
                description: 'Invitation link copied to clipboard',
            });
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to copy link',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        if (deleteId === null) return;

        setIsDeleting(true);
        try {
            await invitationService.cancelInvitation(deleteId);
            setInvitations(prev => prev.filter(inv => inv.id !== deleteId));
            toast({
                title: 'Cancelled',
                description: 'Invitation has been cancelled',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to cancel invitation',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const isExpired = (expiresAt: string) => isPast(new Date(expiresAt));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (invitations.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No pending invitations</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invitations.map((invitation) => (
                            <TableRow key={invitation.id}>
                                <TableCell className="font-medium">
                                    {invitation.email}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                                        {invitation.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(invitation.invitation_expires), { addSuffix: true })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {isExpired(invitation.invitation_expires) ? (
                                        <Badge variant="destructive">Expired</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                            Active
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCopyLink(invitation)}
                                            disabled={isExpired(invitation.invitation_expires)}
                                        >
                                            {copiedId === invitation.id ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeleteId(invitation.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this invitation? The invitation link will no longer work.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Keep</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Cancelling...' : 'Cancel Invitation'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
