import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ConversationList,
    MessageThread,
    NewConversationModal,
} from '@/components/messaging';
import messagingService, {
    Conversation,
    DirectMessage,
    Contact,
} from '@/services/messagingService';
import { useSocketContext } from '@/contexts/SocketContext';
import { NewMessageEvent } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
// Removed mockData import

/**
 * Messages Page
 *
 * Main messaging interface for both admin and employee users.
 * Features:
 * - Conversation list with unread indicators
 * - Real-time message updates via WebSocket
 * - New conversation creation
 * - Typing indicators
 */
export const MessagesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { socket, isConnected } = useSocketContext();
    const { user: authUser } = useAuth();
    const user = authUser ? {
        id: authUser.id.toString(),
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        avatar: authUser.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${authUser.email}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        joinedDate: authUser.created_at || new Date().toISOString(),
        status: 'active' as const,
    } : null;

    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

    // Fetch conversations
    const {
        data: conversations = [],
        isLoading: isLoadingConversations,
    } = useQuery({
        queryKey: ['conversations'],
        queryFn: messagingService.getConversations,
    });

    // Fetch messages for selected conversation
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
    } = useQuery({
        queryKey: ['messages', selectedConversation?.id],
        queryFn: () => messagingService.getMessages(selectedConversation!.id),
        enabled: !!selectedConversation,
    });

    const messages = messagesData?.messages || [];

    // Fetch contacts for new conversation modal
    const {
        data: contacts = [],
        isLoading: isLoadingContacts,
    } = useQuery({
        queryKey: ['contacts'],
        queryFn: messagingService.getContacts,
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
            messagingService.sendMessage(conversationId, content),
        onSuccess: (newMessage) => {
            // Optimistically add message to cache, ensuring no duplicates
            queryClient.setQueryData<{ messages: DirectMessage[]; pagination: any }>(
                ['messages', selectedConversation?.id],
                (old) => {
                    if (!old) return {
                        messages: [newMessage],
                        pagination: { page: 1, limit: 50, hasMore: false }
                    };

                    // Check if message already exists (to prevent race conditions with socket)
                    const exists = old.messages.some((m) => m.id === newMessage.id);
                    if (exists) return old;

                    return {
                        ...old,
                        messages: [...old.messages, newMessage]
                    };
                }
            );
            // Refetch conversations to update last message
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: () => {
            toast.error('Failed to send message');
        },
    });

    // Create conversation mutation
    const createConversationMutation = useMutation({
        mutationFn: (recipientId: number) => messagingService.createConversation(recipientId),
        onSuccess: (conversation) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            // Select the new/existing conversation
            setSelectedConversation(conversation);
        },
        onError: () => {
            toast.error('Failed to create conversation');
        },
    });

    // Mark messages as read
    const markAsReadMutation = useMutation({
        mutationFn: (conversationId: number) => messagingService.markAsRead(conversationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
        },
    });

    // Handle selecting a conversation
    const handleSelectConversation = useCallback((conversation: Conversation) => {
        setSelectedConversation(conversation);

        // Mark as read if there are unread messages
        if (conversation.unread_count > 0) {
            markAsReadMutation.mutate(conversation.id);
        }
    }, [markAsReadMutation]);

    // Handle sending a message
    const handleSendMessage = useCallback((content: string) => {
        if (selectedConversation) {
            sendMessageMutation.mutate({
                conversationId: selectedConversation.id,
                content,
            });
        }
    }, [selectedConversation, sendMessageMutation]);

    // Handle starting new conversation
    const handleSelectContact = useCallback((contact: Contact) => {
        createConversationMutation.mutate(contact.id);
    }, [createConversationMutation]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Listen for new messages
        const handleNewMessage = (message: NewMessageEvent) => {
            // If this is for the currently selected conversation, add to messages
            if (selectedConversation && message.conversation_id === selectedConversation.id) {
                queryClient.setQueryData<{ messages: DirectMessage[]; pagination: any }>(
                    ['messages', selectedConversation.id],
                    (old) => {
                        if (!old) return {
                            messages: [message as DirectMessage],
                            pagination: { page: 1, limit: 50, hasMore: false }
                        };

                        // Avoid duplicate messages (to prevent race conditions with API response)
                        const exists = old.messages.some((m) => m.id === message.id);
                        if (exists) return old;

                        return {
                            ...old,
                            messages: [...old.messages, message as DirectMessage]
                        };
                    }
                );
                // Mark as read since we're viewing the conversation
                markAsReadMutation.mutate(message.conversation_id);
            } else {
                // If in another conversation, just invalidate to update unread counts
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                toast.info(`New message from ${message.sender_name}`, {
                    description: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
                });
            }
        };

        socket.on('message:new', handleNewMessage);

        return () => {
            socket.off('message:new', handleNewMessage);
        };
    }, [socket, selectedConversation?.id, user?.id, queryClient, markAsReadMutation]);

    return (
        <div className="min-h-screen">
            {/* Dashboard Header */}
            <DashboardHeader title="Messages" user={user!} />

            {/* Main Content */}
            <div className="p-6 lg:p-8">
                <div className="h-[calc(100vh-12rem)] flex bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    {/* Sidebar - Conversations List */}
                    <div
                        className={`
                            w-full lg:w-80 border-r border-border flex flex-col bg-card
                            ${selectedConversation ? 'hidden lg:flex' : 'flex'}
                        `}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                            <h2 className="font-semibold text-lg">Conversations</h2>
                            <button
                                onClick={() => setIsNewConversationOpen(true)}
                                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                                title="New conversation"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Connection status indicator */}
                        {!isConnected && (
                            <div className="px-4 py-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                Connecting to live updates...
                            </div>
                        )}

                        {/* Conversations */}
                        <ConversationList
                            conversations={conversations}
                            selectedId={selectedConversation?.id}
                            onSelect={handleSelectConversation}
                            isLoading={isLoadingConversations}
                        />
                    </div>

                    {/* Main Content - Message Thread */}
                    <div className={`flex-1 ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
                        {selectedConversation ? (
                            <MessageThread
                                conversation={selectedConversation}
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                onBack={() => setSelectedConversation(null)}
                                isLoading={isLoadingMessages}
                                isSending={sendMessageMutation.isPending}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-background/50">
                                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                    <MessageSquare className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Select a Conversation</h2>
                                <p className="text-muted-foreground text-sm max-w-sm">
                                    Choose an existing conversation or start a new one to begin messaging
                                </p>
                                <button
                                    onClick={() => setIsNewConversationOpen(true)}
                                    className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Conversation
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* New Conversation Modal */}
            <NewConversationModal
                isOpen={isNewConversationOpen}
                onClose={() => setIsNewConversationOpen(false)}
                onSelectContact={handleSelectContact}
                contacts={contacts}
                isLoading={isLoadingContacts}
            />
        </div>
    );
};

