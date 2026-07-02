export interface IInvitation {
    id: number;
    email: string;
    role: 'employee' | 'admin';
    invitation_token: string;
    invitation_expires: Date;
    invited_by: number;
    created_at: Date;
    accepted_at?: Date | null;
    is_accepted: boolean;
}

export interface IInvitationValidation {
    valid: boolean;
    invitation?: IInvitation;
    error?: string;
}
