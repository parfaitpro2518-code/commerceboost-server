class CacheManager {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
  }

  // 🔹 CACHE SIMPLE
  set(key, value, ttl = 600000) {
    const expires = Date.now() + ttl;
    this.cache.set(key, { value, expires });
    this.stats.size = this.cache.size;
    
    if (this.cache.size > 500) {
      this.cleanup();
    }
    
    return true;
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  // 🔹 CACHE IA INTELLIGENT
  async getCachedIA(userId, question, generatorFn, ttl = 300000) {
    const key = `ia_${userId}_${this.hashString(question.substring(0, 50))}`;
    const cached = this.get(key);
    
    if (cached) {
      console.log(`💾 Cache IA HIT pour ${userId}`);
      return cached;
    }

    console.log(`🔄 Cache IA MISS pour ${userId}`);
    const result = await generatorFn();
    this.set(key, result, ttl);
    return result;
  }

  // 🔹 NETTOYAGE AUTO
  cleanup() {
    const now = Date.now();
    let deleted = 0;
    
    for (const [key, item] of this.cache) {
      if (now > item.expires) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    console.log(`🧹 Cache nettoyé: ${deleted} entrées, ${this.cache.size} restantes`);
    this.stats.size = this.cache.size;
  }

  // 🔹 STATISTIQUES
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(1) : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      size: this.stats.size,
      timestamp: new Date().toISOString()
    };
  }

  // 🔹 HASH SIMPLE
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

const globalCache = new CacheManager();

setInterval(() => {
  globalCache.cleanup();
}, 300000);

export default globalCache;