if (!process.env.REDIS_URL) {
  throw new Error("❌ REDIS_URL environment variable is not set in .env");
}

// Exporting both the raw URL string and a structured object configuration
// to support different client implementations (Redis native vs BullMQ workers)
export const redisConnection = {
  url: process.env.REDIS_URL,
  // Add fallback connection configuration details if standard parsers are used
  maxRetriesPerRequest: null, 
  enableReadyCheck: false
};

export const REDIS_URL = process.env.REDIS_URL;