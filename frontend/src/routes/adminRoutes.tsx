import { Navigate, RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

// Admin pages
import AdminOverview from '@/pages/admin/AdminOverview';
import KnowledgeBase from '@/pages/admin/KnowledgeBase';
import UserManagement from '@/pages/admin/UserManagement';
import Analytics from '@/pages/admin/Analytics';
import AgentListPage from '@/pages/admin/agents/AgentListPage';
import AgentFormPage from '@/pages/admin/agents/AgentFormPage';
import OnboardingAdmin from '@/pages/admin/OnboardingAdmin';
import { MessagesPage } from '@/pages/shared/Messages';
import AskBrain from '@/pages/employee/AskBrain';
import MyProfile from '@/pages/employee/MyProfile';

export const adminRoutes: RouteObject = {
    path: '/admin',
    element: (
        <ProtectedRoute requiredRole="admin">
            <DashboardLayout />
        </ProtectedRoute>
    ),
    children: [
        { index: true, element: <Navigate to="/admin/overview" replace /> },
        { path: 'overview', element: <AdminOverview /> },
        { path: 'knowledge-base', element: <KnowledgeBase /> },
        { path: 'users', element: <UserManagement /> },
        { path: 'analytics', element: <Analytics /> },
        { path: 'agents', element: <AgentListPage /> },
        { path: 'agents/new', element: <AgentFormPage /> },
        { path: 'agents/:id/edit', element: <AgentFormPage /> },
        { path: 'onboarding', element: <OnboardingAdmin /> },
        { path: 'messages', element: <MessagesPage /> },
        { path: 'ask', element: <AskBrain /> },
        { path: 'profile', element: <MyProfile /> },
    ],
};
