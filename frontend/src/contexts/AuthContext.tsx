import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, LoginData, RegisterData } from '@/services/authService';

interface User {
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

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginData) => Promise<User>;
    register: (data: RegisterData) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing token on mount
    // Check for existing token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken) {
            setToken(storedToken);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            // Fetch fresh profile data
            authService.getProfile()
                .then(response => {
                    // response.data from getProfile wraps the user object in 'data' usually? 
                    // Wait, getProfile implementation: return response.data.
                    // api.get('/users/me') returns { status: 'success', data: user }.
                    // So getProfile returns { status, message, data }.
                    // Actually check authService again.
                    // LoginResponse has data: { user, ... }.
                    // getProfile impl I wrote: response.data.
                    // The backend returns: res.json(ResponseUtil.success(..., userResponse)).
                    // So response body is { status: 'success', message:..., data: userResponse }.
                    // So authService.getProfile() returns { status, message, data: UserData }.

                    const userData = response.data;
                    setUser(userData as User); // existing User interface matches UserData mostly
                    localStorage.setItem('user', JSON.stringify(userData));
                })
                .catch(error => {
                    console.error('Failed to fetch profile:', error);
                    if (error.response?.status === 401) {
                        logout();
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (data: LoginData) => {
        const response = await authService.login(data);
        const { accessToken, refreshToken, user: userData } = response.data;

        setToken(accessToken);
        setUser(userData);

        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        return userData as User;
    };

    const register = async (data: RegisterData) => {
        const response = await authService.register(data);
        const userData = response.data;

        // Note: Registration does not return a token, user must login separately or backend must be updated.
        // For now, we just return the created user.
        return userData as User;
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
