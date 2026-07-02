import api from './api';

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    message: string;
    metadata: Record<string, any> | null;
    read: boolean;
    read_at: string | null;
    created_at: string;
}

export interface NotificationQueryParams {
    type?: string;
    status?: 'read' | 'unread' | 'all';
    limit?: number;
    offset?: number;
}

export const notificationService = {
    // Get notifications
    getNotifications: async (
        params?: NotificationQueryParams
    ): Promise<{ notifications: Notification[]; total: number }> => {
        const response = await api.get('/notifications', { params });
        return response.data.data;
    },

    // Get unread count
    getUnreadCount: async (): Promise<number> => {
        const response = await api.get('/notifications/unread-count');
        return response.data.data.count;
    },

    // Mark as read
    markAsRead: async (id: number): Promise<void> => {
        await api.put(`/notifications/${id}/read`);
    },

    // Mark all as read
    markAllAsRead: async (): Promise<void> => {
        await api.post('/notifications/read-all');
    },

    // Delete notification
    deleteNotification: async (id: number): Promise<void> => {
        await api.delete(`/notifications/${id}`);
    },

    // Broadcast (admin only)
    broadcast: async (data: {
        type: string;
        message: string;
        metadata?: Record<string, any>;
    }): Promise<void> => {
        await api.post('/notifications/broadcast', data);
    },
};
