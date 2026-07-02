import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { SocialButton } from '@/components/auth/SocialButton';
import { Testimonial } from '@/components/auth/TestimonialCard';

const SignIn = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const loggedInUser = await login({ email, password });

            toast({
                title: "Login successful!",
                description: "Welcome back to Anstric Gaming",
            });

            // Redirect based on role
            if (loggedInUser.role === 'admin') {
                navigate('/admin/overview');
            } else {
                navigate('/employee/dashboard');
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login failed",
                description: error.response?.data?.message || "Invalid credentials",
            });
        } finally {
            setIsLoading(false);
        }
    };





    const testimonials: Testimonial[] = [
        {
            avatarSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            name: 'Aarav Mehta',
            handle: '@aaravm',
            text: 'Anstric Gaming transformed how our team shares knowledge!',
        },
        {
            avatarSrc: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
            name: 'Ananya Iyer',
            handle: '@ananyai',
            text: 'Onboarding new employees is 10x faster now.',
        },
        {
            avatarSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
            name: 'Vikram Malhotra',
            handle: '@vikramm',
            text: 'Best team knowledge platform we\'ve used.',
        },
    ];

    return (
        <AuthLayout
            heroImageSrc="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=1000&fit=crop"
            testimonials={testimonials}
        >
            <div className="flex flex-col gap-6">
                <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
                    <span className="font-light text-foreground tracking-tighter">Welcome Back</span>
                </h1>
                <p className="animate-element animate-delay-200 text-muted-foreground">
                    Access your account and continue your journey with Anstric Gaming
                </p>

                <form className="space-y-5" onSubmit={handleSignIn}>
                    <div className="animate-element animate-delay-300">
                        <AuthFormField
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="Enter your email address"
                            required
                        />
                    </div>

                    <div className="animate-element animate-delay-400">
                        <AuthFormField
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="animate-element animate-delay-500 flex items-center text-sm">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                            <span className="text-foreground/90">Keep me signed in</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="animate-element animate-delay-700 text-center text-sm text-muted-foreground">
                    New to Anstric Gaming?{' '}
                    <button
                        onClick={() => navigate('/signup')}
                        className="text-accent hover:underline transition-colors"
                    >
                        Create Account
                    </button>
                </p>
            </div>
        </AuthLayout>
    );
};

export default SignIn;
