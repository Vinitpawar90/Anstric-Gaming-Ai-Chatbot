import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { Search, FileText, BookOpen, File, Files, Loader2, RefreshCw } from 'lucide-react';
import { documentService, Document } from '@/services/documentService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const MyDocuments: React.FC = () => {
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
    const { toast } = useToast();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');

    // Load documents on mount
    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await documentService.getDocuments({
                status: 'ready',
                limit: 100,
            });
            setDocuments(response.documents);
        } catch (error: any) {
            console.error('Failed to load documents:', error);
            toast({
                title: 'Error',
                description: 'Failed to load documents',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Get unique file types for filter
    const fileTypes = ['all', ...new Set(documents.map(d => d.file_type))];

    // Filter documents
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch =
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        const matchesFileType = fileTypeFilter === 'all' || doc.file_type === fileTypeFilter;
        return matchesSearch && matchesFileType;
    });

    const getFileTypeIcon = (fileType: string) => {
        switch (fileType) {
            case 'pdf': return FileText;
            case 'docx': return BookOpen;
            case 'md': return Files;
            default: return File;
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Document',
            render: (doc: Document) => {
                const Icon = getFileTypeIcon(doc.file_type);
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{doc.name}</p>
                            <div className="flex gap-1 mt-1">
                                {doc.tags && doc.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-secondary/50 text-muted-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'file_type',
            label: 'Type',
            render: (doc: Document) => (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground uppercase">
                    {doc.file_type}
                </span>
            ),
        },
        {
            key: 'last_updated',
            label: 'Last Updated',
            render: (doc: Document) => (
                <span className="text-sm">
                    {new Date(doc.last_updated).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'file_size',
            label: 'Size',
            render: (doc: Document) => (
                <span className="text-sm text-muted-foreground">
                    {documentService.formatFileSize(doc.file_size)}
                </span>
            ),
        },
    ];

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Documents" user={user} />

            <div className="p-6 lg:p-8 space-y-6">
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 px-4 h-[46px] rounded-xl bg-secondary/20 border border-border">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search documents by name or tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm focus:outline-none flex-1"
                            />
                        </div>
                    </div>
                    <select
                        value={fileTypeFilter}
                        onChange={(e) => setFileTypeFilter(e.target.value)}
                        className="px-4 h-[46px] rounded-xl bg-secondary/20 border border-border text-sm focus:outline-none focus:border-primary min-w-[140px]"
                    >
                        {fileTypes.map(type => (
                            <option key={type} value={type}>
                                {type === 'all' ? 'All Types' : type.toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => loadDocuments()}
                        disabled={isLoading}
                        className="rounded-xl h-[46px] w-[46px]"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* File Type Pills */}
                <div className="flex gap-2 flex-wrap">
                    {fileTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setFileTypeFilter(type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${fileTypeFilter === type
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary/30 text-foreground hover:bg-secondary/50'
                                }`}
                        >
                            {type === 'all' ? 'All' : type.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Documents Count */}
                <p className="text-sm text-muted-foreground">
                    Showing {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                </p>

                {/* Documents Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No documents found</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchQuery ? 'Try a different search term' : 'No documents available yet'}
                        </p>
                    </div>
                ) : (
                    <DataTable
                        data={filteredDocuments}
                        columns={columns}
                        onRowClick={(doc) => window.open(documentService.getDocumentUrl(doc.file_path), '_blank')}
                    />
                )}
            </div>
        </div>
    );
};

export default MyDocuments;
