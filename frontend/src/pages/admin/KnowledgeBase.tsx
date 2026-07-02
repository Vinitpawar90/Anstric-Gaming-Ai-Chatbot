import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Search, Loader2, RefreshCw, FileText, Trash2, History, Eye } from 'lucide-react';
import { documentService, Document, DocumentListResponse } from '@/services/documentService';
import UploadDocumentModal from '@/components/documents/UploadDocumentModal';
import VersionHistoryModal from '@/components/documents/VersionHistoryModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const KnowledgeBase: React.FC = () => {
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
    const [searchQuery, setSearchQuery] = useState('');

    // Document state
    const [documents, setDocuments] = useState<Document[]>([]);
    const [documentStats, setDocumentStats] = useState({
        total: 0,
        ready: 0,
        processing: 0,
        failed: 0,
    });
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const documentsPerPage = 20;

    // Modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteDocDialog, setShowDeleteDocDialog] = useState(false);
    const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
    const [isDeletingDoc, setIsDeletingDoc] = useState(false);

    // Version History state
    const [showVersionModal, setShowVersionModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [selectedDocName, setSelectedDocName] = useState('');

    // Load documents when search changes or page changes
    useEffect(() => {
        loadDocuments();
    }, [searchQuery, currentPage]);

    const loadDocuments = useCallback(async () => {
        try {
            setIsLoadingDocuments(true);
            const response: DocumentListResponse = await documentService.getDocuments({
                search: searchQuery || undefined,
                page: currentPage,
                limit: documentsPerPage,
                status: 'ready', // Only show ready documents by default
            });

            setDocuments(response.documents);
            setTotalDocuments(response.total);

            // Load stats (all documents)
            const allDocsResponse = await documentService.getDocuments({
                limit: 1000, // Get all for stats
            });

            const stats = {
                total: allDocsResponse.total,
                ready: allDocsResponse.documents.filter(d => d.status === 'ready').length,
                processing: allDocsResponse.documents.filter(d => d.status === 'processing').length,
                failed: allDocsResponse.documents.filter(d => d.status === 'failed').length,
            };
            setDocumentStats(stats);
        } catch (error) {
            console.error('Failed to load documents:', error);
            toast({
                title: 'Error',
                description: 'Failed to load documents',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingDocuments(false);
        }
    }, [searchQuery, currentPage, toast]);

    const handleDeleteDocument = async () => {
        if (!deleteDocId) return;

        setIsDeletingDoc(true);
        try {
            await documentService.deleteDocument(deleteDocId);
            toast({
                title: 'Document deleted',
                description: 'The document has been deleted successfully.',
            });
            loadDocuments(); // Refresh list
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete document',
                variant: 'destructive',
            });
        } finally {
            setIsDeletingDoc(false);
            setShowDeleteDocDialog(false);
            setDeleteDocId(null);
        }
    };

    const getStatusBadge = (status: Document['status']) => {
        const colors = {
            ready: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
            processing: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
            failed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
            archived: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
        };

        const labels = {
            ready: 'Ready',
            processing: 'Processing',
            failed: 'Failed',
            archived: 'Archived',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getFileTypeBadge = (fileType: Document['file_type']) => {
        const colors = {
            pdf: 'bg-red-500/10 text-red-700',
            docx: 'bg-blue-500/10 text-blue-700',
            md: 'bg-purple-500/10 text-purple-700',
            txt: 'bg-gray-500/10 text-gray-700',
            csv: 'bg-emerald-500/10 text-emerald-700',
            json: 'bg-yellow-500/10 text-yellow-700',
        };

        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${colors[fileType as keyof typeof colors] || colors.txt}`}>
                {fileType.toUpperCase()}
            </span>
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (doc: Document) => (
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {doc.original_name}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'file_type',
            label: 'Type',
            render: (doc: Document) => getFileTypeBadge(doc.file_type),
        },
        {
            key: 'upload_date',
            label: 'Uploaded',
            render: (doc: Document) => (
                <span className="text-sm">
                    {new Date(doc.upload_date).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (doc: Document) => getStatusBadge(doc.status),
        },
        {
            key: 'version',
            label: 'Version',
            render: (doc: Document) => <span className="font-mono">v{doc.version}</span>,
        },
        {
            key: 'file_size',
            label: 'Size',
            render: (doc: Document) => (
                <span className="text-sm text-muted-foreground">
                    {documentService.formatFileSize(doc.file_size || 0)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (doc: Document) => (
                <div className="flex items-center gap-1 justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(documentService.getDocumentUrl(doc.file_path), '_blank');
                        }}
                        title="View Document"
                    >
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocId(doc.id);
                            setSelectedDocName(doc.name);
                            setShowVersionModal(true);
                        }}
                        title="View Version History"
                    >
                        <History className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDocId(doc.id);
                            setShowDeleteDocDialog(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Knowledge Base" user={user} />

            <div className="p-6 lg:p-8 space-y-6">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1 w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-4 h-[46px] rounded-xl bg-secondary/20 border border-border w-full sm:w-96">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent text-sm focus:outline-none flex-1"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => loadDocuments()}
                            disabled={isLoadingDocuments}
                            className="rounded-xl h-[46px] w-[46px]"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 rounded-xl h-[46px] px-6 shadow-lg shadow-primary/25"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Document
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Total Documents</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{documentStats.total}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Ready</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{documentStats.ready}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Processing</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{documentStats.processing}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <p className="text-sm text-muted-foreground">Failed</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{documentStats.failed}</p>
                    </div>
                </div>

                {/* Documents Table */}
                {isLoadingDocuments ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No documents found</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchQuery ? 'Try a different search term' : 'Upload your first document to get started'}
                        </p>
                        <Button
                            onClick={() => setShowUploadModal(true)}
                            className="mt-4"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                        </Button>
                    </div>
                ) : (
                    <DataTable
                        data={documents}
                        columns={columns}
                        onRowClick={(doc) => window.open(documentService.getDocumentUrl(doc.file_path), '_blank')}
                    />
                )}
            </div>

            <UploadDocumentModal
                open={showUploadModal}
                onOpenChange={setShowUploadModal}
                onSuccess={loadDocuments}
            />

            <VersionHistoryModal
                open={showVersionModal}
                onOpenChange={setShowVersionModal}
                documentId={selectedDocId}
                documentName={selectedDocName}
            />

            {/* Delete Document Dialog */}
            <AlertDialog open={showDeleteDocDialog} onOpenChange={setShowDeleteDocDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this document? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingDoc}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDocument}
                            disabled={isDeletingDoc}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingDoc ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default KnowledgeBase;
