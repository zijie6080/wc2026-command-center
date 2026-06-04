// ============================================================
//  AI Analysis Cache — In-memory, process-lifetime
// ============================================================

export interface AnalysisSections {
  summary: string;
  keyEvents: string;
  bestPlayer: string;
  tactical: string;
}

interface CachedAnalysis {
  matchId: string;
  sections: AnalysisSections;
  generatedAt: number;
}

const MAX_CACHE_SIZE = 200; // Max 200 match analyses (~2MB)
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 day TTL

const cache = new Map<string, CachedAnalysis>();

function pruneIfNeeded(): void {
  // Remove expired entries
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.generatedAt > MAX_AGE_MS) {
      cache.delete(key);
    }
  }
  // If still over limit, evict oldest
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].generatedAt - b[1].generatedAt);
    const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    for (const [key] of toDelete) {
      cache.delete(key);
    }
  }
}

export const analysisCache = {
  get(matchId: string): AnalysisSections | null {
    const entry = cache.get(matchId);
    if (!entry) return null;
    if (Date.now() - entry.generatedAt > MAX_AGE_MS) {
      cache.delete(matchId);
      return null;
    }
    return entry.sections;
  },

  set(matchId: string, sections: AnalysisSections): void {
    cache.set(matchId, { matchId, sections, generatedAt: Date.now() });
    if (cache.size > MAX_CACHE_SIZE * 1.1) pruneIfNeeded();
  },

  has(matchId: string): boolean {
    return this.get(matchId) !== null;
  },

  size(): number {
    return cache.size;
  },
};
