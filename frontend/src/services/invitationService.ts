import api from './api';

export interface Invitation {
    id: number;
    email: string;
    role: 'employee' | 'admin';
    invitation_token: string;
    invitation_expires: string;
    invited_by: number;
    created_at: string;
    invitation_link?: string;
}

export interface InvitationValidation {
    email: string;
    role: string;
    expires: string;
}

export const invitationService = {
    // Create invitation (admin)
    createInvitation: async (data: {
        email: string;
        role: 'employee' | 'admin';
        name?: string;
    }): Promise<Invitation> => {
        const response = await api.post('/invitations', data);
        return response.data.data;
    },

    // Get pending invitations (admin)
    getPendingInvitations: async (): Promise<Invitation[]> => {
        const response = await api.get('/invitations');
        return response.data.data;
    },

    // Cancel invitation (admin)
    cancelInvitation: async (id: number): Promise<void> => {
        await api.delete(`/invitations/${id}`);
    },

    // Validate token (public - no auth)
    validateToken: async (token: string): Promise<InvitationValidation> => {
        const response = await api.get(`/invitations/validate/${token}`);
        return response.data.data;
    },

    // Accept invitation (public - no auth)
    acceptInvitation: async (data: {
        token: string;
        name: string;
        password: string;
        phone_number?: string;
    }) => {
        const response = await api.post('/invitations/accept', data);
        return response.data.data;
    },
};
