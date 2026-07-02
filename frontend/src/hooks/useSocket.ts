import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * WebSocket Hook
 *
 * Provides Socket.IO connection management for real-time features.
 * Automatically authenticates using the stored JWT token.
 */

const SOCKET_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

interface UseSocketOptions {
    autoConnect?: boolean;
}

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

export function useSocket(options: UseSocketOptions = { autoConnect: true }): UseSocketReturn {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(() => {
        // Already connected
        if (socketRef.current?.connected) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('Cannot connect to WebSocket: No auth token');
            return;
        }

        // Create socket connection
        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        // Connection event handlers
        socketRef.current.on('connect', () => {
            console.log('🔌 WebSocket connected');
            setIsConnected(true);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('⭕ WebSocket disconnected:', reason);
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error.message);
            setIsConnected(false);
        });
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, []);

    useEffect(() => {
        if (options.autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [connect, disconnect, options.autoConnect]);

    return {
        socket: socketRef.current,
        isConnected,
        connect,
        disconnect,
    };
}

// Types for message events
export interface NewMessageEvent {
    id: number;
    conversation_id: number;
    sender_id: number;
    sender_name: string;
    content: string;
    created_at: string;
}

export interface TypingEvent {
    conversationId: number;
    userId: number;
}

export interface ReadReceiptEvent {
    conversationId: number;
    readerId: number;
}
