import api from './api';

export interface OnboardingSection {
    day: number;
    title: string;
    description?: string;
    document_ids?: number[];
    // Frontend-only fields for display
    id?: number;
    documents?: Array<{ title: string; url: string }>;
}

export interface OnboardingTemplate {
    id: number;
    title: string;
    description: string | null;
    sections: OnboardingSection[];
    is_active: boolean;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface OnboardingProgress {
    id: number;
    user_id: number;
    template_id: number;
    current_day: number;
    completed_sections: number[];
    started_at: string;
    completed_at: string | null;
    is_completed: boolean;
    // Frontend computed field
    progress_percentage?: number;
}

export interface OnboardingStatus {
    user_id: number;
    onboarding_completed: boolean;
    progress?: OnboardingProgress;
    template?: OnboardingTemplate;
    current_section?: OnboardingSection;
    next_section?: OnboardingSection;
}

// Admin view: user onboarding status with user details
export interface UserOnboardingStatus {
    user_id: number;
    name: string;
    email: string;
    is_complete: boolean;
    progress_percentage: number;
    completed_sections: number[];
    total_sections: number;
    started_at: string | null;
    completed_at: string | null;
}

export const onboardingService = {
    // Get template
    getTemplate: async (): Promise<OnboardingTemplate> => {
        const response = await api.get('/onboarding/template');
        return response.data.data;
    },

    // Update template (admin)
    updateTemplate: async (data: {
        title: string;
        description?: string;
        sections: OnboardingSection[];
    }): Promise<OnboardingTemplate> => {
        const response = await api.put('/onboarding/template', data);
        return response.data.data;
    },

    // Get user status
    getStatus: async (): Promise<OnboardingStatus> => {
        const response = await api.get('/onboarding/status');
        return response.data.data;
    },

    // Complete section
    completeSection: async (data: {
        template_id: number;
        section_day: number;
    }): Promise<OnboardingProgress> => {
        const response = await api.post('/onboarding/complete-section', data);
        return response.data.data;
    },

    // Complete onboarding
    completeOnboarding: async (): Promise<void> => {
        await api.post('/onboarding/complete');
    },

    // Get all users status (admin)
    getAllUsersStatus: async () => {
        const response = await api.get('/onboarding/all-users');
        return response.data.data;
    },
};
