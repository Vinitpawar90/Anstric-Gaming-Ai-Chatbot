import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { documentService, Document } from '@/services/documentService';
import { Loader2, Calendar, HardDrive, User, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VersionHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: number | null;
    documentName: string;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
    open,
    onOpenChange,
    documentId,
    documentName,
}) => {
    const { toast } = useToast();
    const [versions, setVersions] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && documentId) {
            loadVersionHistory();
        }
    }, [open, documentId]);

    const loadVersionHistory = async () => {
        if (!documentId) return;

        setIsLoading(true);
        try {
            const response = await documentService.getVersionHistory(documentId);
            setVersions(response.versions);
        } catch (error) {
            console.error('Failed to load version history:', error);
            toast({
                title: 'Error',
                description: 'Failed to load version history',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(true); // Wait, should be false
            setIsLoading(false);
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
            ready: 'Current (Ready)',
            processing: 'Processing',
            failed: 'Failed',
            archived: 'Archived',
        };

        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Version History
                    </DialogTitle>
                    <DialogDescription>
                        Version history for <span className="font-semibold text-foreground">{documentName}</span>
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : versions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No version history found.
                    </div>
                ) : (
                    <div className="mt-4 border rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-[100px]">Version</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Upload Date</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {versions.map((version) => (
                                    <TableRow key={version.id}>
                                        <TableCell className="font-mono font-medium text-sm">
                                            v{version.version}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(version.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1 text-foreground font-medium">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(version.upload_date).toLocaleDateString()}
                                                </div>
                                                <div className="mt-0.5 ml-4">
                                                    {new Date(version.upload_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <HardDrive className="h-3 w-3" />
                                                {documentService.formatFileSize(version.file_size || 0)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 gap-1.5 text-xs hover:text-primary"
                                                onClick={() => window.open(documentService.getDocumentUrl(version.file_path), '_blank')}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                View / Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default VersionHistoryModal;
