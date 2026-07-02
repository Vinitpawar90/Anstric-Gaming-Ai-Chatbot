// Agent Types and Interfaces

export type TrainingStatus = 'idle' | 'pending' | 'in-progress' | 'completed' | 'failed';

export type AIProvider = 'groq' | 'openai' | 'anthropic' | 'cohere';

export interface Agent {
    id: number;
    name: string;
    description?: string;
    provider: AIProvider;
    model: string;
    temperature: number;
    system_prompt: string;
    is_active: number;
    user_id: number;
    training_status: TrainingStatus;
    training_progress: number;
    training_error?: string;
    embedded_sources_count: number;
    total_sources_count: number;
    created_at: string;
    updated_at: string;
    trained_on?: string;
}

export interface CreateAgentDto {
    name: string;
    description?: string;
    provider: AIProvider;
    api_key?: string;
    model?: string;
    temperature?: number;
    system_prompt?: string;
    is_active?: number;
}

export interface UpdateAgentDto {
    name?: string;
    description?: string;
    provider?: AIProvider;
    api_key?: string;
    model?: string;
    temperature?: number;
    system_prompt?: string;
    is_active?: number;
}

export interface TrainingAnalytics {
    total_documents: number;
    processed_documents: number;
    failed_documents: number;
    total_chunks: number;
    average_chunk_size: number;
    training_duration?: number;
}

export interface SourceBreakdown {
    total: number;
    completed: number;
    embedded: number;
    pending: number;
    failed: number;
}

export interface TrainingMetrics {
    embeddedSources: number;
    recentlyProcessed: number;
    failedSources: number;
    vectorCount: number;
    averageProcessingTime: number | null;
    namespace: string;
}

export interface TrainingStatusResponse {
    agent: {
        id: number;
        name: string;
        createdAt: string;
        lastUpdated: string;
    };
    status: TrainingStatus;
    progress: number;
    error: { message: string; timestamp: string } | null;
    sources: {
        total: number;
        embedded: number;
        pending: number;
        breakdown: Record<string, SourceBreakdown>;
        details: {
            id: number;
            name: string;
            type: string;
            status: string;
            isEmbedded: boolean;
            description: string;
            createdAt: string;
            lastUpdated: string;
        }[];
    };
    metrics: TrainingMetrics;
    history: {
        recentSessions: { status: string; progress: number; timestamp: string; trainingDate: string }[];
        sourceCompletions: { name: string; type: string; completedAt: string }[];
    };
    timestamps: {
        lastTraining: string | null;
        estimatedCompletion: string | null;
        timeRemaining: number | null;
    };
}

export interface TrainAgentDto {
    documentIds?: number[];
    forceRetrain?: boolean;
    cleanupExisting?: boolean;
}

// Provider-specific model configurations
export const PROVIDER_MODELS: Record<AIProvider, string[]> = {
    groq: [
        "moonshotai/kimi-k2-instruct",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
    ],
    openai: [],
    anthropic: [],
    cohere: []
};

// Default System Prompt for the Anstric Gaming Enterprise Assistant
export const ANSTRIC_GAMING_DEFAULT_PROMPT = `You are Anstric Gaming, the AI-powered internal intelligence assistant for our company.

Your role is to provide instant, highly accurate, and contextual answers to employees based strictly on internal company documents, policies, and technical documentation. 

Rules:
1. Do not hallucinate external facts. Base your answers ONLY on the provided context retrieved from the knowledge base.
2. Always be professional, concise, and helpful. 
3. If a user asks a question that is not covered by the retrieved documentation, politely state that you could not find the information in the company's knowledge base. Do not attempt to guess or invent an answer.
4. Format responses clearly using markdown (bullet points, bold text, etc.) for readability.

COMPANY INFORMATION (Anstric Games Private Limited):
- Founded by Aditya More in 2024 (initially as LLP, converted to Private Limited in 2025).
- Vision: Build globally impactful digital products and games.
- Mission: Deliver high-quality and innovative digital experiences.
- Focus: Game development, software solutions, and digital innovation.
- Platforms supported: Android, iOS, web, and desktop.
- Technologies used: Unity, React, Node.js, PHP, and modern frameworks.
- Core Products:
  - Border Game: A game focused on strategic/engaging gameplay.
  - Anstric IDE: A development environment simplifying coding and projects. Features an "exam mode" which restricts system access for secure exams to ensure fairness.
- Services: Game development (mobile, web, PC - casual and story-driven), custom software solutions.
- Internships: Anstric Games offers internships for practical learning (coding, design, teamwork, real-world skills).
- Long-term goal: To expand globally with innovative products.
- Strengths: Innovation, design, execution, creative digital products.`;

