import { useState, useRef } from 'react';
import { documentService, UploadDocumentRequest } from '@/services/documentService';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, Loader2 } from 'lucide-react';

interface UploadDocumentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.md,.txt';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadDocumentModal({
    open,
    onOpenChange,
    onSuccess,
}: UploadDocumentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file size
        if (selectedFile.size > MAX_FILE_SIZE) {
            toast({
                title: 'File too large',
                description: 'Maximum file size is 10MB',
                variant: 'destructive',
            });
            return;
        }

        setFile(selectedFile);
        // Auto-fill name from filename if empty
        if (!name) {
            setName(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            if (droppedFile.size > MAX_FILE_SIZE) {
                toast({
                    title: 'File too large',
                    description: 'Maximum file size is 10MB',
                    variant: 'destructive',
                });
                return;
            }
            setFile(droppedFile);
            if (!name) {
                setName(droppedFile.name.replace(/\.[^/.]+$/, ''));
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const clearFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsSubmitting(true);
        setUploadProgress(10);

        try {
            const uploadData: UploadDocumentRequest = {
                file,
                name: name.trim() || file.name,
                tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            };

            setUploadProgress(30);
            await documentService.uploadDocument(uploadData);
            setUploadProgress(100);

            toast({
                title: 'Document uploaded',
                description: `"${name || file.name}" has been uploaded successfully.`,
            });

            // Reset form
            setFile(null);
            setName('');
            setTags('');
            setUploadProgress(0);

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to upload document:', error);
            toast({
                title: 'Upload failed',
                description: error.response?.data?.message || 'Failed to upload document',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setFile(null);
            setName('');
            setTags('');
            setUploadProgress(0);
        }
        onOpenChange(newOpen);
    };

    const getFileTypeLabel = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return 'PDF Document';
            case 'docx':
            case 'doc': return 'Word Document';
            case 'md': return 'Markdown';
            case 'txt': return 'Text File';
            default: return 'Document';
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                        <DialogDescription>
                            Upload a document to the Knowledge Base. Supported formats: PDF, DOCX, Markdown, TXT.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* File Drop Zone */}
                        {!file ? (
                            <div
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PDF, DOCX, MD, TXT (max 10MB)
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ACCEPTED_FILE_TYPES}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <File className="h-8 w-8 text-primary" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {getFileTypeLabel(file.name)} • {documentService.formatFileSize(file.size)}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearFile}
                                    disabled={isSubmitting}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* Document Name */}
                        <div className="space-y-2">
                            <Label htmlFor="doc-name">Document Name (Optional)</Label>
                            <Input
                                id="doc-name"
                                placeholder="Enter document name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
                            <Input
                                id="tags"
                                placeholder="e.g. HR, Policy, 2024"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Upload Progress */}
                        {isSubmitting && uploadProgress > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!file || isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
