import DB from "../index.schema";

/**
 * Migration: Add document_id column to sources table
 * This links sources to documents from the knowledge base
 */

export const up = async () => {
    console.log("Adding document_id column to sources table...");

    await DB.schema.alterTable("sources", (table) => {
        table
            .integer("document_id")
            .nullable()
            .references("id")
            .inTable("documents")
            .onDelete("SET NULL");
    });

    // Add index for better query performance
    await DB.raw(`
    CREATE INDEX IF NOT EXISTS idx_sources_document_id ON sources(document_id);
  `);

    console.log("✅ document_id column added to sources table");
};

export const down = async () => {
    console.log("Removing document_id column from sources table...");

    // Drop index first
    await DB.raw(`
    DROP INDEX IF EXISTS idx_sources_document_id;
  `);

    // Drop column
    await DB.schema.alterTable("sources", (table) => {
        table.dropColumn("document_id");
    });

    console.log("✅ document_id column removed from sources table");
};

// Run migration if this file is executed directly
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes("--down")) {
        down()
            .then(() => {
                console.log("Migration rollback completed");
                process.exit(0);
            })
            .catch((error) => {
                console.error("Migration rollback failed:", error);
                process.exit(1);
            });
    } else {
        up()
            .then(() => {
                console.log("Migration completed");
                process.exit(0);
            })
            .catch((error) => {
                console.error("Migration failed:", error);
                process.exit(1);
            });
    }
}

/* Usage:
   npx ts-node backend/database/migrations/001_add_document_id_to_sources.ts       # Apply migration
   npx ts-node backend/database/migrations/001_add_document_id_to_sources.ts --down # Rollback migration
*/
