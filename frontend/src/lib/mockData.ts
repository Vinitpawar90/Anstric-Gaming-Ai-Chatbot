import { User, Document, Question, Analytics, Activity, Stat, TrendData, PopularQuestion, KnowledgeGap, DepartmentStat } from '@/types';

// Mock Users
export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@anstricgaming.com',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        department: 'Management',
        joinedDate: '2024-01-15',
        status: 'active',
        lastActive: '2026-01-16T10:30:00',
    },
    {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.j@anstricgaming.com',
        role: 'employee',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        department: 'Engineering',
        joinedDate: '2024-03-20',
        status: 'active',
        lastActive: '2026-01-16T09:15:00',
    },
    {
        id: '3',
        name: 'Michael Chen',
        email: 'michael.c@anstricgaming.com',
        role: 'employee',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        department: 'Engineering',
        joinedDate: '2024-02-10',
        status: 'active',
        lastActive: '2026-01-16T11:45:00',
    },
    {
        id: '4',
        name: 'Emily Davis',
        email: 'emily.d@anstricgaming.com',
        role: 'employee',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        department: 'HR',
        joinedDate: '2024-04-05',
        status: 'active',
        lastActive: '2026-01-15T16:20:00',
    },
    {
        id: '5',
        name: 'David Park',
        email: 'david.p@anstricgaming.com',
        role: 'employee',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        department: 'Marketing',
        joinedDate: '2024-05-12',
        status: 'active',
        lastActive: '2026-01-16T08:30:00',
    },
    {
        id: '6',
        name: 'Lisa Anderson',
        email: 'lisa.a@anstricgaming.com',
        role: 'employee',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        department: 'Engineering',
        joinedDate: '2024-06-18',
        status: 'inactive',
        lastActive: '2026-01-10T14:00:00',
    },
];

// Mock Documents
export const mockDocuments: Document[] = [
    {
        id: 'doc-1',
        title: 'Employee Handbook 2024',
        category: 'HR Policies',
        uploadedBy: 'Admin User',
        uploadDate: '2024-01-15',
        lastModified: '2024-12-10',
        status: 'active',
        fileType: 'PDF',
        tags: ['HR', 'Policies', 'Onboarding'],
        version: 3,
        size: '2.4 MB',
    },
    {
        id: 'doc-2',
        title: 'Leave Application Process',
        category: 'HR Policies',
        uploadedBy: 'Emily Davis',
        uploadDate: '2024-02-20',
        lastModified: '2025-08-15',
        status: 'active',
        fileType: 'PDF',
        tags: ['HR', 'Leave', 'Process'],
        version: 2,
        size: '1.2 MB',
    },
    {
        id: 'doc-3',
        title: 'API Documentation v2.0',
        category: 'Technical',
        uploadedBy: 'Michael Chen',
        uploadDate: '2024-03-10',
        lastModified: '2026-01-05',
        status: 'active',
        fileType: 'Markdown',
        tags: ['API', 'Technical', 'Development'],
        version: 5,
        size: '850 KB',
    },
    {
        id: 'doc-4',
        title: 'Deployment Guide',
        category: 'Technical',
        uploadedBy: 'Sarah Johnson',
        uploadDate: '2024-04-22',
        lastModified: '2025-11-20',
        status: 'active',
        fileType: 'Markdown',
        tags: ['DevOps', 'Deployment', 'Technical'],
        version: 4,
        size: '650 KB',
    },
    {
        id: 'doc-5',
        title: 'Authentication Flow Overview',
        category: 'Technical',
        uploadedBy: 'Michael Chen',
        uploadDate: '2024-05-08',
        lastModified: '2025-09-12',
        status: 'outdated',
        fileType: 'PDF',
        tags: ['Auth', 'Security', 'Technical'],
        version: 1,
        size: '1.8 MB',
    },
    {
        id: 'doc-6',
        title: 'Marketing Strategy Q1 2024',
        category: 'Marketing',
        uploadedBy: 'David Park',
        uploadDate: '2024-01-05',
        lastModified: '2024-03-30',
        status: 'outdated',
        fileType: 'DOCX',
        tags: ['Marketing', 'Strategy'],
        version: 1,
        size: '3.2 MB',
    },
    {
        id: 'doc-7',
        title: 'Code Review Guidelines',
        category: 'Technical',
        uploadedBy: 'Sarah Johnson',
        uploadDate: '2024-07-15',
        lastModified: '2025-12-01',
        status: 'active',
        fileType: 'Markdown',
        tags: ['Development', 'Best Practices'],
        version: 2,
        size: '420 KB',
    },
    {
        id: 'doc-8',
        title: 'Benefits Package Info',
        category: 'HR Policies',
        uploadedBy: 'Emily Davis',
        uploadDate: '2024-02-01',
        lastModified: '2024-02-01',
        status: 'pending',
        fileType: 'PDF',
        tags: ['HR', 'Benefits'],
        version: 1,
        size: '1.5 MB',
    },
];

