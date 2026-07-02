import { Router } from "express";
import MessagingController from "./messaging.controller";
import Routes from "../../interfaces/route.interface";

/**
 * Messaging Routes
 *
 * API endpoints for direct messaging feature.
 */
class MessagingRoute implements Routes {
    public path = "/messages";
    public router = Router();
    private controller = new MessagingController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Get all conversations for current user
        this.router.get(
            `${this.path}/conversations`,
            this.controller.getConversations
        );

        // Create or get a conversation with a specific user
        this.router.post(
            `${this.path}/conversations`,
            this.controller.createConversation
        );

        // Get messages for a conversation (paginated)
        this.router.get(
            `${this.path}/conversations/:id/messages`,
            this.controller.getMessages
        );

        // Send a new message in a conversation
        this.router.post(
            `${this.path}/conversations/:id/messages`,
            this.controller.sendMessage
        );

        // Mark all messages in a conversation as read
        this.router.patch(
            `${this.path}/conversations/:id/read`,
            this.controller.markAsRead
        );

        // Get total unread message count
        this.router.get(
            `${this.path}/unread-count`,
            this.controller.getUnreadCount
        );

        // Get list of contacts (users that can be messaged)
        this.router.get(
            `${this.path}/contacts`,
            this.controller.getContacts
        );
    }
}

export default MessagingRoute;
