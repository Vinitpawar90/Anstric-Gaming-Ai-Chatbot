import DB from "./index.schema";

// Import schema modules
import * as Users from "../src/features/user/users.schema";
import * as Agents from "../src/features/agent/agents.schema";
import * as ProviderModels from "../src/features/provider_model/provider_models.schema";
import * as AIConfig from "../src/features/provider_model/ai_config.schema";
import * as ChatSessions from "../src/features/chat/chat_sessions.schema";
import * as Sources from "../src/features/source/sources.schema";
import * as FileSources from "../src/features/source/file/file_sources.schema";
// Removed: TextSources, WebsiteSources, DatabaseSources, DatabaseTableSchemas, QASources
import * as Messages from "../src/features/chat/messages.schema";
import * as Analytics from "../src/features/analytics/analytics.schema";
import * as Documents from "../src/features/documents/documents.schema";
import * as OnboardingTemplates from "../src/features/onboarding/onboarding_templates.schema";
import * as OnboardingProgress from "../src/features/onboarding/onboarding_progress.schema";
import * as Notifications from "../src/features/notifications/notifications.schema";
import * as DMConversations from "../src/features/messaging/dm_conversations.schema";
import * as DirectMessages from "../src/features/messaging/direct_messages.schema";
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

export const migrateAll = async (dropFirst = false) => {
  try {
    console.log("Starting database migration and seeding...\n");

    if (dropFirst) {
      console.log("🗑️  Dropping all tables in reverse dependency order...\n");

      // Level 5: Drop dependent tables
      console.log("Level 5: Dropping dependent tables...");
      await dropTable(OnboardingProgress, "onboarding_progress");
      await dropTable(Notifications, "notifications");
      await dropTable(Documents, "documents");
      console.log("✓ Dependent tables dropped");

      await sleep(500);

      // Level 4: Drop file sources
      console.log("Level 4: Dropping file sources...");
      await dropTable(FileSources, "file_sources");
      console.log("✓ File sources dropped");

      // Drop messages tables
      await dropTable(DirectMessages, "direct_messages");
      await dropTable(DMConversations, "dm_conversations");
      await dropTable(Messages, "messages");
      console.log("✓ Messages tables dropped");

      // Drop analytics tables
      await Analytics.dropAnalyticsTables();
      console.log("✓ Analytics tables dropped\n");

      // Small delay to ensure cleanup
      await sleep(1000);

      // Level 3: Drop second level dependencies
      console.log("Level 3: Dropping second level dependencies...");
      await dropTable(Sources, "sources");
      await dropTable(ChatSessions, "chat_sessions");
      console.log("✓ Sources and chat sessions tables dropped\n");

      // Small delay to ensure cleanup
      await sleep(1000);

      // Level 2: Drop first level dependencies
      console.log("Level 2: Dropping first level dependencies...");
      await dropTable(ProviderModels, "provider_models");
      await dropTable(Agents, "agents");
      console.log("✓ Provider models and agents tables dropped\n");

      // Small delay to ensure cleanup
      await sleep(1000);

      // Level 1: Drop base tables and independent tables
      console.log("Level 1: Dropping base tables and independent tables...");
      await dropTable(OnboardingTemplates, "onboarding_templates");
      await dropTable(AIConfig, "ai_config");
      await dropTable(Users, "users");
      console.log("✓ Base tables and independent tables dropped\n");

      console.log("🎯 All tables dropped successfully!\n");
    }

    // Now create tables in correct dependency order
    console.log("🏗️  Creating all tables in dependency order...\n");

    // Level 1: Base Tables
    console.log("Level 1: Creating base tables...");
    await createTable(Users, "users");
    console.log(`✓ Users table created\n`);

    // Level 2: First Level Dependencies
    console.log("Level 2: Creating first level dependencies...");
    await Promise.all([
      createTable(Agents, "agents"),
      createTable(ProviderModels, "provider_models"),
    ]);
    console.log(`✓ Agents and provider models tables created`);

    // Seed provider models with default Groq models
    console.log("Seeding provider models...");
    await ProviderModels.seedTable();
    console.log(`✓ Provider models seeded\n`);

    // Small delay to ensure foreign keys are ready
    await sleep(1000);

    // Level 3: Second Level Dependencies
    console.log("Level 3: Creating second level dependencies...");
    await Promise.all([
      createTable(ChatSessions, "chat_sessions"),
      createTable(Sources, "sources"),
      createTable(DMConversations, "dm_conversations"),
    ]);
    console.log(`✓ Chat sessions, sources, and dm_conversations tables created\n`);

    // Small delay to ensure foreign keys are ready
    await sleep(1000);

    // Create file sources and messages tables
    await Promise.all([
      createTable(FileSources, "file_sources"),
      createTable(Messages, "messages"),
      createTable(DirectMessages, "direct_messages"),
    ]);
    console.log(`✓ File sources, messages, and direct_messages tables created`);

    // Create analytics tables
    await Analytics.createAnalyticsTables();
    console.log(`✓ Analytics tables created\n`);

    await sleep(500);

    // Level 5: Dependent Tables
    console.log("Level 5: Creating dependent tables...");
    await Promise.all([
      createTable(Documents, "documents"),
      createTable(OnboardingProgress, "onboarding_progress"),
      createTable(Notifications, "notifications"),
    ]);
    console.log(`✓ Dependent tables created\n`);

    console.log(
      "✨ All database migrations and seeding completed successfully!"
    );
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
};

// Run directly if this file is being executed directly

if (require.main === module) {
  const args = process.argv.slice(2);

  // Handle help flag
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Database Migration Script

Usage:
  npx ts-node database/migrate.schema.ts [options]

Options:
  --drop    Drop all tables before creating them (reset database)
  --help    Show this help message

Examples:
  npx ts-node database/migrate.schema.ts              # Create tables (fails if they exist)
  npx ts-node database/migrate.schema.ts --drop       # Recreate all tables

Note: This script creates database tables in dependency order without seeding any data.
`);
    process.exit(0);
  }

  const dropFirst = args.includes("--drop");
  migrateAll(dropFirst)
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error during migration:", error);
      process.exit(1);
    });
}

/*
Usage:

1. To run ALL migrations without dropping tables (keeps existing data):
   npx ts-node database/migrate.schema.ts

2. To run ALL migrations and reset all data:
   npx ts-node database/migrate.schema.ts --drop

3. To run individual schema migrations:
   npx ts-node src/database/users.schema.ts         # Migrate users table
   npx ts-node src/database/agents.schema.ts        # Migrate agents table
   npx ts-node src/database/provider_models.schema.ts # Migrate provider models table
   npx ts-node src/database/chat_sessions.schema.ts  # Migrate chat sessions table
   npx ts-node src/database/sources.schema.ts       # Migrate sources table
   npx ts-node src/database/messages.schema.ts      # Migrate messages table
   npx ts-node src/database/file_sources.schema.ts  # Migrate file sources table
   npx ts-node src/database/text_sources.schema.ts  # Migrate text sources table
   npx ts-node src/database/website_sources.schema.ts # Migrate website sources table
   npx ts-node src/database/database_sources.schema.ts # Migrate database sources table
   npx ts-node src/database/qa_sources.schema.ts    # Migrate QA sources table

Note: When running individual migrations, make sure to maintain the dependency order:
1. Users
2. Agents, Provider Models
3. Chat Sessions, Sources
4. Messages, File Sources, Text Sources, Website Sources, Database Sources, QA Sources
*/
