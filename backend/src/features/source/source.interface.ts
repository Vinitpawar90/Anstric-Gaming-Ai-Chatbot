// Represents a file source entity in the system
export interface FileSource {
  id: number;
  source_id: number;
  file_url: string;
  mime_type?: string;
  file_size: number;
  text_content?: string;
}

// Input interface for creating a file source
export interface FileSourceInput {
  source_id: number;
  file_url: string;
  mime_type?: string;
  file_size?: number;
  text_content?: string;
}

// Input interface for updating a file source
export interface FileSourceUpdateInput {
  file_url?: string;
  mime_type?: string;
  file_size?: number;
  text_content?: string;
}

export interface Source {
  id: number;
  agent_id: number;
  source_type: "file";
  name: string;
  description?: string;
  status: "pending" | "processing" | "completed" | "failed";
  is_embedded: boolean;
  created_by: number;
  created_at: Date;
  updated_by?: number;
  updated_at: Date;
  is_deleted: boolean;
  deleted_by?: number;
  deleted_at?: Date;
}

// Input interface for creating a base source
export interface SourceInput {
  agent_id: number;
  source_type: "file";
  name: string;
  description?: string;
}

// Input interface for updating a base source
export interface SourceUpdateInput {
  name?: string;
  description?: string;
  status?: "pending" | "processing" | "completed" | "failed";
  is_embedded?: boolean;
}
