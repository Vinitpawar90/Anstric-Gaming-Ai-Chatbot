import { NextFunction, Request, Response } from "express";
import { RequestWithUser } from "../../interfaces/auth.interface";
import NotificationService from "./notification.service";
import { BroadcastNotificationDto, NotificationQueryDto } from "./notification.dto";
import HttpException from "../../exceptions/HttpException";
import ResponseUtil from "../../utils/response.util";

class NotificationController {
    public notificationService = new NotificationService();

    /**
     * Get notifications for the authenticated user
     */
    public getNotifications = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            const query: NotificationQueryDto = {
                type: req.query.type as string,
                status: req.query.status as any,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
            };

            const result = await this.notificationService.getUserNotifications(userId, query);

            res.status(200).json(
                ResponseUtil.success("Notifications retrieved successfully", result)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get unread notification count
     */
    public getUnreadCount = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            const count = await this.notificationService.getUnreadCount(userId);

            res.status(200).json(
                ResponseUtil.success("Unread count retrieved successfully", { count })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Mark a notification as read
     */
    public markAsRead = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;
            const notificationId = Number(req.params.id);

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            if (isNaN(notificationId)) {
                throw new HttpException(400, "Invalid notification ID");
            }

            const notification = await this.notificationService.markAsRead(notificationId, userId);

            res.status(200).json(
                ResponseUtil.updated("Notification marked as read", notification)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Mark all notifications as read
     */
    public markAllAsRead = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            const count = await this.notificationService.markAllAsRead(userId);

            res.status(200).json(
                ResponseUtil.success(`${count} notification(s) marked as read`, { count })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Delete a notification
     */
    public deleteNotification = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;
            const notificationId = Number(req.params.id);

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            if (isNaN(notificationId)) {
                throw new HttpException(400, "Invalid notification ID");
            }

            await this.notificationService.deleteNotification(notificationId, userId);

            res.status(200).json(
                ResponseUtil.deleted("Notification deleted successfully")
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Broadcast notification to all users (Admin only)
     */
    public broadcastNotification = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            // TODO: Add admin role check
            // For now, any authenticated user can broadcast (should be restricted to admin)

            const data: BroadcastNotificationDto = req.body;

            const count = await this.notificationService.broadcastNotification(data);

            res.status(200).json(
                ResponseUtil.success(`Notification sent to ${count} user(s)`, { count })
            );
        } catch (error) {
            next(error);
        }
    };
}

export default NotificationController;
