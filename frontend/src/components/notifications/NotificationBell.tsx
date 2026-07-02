import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSocketContext } from '@/contexts/SocketContext';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const { socket } = useSocketContext();

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Initial fetch for notifications
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    // Listen for real-time notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = () => {
            // Increment unread count or refetch to be safe
            setUnreadCount((prev) => prev + 1);
        };

        socket.on('notification:new', handleNewNotification);

        return () => {
            socket.off('notification:new', handleNewNotification);
        };
    }, [socket]);

    // Refresh count when panel is closed
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            fetchUnreadCount();
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
                <NotificationPanel onClose={() => setIsOpen(false)} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
