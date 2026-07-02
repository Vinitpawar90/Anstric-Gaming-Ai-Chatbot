import { Navigate, RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

// Employee pages
import EmployeeDashboard from '@/pages/employee/EmployeeDashboard';
import AskBrain from '@/pages/employee/AskBrain';
import MyDocuments from '@/pages/employee/MyDocuments';
import MyProfile from '@/pages/employee/MyProfile';
import { MessagesPage } from '@/pages/shared/Messages';

export const employeeRoutes: RouteObject = {
    path: '/employee',
    element: (
        <ProtectedRoute requiredRole="employee">
            <DashboardLayout />
        </ProtectedRoute>
    ),
    children: [
        { index: true, element: <Navigate to="/employee/dashboard" replace /> },
        { path: 'dashboard', element: <EmployeeDashboard /> },
        { path: 'ask', element: <AskBrain /> },
        { path: 'documents', element: <MyDocuments /> },
        { path: 'profile', element: <MyProfile /> },
        { path: 'messages', element: <MessagesPage /> },
    ],
};
