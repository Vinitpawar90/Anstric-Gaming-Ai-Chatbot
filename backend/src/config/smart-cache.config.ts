import { CacheNamespace } from '../interfaces/config.interface';

/**
 * Cache Configuration — memory-only (L1).
 * Redis (L2) has been removed.
 */
export const CACHE_CONFIG = {
  TTL: {
    AGENT: 5 * 60 * 1000,
    API_KEY: 5 * 60 * 1000,
    CONVERSATION_SUMMARY: 30 * 60 * 1000,
    CONTEXT: 2 * 60 * 1000,
    SESSION_MESSAGES: 3 * 60 * 1000,
    VECTOR_AVAILABILITY: 2 * 60 * 1000,
    EMBEDDING: 30 * 60 * 1000,
    PINECONE_HYBRID: 5 * 60 * 1000,
  },

  SIZE_LIMITS: {
    AGENT: 100,
    API_KEY: 50,
    CONVERSATION_SUMMARY: 50,
    CONTEXT: 50,
    SESSION_MESSAGES: 100,
    VECTOR_AVAILABILITY: 50,
    PINECONE_HYBRID: 30,
  },

  // Key prefixes (used as in-memory namespacing)
  KEY_PREFIXES: {
    AGENT: "agent:",
    API_KEY: "api_key:",
    CONVERSATION_SUMMARY: "conv_summary:",
    CONTEXT: "context:",
    SESSION_MESSAGES: "session_messages:",
    VECTOR_AVAILABILITY: "vector_avail:",
    EMBEDDING: "embedding:",
    PINECONE_HYBRID: "pinecone_hybrid:",
  },
} as const;

export function getTTL(namespace: CacheNamespace): number {
  const ttlMap: Record<CacheNamespace, number> = {
    agent: CACHE_CONFIG.TTL.AGENT,
    api_key: CACHE_CONFIG.TTL.API_KEY,
    conversation_summary: CACHE_CONFIG.TTL.CONVERSATION_SUMMARY,
    context: CACHE_CONFIG.TTL.CONTEXT,
    session_messages: CACHE_CONFIG.TTL.SESSION_MESSAGES,
    vector_availability: CACHE_CONFIG.TTL.VECTOR_AVAILABILITY,
    embedding: CACHE_CONFIG.TTL.EMBEDDING,
    pinecone_hybrid: CACHE_CONFIG.TTL.PINECONE_HYBRID,
  };
  return ttlMap[namespace];
}

export function getSizeLimit(namespace: CacheNamespace): number {
  const sizeMap: Record<CacheNamespace, number> = {
    agent: CACHE_CONFIG.SIZE_LIMITS.AGENT,
    api_key: CACHE_CONFIG.SIZE_LIMITS.API_KEY,
    conversation_summary: CACHE_CONFIG.SIZE_LIMITS.CONVERSATION_SUMMARY,
    context: CACHE_CONFIG.SIZE_LIMITS.CONTEXT,
    session_messages: CACHE_CONFIG.SIZE_LIMITS.SESSION_MESSAGES,
    vector_availability: CACHE_CONFIG.SIZE_LIMITS.VECTOR_AVAILABILITY,
    embedding: 0,
    pinecone_hybrid: CACHE_CONFIG.SIZE_LIMITS.PINECONE_HYBRID,
  };
  return sizeMap[namespace];
}

export function getKeyPrefix(namespace: CacheNamespace): string {
  const prefixMap: Record<CacheNamespace, string> = {
    agent: CACHE_CONFIG.KEY_PREFIXES.AGENT,
    api_key: CACHE_CONFIG.KEY_PREFIXES.API_KEY,
    conversation_summary: CACHE_CONFIG.KEY_PREFIXES.CONVERSATION_SUMMARY,
    context: CACHE_CONFIG.KEY_PREFIXES.CONTEXT,
    session_messages: CACHE_CONFIG.KEY_PREFIXES.SESSION_MESSAGES,
    vector_availability: CACHE_CONFIG.KEY_PREFIXES.VECTOR_AVAILABILITY,
    embedding: CACHE_CONFIG.KEY_PREFIXES.EMBEDDING,
    pinecone_hybrid: CACHE_CONFIG.KEY_PREFIXES.PINECONE_HYBRID,
  };
  return prefixMap[namespace];
}