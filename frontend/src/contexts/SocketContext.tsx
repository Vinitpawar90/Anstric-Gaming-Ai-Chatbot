import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Socket Context
 *
 * Provides app-wide access to the WebSocket connection.
 * Automatically connects when a user is authenticated.
 */

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    connect: () => { },
    disconnect: () => { },
});

export const useSocketContext = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
}

const SOCKET_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export function SocketProvider({ children }: SocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('Cannot connect to WebSocket: No auth token');
            return;
        }

        // Don't create duplicate connections
        if (socketRef.current?.connected) {
            return;
        }

        const socketInstance = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketInstance.on('connect', () => {
            console.log('🔌 WebSocket connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('⭕ WebSocket disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error.message);
            setIsConnected(false);
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
        }
    }, []);

    // Auto-connect when token exists
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !socketRef.current) {
            connect();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [connect]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
            {children}
        </SocketContext.Provider>
    );
}
