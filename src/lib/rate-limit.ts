import { LRUCache } from 'lru-cache';

const options = {
  max: 500, // Store 500 unique IPs
  ttl: 60 * 1000, // 1 minute
};

const tokenCache = new LRUCache<string, number>(options);

export function rateLimit(ip: string, limit: number = 30) {
  const currentUsage = tokenCache.get(ip) || 0;
  
  if (currentUsage >= limit) {
    return { success: false, currentUsage };
  }
  
  tokenCache.set(ip, currentUsage + 1);
  return { success: true, currentUsage: currentUsage + 1 };
}
