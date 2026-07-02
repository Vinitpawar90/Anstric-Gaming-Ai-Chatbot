import DB from "../database/index.schema";
import * as Analytics from "../src/features/analytics/analytics.schema";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to drop a table
const dropTable = async (
  schema: {
    dropTable: () => Promise<void>;
  },
  tableName: string
) => {
  console.log(`Dropping ${tableName} table...`);
  await schema.dropTable();
};

// Helper function to create a table
const createTable = async (
  schema: {
    createTable: () => Promise<void>;
  },
  tableName: string
) => {
  console.log(`Creating ${tableName} table...`);
  await schema.createTable();
};

export const migrateAnalytics = async (dropFirst = false) => {
  try {
    console.log("Starting analytics database migration...\n");

    if (dropFirst) {
      console.log("🗑️  Dropping analytics tables...\n");
      await Analytics.dropAnalyticsTables();
      console.log("✅ Analytics tables dropped successfully!\n");
    }

    console.log("📊 Creating analytics tables...\n");
    await Analytics.createAnalyticsTables();
    console.log("✅ Analytics tables created successfully!\n");

    console.log("🎉 Analytics migration completed successfully!");
  } catch (error) {
    console.error("❌ Analytics migration failed:", error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  const dropFirst = process.argv.includes("--drop");
  const dropOnly = process.argv.includes("--drop-only");

  if (dropOnly) {
    // Only drop tables, don't create them
    migrateAnalytics(true)
      .then(() => {
        console.log("Analytics tables dropped successfully.");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Failed to drop analytics tables:", error);
        process.exit(1);
      });
  } else {
    // Normal migration (create tables, optionally drop first)
    migrateAnalytics(dropFirst)
      .then(() => {
        console.log("Analytics migration script completed.");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Analytics migration script failed:", error);
        process.exit(1);
      });
  }
}