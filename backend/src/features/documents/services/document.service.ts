import knex from "../../../../database/index.schema";
import {
    IDocument,
    CreateDocumentRequest,
    UpdateDocumentRequest,
    DocumentListQuery,
} from "../document.interface";
import HttpException from "../../../exceptions/HttpException";
import { FileUploadResult, extractInsertedId } from "../../../utils/fileupload";

class DocumentService {
    /**
     * Upload a document to the Knowledge Base
     * Implements versioning: if a document with the same name exists,
     * the version is auto-incremented per PRD FR-3.3
     */
    public async uploadDocument(
        uploadResult: FileUploadResult,
        metadata: {
            name?: string;
            tags?: string[];
        },
        userId: number
    ): Promise<IDocument> {
        try {
            // Determine file type from mime type
            const mimeType = uploadResult.ContentType || "application/octet-stream";
            let file_type: "pdf" | "docx" | "md" | "txt" = "pdf";

            if (mimeType.includes("pdf")) {
                file_type = "pdf";
            } else if (
                mimeType.includes("word") ||
                mimeType.includes("document")
            ) {
                file_type = "docx";
            } else if (mimeType.includes("markdown")) {
                file_type = "md";
            } else if (mimeType.includes("text")) {
                file_type = "txt";
            }

            const documentName = metadata.name || "Untitled Document";

            // Check for existing document with same name (versioning)
            let existingDocument = null;
            let newVersion = 1;
            let isUpdate = false;

            const existingQuery = knex("documents")
                .where({ name: documentName });

            existingDocument = await existingQuery
                .orderBy("version", "desc")
                .first();

            if (existingDocument) {
                // Document with same name exists - this is a version update
                newVersion = (existingDocument.version || 1) + 1;
                isUpdate = true;

                // Archive the old version by marking it (optional: you could also delete old embeddings here)
                await knex("documents")
                    .where({ id: existingDocument.id })
                    .update({
                        status: "archived",
                        updated_at: knex.fn.now(),
                    });
            }

            const document = {
                name: documentName,
                original_name: metadata.name || "unknown",
                file_type,
                file_size: uploadResult.size || 0,
                file_path: uploadResult.Location,
                tags: JSON.stringify(metadata.tags || []),
                metadata: JSON.stringify({
                    contentType: mimeType,
                    uploadedAt: new Date().toISOString(),
                    previousVersion: isUpdate ? existingDocument?.id : undefined,
                }),
            };

            const result = await knex("documents")
                .insert({
                    ...document,
                    uploaded_by: userId,
                    upload_date: knex.fn.now(),
                    last_updated: knex.fn.now(),
                    status: "ready", // Mark as ready since no processing needed yet
                    version: newVersion,
                    chunk_count: 0,
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now(),
                })
                .returning("*");


            const insertedDocument = Array.isArray(result) ? result[0] : result;

            // Broadcast notification to all users about new/updated document
            try {
                const NotificationService = require("../../notifications/notification.service").default;
                const notificationService = new NotificationService();

                const notificationType = isUpdate ? 'document_update' : 'document_upload';
                const notificationMessage = isUpdate
                    ? `Document updated: ${insertedDocument.name} (v${newVersion})`
                    : `New document uploaded: ${insertedDocument.name}`;

                await notificationService.broadcastNotification({
                    type: notificationType,
                    message: notificationMessage,
                    metadata: {
                        document_id: insertedDocument.id,
                        document_name: insertedDocument.name,
                        file_type: insertedDocument.file_type,
                        version: newVersion,
                        is_update: isUpdate,
                        previous_version_id: isUpdate ? existingDocument?.id : undefined,
                    },
                    except_user_id: userId, // Don't notify the uploader
                });
            } catch (notifError) {
                // Log but don't fail the upload if notification fails
                console.error('Failed to send notification:', notifError);
            }

            return insertedDocument as IDocument;
        } catch (error) {
            throw new HttpException(
                500,
                `Error uploading document: ${error.message}`
            );
        }
    }

