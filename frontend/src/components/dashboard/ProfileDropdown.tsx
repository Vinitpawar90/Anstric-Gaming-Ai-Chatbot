import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as UserType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileDropdownProps {
    user: UserType;
    onLogout?: () => void; // Keeping for backward compatibility but using hook
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const profilePath = user.role === 'admin' ? '/admin/profile' : '/employee/profile';

    const handleLogout = async () => {
        try {
            await logout();
            if (onLogout) onLogout();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                                {user.role}
                            </span>
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(profilePath)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
