import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "../../interfaces/auth.interface";
import MessagingService from "./messaging.service";
import { SendMessageDto, CreateConversationDto } from "./messaging.dto";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import HttpException from "../../exceptions/HttpException";
import DB from "../../../database/index.schema";
import { USERS_TABLE } from "../user/users.schema";
import { emitNewMessage, isSocketInitialized } from "../../utils/socket";

/**
 * Messaging Controller
 *
 * Handles HTTP requests for direct messaging feature.
 */
class MessagingController {
    /**
     * GET /messages/conversations
     * Get all conversations for the current user.
     */
    public getConversations = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = req.userId!;
            const conversations = await MessagingService.getConversations(userId);

            res.status(200).json({
                success: true,
                data: conversations,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /messages/conversations
     * Create or get a conversation with a specific user.
     */
    public createConversation = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = req.userId!;
            const dto = plainToInstance(CreateConversationDto, req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                const messages = errors.map((e) => Object.values(e.constraints || {})).flat();
                return next(new HttpException(400, messages.join(", ")));
            }

            // Get current user's role to validate messaging permissions
            const currentUser = await DB(USERS_TABLE).where("id", userId).first();
            const recipientUser = await DB(USERS_TABLE).where("id", dto.recipient_id).first();

            if (!recipientUser) {
                return next(new HttpException(404, "Recipient not found"));
            }

            // Validate admin <-> employee only
            if (currentUser.role === recipientUser.role) {
                return next(
                    new HttpException(403, "Messaging is only allowed between admins and employees")
                );
            }

            const conversation = await MessagingService.getOrCreateConversation(
                userId,
                dto.recipient_id
            );

            res.status(200).json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /messages/conversations/:id/messages
     * Get messages for a specific conversation (paginated).
     */
    public getMessages = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = req.userId!;
            const conversationId = parseInt(req.params.id);
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

            if (isNaN(conversationId)) {
                return next(new HttpException(400, "Invalid conversation ID"));
            }

            const result = await MessagingService.getMessages(
                conversationId,
                userId,
                page,
                limit
            );

            res.status(200).json({
                success: true,
                data: result.messages,
                pagination: {
                    page,
                    limit,
                    hasMore: result.hasMore,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /messages/conversations/:id/messages
     * Send a new message in a conversation.
     */
    public sendMessage = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = req.userId!;
            const conversationId = parseInt(req.params.id);
            const dto = plainToInstance(SendMessageDto, req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                const messages = errors.map((e) => Object.values(e.constraints || {})).flat();
                return next(new HttpException(400, messages.join(", ")));
            }

            if (isNaN(conversationId)) {
                return next(new HttpException(400, "Invalid conversation ID"));
            }

            const message = await MessagingService.sendMessage(
                conversationId,
                userId,
                dto.content
            );

            // Broadcast to recipient via WebSocket for real-time delivery
            if (isSocketInitialized()) {
                const messageWithRecipient = message as typeof message & { recipient_id: number };
                emitNewMessage(messageWithRecipient.recipient_id, {
                    id: message.id,
                    conversation_id: message.conversation_id,
                    sender_id: message.sender_id,
                    sender_name: message.sender_name,
                    content: message.content,
                    created_at: message.created_at as string,
                });
            }

            res.status(201).json({
                success: true,
                data: message,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * PATCH /messages/conversations/:id/read
     * Mark all messages in a conversation as read.
     */
    public markAsRead = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = req.userId!;
            const conversationId = parseInt(req.params.id);

            if (isNaN(conversationId)) {
                return next(new HttpException(400, "Invalid conversation ID"));
            }

            const updatedCount = await MessagingService.markAsRead(conversationId, userId);

            res.status(200).json({
                success: true,
                data: { updatedCount },
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /messages/unread-count
     * Get total unread message count for current user.
     */
    public getUnreadCount = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = req.userId!;
            const count = await MessagingService.getUnreadCount(userId);

            res.status(200).json({
                success: true,
                data: { count },
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /messages/contacts
     * Get list of users the current user can message.
     */
    public getContacts = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = req.userId!;

            // Get current user's role
            const user = await DB(USERS_TABLE).where("id", userId).first();
            if (!user) {
                return next(new HttpException(404, "User not found"));
            }

            const contacts = await MessagingService.getContacts(userId, user.role);

            res.status(200).json({
                success: true,
                data: contacts,
            });
        } catch (error) {
            next(error);
        }
    };
}

export default MessagingController;