    /**
     * Get all documents with pagination and filters
     */
    public async getDocuments(
        query: DocumentListQuery,
        userId?: number
    ): Promise<{ documents: IDocument[]; total: number; page: number; limit: number }> {
        try {
            const page = query.page || 1;
            const limit = query.limit || 20;
            const offset = (page - 1) * limit;

            let queryBuilder = knex("documents").where({ /* is_deleted: false */ });

            // Apply filters
            if (query.search) {
                queryBuilder = queryBuilder.where((builder) => {
                    builder
                        .where("name", "ilike", `%${query.search}%`)
                        .orWhere("original_name", "ilike", `%${query.search}%`);
                });
            }

            if (query.file_type) {
                queryBuilder = queryBuilder.where("file_type", query.file_type);
            }

            if (query.file_type) {
                queryBuilder = queryBuilder.where("file_type", query.file_type);
            }

            if (query.status) {
                queryBuilder = queryBuilder.where("status", query.status);
            }

            // Get total count
            const countResult = await queryBuilder.clone().count("* as count").first();
            const total = parseInt(countResult?.count as string) || 0;

            // Get paginated documents
            const documents = await queryBuilder
                .select("*")
                .orderBy("created_at", "desc")
                .limit(limit)
                .offset(offset);

            return {
                documents: documents as IDocument[],
                total,
                page,
                limit,
            };
        } catch (error) {
            throw new HttpException(
                500,
                `Error fetching documents: ${error.message}`
            );
        }
    }

    /**
     * Get single document by ID
     */
    public async getDocumentById(id: number): Promise<IDocument> {
        try {
            const document = await knex("documents")
                .where({ id /* , is_deleted: false */ })
                .first();

            if (!document) {
                throw new HttpException(404, "Document not found");
            }

            return document as IDocument;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error fetching document: ${error.message}`
            );
        }
    }

    /**
     * Update document metadata
     */
    public async updateDocument(
        id: number,
        updateData: UpdateDocumentRequest,
        userId: number
    ): Promise<IDocument> {
        try {
            // Check if document exists
            await this.getDocumentById(id);

            const updateFields: any = {
                last_updated: knex.fn.now(),
                updated_at: knex.fn.now(),
            };

            if (updateData.name) updateFields.name = updateData.name;
            if (updateData.tags) updateFields.tags = updateData.tags;

            const result = await knex("documents")
                .where({ id })
                .update(updateFields)
                .returning("*");

            const updatedDocument = Array.isArray(result) ? result[0] : result;
            return updatedDocument as IDocument;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error updating document: ${error.message}`
            );
        }
    }

    /**
     * Delete document (hard delete for now, can be changed to soft delete)
     */
    public async deleteDocument(id: number, userId: number): Promise<void> {
        try {
            // Check if document exists and get its name
            const document = await this.getDocumentById(id);
            const documentName = document.name;

            // Get all IDs for this document (all versions)
            const allVersions = await knex("documents")
                .where({ name: documentName })
                .select("id");

            const allIds = allVersions.map(v => v.id);

            // Check if ANY version is linked to any agents
            const linkedSources = await knex("sources")
                .whereIn("document_id", allIds)
                .where({ is_deleted: false })
                .count("* as count")
                .first();

            const linkCount = parseInt(linkedSources?.count as string) || 0;

            if (linkCount > 0) {
                throw new HttpException(
                    400,
                    `Cannot delete document. One or more versions are currently linked to ${linkCount} agent(s). Please unlink them first.`
                );
            }

            // Hard delete all versions
            await knex("documents").where({ name: documentName }).delete();
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error deleting document: ${error.message}`
            );
        }
    }

    /**
     * Get version history for a document
     * Returns all versions of documents with the same name
     */
    public async getVersionHistory(documentId: number): Promise<IDocument[]> {
        try {
            // Get the document to find its name
            const document = await this.getDocumentById(documentId);

            const query = knex("documents")
                .where({ name: document.name });

            const versions = await query
                .orderBy("version", "desc")
                .select("*");

            return versions as IDocument[];
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error fetching version history: ${error.message}`
            );
        }
    }

    /**
     * Get folder path for document uploads (global knowledge base)
     */
    public getFolderPathForDocuments(): string {
        return `knowledge-base/documents`;
    }
}

export default DocumentService;
