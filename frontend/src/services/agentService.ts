import api from './api';
import {
    Agent,
    CreateAgentDto,
    UpdateAgentDto,
    TrainingAnalytics,
    TrainingStatusResponse,
    TrainAgentDto,
} from '@/types/agent.types';

class AgentService {
    private basePath = '/agents';

    /**
     * Get all agents for the authenticated user
     */
    async getAgents(): Promise<Agent[]> {
        const response = await api.get(this.basePath);
        return response.data.data;
    }

    /**
     * Get the active system agent (for any user)
     */
    async getActiveAgent(): Promise<Agent> {
        const response = await api.get(`${this.basePath}/active`);
        return response.data.data;
    }

    /**
     * Get ALL active agents across all users (for chat agent dropdown)
     */
    async getAllActiveAgents(): Promise<Agent[]> {
        const response = await api.get(`${this.basePath}/active-all`);
        return response.data.data;
    }

    /**
     * Get agent by ID
     */
    async getAgent(id: number): Promise<Agent> {
        const response = await api.get(`${this.basePath}/${id}`);
        return response.data.data;
    }

    /**
     * Create a new agent
     */
    async createAgent(data: CreateAgentDto): Promise<Agent> {
        const response = await api.post(this.basePath, data);
        return response.data.data;
    }

    /**
     * Update an existing agent
     */
    async updateAgent(id: number, data: UpdateAgentDto): Promise<Agent> {
        const response = await api.put(`${this.basePath}/${id}`, data);
        return response.data.data;
    }

    /**
     * Delete an agent (soft delete)
     */
    async deleteAgent(id: number): Promise<void> {
        await api.delete(`${this.basePath}/${id}`);
    }

    /**
     * Train an agent with documents
     */
    async trainAgent(id: number, data?: TrainAgentDto): Promise<void> {
        await api.post(`${this.basePath}/${id}/train`, data || {});
    }

    /**
     * Retrain an existing agent
     */
    async retrainAgent(id: number, data?: TrainAgentDto): Promise<void> {
        await api.post(`${this.basePath}/${id}/retrain`, data || {});
    }

    /**
     * Get training status for an agent
     */
    async getTrainingStatus(id: number): Promise<TrainingStatusResponse> {
        const response = await api.get(`${this.basePath}/${id}/training-status`);
        return response.data.data;
    }

    /**
     * Get training analytics for an agent
     */
    async getTrainingAnalytics(id: number): Promise<TrainingAnalytics> {
        const response = await api.get(`${this.basePath}/${id}/training-analytics`);
        return response.data.data;
    }

    /**
     * Get all documents linked to a specific agent (for pre-selection in training UI)
     */
    async getAgentDocuments(id: number): Promise<any[]> {
        const response = await api.get(`${this.basePath}/${id}/documents`);
        return response.data.data;
    }

    /**
     * Unlink a specific document from an agent
     */
    async unlinkAgentDocument(agentId: number, documentId: number): Promise<void> {
        await api.delete(`${this.basePath}/${agentId}/documents/${documentId}`);
    }

    /**
     * Clear all training and knowledge for an agent completely
     */
    async clearAgentTraining(agentId: number): Promise<void> {
        await api.delete(`${this.basePath}/${agentId}/clear-training`);
    }

    /**
     * Get all available provider models from the system
     */
    async getProviderModels(): Promise<any[]> {
        const response = await api.get('/provider-models');
        return response.data.data;
    }
}

// Export singleton instance
export const agentService = new AgentService();
export default agentService;
