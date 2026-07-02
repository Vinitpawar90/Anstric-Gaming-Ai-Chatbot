import DB from "../../../database/index.schema";

export const DIRECT_MESSAGES_TABLE = "direct_messages";

/**
 * Direct Messages Schema
 * 
 * Stores individual messages between users in a conversation.
 * Links to dm_conversations table for conversation context.
 */

// Schema Definition
export const createTable = async () => {
    await DB.schema.createTable(DIRECT_MESSAGES_TABLE, (table) => {
        table.increments("id").primary();
        // Foreign key to conversation
        table
            .integer("conversation_id")
            .notNullable()
            .references("id")
            .inTable("dm_conversations")
            .onDelete("CASCADE");
        // Sender reference
        table
            .integer("sender_id")
            .notNullable()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        // Message content
        table.text("content").notNullable();
        // Read status
        table.boolean("is_read").defaultTo(false);
        // Timestamps
        table.timestamp("created_at").defaultTo(DB.fn.now());
    });

    // Create indexes for efficient queries
    await DB.raw(`CREATE INDEX idx_direct_messages_conversation ON ${DIRECT_MESSAGES_TABLE}(conversation_id);`);
    await DB.raw(`CREATE INDEX idx_direct_messages_sender ON ${DIRECT_MESSAGES_TABLE}(sender_id);`);
    await DB.raw(`CREATE INDEX idx_direct_messages_created ON ${DIRECT_MESSAGES_TABLE}(created_at DESC);`);
    await DB.raw(`CREATE INDEX idx_direct_messages_unread ON ${DIRECT_MESSAGES_TABLE}(conversation_id, is_read) WHERE is_read = false;`);
};

// Drop Table
export const dropTable = async () => {
    await DB.schema.dropTableIfExists(DIRECT_MESSAGES_TABLE);
};

// For individual table migration (when run directly)
if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");

    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${DIRECT_MESSAGES_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${DIRECT_MESSAGES_TABLE} table...`);
            await createTable();

            console.log(
                `${DIRECT_MESSAGES_TABLE} table ${dropFirst ? "recreated" : "created"}`
            );
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${DIRECT_MESSAGES_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}

/* Usage:
   npx ts-node src/features/messaging/direct_messages.schema.ts       # Create table
   npx ts-node src/features/messaging/direct_messages.schema.ts --drop # Recreate table
   
   Note: dm_conversations table must exist before creating this table.
*/
