import React from 'react';

interface GlassInputWrapperProps {
    children: React.ReactNode;
}

export const GlassInputWrapper: React.FC<GlassInputWrapperProps> = ({ children }) => {
    return (
        <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-accent focus-within:bg-accent/10">
            {children}
        </div>
    );
};
