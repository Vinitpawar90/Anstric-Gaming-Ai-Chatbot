export interface INotification {
    id: number;
    user_id: number;
    type: string;
    message: string;
    metadata: Record<string, any> | null;
    read: boolean;
    read_at: Date | null;
    created_at: Date;
}
