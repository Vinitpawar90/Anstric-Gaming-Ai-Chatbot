import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, LayoutDashboard, FileText, Users, BarChart3, Menu, X, MessageCircle, User as UserIcon, BookOpen, Bot, GraduationCap, MessageSquare } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import messagingService from '@/services/messagingService';
import { useSocketContext } from '@/contexts/SocketContext';
import { useEffect } from 'react';
import { User } from '@/types';

interface SidebarProps {
    user: User;
    onLogout?: () => void;
}

interface NavItem {
    name: string;
    path: string;
    icon: React.ElementType;
    roles: ('admin' | 'employee')[];
}

// Combined navigation items for both admin and employee
const navItems: NavItem[] = [
    // Admin routes
    { name: 'Overview', path: '/admin/overview', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Knowledge Base', path: '/admin/knowledge-base', icon: FileText, roles: ['admin'] },
    { name: 'Ask Brain', path: '/admin/ask', icon: MessageCircle, roles: ['admin'] },
    { name: 'Users', path: '/admin/users', icon: Users, roles: ['admin'] },
    { name: 'Agents', path: '/admin/agents', icon: Bot, roles: ['admin'] },
    // { name: 'Onboarding', path: '/admin/onboarding', icon: GraduationCap, roles: ['admin'] },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, roles: ['admin'] },
    { name: 'Messages', path: '/admin/messages', icon: MessageSquare, roles: ['admin'] },
    { name: 'My Profile', path: '/admin/profile', icon: UserIcon, roles: ['admin'] },
    // Employee routes
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard, roles: ['employee'] },
    { name: 'Ask Brain', path: '/employee/ask', icon: MessageCircle, roles: ['employee'] },
    { name: 'Documents', path: '/employee/documents', icon: BookOpen, roles: ['employee'] },
    { name: 'Messages', path: '/employee/messages', icon: MessageSquare, roles: ['employee'] },
    { name: 'My Profile', path: '/employee/profile', icon: UserIcon, roles: ['employee'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
    const location = useLocation();
    const queryClient = useQueryClient();
    const { socket } = useSocketContext();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Fetch unread messages count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['unreadMessagesCount'],
        queryFn: messagingService.getUnreadCount,
        refetchOnWindowFocus: true,
    });

    // Listen for new messages to update unread count
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = () => {
            queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
        };

        socket.on('message:new', handleNewMessage);
        return () => {
            socket.off('message:new', handleNewMessage);
        };
    }, [socket, queryClient]);

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

    // Dynamic dashboard label
    const dashboardLabel = user.role === 'admin' ? 'Admin Dashboard' : 'Employee Portal';

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="px-6 py-4 border-b border-border">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Brain className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-primary">Anstric Gaming</h1>
                        <p className="text-xs text-muted-foreground">{dashboardLabel}</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${isActive
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                            {item.name === 'Messages' && unreadCount > 0 && (
                                <span className="absolute right-4 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                            )}
                        </Link>
                    );
                })}
            </nav>


        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col w-72 bg-card border-r border-border h-screen sticky top-0">
                <SidebarContent />
            </aside>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card border border-border shadow-lg"
            >
                {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Sidebar */}
            {isMobileOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsMobileOpen(false)}
                    />
                    <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col">
                        <SidebarContent />
                    </aside>
                </>
            )}
        </>
    );
};
