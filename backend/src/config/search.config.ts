/**
 * Global Search Configuration
 *
 * Centralized configuration for all search operations.
 * Uses pure dense semantic search via Pinecone Inference API.
 */

import { SearchConfig } from '../interfaces/config.interface';

export const defaultSearchConfig: SearchConfig = {
  // ========================
  // GLOBAL SEARCH SETTINGS
  // ========================
  global: {
    enableSearch: true,
    defaultStrategy: 'semantic',
    minQueryLength: 10,
  },

  // ========================
  // CORE SEARCH PARAMETERS
  // ========================
  parameters: {
    defaultTopK: 10,
    maxTopK: 50,
    minTopK: 10,

    minSimilarityThreshold: 0.1,
    defaultMinSimilarity: 0.15,

    enableCacheByDefault: true,
    includeMetadataByDefault: true,
    prioritizeSpeed: false,
  },

  // ========================
  // LAYER-SPECIFIC OVERRIDES
  // ========================
  layers: {
    chat: {
      context: {
        maxContextChars: 2000,
        previewMaxChars: 1200,
        textPreviewLength: 200,
        maxResultsToUse: 8,
        rerankedUseTopN: 5, // Kept for interface compatibility — not actively used
      },
      vectorSearch: {
        topK: 15,
        minSimilarity: 0.10,
        rerankTopN: 10,       // Kept for interface compatibility — not actively used
        rerankThreshold: 0.35, // Kept for interface compatibility — not actively used
        enableCache: true,
      },
    },

    vector: {
      supportedSourceTypes: ['file', 'text', 'website', 'database', 'qa'],
      supportedStrategies: ['semantic', 'fixed', 'hierarchical', 'content-aware'],
    },
  },
};

export const getSearchConfig = (): SearchConfig => {
  const config = { ...defaultSearchConfig };

  if (process.env.NODE_ENV === 'test') {
    config.parameters.enableCacheByDefault = false;
    config.parameters.defaultTopK = 5;
  }

  if (process.env.NODE_ENV === 'production') {
    config.parameters.prioritizeSpeed = true;
  }

  return config;
};

export const searchConfig = getSearchConfig();

export const searchUtils = {
  getLayerParams: (layer: 'chat' | 'vector') => {
    const config = searchConfig;
    if (layer === 'chat') {
      return { ...config.parameters, ...config.layers.chat.vectorSearch };
    }
    return {
      ...config.parameters,
      supportedSourceTypes: config.layers.vector.supportedSourceTypes,
      supportedStrategies: config.layers.vector.supportedStrategies,
    };
  },

  getHybridWeights: () => ({ dense: 1.0, sparse: 0.0 }), // Pure dense — kept for interface compat
};