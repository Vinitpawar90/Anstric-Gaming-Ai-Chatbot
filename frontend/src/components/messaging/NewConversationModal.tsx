import React, { useState, useEffect } from 'react';
import { X, Search, User, Loader2 } from 'lucide-react';
import { Contact } from '@/services/messagingService';

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectContact: (contact: Contact) => void;
    contacts: Contact[];
    isLoading?: boolean;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
    isOpen,
    onClose,
    onSelectContact,
    contacts,
    isLoading = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter contacts based on search
    const filteredContacts = contacts.filter(
        (contact) =>
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Reset search when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="font-semibold text-lg">New Conversation</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <User className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground text-sm">
                                {searchQuery ? 'No contacts found' : 'No contacts available'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => {
                                        onSelectContact(contact);
                                        onClose();
                                    }}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded-full bg-secondary">
                                        {contact.role}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