// Mock Questions
export const mockQuestions: Question[] = [
    {
        id: 'q-1',
        userId: '2',
        userName: 'Sarah Johnson',
        question: 'How do I apply for leave?',
        answer: 'You can apply for leave through the HR portal. Navigate to the Leave section, select the dates, and submit your request. Your manager will be notified automatically.',
        timestamp: '2026-01-16T09:30:00',
        category: 'HR Policies',
        helpful: true,
        responseTime: 2,
    },
    {
        id: 'q-2',
        userId: '3',
        userName: 'Michael Chen',
        question: 'What is the deployment process for production?',
        answer: 'Follow the deployment guide in the technical documentation. Key steps: 1) Create a release branch, 2) Run tests, 3) Get approval, 4) Deploy to staging, 5) Deploy to production.',
        timestamp: '2026-01-16T08:15:00',
        category: 'Technical',
        helpful: true,
        responseTime: 3,
    },
    {
        id: 'q-3',
        userId: '4',
        userName: 'Emily Davis',
        question: 'Where can I find the benefits package information?',
        answer: 'The benefits package information is available in the HR section of the knowledge base. Look for "Benefits Package Info" document.',
        timestamp: '2026-01-15T14:20:00',
        category: 'HR Policies',
        helpful: null,
        responseTime: 1,
    },
    {
        id: 'q-4',
        userId: '5',
        userName: 'David Park',
        question: 'How does authentication work in our app?',
        answer: 'Our authentication uses JWT tokens with OAuth 2.0. Please refer to the "Authentication Flow Overview" document for detailed information.',
        timestamp: '2026-01-15T11:45:00',
        category: 'Technical',
        helpful: false,
        responseTime: 4,
    },
    {
        id: 'q-5',
        userId: '2',
        userName: 'Sarah Johnson',
        question: 'What are the code review guidelines?',
        answer: 'Code review guidelines are documented in the "Code Review Guidelines" file. Key points: check for code quality, test coverage, and follow naming conventions.',
        timestamp: '2026-01-14T16:30:00',
        category: 'Technical',
        helpful: true,
        responseTime: 2,
    },
];

// Mock Activities
export const mockActivities: Activity[] = [
    {
        id: 'act-1',
        type: 'upload',
        message: 'uploaded "API Documentation v2.0"',
        timestamp: '2026-01-16T11:30:00',
        user: 'Michael Chen',
    },
    {
        id: 'act-2',
        type: 'question',
        message: 'asked about leave application process',
        timestamp: '2026-01-16T09:30:00',
        user: 'Sarah Johnson',
    },
    {
        id: 'act-3',
        type: 'document_updated',
        message: 'updated "Code Review Guidelines"',
        timestamp: '2026-01-15T15:20:00',
        user: 'Sarah Johnson',
    },
    {
        id: 'act-4',
        type: 'user_joined',
        message: 'joined the platform',
        timestamp: '2026-01-15T10:00:00',
        user: 'Lisa Anderson',
    },
    {
        id: 'act-5',
        type: 'question',
        message: 'asked about authentication flow',
        timestamp: '2026-01-15T11:45:00',
        user: 'David Park',
    },
];

