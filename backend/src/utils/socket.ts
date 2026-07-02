import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "./logger";

/**
 * Socket.IO Server Utility
 *
 * Initializes and manages WebSocket connections for real-time messaging.
 * Uses JWT authentication and room-based message delivery.
 */

// Extend Socket type to include user info
interface AuthenticatedSocket extends Socket {
    userId?: number;
    userRole?: string;
}

// Stored token data from JWT
interface JwtPayload {
    id: number;
    role?: string;
}

// Store io instance for use in other modules
let io: Server | null = null;

/**
 * Initialize Socket.IO server with authentication middleware.
 */
export const initializeSocket = (server: HttpServer): Server => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:8080",
        "http://localhost:8000",
    ];

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
        // Connection options
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Authentication middleware - verify JWT token
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            logger.warn("Socket connection rejected: No token provided");
            return next(new Error("Authentication required"));
        }

        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                logger.error("JWT_SECRET not configured");
                return next(new Error("Server configuration error"));
            }

            const decoded = jwt.verify(token, secret) as JwtPayload;

            // Attach user info to socket
            socket.userId = decoded.id;
            socket.userRole = decoded.role;

            logger.debug(`Socket authenticated for user ${decoded.id}`);
            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                logger.warn("Socket connection rejected: Token expired");
                return next(new Error("Token expired"));
            }
            logger.warn("Socket connection rejected: Invalid token");
            return next(new Error("Invalid token"));
        }
    });

    // Handle connections
    io.on("connection", (socket: AuthenticatedSocket) => {
        const userId = socket.userId!;

        logger.info(`🔌 User ${userId} connected via WebSocket (${socket.id})`);

        // Join personal room for private messages
        socket.join(`user:${userId}`);

        // Handle disconnect
        socket.on("disconnect", (reason) => {
            logger.info(`⭕ User ${userId} disconnected: ${reason}`);
        });

        // Handle typing indicators
        socket.on("typing:start", (data: { conversationId: number; recipientId: number }) => {
            if (!data.conversationId || !data.recipientId) return;

            io?.to(`user:${data.recipientId}`).emit("typing:start", {
                conversationId: data.conversationId,
                userId: userId,
            });
        });

        socket.on("typing:stop", (data: { conversationId: number; recipientId: number }) => {
            if (!data.conversationId || !data.recipientId) return;

            io?.to(`user:${data.recipientId}`).emit("typing:stop", {
                conversationId: data.conversationId,
                userId: userId,
            });
        });

        // Handle read receipts
        socket.on("message:read", (data: { conversationId: number; senderId: number }) => {
            if (!data.conversationId || !data.senderId) return;

            // Notify the sender that their messages were read
            io?.to(`user:${data.senderId}`).emit("message:read", {
                conversationId: data.conversationId,
                readerId: userId,
            });
        });

        // Error handling
        socket.on("error", (error) => {
            logger.error(`Socket error for user ${userId}:`, error);
        });
    });

    logger.info("✅ Socket.IO server initialized");
    return io;
};

/**
 * Get the Socket.IO server instance.
 * Throws if not initialized.
 */
export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initializeSocket first.");
    }
    return io;
};

/**
 * Check if Socket.IO is initialized.
 */
export const isSocketInitialized = (): boolean => {
    return io !== null;
};

/**
 * Emit an event to a specific user's room.
 */
export const emitToUser = (userId: number, event: string, data: unknown): void => {
    if (!io) {
        logger.warn("Cannot emit: Socket.IO not initialized");
        return;
    }
    io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit a new message notification to a user.
 */
export const emitNewMessage = (
    recipientId: number,
    message: {
        id: number;
        conversation_id: number;
        sender_id: number;
        sender_name: string;
        content: string;
        created_at: string;
    }
): void => {
    emitToUser(recipientId, "message:new", message);
};
