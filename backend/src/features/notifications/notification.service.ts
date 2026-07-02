import knex from "../../../database/index.schema";
import HttpException from "../../exceptions/HttpException";
import { CreateNotificationDto, BroadcastNotificationDto, NotificationQueryDto } from "./notification.dto";
import { INotification } from "./notification.interface";
import { emitToUser } from "../../utils/socket";

class NotificationService {
    /**
     * Get notifications for a user
     */
    public async getUserNotifications(
        userId: number,
        query?: NotificationQueryDto
    ): Promise<{ notifications: INotification[]; total: number }> {
        try {
            const limit = query?.limit || 50;
            const offset = query?.offset || 0;

            let queryBuilder = knex("notifications")
                .where({ user_id: userId });

            // Filter by type
            if (query?.type) {
                queryBuilder = queryBuilder.where({ type: query.type });
            }

            // Filter by read status
            if (query?.status === 'read') {
                queryBuilder = queryBuilder.where({ read: true });
            } else if (query?.status === 'unread') {
                queryBuilder = queryBuilder.where({ read: false });
            }

            // Get total count
            const countResult = await queryBuilder.clone().count('* as count').first();
            const total = parseInt(countResult?.count as string) || 0;

            // Get notifications
            const notifications = await queryBuilder
                .orderBy('created_at', 'desc')
                .limit(limit)
                .offset(offset);

            return { notifications, total };
        } catch (error: any) {
            throw new HttpException(500, `Error fetching notifications: ${error.message}`);
        }
    }

    /**
     * Create a notification for a user
     */
    public async createNotification(data: CreateNotificationDto): Promise<INotification> {
        try {
            const [notification] = await knex("notifications")
                .insert({
                    user_id: data.user_id,
                    type: data.type,
                    message: data.message,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                    read: false,
                    created_at: new Date(),
                })
                .returning("*");

            // Emit real-time notification
            emitToUser(data.user_id, 'notification:new', notification);

            return notification;
        } catch (error: any) {
            throw new HttpException(500, `Error creating notification: ${error.message}`);
        }
    }

    /**
     * Broadcast notification to all users (except optionally one)
     */
    public async broadcastNotification(data: BroadcastNotificationDto): Promise<number> {
        try {
            // Get all active users
            let usersQuery = knex("users")
                .where({ is_deleted: false })
                .select('id');

            // Exclude specific user if provided
            if (data.except_user_id) {
                usersQuery = usersQuery.whereNot({ id: data.except_user_id });
            }

            const users = await usersQuery;

            // Create notification for each user
            const notifications = users.map(user => ({
                user_id: user.id,
                type: data.type,
                message: data.message,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                read: false,
                created_at: new Date(),
            }));

            if (notifications.length > 0) {
                await knex("notifications").insert(notifications);

                // Emitting events individually for now
                // In a production env with many users, might want to use a room broadcast if applicable
                // or a job queue. For now, individual emits are fine.
                notifications.forEach(n => {
                    emitToUser(n.user_id, 'notification:new', n);
                });
            }

            return notifications.length;
        } catch (error: any) {
            throw new HttpException(500, `Error broadcasting notification: ${error.message}`);
        }
    }

    /**
     * Mark notification as read
     */
    public async markAsRead(notificationId: number, userId: number): Promise<INotification> {
        try {
            // Verify notification belongs to user
            const notification = await knex("notifications")
                .where({ id: notificationId, user_id: userId })
                .first();

            if (!notification) {
                throw new HttpException(404, "Notification not found");
            }

            const [updated] = await knex("notifications")
                .where({ id: notificationId })
                .update({
                    read: true,
                    read_at: new Date(),
                })
                .returning("*");

            return updated;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error marking notification as read: ${error.message}`);
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    public async markAllAsRead(userId: number): Promise<number> {
        try {
            const updatedCount = await knex("notifications")
                .where({ user_id: userId, read: false })
                .update({
                    read: true,
                });

            return updatedCount;
        } catch (error: any) {
            throw new HttpException(500, `Error marking all notifications as read: ${error.message}`);
        }
    }

    /**
     * Delete a notification
     */
    public async deleteNotification(notificationId: number, userId: number): Promise<void> {
        try {
            // Verify notification belongs to user
            const notification = await knex("notifications")
                .where({ id: notificationId, user_id: userId })
                .first();

            if (!notification) {
                throw new HttpException(404, "Notification not found");
            }

            await knex("notifications")
                .where({ id: notificationId })
                .del();
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error deleting notification: ${error.message}`);
        }
    }

    /**
     * Get unread count for a user
     */
    public async getUnreadCount(userId: number): Promise<number> {
        try {
            const result = await knex("notifications")
                .where({ user_id: userId, read: false })
                .count('* as count')
                .first();

            return parseInt(result?.count as string) || 0;
        } catch (error: any) {
            throw new HttpException(500, `Error getting unread count: ${error.message}`);
        }
    }
}

export default NotificationService;
