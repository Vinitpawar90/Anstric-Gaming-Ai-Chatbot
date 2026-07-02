import React from 'react';
import { TestimonialCard, Testimonial } from './TestimonialCard';

interface AuthLayoutProps {
    children: React.ReactNode;
    heroImageSrc?: string;
    testimonials?: Testimonial[];
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    heroImageSrc,
    testimonials = [],
}) => {
    return (
        <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
            {/* Left column: auth form */}
            <section className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">{children}</div>
            </section>

            {/* Right column: hero image + testimonials */}
            {heroImageSrc && (
                <section className="hidden md:block flex-1 relative p-4">
                    <div
                        className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${heroImageSrc})` }}
                    ></div>
                    {testimonials.length > 0 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
                            <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
                            {testimonials[1] && (
                                <div className="hidden xl:flex">
                                    <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                                </div>
                            )}
                            {testimonials[2] && (
                                <div className="hidden 2xl:flex">
                                    <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};
