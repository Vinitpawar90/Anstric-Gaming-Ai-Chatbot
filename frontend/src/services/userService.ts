import api from './api';

// ============================================================================
// User Types (matching backend user interface)
// ============================================================================

export type UserRole = 'admin' | 'employee';

export interface User {
    id: number;
    name: string;
    email: string;
    phone_number?: string | null;
    role: UserRole;
    onboarding_completed: boolean;
    last_login: string | null;
    created_at: string;
    updated_at: string;
    // Extra fields for display
    avatar?: string;
    department?: string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    phone_number?: string;
    role?: UserRole;
}

// ============================================================================
// User Service
// ============================================================================

class UserService {
    private basePath = '/users';

    /**
     * Get all users
     */
    async getAllUsers(): Promise<User[]> {
        const response = await api.get(this.basePath);
        return response.data.data;
    }

    /**
     * Get a single user by ID
     */
    async getUserById(id: number): Promise<User> {
        const response = await api.get(`${this.basePath}/${id}`);
        return response.data.data;
    }

    /**
     * Get current logged-in user
     */
    async getCurrentUser(): Promise<User> {
        const response = await api.get(`${this.basePath}/me`);
        return response.data.data;
    }

    /**
     * Update user
     */
    async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
        const response = await api.put(`${this.basePath}/${id}`, data);
        return response.data.data;
    }

    /**
     * Delete/deactivate user
     */
    async deleteUser(id: number): Promise<void> {
        await api.delete(`${this.basePath}/${id}`);
    }

    /**
     * Helper: Generate avatar from name
     */
    getAvatarUrl(name: string): string {
        // Use UI Avatars service for consistent avatars
        const initials = name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=100`;
    }

    /**
     * Helper: Format last active date
     */
    formatLastActive(date: string | null): string {
        if (!date) return 'Never';

        const now = new Date();
        const lastActive = new Date(date);
        const diffMs = now.getTime() - lastActive.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return lastActive.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }

    /**
     * Helper: Get user status based on last login
     */
    getUserStatus(lastLogin: string | null): 'active' | 'inactive' {
        if (!lastLogin) return 'inactive';

        const now = new Date();
        const lastActive = new Date(lastLogin);
        const diffMs = now.getTime() - lastActive.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Consider user active if they logged in within last 7 days
        return diffDays <= 7 ? 'active' : 'inactive';
    }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