// Mock Stats
export const mockStats: Stat[] = [
    {
        id: 'stat-1',
        title: 'Total Users',
        value: 6,
        change: 12.5,
        trend: 'up',
        icon: 'Users',
    },
    {
        id: 'stat-2',
        title: 'Total Documents',
        value: 8,
        change: 25.0,
        trend: 'up',
        icon: 'FileText',
    },
    {
        id: 'stat-3',
        title: 'Questions Asked',
        value: 147,
        change: 8.2,
        trend: 'up',
        icon: 'MessageSquare',
    },
    {
        id: 'stat-4',
        title: 'Avg Response Time',
        value: '2.4s',
        change: -15.3,
        trend: 'down',
        icon: 'Clock',
    },
];

// Mock Trend Data
export const mockTrendData: TrendData[] = [
    { date: '2026-01-10', questions: 12, users: 4 },
    { date: '2026-01-11', questions: 15, users: 5 },
    { date: '2026-01-12', questions: 10, users: 3 },
    { date: '2026-01-13', questions: 18, users: 6 },
    { date: '2026-01-14', questions: 22, users: 5 },
    { date: '2026-01-15', questions: 19, users: 4 },
    { date: '2026-01-16', questions: 25, users: 5 },
];

// Mock Popular Questions
export const mockPopularQuestions: PopularQuestion[] = [
    { question: 'How do I apply for leave?', count: 23, category: 'HR Policies' },
    { question: 'What is the deployment process?', count: 18, category: 'Technical' },
    { question: 'How does authentication work?', count: 15, category: 'Technical' },
    { question: 'Where is the API documentation?', count: 12, category: 'Technical' },
    { question: 'What are the benefits?', count: 10, category: 'HR Policies' },
];

// Mock Knowledge Gaps
export const mockKnowledgeGaps: KnowledgeGap[] = [
    { topic: 'Deployment Process', frequency: 18, status: 'missing' },
    { topic: 'Authentication Flow', frequency: 15, status: 'outdated' },
    { topic: 'Leave Policy', frequency: 12, status: 'missing' },
    { topic: 'Marketing Strategy', frequency: 8, status: 'outdated' },
];

// Mock Department Stats
export const mockDepartmentStats: DepartmentStat[] = [
    { department: 'Engineering', activeUsers: 3, questionsAsked: 78, avgResponseTime: 2.8 },
    { department: 'HR', activeUsers: 1, questionsAsked: 34, avgResponseTime: 1.5 },
    { department: 'Marketing', activeUsers: 1, questionsAsked: 25, avgResponseTime: 2.1 },
    { department: 'Management', activeUsers: 1, questionsAsked: 10, avgResponseTime: 3.2 },
];

// Mock Analytics
export const mockAnalytics: Analytics = {
    totalUsers: 6,
    totalDocuments: 8,
    totalQuestions: 147,
    avgResponseTime: 2.4,
    activeUsersToday: 5,
    newDocumentsThisWeek: 2,
    trendsData: mockTrendData,
    popularQuestions: mockPopularQuestions,
    knowledgeGaps: mockKnowledgeGaps,
    departmentStats: mockDepartmentStats,
};

// Helper function to get current user (mock)
export const getCurrentUser = (): User => {
    // Check if user is stored in localStorage (from login)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            // Find the full user object from mockUsers
            const fullUser = mockUsers.find(u => u.email === parsed.email);
            if (fullUser) {
                return fullUser;
            }
        } catch {
            // Invalid JSON, fall through to default
        }
    }
    // Default to admin user for testing
    return mockUsers[0];
};

// Helper to filter users by role
export const getUsersByRole = (role: 'admin' | 'employee'): User[] => {
    return mockUsers.filter(user => user.role === role);
};

// Set a specific user as the current user (for testing different roles)
export const setCurrentUser = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
        localStorage.setItem('user', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        }));
    }
};
