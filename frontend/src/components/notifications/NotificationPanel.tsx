import { useEffect, useState } from 'react';
import { notificationService, Notification } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Trash2 } from 'lucide-react';

import { useSocketContext } from '@/contexts/SocketContext';

interface NotificationPanelProps {
    onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocketContext();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const result = await notificationService.getNotifications({
                limit: 10,
                status: 'all',
            });
            setNotifications(result.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Listen for real-time notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
        };

        socket.on('notification:new', handleNewNotification);

        return () => {
            socket.off('notification:new', handleNewNotification);
        };
    }, [socket]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'document_upload':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'system':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'agent':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    {notifications.some((n) => !n.read) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-96">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">No notifications</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${getNotificationColor(notification.type)}`}
                                            >
                                                {notification.type.replace('_', ' ')}
                                            </Badge>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                <CheckCheck className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => handleDelete(notification.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
