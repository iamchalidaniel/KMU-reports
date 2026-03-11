import { createClient } from 'redis';

// Redis client singleton
let redisClient = null;

/**
 * Initialize Redis connection
 */
export async function initRedis() {
  if (redisClient) return redisClient;
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis connection failed after 10 retries');
          return new Error('Redis connection failed');
        }
        // Exponential backoff
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Get Redis client (must call initRedis first)
 */
export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redisClient;
}

/**
 * Cache middleware for Express routes
 * @param {string} key - Cache key prefix
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export function cacheMiddleware(key, ttl = 300) {
  return async (req, res, next) => {
    // Skip caching if Redis not available
    if (!redisClient || !redisClient.isOpen) {
      return next();
    }

    try {
      // Create unique cache key from request
      const cacheKey = `${key}:${req.originalUrl}:${JSON.stringify(req.query)}`;
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Return cached response
        return res.json(JSON.parse(cachedData));
      }

      // Store original json function
      const originalJson = res.json.bind(res);

      // Override json function to cache response
      res.json = async (data) => {
        try {
          // Only cache successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            await redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
          }
        } catch (cacheError) {
          console.error('Cache set error:', cacheError);
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'students:*')
 */
export async function clearCache(pattern) {
  if (!redisClient || !redisClient.isOpen) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
}

/**
 * Set cache value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
export async function setCache(key, value, ttl = 300) {
  if (!redisClient || !redisClient.isOpen) return false;

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Set cache error:', error);
    return false;
  }
}

/**
 * Get cache value
 * @param {string} key - Cache key
 */
export async function getCache(key) {
  if (!redisClient || !redisClient.isOpen) return null;

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Get cache error:', error);
    return null;
  }
}

export default {
  initRedis,
  getRedisClient,
  cacheMiddleware,
  clearCache,
  setCache,
  getCache
};
