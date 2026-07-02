export interface IOnboardingTemplate {
    id: number;
    title: string;
    description: string | null;
    sections: IOnboardingSection[];
    is_active: boolean;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}

export interface IOnboardingSection {
    day: number;
    title: string;
    description?: string;
    document_ids?: number[];
}

export interface IOnboardingProgress {
    id: number;
    user_id: number;
    template_id: number;
    current_day: number;
    completed_sections: number[]; // Array of day numbers
    started_at: Date;
    completed_at: Date | null;
    is_completed: boolean;
}

export interface IOnboardingStatus {
    user_id: number;
    onboarding_completed: boolean;
    progress?: IOnboardingProgress;
    template?: IOnboardingTemplate;
    current_section?: IOnboardingSection;
    next_section?: IOnboardingSection;
}
