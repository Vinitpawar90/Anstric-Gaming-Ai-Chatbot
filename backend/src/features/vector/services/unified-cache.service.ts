import { SmartCacheService } from "../../../utils/smart-cache.service";
import { IVectorSearchResult } from "../vector.interface";
import { logger } from "../../../utils/logger";
import { cacheConfig } from "../../../config/feature-cache.config";

/**
 * Unified Cache Service for Vector Operations and AI Responses.
 * Uses distinct namespaces for each cache type to avoid key collisions.
 */
class UnifiedCacheService {
  // Each cache type has its own namespace to prevent key collisions
  private responseCache: SmartCacheService;  // AI responses  → namespace: "context"
  private vectorCache: SmartCacheService;    // Search results → namespace: "vector_availability"

  // Tracks which cache keys belong to each agent for targeted invalidation
  private agentKeys: Map<string, Set<string>> = new Map();

  constructor() {
    this.responseCache = new SmartCacheService("context");              // AI response TTL & limits
    this.vectorCache   = new SmartCacheService("vector_availability");  // Separate map, separate TTL
  }

  // ========================
  // AI RESPONSE CACHING
  // ========================

  private generateResponseCacheKey(
    query: string,
    agentId: number,
    userId: number,
    contextHash?: string
  ): string {
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    return SmartCacheService.hashKey(normalizedQuery, agentId.toString(), contextHash || 'no-context');
  }

  private generateContextHash(context: string): string {
    if (!context || context.length === 0) return 'no-context';
    return SmartCacheService.hashKey(context);
  }

  /**
   * Determine whether a query is worth caching.
   * Skips personalized queries ("my ...", "I ...") and very short queries.
   */
  private shouldCacheResponse(query: string): boolean {
    const normalizedQuery = query.toLowerCase();
    const personalizationIndicators = ['my ', 'i ', 'me ', 'mine', 'myself', 'personal'];
    const hasPersonalization = personalizationIndicators.some(term => normalizedQuery.includes(term));
    return !hasPersonalization && query.length >= 20;
  }

  public async getCachedResponse(
    query: string,
    agentId: number,
    userId: number,
    context?: string
  ): Promise<string | null> {
    try {
      if (!this.shouldCacheResponse(query)) return null;
      const contextHash = context ? this.generateContextHash(context) : undefined;
      const cacheKey = this.generateResponseCacheKey(query, agentId, userId, contextHash);
      const cached = await this.responseCache.get<{ response: string; timestamp: number; agentId: number }>(cacheKey);
      if (cached) {
        logger.info(`⚡ AI Response cache HIT for agent ${agentId}: ${query.substring(0, 50)}...`);
        return cached.response;
      }
      return null;
    } catch (error: any) {
      logger.error('Error getting cached response:', error);
      return null;
    }
  }

  public async setCachedResponse(
    query: string,
    response: string,
    agentId: number,
    userId: number,
    context?: string
  ): Promise<void> {
    try {
      if (!this.shouldCacheResponse(query) || !response || response.length < 20) return;
      const contextHash = context ? this.generateContextHash(context) : undefined;
      const cacheKey = this.generateResponseCacheKey(query, agentId, userId, contextHash);
      const cacheData = { response, timestamp: Date.now(), agentId };
      await this.responseCache.set(cacheKey, cacheData, cacheConfig.chat.responseCache.ttl * 1000);
      logger.info(`💾 AI Response cached for agent ${agentId}: ${query.substring(0, 50)}...`);
    } catch (error: any) {
      logger.error('Error caching response:', error);
    }
  }

  // ========================
  // VECTOR SEARCH CACHING
  // ========================

  public async getVectorSearchResults(
    query: string,
    userId: number,
    agentId: number
  ): Promise<IVectorSearchResult[] | null> {
    const key = SmartCacheService.hashKey("search", query, userId, agentId);
    return await this.vectorCache.get<IVectorSearchResult[]>(key);
  }

  public async setVectorSearchResults(
    query: string,
    userId: number,
    agentId: number,
    results: IVectorSearchResult[]
  ): Promise<void> {
    const key = SmartCacheService.hashKey("search", query, userId, agentId);
    await this.vectorCache.set(key, results);
    this.trackKey(userId, agentId, key);
    logger.debug(`💾 Vector search cached: ${results.length} results for "${query.substring(0, 50)}..."`);
  }

  // ========================
  // CACHE MANAGEMENT
  // ========================

  private trackKey(userId: number, agentId: number, key: string): void {
    const agentKey = `${userId}_${agentId}`;
    if (!this.agentKeys.has(agentKey)) {
      this.agentKeys.set(agentKey, new Set());
    }
    this.agentKeys.get(agentKey)!.add(key);
  }

  public async invalidateAgentCache(userId: number, agentId: number): Promise<void> {
    const agentKey = `${userId}_${agentId}`;
    const keys = this.agentKeys.get(agentKey);
    if (keys && keys.size > 0) {
      for (const key of Array.from(keys)) {
        await this.vectorCache.delete(key);
      }
      this.agentKeys.delete(agentKey);
    }
    logger.info(`🗑️ Vector cache invalidated for Agent ${agentId}, User ${userId}`);
  }

  public async invalidateUserCache(userId: number): Promise<void> {
    const userAgentKeys = Array.from(this.agentKeys.keys()).filter(k => k.startsWith(`${userId}_`));
    for (const agentKey of userAgentKeys) {
      const [, agentIdStr] = agentKey.split('_');
      await this.invalidateAgentCache(userId, parseInt(agentIdStr));
    }
    logger.info(`🗑️ Vector cache invalidated for User ${userId}`);
  }

  public async clearAllCaches(): Promise<void> {
    await this.responseCache.clear();
    await this.vectorCache.clear();
    this.agentKeys.clear();
    logger.info(`🗑️ All caches cleared`);
  }

  public getCacheStats() {
    return {
      responseCache: {
        l1Size: this.responseCache.getStats().l1Size,
        defaultTTL: this.responseCache.getStats().defaultTTL,
      },
      vectorCache: {
        l1Size: this.vectorCache.getStats().l1Size,
        defaultTTL: this.vectorCache.getStats().defaultTTL,
      },
      trackedAgents: this.agentKeys.size,
      totalTrackedKeys: Array.from(this.agentKeys.values()).reduce((sum, keys) => sum + keys.size, 0),
    };
  }
}

// Export singleton instance
const unifiedCacheService = new UnifiedCacheService();
export default unifiedCacheService;