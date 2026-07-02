export interface IDocument {
    id: number;
    name: string;
    original_name: string;
    file_type: "pdf" | "docx" | "md" | "txt";
    file_size?: number | null;
    file_path: string;
    uploaded_by: number;
    upload_date: Date;
    last_updated: Date;
    status: "processing" | "ready" | "failed";
    version: number;
    chunk_count: number;
    tags?: string[] | null;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export interface CreateDocumentRequest {
    name: string;
    original_name: string;
    file_type: "pdf" | "docx" | "md" | "txt";
    file_size: number;
    file_path: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface UpdateDocumentRequest {
    name?: string;
    tags?: string[];
}

export interface DocumentListQuery {
    page?: number;
    limit?: number;
    search?: string;
    file_type?: "pdf" | "docx" | "md" | "txt";
    status?: "processing" | "ready" | "failed";
}
