import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationService } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InvitationSignUp() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const { toast } = useToast();

    // Validation state
    const [isValidating, setIsValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [validationData, setValidationData] = useState<{
        email: string;
        role: string;
        expires: string;
    } | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            validateToken(token);
        } else {
            setIsValidating(false);
            setValidationError('No invitation token provided');
        }
    }, [token]);

    const validateToken = async (tokenValue: string) => {
        try {
            setIsValidating(true);
            const data = await invitationService.validateToken(tokenValue);
            setValidationData(data);
            setIsValid(true);
        } catch (error: any) {
            setIsValid(false);
            setValidationError(
                error.response?.data?.message || 'Invalid or expired invitation'
            );
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token || !validationData) return;

        if (password !== confirmPassword) {
            toast({
                title: 'Error',
                description: 'Passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        if (password.length < 8) {
            toast({
                title: 'Error',
                description: 'Password must be at least 8 characters',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await invitationService.acceptInvitation({
                token,
                name: name.trim(),
                password,
                phone_number: phoneNumber.trim() || undefined,
            });

            setIsSuccess(true);
            toast({
                title: 'Account created!',
                description: 'You can now sign in with your credentials.',
            });

            // Redirect to sign in after delay
            setTimeout(() => {
                navigate('/signin');
            }, 3000);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create account',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                            <p className="mt-4 text-muted-foreground">Validating invitation...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Invalid token
    if (!isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <XCircle className="h-12 w-12 mx-auto text-destructive" />
                            <h2 className="mt-4 text-lg font-semibold">Invalid Invitation</h2>
                            <p className="mt-2 text-muted-foreground">{validationError}</p>
                            <Button
                                className="mt-6"
                                onClick={() => navigate('/signin')}
                            >
                                Go to Sign In
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                            <h2 className="mt-4 text-lg font-semibold">Account Created!</h2>
                            <p className="mt-2 text-muted-foreground">
                                Redirecting you to sign in...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Registration form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
                        <Brain className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle>Complete Your Registration</CardTitle>
                    <CardDescription>
                        You've been invited to join Anstric Gaming
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={validationData?.email || ''}
                                    disabled
                                    className="bg-secondary/50"
                                />
                                <Badge variant="secondary">{validationData?.role}</Badge>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimum 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={isSubmitting}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password *</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Phone (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || !name.trim() || !password || !confirmPassword}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
