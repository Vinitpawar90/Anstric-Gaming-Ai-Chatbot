import knex from "../../../../database/index.schema";
import HttpException from "../../../exceptions/HttpException";
import { logger } from "../../../utils/logger";
import DocumentService from "../../documents/services/document.service";

interface SyncResult {
    addedDocuments: number[];
    existingDocuments: number[];
    removedDocuments: number[];
}

class AgentDocumentLinkService {
    private documentService = new DocumentService();

    /**
     * Sync documents to an agent (Replace/Sync approach)
     * This will replace the current set of document-linked sources with the new set
     */
    public async syncDocumentsToAgent(
        agentId: number,
        documentIds: number[],
        userId: number
    ): Promise<SyncResult> {
        try {
            logger.info(`Syncing ${documentIds.length} documents to agent ${agentId}`);

            //  1. Validate agent exists and user owns it
            const agent = await knex("agents")
                .where({ id: agentId, user_id: userId, is_deleted: false })
                .first();

            if (!agent) {
                throw new HttpException(404, "Agent not found or access denied");
            }

            // 2. Validate all documents exist
            const documents = await knex("documents")
                .whereIn("id", documentIds)
                .select("*");

            if (documents.length !== documentIds.length) {
                const foundIds = documents.map((d) => d.id);
                const missingIds = documentIds.filter((id) => !foundIds.includes(id));
                throw new HttpException(
                    404,
                    `Documents not found: ${missingIds.join(", ")}`
                );
            }

            // 3. Get existing document-linked sources for this agent
            const existingSources = await knex("sources")
                .where({ agent_id: agentId, is_deleted: false })
                .whereNotNull("document_id")
                .select("id", "document_id");

            const existingDocIds = existingSources.map((s) => s.document_id);

            // 4. Determine what to add and what to remove
            const toAdd = documentIds.filter((id) => !existingDocIds.includes(id));
            const toRemove = existingDocIds.filter((id) => !documentIds.includes(id));
            const existing = documentIds.filter((id) => existingDocIds.includes(id));

            logger.info(
                `Sync plan: Add ${toAdd.length}, Remove ${toRemove.length}, Keep ${existing.length}`
            );

            // 5. Execute transaction
            await knex.transaction(async (trx) => {
                // Remove sources that are no longer selected (soft delete)
                if (toRemove.length > 0) {
                    const sourcesToDelete = existingSources
                        .filter((s) => toRemove.includes(s.document_id))
                        .map((s) => s.id);

                    await trx("sources")
                        .whereIn("id", sourcesToDelete)
                        .update({
                            is_deleted: true,
                            is_embedded: false,
                            deleted_by: userId,
                            deleted_at: trx.fn.now(),
                        });

                    // Clean up vectors from Pinecone for removed sources
                    try {
                        const { chatbotIndex } = require("../../../utils/pinecone");
                        const namespaceName = `user_${userId}_agent_${agentId}`;
                        const namespace = chatbotIndex.namespace(namespaceName);

                        const vectorIds: string[] = [];
                        for (const sourceId of sourcesToDelete) {
                            for (let i = 0; i < 200; i++) {
                                vectorIds.push(`${sourceId}_chunk_${i}`);
                            }
                        }
                        if (vectorIds.length > 0) {
                            await namespace.deleteMany(vectorIds);
                            logger.info(`🗑️ Deleted vectors for ${sourcesToDelete.length} unlinked sources from Pinecone`);
                        }
                    } catch (vecError) {
                        logger.warn(`⚠️ Failed to clean up vectors for removed sources:`, vecError);
                    }

                    logger.info(`Soft-deleted ${sourcesToDelete.length} sources`);
                }

                // Add new documents as sources
                if (toAdd.length > 0) {
                    const sourcesToAdd = documents
                        .filter((doc) => toAdd.includes(doc.id))
                        .map((doc) => ({
                            agent_id: agentId,
                            source_type: "file" as const,
                            name: doc.name,
                            description: `Document from Knowledge Base: ${doc.original_name}`,
                            status: "pending" as const,
                            is_embedded: false,
                            document_id: doc.id,
                            created_by: userId,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now(),
                            is_deleted: false,
                        }));

                    await trx("sources").insert(sourcesToAdd);

                    // Also create corresponding file_sources entries
                    const newSources = await trx("sources")
                        .where({ agent_id: agentId })
                        .whereIn("document_id", toAdd)
                        .select("id", "document_id");

                    const fileSourcesData = await Promise.all(
                        newSources.map(async (source) => {
                            const doc = documents.find((d) => d.id === source.document_id);
                            return {
                                source_id: source.id,
                                file_url: doc.file_path,
                                mime_type: doc.metadata?.contentType || "application/octet-stream",
                                file_size: doc.file_size || 0,
                                text_content: null, // Will be extracted during training
                            };
                        })
                    );

                    await trx("file_sources").insert(fileSourcesData);

                    logger.info(`Added ${toAdd.length} new document sources`);
                }
            });

            return {
                addedDocuments: toAdd,
                existingDocuments: existing,
                removedDocuments: toRemove,
            };
        } catch (error) {
            logger.error(`Error syncing documents to agent ${agentId}:`, error);
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error syncing documents: ${error.message}`
            );
        }
    }

    /**
     * Get all documents linked to an agent
     */
    public async getAgentDocuments(agentId: number, userId: number): Promise<any[]> {
        try {
            // Validate agent access
            const agent = await knex("agents")
                .where({ id: agentId, user_id: userId, is_deleted: false })
                .first();

            if (!agent) {
                throw new HttpException(404, "Agent not found or access denied");
            }

            // Get documents linked via sources
            const documents = await knex("documents")
                .join("sources", "documents.id", "sources.document_id")
                .where({ "sources.agent_id": agentId, "sources.is_deleted": false })
                .select("documents.*", "sources.status as training_status", "sources.is_embedded");

            return documents;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error fetching agent documents: ${error.message}`
            );
        }
    }
    /**
     * Unlink a specific document from an agent (Soft delete the source)
     * Also cleans up associated vectors from Pinecone
     */
    public async unlinkDocumentFromAgent(
        agentId: number,
        documentId: number,
        userId: number
    ): Promise<void> {
        try {
            // Validate agent access
            const agent = await knex("agents")
                .where({ id: agentId, user_id: userId, is_deleted: false })
                .first();

            if (!agent) {
                throw new HttpException(404, "Agent not found or access denied");
            }

            // Find the source linking this agent and document
            const source = await knex("sources")
                .where({ agent_id: agentId, document_id: documentId, is_deleted: false })
                .first();

            if (!source) {
                throw new HttpException(404, "This document is not currently linked to the agent");
            }

            // Soft-delete the source link
            await knex("sources")
                .where({ id: source.id })
                .update({
                    is_deleted: true,
                    is_embedded: false,
                    deleted_by: userId,
                    deleted_at: knex.fn.now(),
                });

            // Clean up vectors from Pinecone for this source
            if (source.is_embedded) {
                try {
                    const { chatbotIndex } = require("../../../utils/pinecone");
                    const namespaceName = `user_${userId}_agent_${agentId}`;
                    const namespace = chatbotIndex.namespace(namespaceName);

                    // Get total chunks count to build vector IDs
                    // Vector IDs follow pattern: {sourceId}_chunk_{index}
                    const stats = await chatbotIndex.describeIndexStats();
                    const nsRecordCount = stats.namespaces?.[namespaceName]?.recordCount || 0;

                    if (nsRecordCount > 0) {
                        // Build vector IDs for this source (up to 200 chunks max)
                        const vectorIds: string[] = [];
                        for (let i = 0; i < 200; i++) {
                            vectorIds.push(`${source.id}_chunk_${i}`);
                        }
                        await namespace.deleteMany(vectorIds);
                        logger.info(`🗑️ Deleted vectors for source ${source.id} from namespace ${namespaceName}`);
                    }
                } catch (vecError) {
                    logger.warn(`⚠️ Failed to clean up vectors for unlinked source ${source.id}:`, vecError);
                    // Don't throw — the source is already unlinked
                }
            }

            logger.info(`Successfully unlinked document ${documentId} from agent ${agentId}`);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error unlinking document from agent: ${error.message}`
            );
        }
    }

    /**
     * Clear all training and knowledge for an agent.
     * This wipes the Pinecone namespace entirely, resets agent status to 'idle',
     * and soft-deletes all linked document sources.
     */
    public async clearAllTrainingForAgent(agentId: number, userId: number): Promise<void> {
        try {
            // 1. Validate agent access
            const agent = await knex("agents")
                .where({ id: agentId, user_id: userId, is_deleted: false })
                .first();

            if (!agent) {
                throw new HttpException(404, "Agent not found or access denied");
            }

            if (agent.training_status === 'in-progress' || agent.training_status === 'pending') {
                throw new HttpException(400, "Cannot clear training while a training job is actively in progress");
            }

            // 2. Soft-delete all sources for this agent
            await knex("sources")
                .where({ agent_id: agentId, is_deleted: false })
                .update({
                    is_deleted: true,
                    is_embedded: false,
                    status: 'pending',
                    deleted_by: userId,
                    deleted_at: knex.fn.now(),
                });

            // 3. Reset the agent's training status
            await knex("agents")
                .where({ id: agentId })
                .update({
                    training_status: 'idle',
                    training_progress: 0,
                    embedded_sources_count: 0,
                    trained_on: null,
                    updated_by: userId,
                    updated_at: knex.fn.now(),
                });

            // 4. Wipe the Pinecone namespace
            try {
                const { chatbotIndex } = require("../../../utils/pinecone");
                const namespaceName = `user_${userId}_agent_${agentId}`;
                const namespace = chatbotIndex.namespace(namespaceName);
                
                await namespace.deleteAll();
                logger.info(`🧹 Wiped all vectors from Pinecone namespace: ${namespaceName}`);
            } catch (vecError) {
                logger.warn(`⚠️ Failed to wipe vectors for agent ${agentId}:`, vecError);
                // If it fails because the namespace doesn't exist, that's fine.
            }

            // 5. Invalidate agent caches
            try {
                const agentCacheService = require("./agent-cache.service").default;
                await agentCacheService.invalidateAgent(agentId, userId);
            } catch (cacheError) {
                logger.warn(`⚠️ Failed to invalidate agent cache:`, cacheError);
            }

            logger.info(`✅ Successfully cleared all training for agent ${agentId}`);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                500,
                `Error clearing training for agent: ${error.message}`
            );
        }
    }
}

export default AgentDocumentLinkService;
