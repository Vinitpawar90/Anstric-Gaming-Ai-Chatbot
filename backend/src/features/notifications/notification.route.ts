import { Router } from "express";
import Route from "../../interfaces/route.interface";
import NotificationController from "./notification.controller";
import validationMiddleware from "../../middlewares/validation.middleware";
import { BroadcastNotificationDto } from "./notification.dto";

class NotificationRoute implements Route {
    public path = "/notifications";
    public router = Router();
    public notificationController = new NotificationController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Get user's notifications (supports query params: ?type=document_upload&status=unread&limit=10&offset=0)
        this.router.get(
            `${this.path}`,
            this.notificationController.getNotifications
        );

        // Get unread count
        this.router.get(
            `${this.path}/unread-count`,
            this.notificationController.getUnreadCount
        );

        // Mark specific notification as read
        this.router.put(
            `${this.path}/:id/read`,
            this.notificationController.markAsRead
        );

        // Mark all notifications as read
        this.router.post(
            `${this.path}/read-all`,
            this.notificationController.markAllAsRead
        );

        // Delete a notification
        this.router.delete(
            `${this.path}/:id`,
            this.notificationController.deleteNotification
        );

        // Broadcast notification to all users (Admin only - TODO: add admin middleware)
        this.router.post(
            `${this.path}/broadcast`,
            validationMiddleware(BroadcastNotificationDto, "body", false, []),
            this.notificationController.broadcastNotification
        );
    }
}

export default NotificationRoute;
