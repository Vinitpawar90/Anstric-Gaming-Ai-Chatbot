import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OnboardingStatus from '@/components/onboarding/OnboardingStatus';
import TemplateEditor from '@/components/onboarding/TemplateEditor';

const OnboardingAdmin: React.FC = () => {
    const { user: authUser } = useAuth();
    const user = authUser ? {
        id: authUser.id.toString(),
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        avatar: authUser.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${authUser.email}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        joinedDate: authUser.created_at || new Date().toISOString(),
        status: 'active' as const,
    } : null;

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Onboarding Management" user={user} />

            <div className="p-6 lg:p-8">
                <Tabs defaultValue="status" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="status">User Status</TabsTrigger>
                        <TabsTrigger value="template">Template Editor</TabsTrigger>
                    </TabsList>

                    <TabsContent value="status">
                        <OnboardingStatus />
                    </TabsContent>

                    <TabsContent value="template">
                        <TemplateEditor />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default OnboardingAdmin;
