import { IsString, IsOptional, IsNumber, IsObject, IsIn } from "class-validator";

/**
 * DTO for creating a notification (used internally)
 */
export class CreateNotificationDto {
    @IsNumber()
    user_id: number;

    @IsString()
    type: string; // e.g., 'document_upload', 'document_update', 'system'

    @IsString()
    message: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>; // Additional data like document ID, name, etc.
}

/**
 * DTO for broadcasting notifications to all users
 */
export class BroadcastNotificationDto {
    @IsString()
    type: string;

    @IsString()
    message: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @IsNumber()
    @IsOptional()
    except_user_id?: number; // Don't notify this user (e.g., the one who triggered the event)
}

/**
 * DTO for querying notifications
 */
export class NotificationQueryDto {
    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsIn(['read', 'unread', 'all'])
    @IsOptional()
    status?: 'read' | 'unread' | 'all';

    @IsNumber()
    @IsOptional()
    limit?: number;

    @IsNumber()
    @IsOptional()
    offset?: number;
}
