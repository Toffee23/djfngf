import dotenv from "dotenv";

// Re-verify instance initialization bounds defensively
dotenv.config();

/**
 * Global Outbound Mail Transport Layer Configurations Matrix
 */
export const configs = {
  // Target outbound registration identity address profile
  FROM: process.env.FROM || "",
  
  // Cryptographic authorization password/token access key
  PASSWORD: process.env.PASSWORD || "",
  
  // Casts the port assignment to a formal structural integer dynamically, defaulting safely to 465
  PORT: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 465,
  
  // Destination server relay node routing location host entry
  HOST: process.env.HOST || "smtp.gmail.com",
  
  // Defensively casts string inputs to strict Boolean states to eliminate implicit string boolean bugs
  SECURE: process.env.SECURE === "true" || process.env.SECURE === true,
};