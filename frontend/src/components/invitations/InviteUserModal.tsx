import { useState } from 'react';
import { invitationService } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Mail, UserPlus } from 'lucide-react';

interface InviteUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function InviteUserModal({
    open,
    onOpenChange,
    onSuccess,
}: InviteUserModalProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'employee' | 'admin'>('employee');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invitationLink, setInvitationLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await invitationService.createInvitation({
                email: email.trim(),
                role,
                name: name.trim() || undefined,
            });

            setInvitationLink(result.invitation_link || null);

            toast({
                title: 'Invitation sent',
                description: `Invitation sent to ${email}`,
            });

            onSuccess();
        } catch (error: any) {
            console.error('Failed to send invitation:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to send invitation',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = async () => {
        if (!invitationLink) return;

        try {
            await navigator.clipboard.writeText(invitationLink);
            setCopied(true);
            toast({
                title: 'Copied!',
                description: 'Invitation link copied to clipboard',
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to copy link',
                variant: 'destructive',
            });
        }
    };

    const handleClose = () => {
        setEmail('');
        setName('');
        setRole('employee');
        setInvitationLink(null);
        setCopied(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                {!invitationLink ? (
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                Invite New User
                            </DialogTitle>
                            <DialogDescription>
                                Send an invitation to add a new user to the platform.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="invite-email">Email Address *</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="user@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            {/* Name (Optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="invite-name">Name (Optional)</Label>
                                <Input
                                    id="invite-name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="invite-role">Role</Label>
                                <Select
                                    value={role}
                                    onValueChange={(value: 'employee' | 'admin') => setRole(value)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger id="invite-role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!email.trim() || isSubmitting}>
                                <Mail className="h-4 w-4 mr-2" />
                                {isSubmitting ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                <Check className="h-5 w-5" />
                                Invitation Sent!
                            </DialogTitle>
                            <DialogDescription>
                                The invitation has been created. Share this link with the user:
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                                <Input
                                    value={invitationLink}
                                    readOnly
                                    className="bg-transparent border-0 text-sm"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCopyLink}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                This link expires in 7 days.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleClose}>
                                Done
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
