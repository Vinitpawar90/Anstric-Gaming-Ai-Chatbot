import { RouteObject } from 'react-router-dom';
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import NotFound from '@/pages/NotFound';
import InvitationSignUp from '@/pages/InvitationSignUp';
import OnboardingPage from '@/pages/OnboardingPage';
import { adminRoutes } from './adminRoutes';
import { employeeRoutes } from './employeeRoutes';

export const appRoutes: RouteObject[] = [
    { path: '/', element: <Index /> },
    { path: '/signin', element: <SignIn /> },
    { path: '/signup', element: <SignUp /> },
    { path: '/invite', element: <InvitationSignUp /> },
    { path: '/onboarding', element: <OnboardingPage /> },
    adminRoutes,
    employeeRoutes,
    { path: '*', element: <NotFound /> },
];
