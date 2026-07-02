import api from './api';

// ============================================================================
// Document Types (matching backend IDocument interface)
// ============================================================================

export type FileType = 'pdf' | 'docx' | 'md' | 'txt';
export type DocumentStatus = 'processing' | 'ready' | 'failed' | 'archived';

export interface Document {
    id: number;
    name: string;
    original_name: string;
    file_type: FileType;
    file_size: number | null;
    file_path: string;
    uploaded_by: number;
    upload_date: string;
    last_updated: string;
    status: DocumentStatus;
    version: number;
    chunk_count: number;
    tags: string[] | null;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
    // Joined fields (optional, populated by backend)
    uploader_name?: string;
}

export interface DocumentListQuery {
    page?: number;
    limit?: number;
    search?: string;
    file_type?: FileType;
    status?: DocumentStatus;
}

export interface DocumentListResponse {
    documents: Document[];
    total: number;
    page: number;
    limit: number;
}

export interface UploadDocumentRequest {
    file: File;
    name?: string;
    tags?: string[];
}

export interface UpdateDocumentRequest {
    name?: string;
    tags?: string[];
}

export interface VersionHistoryResponse {
    document_id: number;
    total_versions: number;
    versions: Document[];
}

// ============================================================================
// Document Service
// ============================================================================

class DocumentService {
    private basePath = '/documents';

    private parseTags(doc: any): Document {
        if (!doc) return doc;
        let parsedTags: string[] = [];
        if (doc.tags) {
            if (typeof doc.tags === 'string') {
                try {
                    parsedTags = JSON.parse(doc.tags);
                } catch (e) {
                    console.error('Failed to parse tags string:', doc.tags, e);
                    parsedTags = [];
                }
            } else if (Array.isArray(doc.tags)) {
                parsedTags = doc.tags;
            }
        }
        return {
            ...doc,
            tags: parsedTags,
        };
    }

    /**
     * Get all documents with pagination and filters
     */
    async getDocuments(query?: DocumentListQuery): Promise<DocumentListResponse> {
        const params = new URLSearchParams();

        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        if (query?.search) params.append('search', query.search);
        if (query?.file_type) params.append('file_type', query.file_type);
        if (query?.status) params.append('status', query.status);

        const queryString = params.toString();
        const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

        const response = await api.get(url);
        const data = response.data.data;
        if (data && Array.isArray(data.documents)) {
            data.documents = data.documents.map((doc: any) => this.parseTags(doc));
        }
        return data;
    }

    /**
     * Get a single document by ID
     */
    async getDocument(id: number): Promise<Document> {
        const response = await api.get(`${this.basePath}/${id}`);
        return this.parseTags(response.data.data);
    }

    /**
     * Upload a new document
     */
    async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
        const formData = new FormData();
        formData.append('file', request.file);
        if (request.name) formData.append('name', request.name);
        if (request.tags && request.tags.length > 0) {
            formData.append('tags', JSON.stringify(request.tags));
        }

        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return this.parseTags(response.data.data);
    }

    /**
     * Update document metadata
     */
    async updateDocument(id: number, data: UpdateDocumentRequest): Promise<Document> {
        const response = await api.put(`${this.basePath}/${id}`, data);
        return this.parseTags(response.data.data);
    }

    /**
     * Delete a document
     */
    async deleteDocument(id: number): Promise<void> {
        await api.delete(`${this.basePath}/${id}`);
    }

    /**
     * Get version history for a document
     */
    async getVersionHistory(id: number): Promise<VersionHistoryResponse> {
        const response = await api.get(`${this.basePath}/${id}/versions`);
        const data = response.data.data;
        if (data && Array.isArray(data.versions)) {
            data.versions = data.versions.map((doc: any) => this.parseTags(doc));
        }
        return data;
    }



    /**
     * Helper: Format file size for display
     */
    formatFileSize(bytes: number | null): string {
        if (bytes === null || bytes === 0) return '0 B';

        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
    }

    /**
     * Helper: Get status badge color
     */
    getStatusColor(status: DocumentStatus): string {
        const colors: Record<DocumentStatus, string> = {
            processing: 'blue',
            ready: 'green',
            failed: 'red',
            archived: 'gray',
        };
        return colors[status] || 'gray';
    }

    /**
     * Helper: Get file type icon name
     */
    getFileTypeIcon(fileType: FileType): string {
        const icons: Record<FileType, string> = {
            pdf: 'FileText',
            docx: 'FileText',
            md: 'FileCode',
            txt: 'File',
        };
        return icons[fileType] || 'File';
    }

    /**
     * Helper: Get full URL of a document file
     */
    getDocumentUrl(filePath: string): string {
        if (!filePath) return '';
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const backendBase = apiBase.replace(/\/api\/v1\/?$/, '');
        const base = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;
        const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
        return `${base}${path}`;
    }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;
