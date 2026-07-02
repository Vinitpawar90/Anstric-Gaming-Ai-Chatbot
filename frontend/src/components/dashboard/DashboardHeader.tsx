import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ProfileDropdown } from './ProfileDropdown';

interface DashboardHeaderProps {
    title: string;
    user: User;
    onLogout?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, user, onLogout }) => {
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
            <div className="flex items-center justify-between px-6 lg:px-8 py-4">
                {/* Page Title */}
                <div className="flex-1">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <NotificationBell />

                    {/* User Profile Dropdown (desktop only) */}
                    <div className="hidden lg:block pl-4 border-l border-border">
                        <ProfileDropdown user={user} onLogout={onLogout} />
                    </div>
                </div>
            </div>
        </header>
    );
};
