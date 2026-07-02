import DB from "../../../database/index.schema";
import { DM_CONVERSATIONS_TABLE } from "./dm_conversations.schema";
import { DIRECT_MESSAGES_TABLE } from "./direct_messages.schema";
import { USERS_TABLE } from "../user/users.schema";
import {
    DMConversation,
    DirectMessage,
    Contact,
    MessageWithSender,
} from "./messaging.interface";
import HttpException from "../../exceptions/HttpException";

/**
 * Messaging Service
 *
 * Business logic for direct messaging between admin and employees.
 * Employees can only message admins and vice versa.
 */
class MessagingService {
    /**
     * Get or create a conversation between two users.
     * Normalizes participant order (smaller ID first) for consistent lookups.
     */
    async getOrCreateConversation(
        userId1: number,
        userId2: number
    ): Promise<DMConversation> {
        // Normalize order: smaller ID is always participant_one
        const p1 = Math.min(userId1, userId2);
        const p2 = Math.max(userId1, userId2);

        // Check if conversation exists
        let conversation = await DB(DM_CONVERSATIONS_TABLE)
            .where({ participant_one: p1, participant_two: p2 })
            .first();

        if (!conversation) {
            // Validate that users can message each other (admin <-> employee only)
            const users = await DB(USERS_TABLE)
                .whereIn("id", [p1, p2])
                .select("id", "role");

            if (users.length !== 2) {
                throw new HttpException(404, "One or both users not found");
            }

            const roles = users.map((u) => u.role);
            const hasAdmin = roles.includes("admin");
            const hasEmployee = roles.includes("employee");

            if (!hasAdmin || !hasEmployee) {
                throw new HttpException(
                    403,
                    "Messaging is only allowed between admins and employees"
                );
            }

            // Create new conversation
            [conversation] = await DB(DM_CONVERSATIONS_TABLE)
                .insert({
                    participant_one: p1,
                    participant_two: p2,
                })
                .returning("*");
        }

        // Return enriched conversation for the user making the request
        return this.enrichConversation(conversation, userId1);
    }

    /**
     * Enrich a raw conversation with other user details, unread count, and last message.
     */
    private async enrichConversation(conv: any, userId: number): Promise<DMConversation> {
        // Determine who the "other" user is
        const otherUserId =
            conv.participant_one === userId
                ? conv.participant_two
                : conv.participant_one;

        // Get other user details
        const otherUser = await DB(USERS_TABLE)
            .where("id", otherUserId)
            .select("id", "name", "role")
            .first();

        // Get unread count
        const unreadResult = await DB(DIRECT_MESSAGES_TABLE)
            .where("conversation_id", conv.id)
            .whereNot("sender_id", userId)
            .where("is_read", false)
            .count("id as count")
            .first();

        // Get last message
        const lastMessage = await DB(DIRECT_MESSAGES_TABLE)
            .where("conversation_id", conv.id)
            .orderBy("created_at", "desc")
            .select("content")
            .first();

        return {
            ...conv,
            other_user_id: otherUserId,
            other_user_name: otherUser?.name || "Unknown",
            other_user_role: otherUser?.role || "unknown",
            unread_count: parseInt(unreadResult?.count as string) || 0,
            last_message: lastMessage?.content,
        };
    }

    /**
     * Get all conversations for a user with other user details and unread count.
     */
    async getConversations(userId: number): Promise<DMConversation[]> {
        const conversations = await DB(DM_CONVERSATIONS_TABLE)
            .where("participant_one", userId)
            .orWhere("participant_two", userId)
            .select("*")
            .orderBy("last_message_at", "desc");

        // Enrich with other user details and unread count
        const enrichedConversations = await Promise.all(
            conversations.map((conv) => this.enrichConversation(conv, userId))
        );

        return enrichedConversations;
    }

    /**
     * Get messages for a conversation with pagination.
     * Verifies user is part of the conversation.
     */
    async getMessages(
        conversationId: number,
        userId: number,
        page = 1,
        limit = 50
    ): Promise<{ messages: MessageWithSender[]; hasMore: boolean }> {
        // Verify user is part of this conversation
        const conversation = await DB(DM_CONVERSATIONS_TABLE)
            .where("id", conversationId)
            .where(function () {
                this.where("participant_one", userId).orWhere("participant_two", userId);
            })
            .first();

        if (!conversation) {
            throw new HttpException(403, "Unauthorized access to conversation");
        }

        const offset = (page - 1) * limit;

        // Get messages with sender info
        const messages = await DB(DIRECT_MESSAGES_TABLE)
            .where("conversation_id", conversationId)
            .join(USERS_TABLE, `${DIRECT_MESSAGES_TABLE}.sender_id`, `${USERS_TABLE}.id`)
            .select(
                `${DIRECT_MESSAGES_TABLE}.*`,
                `${USERS_TABLE}.name as sender_name`,
                `${USERS_TABLE}.role as sender_role`
            )
            .orderBy(`${DIRECT_MESSAGES_TABLE}.created_at`, "desc")
            .limit(limit + 1) // Get one extra to check if there are more
            .offset(offset);

        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop(); // Remove the extra message
        }

