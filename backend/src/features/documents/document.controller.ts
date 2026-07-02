import { NextFunction, Response } from "express";
import { RequestWithUser } from "../../interfaces/auth.interface";
import DocumentService from "./services/document.service";
import HttpException from "../../exceptions/HttpException";
import ResponseUtil from "../../utils/response.util";
import { uploadMulterFile } from "../../utils/fileupload";
import { UpdateDocumentDto, DocumentQueryDto } from "./document.dto";

class DocumentController {
    public documentService = new DocumentService();

    /**
     * Upload a document to Knowledge Base
     */
    public uploadDocument = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;
            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            if (!req.file) {
                throw new HttpException(400, "File is required");
            }

            // Get metadata from request body
            const { name, tags } = req.body;

            // Upload file to S3/storage
            const folderPath = this.documentService.getFolderPathForDocuments();
            const uploadResult = await uploadMulterFile(req.file, folderPath);

            // Create document record
            const document = await this.documentService.uploadDocument(
                uploadResult,
                {
                    name: name || req.file.originalname,
                    tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : undefined,
                },
                userId
            );

            res
                .status(201)
                .json(
                    ResponseUtil.created("Document uploaded successfully", document)
                );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all documents with pagination and filters
     */
    public getDocuments = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            const query: DocumentQueryDto = {
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                search: req.query.search as string,
                file_type: req.query.file_type as any,
                status: req.query.status as any,
            };

            const result = await this.documentService.getDocuments(query, userId);

            res.status(200).json(
                ResponseUtil.success("Documents retrieved successfully", result)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get single document by ID
     */
    public getDocument = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                throw new HttpException(400, "Invalid document ID");
            }

            const document = await this.documentService.getDocumentById(id);

            res.status(200).json(
                ResponseUtil.success("Document retrieved successfully", document)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update document metadata
     */
    public updateDocument = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            if (isNaN(id)) {
                throw new HttpException(400, "Invalid document ID");
            }

            const updateData: UpdateDocumentDto = req.body;

            const updatedDocument = await this.documentService.updateDocument(
                id,
                updateData,
                userId
            );

            res.status(200).json(
                ResponseUtil.updated("Document updated successfully", updatedDocument)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Delete document
     */
    public deleteDocument = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            if (isNaN(id)) {
                throw new HttpException(400, "Invalid document ID");
            }

            await this.documentService.deleteDocument(id, userId);

            res.status(200).json(ResponseUtil.deleted("Document deleted successfully"));
        } catch (error) {
            next(error);
        }
    };



    /**
     * Get version history for a document
     */
    public getVersionHistory = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                throw new HttpException(400, "Invalid document ID");
            }

            const versions = await this.documentService.getVersionHistory(id);

            res.status(200).json(
                ResponseUtil.success("Version history retrieved successfully", {
                    document_id: id,
                    total_versions: versions.length,
                    versions: versions,
                })
            );
        } catch (error) {
            next(error);
        }
    };
}

export default DocumentController;
