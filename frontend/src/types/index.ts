// User and authentication types
export type UserRole = 'admin' | 'employee';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar: string;
    department?: string;
    joinedDate: string;
    status: 'active' | 'inactive';
    lastActive?: string;
}

// Knowledge base types
export interface Document {
    id: string;
    title: string;
    category: string;
    uploadedBy: string;
    uploadDate: string;
    lastModified: string;
    status: 'active' | 'outdated' | 'pending';
    fileType: string;
    tags: string[];
    version: number;
    size: string;
}

// Q&A types
export interface Question {
    id: string;
    userId: string;
    userName: string;
    question: string;
    answer: string;
    timestamp: string;
    category: string;
    helpful: boolean | null;
    responseTime: number; // in seconds
}

// Analytics types
export interface Analytics {
    totalUsers: number;
    totalDocuments: number;
    totalQuestions: number;
    avgResponseTime: number;
    activeUsersToday: number;
    newDocumentsThisWeek: number;
    trendsData: TrendData[];
    popularQuestions: PopularQuestion[];
    knowledgeGaps: KnowledgeGap[];
    departmentStats: DepartmentStat[];
}

export interface TrendData {
    date: string;
    questions: number;
    users: number;
}

export interface PopularQuestion {
    question: string;
    count: number;
    category: string;
}

export interface KnowledgeGap {
    topic: string;
    frequency: number;
    status: 'missing' | 'outdated';
}

export interface DepartmentStat {
    department: string;
    activeUsers: number;
    questionsAsked: number;
    avgResponseTime: number;
}

// Activity feed types
export interface Activity {
    id: string;
    type: 'upload' | 'question' | 'user_joined' | 'document_updated';
    message: string;
    timestamp: string;
    user: string;
    icon?: string;
}

// Stats card types
export interface Stat {
    id: string;
    title: string;
    value: string | number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
    icon: string;
}
