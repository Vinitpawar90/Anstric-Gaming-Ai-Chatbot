import api from './api';

// ============================================================================
// Analytics Types
// ============================================================================

export interface UserEngagement {
    user_id: number;
    total_sessions: number;
    total_questions: number;
    avg_response_time_ms: number | null;
    avg_session_duration: number;
    most_active_day: string;
    favorite_agents: string[];
    engagement_score: number;
}

export interface UserActivity {
    date: string;
    questions_asked: number;
    sessions_started: number;
    avg_response_rating: number;
}

export interface BehaviorInsights {
    period: { startDate: string, endDate: string, days: number };
    userBehavior: {
        userId: number;
        totalActivities: number;
        uniqueActiveDays: number;
        avgDailyActivity: number;
        engagementScore: number;
    }[];
    eventTypeDistribution: {
        eventType: string;
        count: number;
        percentage: number;
    }[];
    summary: { totalUsers: number, totalActivities: number, avgActivitiesPerUser: number };
}

export interface RetentionMetrics {
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    stickiness: number;
    wow_growth: number;
}

export interface AgentPerformance {
    agent_id: number;
    agent_name: string;
    total_conversations: number;
    total_messages: number;
    avg_response_time: number;
    positive_feedback_rate: number;
    negative_feedback_rate: number;
    accuracy_score: number;
    response_quality_score: number;
}

export interface TopAgent {
    agentId: number;
    agentName: string;
    model?: string;
    provider?: string;
    totalChats: number;
    totalCost: number;
    avgResponseTime: number;
    avgSatisfaction: number;
}

export interface ModelUsage {
    model: string;
    provider?: string;
    usageCount: number;
    totalCost: number;
    avgResponseTime: number;
    avgSatisfaction: number;
}

export interface ModelCost {
    model_name: string;
    total_cost: number;
    cost_per_request: number;
    input_tokens: number;
    output_tokens: number;
    period: string;
}

// Mapped types for frontend display (compatible with existing mock data structure)
export interface PopularQuestion {
    question: string;
    count: number;
    category: string;
}

export interface KnowledgeGap {
    topic: string;
    frequency: number;
    status: 'missing' | 'outdated';
}

export interface DepartmentStat {
    department: string;
    activeUsers: number;
    questionsAsked: number;
    avgResponseTime: number;
}

// ============================================================================
// Analytics Service
// ============================================================================

class AnalyticsService {
    private basePath = '/analytics';

    /**
     * Get user engagement metrics for current user
     */
    async getUserEngagement(): Promise<UserEngagement> {
        const response = await api.get(`${this.basePath}/user/engagement`);
        return response.data.data;
    }

    /**
     * Get user activity over time
     */
    async getUserActivity(days: number = 30): Promise<UserActivity[]> {
        const response = await api.get(`${this.basePath}/user/activity`, {
            params: { days },
        });
        return response.data.data;
    }

    /**
     * Get behavior insights (admin)
     */
    async getBehaviorInsights(): Promise<BehaviorInsights> {
        const response = await api.get(`${this.basePath}/behavior/insights`);
        return response.data.data;
    }

    /**
     * Get retention metrics (admin)
     */
    async getRetentionMetrics(): Promise<RetentionMetrics> {
        const response = await api.get(`${this.basePath}/retention`);
        return response.data.data;
    }

    /**
     * Get agent performance (admin)
     */
    async getAgentPerformance(agentId: number): Promise<AgentPerformance> {
        const response = await api.get(`${this.basePath}/agents/${agentId}/performance`);
        return response.data.data;
    }

    /**
     * Get top performing agents (admin)
     */
    async getTopAgents(limit: number = 5): Promise<TopAgent[]> {
        const response = await api.get(`${this.basePath}/agents/top`, {
            params: { limit },
        });
        return response.data.data;
    }

    /**
     * Get model usage statistics (admin)
     */
    async getModelUsage(): Promise<ModelUsage[]> {
        const response = await api.get(`${this.basePath}/models/usage`);
        return response.data.data.modelStats || [];
    }

    /**
     * Get model costs (admin)
     */
    async getModelCosts(): Promise<ModelCost[]> {
        const response = await api.get(`${this.basePath}/models/costs`);
        return response.data.data;
    }

    /**
     * Track user interaction
     */
    async trackInteraction(data: {
        session_id: number;
        interaction_type: string;
        duration_seconds?: number;
        metadata?: Record<string, any>;
    }): Promise<void> {
        await api.post(`${this.basePath}/interaction`, data);
    }

    /**
     * Track feature usage
     */
    async trackFeatureUsage(data: {
        feature_name: string;
        action: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        await api.post(`${this.basePath}/feature-usage`, data);
    }

    /**
     * Helper: Transform behavior insights to PopularQuestion format
     * Note: common_queries is no longer returned, using eventTypeDistribution instead
     */
    transformToPopularQuestions(insights: BehaviorInsights): PopularQuestion[] {
        return this.transformTopicsToQuestions(insights);
    }

    /**
     * Helper: Transform popular topics to PopularQuestion format
     */
    transformTopicsToQuestions(insights: BehaviorInsights): PopularQuestion[] {
        if (!insights || !insights.eventTypeDistribution) {
            return [];
        }
        return insights.eventTypeDistribution.map(t => ({
            question: t.eventType, // Using eventType as the "topic/question"
            count: t.count,
            category: 'Event Action',
        }));
    }

    /**
     * Get popular conversational topics (admin)
     */
    async getPopularTopics(limit: number = 10): Promise<PopularQuestion[]> {
        try {
            const response = await api.get(`${this.basePath}/popular-topics`, {
                params: { limit },
            });
            // The backend returns an array of { eventType: string, count: number, percentage: number }
            // Let's map it back to the PopularQuestion format
            return (response.data.data || []).map((t: any) => ({
                question: t.eventType,
                count: t.count,
                category: 'User Question'
            }));
        } catch (error) {
            console.error("Failed to fetch popular topics:", error);
            return [];
        }
    }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
