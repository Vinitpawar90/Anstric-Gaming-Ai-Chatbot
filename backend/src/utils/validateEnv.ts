import dotenv from "dotenv";
dotenv.config({ quiet: true });

import { cleanEnv, port, str, num } from "envalid";
import { logger } from "./logger";

const validateEnv = () => {
  const env = cleanEnv(process.env, {
    JWT_SECRET: str(),
    PORT: port(),
    GROQ_API_KEY: str({ default: "" }),

    // SQLite database path
    DB_PATH: str({ default: "./data/local.db" }),

    // Pinecone configuration
    PINECONE_API_KEY: str(),
    PINECONE_INDEX_NAME: str({ default: "chatverse" }),

    // Queue configuration (used by in-process job runner)
    MAX_CONCURRENT_JOBS: num({ default: 5 }),
    JOB_TIMEOUT: num({ default: 300000 }),

    // Local file uploads directory
    UPLOADS_DIR: str({ default: "./uploads" }),

    // Email configuration
    EMAIL_USER: str({ default: "" }),
    EMAIL_PASSWORD: str({ default: "" }),

    // Security configuration
    ALLOWED_ORIGINS: str({ default: "http://localhost:3000,http://localhost:8080" }),
  });

  if (env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long for security");
  }

  logger.info("✅ Environment variables validated.");
  return env;
};

export default validateEnv;
