import dotenv from "dotenv";
dotenv.config();

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

export const redisConnection = {
  url: process.env.REDIS_URL,
};
