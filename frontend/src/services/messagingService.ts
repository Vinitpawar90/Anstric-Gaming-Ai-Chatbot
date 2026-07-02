import api from './api';

/**
 * Messaging Service
 *
 * API methods for direct messaging feature.
 */

export interface DirectMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    sender_name: string;
    sender_role: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface Conversation {
    id: number;
    participant_one: number;
    participant_two: number;
    other_user_id: number;
    other_user_name: string;
    other_user_role: string;
    unread_count: number;
    last_message?: string;
    last_message_at: string;
    created_at: string;
}

export interface Contact {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'employee';
}

interface MessagesResponse {
    messages: DirectMessage[];
    pagination: {
        page: number;
        limit: number;
        hasMore: boolean;
    };
}

/**
 * Get all conversations for the current user.
 */
export async function getConversations(): Promise<Conversation[]> {
    const response = await api.get<{ success: boolean; data: Conversation[] }>('/messages/conversations');
    return response.data.data;
}

/**
 * Create or get a conversation with a specific user.
 */
export async function createConversation(recipientId: number): Promise<Conversation> {
    const response = await api.post<{ success: boolean; data: Conversation }>('/messages/conversations', {
        recipient_id: recipientId,
    });
    return response.data.data;
}

/**
 * Get messages for a specific conversation (paginated).
 */
export async function getMessages(
    conversationId: number,
    page = 1,
    limit = 50
): Promise<MessagesResponse> {
    const response = await api.get<{ success: boolean; data: DirectMessage[]; pagination: MessagesResponse['pagination'] }>(
        `/messages/conversations/${conversationId}/messages`,
        { params: { page, limit } }
    );
    return {
        messages: response.data.data,
        pagination: response.data.pagination,
    };
}

/**
 * Send a new message in a conversation.
 */
export async function sendMessage(conversationId: number, content: string): Promise<DirectMessage> {
    const response = await api.post<{ success: boolean; data: DirectMessage }>(
        `/messages/conversations/${conversationId}/messages`,
        { content }
    );
    return response.data.data;
}

/**
 * Mark all messages in a conversation as read.
 */
export async function markAsRead(conversationId: number): Promise<void> {
    await api.patch(`/messages/conversations/${conversationId}/read`);
}

/**
 * Get total unread message count for current user.
 */
export async function getUnreadCount(): Promise<number> {
    const response = await api.get<{ success: boolean; data: { count: number } }>('/messages/unread-count');
    return response.data.data.count;
}

/**
 * Get list of contacts the current user can message.
 */
export async function getContacts(): Promise<Contact[]> {
    const response = await api.get<{ success: boolean; data: Contact[] }>('/messages/contacts');
    return response.data.data;
}

const messagingService = {
    getConversations,
    createConversation,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    getContacts,
};

export default messagingService;
