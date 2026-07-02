import { logger } from "./logger";
import { CacheNamespace } from "../interfaces/config.interface";
import {
  getTTL,
  getSizeLimit,
  getKeyPrefix,
} from "../config/smart-cache.config";
import crypto from "crypto";

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * Smart Cache Service — pure in-memory (L1) cache.
 * Redis (L2) has been removed; a single Node process doesn't need it.
 */
export class SmartCacheService {
  private namespace: CacheNamespace;
  // Shared static map so all instances for the same namespace share the same cache
  private static globalL1Caches: Map<string, Map<string, CacheEntry<any>>> = new Map();
  private sizeLimit: number;
  private defaultTTL: number;
  private keyPrefix: string;

  constructor(namespace: CacheNamespace) {
    this.namespace = namespace;

    if (!SmartCacheService.globalL1Caches.has(namespace)) {
      SmartCacheService.globalL1Caches.set(namespace, new Map());
    }

    this.sizeLimit = getSizeLimit(namespace);
    this.defaultTTL = getTTL(namespace);
    this.keyPrefix = getKeyPrefix(namespace);
  }

  private get l1Cache(): Map<string, CacheEntry<any>> {
    return SmartCacheService.globalL1Caches.get(this.namespace)!;
  }

  private getCacheKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  public static hashKey(...parts: (string | number)[]): string {
    const combined = parts.join(":");
    return crypto.createHash("md5").update(combined).digest("hex");
  }

  public async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);

    const entry = this.l1Cache.get(cacheKey);
    if (entry) {
      const age = Date.now() - entry.timestamp;
      if (age < entry.ttl) {
        logger.debug(`✅ Cache HIT: ${this.namespace}:${key} (age: ${age}ms)`);
        return entry.value as T;
      } else {
        this.l1Cache.delete(cacheKey);
        logger.debug(`⏰ Cache EXPIRED: ${this.namespace}:${key}`);
      }
    }

    logger.debug(`❌ Cache MISS: ${this.namespace}:${key}`);
    return null;
  }

  public async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const cacheKey = this.getCacheKey(key);

    if (this.sizeLimit > 0 && this.l1Cache.size >= this.sizeLimit) {
      this.evictOldest();
    }

    this.l1Cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    logger.debug(`💾 Cache SET: ${this.namespace}:${key} (TTL: ${Math.ceil(ttl / 1000)}s)`);
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.l1Cache.delete(oldestKey);
      logger.debug(`🗑️  Cache EVICT: ${oldestKey}`);
    }
  }

  public async delete(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    this.l1Cache.delete(cacheKey);
    logger.debug(`🗑️  Cache DELETE: ${this.namespace}:${key}`);
  }

  public async deletePattern(pattern: string): Promise<void> {
    const fullPattern = this.getCacheKey(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.l1Cache.keys()) {
      if (this.matchPattern(key, fullPattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.l1Cache.delete(key));
    logger.debug(`🗑️  Cache DELETE PATTERN: ${this.namespace}:${pattern}`);
  }

  private matchPattern(str: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(str);
  }

  public async clear(): Promise<void> {
    this.l1Cache.clear();
    logger.info(`🧹 Cache CLEARED: ${this.namespace}`);
  }

  public getStats(): {
    namespace: string;
    l1Size: number;
    sizeLimit: number;
    defaultTTL: number;
  } {
    return {
      namespace: this.namespace,
      l1Size: this.l1Cache.size,
      sizeLimit: this.sizeLimit,
      defaultTTL: this.defaultTTL,
    };
  }

  public async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }
}
