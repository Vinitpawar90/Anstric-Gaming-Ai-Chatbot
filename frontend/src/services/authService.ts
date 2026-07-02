import api from './api';

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface LoginData {
    email: string;
    password: string;
}

interface UserData {
    id: number;
    email: string;
    name: string;
    role: 'employee' | 'admin';
    avatar?: string;
    job_title?: string;
    department?: string;
    bio?: string;
    created_at?: string;
    last_login?: string;
}

export interface LoginResponse {
    status: string;
    message: string;
    data: {
        user: UserData;
        accessToken: string;
        refreshToken: string;
    };
}

export interface RegisterResponse {
    status: string;
    message: string;
    data: UserData;
}

export const authService = {
    register: async (data: RegisterData): Promise<RegisterResponse> => {
        const response = await api.post('/users/register', data);
        return response.data;
    },

    login: async (data: LoginData): Promise<LoginResponse> => {
        const response = await api.post('/users/login', data);
        return response.data;
    },

    getProfile: async (): Promise<{ data: UserData }> => {
        const response = await api.get('/users/me');
        return response.data;
    },

    logout: async (): Promise<void> => {
        await api.post('/users/logout');
    }
};
