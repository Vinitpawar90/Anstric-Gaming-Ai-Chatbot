/**
 * Messaging Interfaces
 * 
 * TypeScript interfaces for direct messaging feature.
 */

export interface DirectMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    is_read: boolean;
    created_at: Date | string;
    // Joined fields
    sender_name?: string;
}

export interface DMConversation {
    id: number;
    participant_one: number;
    participant_two: number;
    last_message_at: Date | string;
    created_at: Date | string;
    // Joined/computed fields
    other_user_id?: number;
    other_user_name?: string;
    other_user_role?: string;
    unread_count?: number;
    last_message?: string;
}

export interface Contact {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'employee';
}

export interface SendMessageData {
    content: string;
}

export interface CreateConversationData {
    recipient_id: number;
}

export interface MessageWithSender extends DirectMessage {
    sender_name: string;
    sender_role: string;
}

// WebSocket event payloads
export interface NewMessageEvent {
    id: number;
    conversation_id: number;
    sender_id: number;
    sender_name: string;
    content: string;
    created_at: string;
}

export interface TypingEvent {
    conversation_id: number;
    user_id: number;
    user_name: string;
}

export interface ReadReceiptEvent {
    conversation_id: number;
    reader_id: number;
}
