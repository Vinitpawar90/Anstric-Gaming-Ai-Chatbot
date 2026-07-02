import api from './api';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface ChatSession {
    id: number;
    agent_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
}

export interface ChatSessionWithSummary extends ChatSession {
    title?: string;
    message_count?: number;
    last_message?: string;
    last_message_at?: string;
}

export interface ChatMessage {
    id: number;
    session_id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
    feedback?: 'thumbs_up' | 'thumbs_down' | null;
    feedback_comment?: string | null;
}

export interface MessageMetadata {
    response_time?: number;
    sources?: Array<{
        title: string;
        snippet: string;
        relevance: number;
    }>;
    confidence?: number;
    model?: string;
    tokens_used?: number;
}

export interface SendMessageRequest {
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    sessionId?: string;
    sourceSelection?: 'auto' | 'file' | 'text' | 'website' | 'database' | 'qa';
    searchStrategy?: 'simple_hybrid' | 'pinecone_hybrid' | 'semantic_only';
    enableReranking?: boolean;
    rerankModel?: string;
}

export interface SendMessageResponse {
    sessionId: number;
    userMessageId: number;
    assistantMessageId: number;
    response: string;
    sources?: Array<{
        title: string;
        snippet: string;
        relevance: number;
    }>;
    metadata?: MessageMetadata;
}

export interface CreateSessionRequest {
    agentId: number;
}

// ============================================================================
// Chat Service
// ============================================================================

class ChatService {
    /**
     * Create a new chat session with an agent
     */
    async createSession(agentId: number): Promise<ChatSession> {
        const response = await api.post('/chat/sessions', { agentId });
        return response.data.data;
    }

    /**
     * Get all chat sessions for the current user
     * @param agentId - Optional: filter by specific agent
     */
    async getSessions(agentId?: number): Promise<ChatSessionWithSummary[]> {
        const params = agentId ? { agent_id: agentId } : {};
        const response = await api.get('/chat/sessions', { params });
        return response.data.data;
    }

    /**
     * Get chat history (messages) for a specific session
     */
    async getSessionHistory(sessionId: number): Promise<ChatMessage[]> {
        const response = await api.get(`/chat/sessions/${sessionId}/history`);
        return response.data.data.messages || [];
    }

    /**
     * Send a message to an agent and get AI response
     * @param agentId - The agent to chat with
     * @param messageData - Message content and options
     */
    async sendMessage(
        agentId: number,
        messageData: SendMessageRequest
    ): Promise<SendMessageResponse> {
        const response = await api.post(`/chat/agents/${agentId}`, messageData);
        return response.data.data;
    }

    /**
     * Delete a chat session
     */
    async deleteSession(sessionId: number): Promise<void> {
        await api.delete(`/chat/sessions/${sessionId}`);
    }

    /**
     * Rate a message (thumbs up/down with optional comment)
     */
    async rateMessage(
        messageId: number,
        rating: 'up' | 'down',
        comment?: string
    ): Promise<void> {
        await api.put(`/chat/messages/${messageId}/rating`, {
            rating,
            rating_comment: comment,
        });
    }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
