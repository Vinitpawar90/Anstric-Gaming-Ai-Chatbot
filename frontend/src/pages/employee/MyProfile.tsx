import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Building, Calendar, Clock } from 'lucide-react';

const MyProfile: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    // Map backend fields to UI
    const profile = {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || 'Not Assigned',
        avatar: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        joinedDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
        lastActive: user.last_login || new Date().toISOString(), // Fallback to now if missing
        status: 'active' as const,
    };



    return (
        <div className="min-h-screen">
            <DashboardHeader title="My Profile" user={profile} />

            <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* Profile Header */}
                <div className="glass rounded-2xl p-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <img
                            src={profile.avatar}
                            alt={profile.name}
                            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/20"
                        />
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                            <p className="text-muted-foreground capitalize">{profile.role}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {profile.email}
                                </span>
                                {profile.department && (
                                    <span className="flex items-center gap-1">
                                        <Building className="w-4 h-4" />
                                        {profile.department}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid removed */}

                {/* Account Info */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-foreground mb-6">Account Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                            <p className="text-foreground mt-1">{profile.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <p className="text-foreground mt-1">{profile.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Department</label>
                            <p className="text-foreground mt-1">{profile.department}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Role</label>
                            <p className="text-foreground mt-1 capitalize">{profile.role}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> Joined Date
                            </label>
                            <p className="text-foreground mt-1">{profile.joinedDate}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Last Active
                            </label>
                            <p className="text-foreground mt-1">
                                {profile.lastActive ? new Date(profile.lastActive).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preferences removed */}
            </div>
        </div>
    );
};

export default MyProfile;
