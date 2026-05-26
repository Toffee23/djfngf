import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// ── Path Insulation Structural Guards ─────────────────────────────
// Guarantees that the decoupled process can resolve the .env root configuration 
// perfectly even when executed on completely independent servers or task engines.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, "../../../.env") });

console.log("=================================================");
console.log("🚀 [Flixora Worker Engine] Process Initialized");
console.log(`⏱️ Current System Time: ${new Date().toISOString()}`);
console.log("=================================================");

// Initialize and spin up the independent background worker instance channels
import "./mailWorker.js";

// Process Level Safety Fallback Listeners
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ [Worker Thread Critical Error] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ [Worker Thread Critical Crash] Uncaught Exception caught:", error.message);
  // Give process time to complete outstanding tasks before exiting
  setTimeout(() => process.exit(1), 1000);
});