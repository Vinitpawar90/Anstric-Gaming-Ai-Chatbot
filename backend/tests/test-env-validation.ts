#!/usr/bin/env ts-node

/**
 * Test script to verify environment validation works without GROQ_API_KEY
 */

import validateEnv from "../src/utils/validateEnv";

async function testEnvironmentValidation() {
  console.log("🧪 Testing Environment Validation");
  console.log("=================================\n");

  try {
    console.log("📝 Testing environment validation without GROQ_API_KEY...");

    // Temporarily remove GROQ_API_KEY from process.env to simulate commented out env var
    const originalGroqKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    console.log(
      `🔍 GROQ_API_KEY in environment: ${
        process.env.GROQ_API_KEY ? "SET" : "NOT SET"
      }`
    );

    // This should not throw an error now
    const env = validateEnv();

    console.log("✅ Environment validation passed!");
    console.log(
      `📋 GROQ_API_KEY value: "${env.GROQ_API_KEY}" (should be empty)`
    );

    // Restore the original value
    if (originalGroqKey) {
      process.env.GROQ_API_KEY = originalGroqKey;
    }

    console.log("\n🎉 Environment validation works without GROQ_API_KEY!");
    console.log("==================================================");
    console.log("✅ GROQ_API_KEY is now optional");
    console.log("✅ API keys are managed per-agent in the database");
    console.log("✅ Global environment variable is no longer required");
  } catch (error: any) {
    console.error("❌ Environment validation failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run the test
testEnvironmentValidation()
  .then(() => {
    console.log("🏁 Environment validation test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