        // Reverse to show oldest first in UI
        return { messages: messages.reverse(), hasMore };
    }

    /**
     * Send a message and broadcast via WebSocket.
     */
    async sendMessage(
        conversationId: number,
        senderId: number,
        content: string
    ): Promise<MessageWithSender> {
        // Get conversation to verify access and find recipient
        const conversation = await DB(DM_CONVERSATIONS_TABLE)
            .where("id", conversationId)
            .first();

        if (!conversation) {
            throw new HttpException(404, "Conversation not found");
        }

        // Verify sender is part of conversation
        if (
            conversation.participant_one !== senderId &&
            conversation.participant_two !== senderId
        ) {
            throw new HttpException(403, "Unauthorized");
        }

        // Insert message
        const [message] = await DB(DIRECT_MESSAGES_TABLE)
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content: content.trim(),
            })
            .returning("*");

        // Update conversation timestamp
        await DB(DM_CONVERSATIONS_TABLE)
            .where("id", conversationId)
            .update({ last_message_at: DB.fn.now() });

        // Get sender info
        const sender = await DB(USERS_TABLE)
            .where("id", senderId)
            .select("name", "role")
            .first();

        // Determine recipient for WebSocket broadcast
        const recipientId =
            conversation.participant_one === senderId
                ? conversation.participant_two
                : conversation.participant_one;

        return {
            ...message,
            sender_name: sender?.name || "Unknown",
            sender_role: sender?.role || "unknown",
            recipient_id: recipientId, // Used by controller for WebSocket broadcast
        } as MessageWithSender & { recipient_id: number };
    }

    /**
     * Mark all messages in a conversation as read (for messages not sent by current user).
     */
    async markAsRead(conversationId: number, userId: number): Promise<number> {
        // Verify user is part of conversation
        const conversation = await DB(DM_CONVERSATIONS_TABLE)
            .where("id", conversationId)
            .where(function () {
                this.where("participant_one", userId).orWhere("participant_two", userId);
            })
            .first();

        if (!conversation) {
            throw new HttpException(403, "Unauthorized access to conversation");
        }

        const result = await DB(DIRECT_MESSAGES_TABLE)
            .where("conversation_id", conversationId)
            .whereNot("sender_id", userId)
            .where("is_read", false)
            .update({ is_read: true });

        return result;
    }

    /**
     * Get total unread message count for a user across all conversations.
     */
    async getUnreadCount(userId: number): Promise<number> {
        // Get all conversations for user
        const conversations = await DB(DM_CONVERSATIONS_TABLE)
            .where("participant_one", userId)
            .orWhere("participant_two", userId)
            .select("id");

        const conversationIds = conversations.map((c) => c.id);

        if (conversationIds.length === 0) return 0;

        const result = await DB(DIRECT_MESSAGES_TABLE)
            .whereIn("conversation_id", conversationIds)
            .whereNot("sender_id", userId)
            .where("is_read", false)
            .count("id as count")
            .first();

        return parseInt(result?.count as string) || 0;
    }

    /**
     * Get list of contacts the user can message.
     * - Admins can message all employees
     * - Employees can message all admins
     */
    async getContacts(userId: number, userRole: string): Promise<Contact[]> {
        const targetRole = userRole === "admin" ? "employee" : "admin";

        return DB(USERS_TABLE)
            .where("role", targetRole)
            .whereNot("id", userId)
            .where("is_deleted", false)
            .select("id", "name", "email", "role")
            .orderBy("name", "asc");
    }

    /**
     * Get a single conversation by ID with authorization check.
     */
    async getConversationById(
        conversationId: number,
        userId: number
    ): Promise<DMConversation | null> {
        const conversation = await DB(DM_CONVERSATIONS_TABLE)
            .where("id", conversationId)
            .where(function () {
                this.where("participant_one", userId).orWhere("participant_two", userId);
            })
            .first();

        return conversation ? this.enrichConversation(conversation, userId) : null;
    }
}

export default new MessagingService();
