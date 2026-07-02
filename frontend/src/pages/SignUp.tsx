import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { SocialButton } from '@/components/auth/SocialButton';
import { Testimonial } from '@/components/auth/TestimonialCard';

const SignUp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialEmail = location.state?.email || '';
    const { register } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const password = e.target.value;
        // Simple password strength calculation
        if (password.length < 6) {
            setPasswordStrength('weak');
        } else if (password.length < 10) {
            setPasswordStrength('medium');
        } else {
            setPasswordStrength('strong');
        }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const newUser = await register({ name, email, password });

            toast({
                title: "Registration successful!",
                description: "Welcome to Anstric Gaming",
            });

            // Redirect based on role
            if (newUser.role === 'admin') {
                navigate('/admin/overview');
            } else {
                navigate('/employee/dashboard');
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Registration failed",
                description: error.response?.data?.message || "Something went wrong",
            });
        } finally {
            setIsLoading(false);
        }
    };



    const testimonials: Testimonial[] = [
        {
            avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            name: 'Kabir Malhotra',
            handle: '@kabirm',
            text: 'Setup was incredibly easy and intuitive!',
        },
        {
            avatarSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
            name: 'Ishita Sharma',
            handle: '@ishitas',
            text: 'Our productivity increased by 40% in the first month.',
        },
        {
            avatarSrc: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
            name: 'Rohan Gupta',
            handle: '@rohang',
            text: 'The AI assistant is a game-changer for our team.',
        },
    ];

    const strengthColors = {
        weak: 'bg-[hsl(var(--status-error))]',
        medium: 'bg-[hsl(var(--status-warning))]',
        strong: 'bg-[hsl(var(--status-success))]',
    };

    const strengthWidth = {
        weak: 'w-1/3',
        medium: 'w-2/3',
        strong: 'w-full',
    };

    return (
        <AuthLayout
            heroImageSrc="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=1000&fit=crop"
            testimonials={testimonials}
        >
            <div className="flex flex-col gap-6">
                <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
                    <span className="font-light text-foreground tracking-tighter">Join Anstric Gaming</span>
                </h1>
                <p className="animate-element animate-delay-200 text-muted-foreground">
                    Create your account and empower your team with AI-powered knowledge
                </p>

                <form className="space-y-5" onSubmit={handleSignUp}>
                    <div className="animate-element animate-delay-300">
                        <AuthFormField
                            label="Full Name"
                            name="name"
                            type="text"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="animate-element animate-delay-400">
                        <AuthFormField
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="Enter your email address"
                            required
                            defaultValue={initialEmail}
                        />
                    </div>

                    <div className="animate-element animate-delay-500">
                        <label className="text-sm font-medium text-muted-foreground">Password</label>
                        <div className="space-y-2">
                            <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-accent focus-within:bg-accent/10">
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    required
                                    onChange={handlePasswordChange}
                                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                                />
                            </div>
                            {/* Password strength indicator */}
                            <div className="flex gap-1">
                                <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${strengthColors[passwordStrength]} ${strengthWidth[passwordStrength]}`}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Password strength: <span className="capitalize">{passwordStrength}</span>
                            </p>
                        </div>
                    </div>

                    <div className="animate-element animate-delay-600 flex items-start gap-3 text-sm">
                        <input type="checkbox" name="terms" required className="custom-checkbox mt-0.5" />
                        <span className="text-foreground/90">
                            I agree to the{' '}
                            <span className="text-accent font-medium">
                                Terms of Service
                            </span>{' '}
                            and{' '}
                            <span className="text-accent font-medium">
                                Privacy Policy
                            </span>
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="animate-element animate-delay-700 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="animate-element animate-delay-800 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/signin')}
                        className="text-accent hover:underline transition-colors"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </AuthLayout>
    );
};

export default SignUp;
