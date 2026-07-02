import DB from "../../../database/index.schema";

export const DM_CONVERSATIONS_TABLE = "dm_conversations";

/**
 * DM Conversations Schema
 * 
 * Stores unique conversation pairs between users.
 * Uses LEAST/GREATEST to ensure order-independent unique constraint.
 */

// Schema Definition
export const createTable = async () => {
    await DB.schema.createTable(DM_CONVERSATIONS_TABLE, (table) => {
        table.increments("id").primary();
        // Participants (order normalized: smaller ID always in participant_one)
        table
            .integer("participant_one")
            .notNullable()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table
            .integer("participant_two")
            .notNullable()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        // Timestamps
        table.timestamp("last_message_at").defaultTo(DB.fn.now());
        table.timestamp("created_at").defaultTo(DB.fn.now());
    });

    // Create indexes for faster lookups
    await DB.raw(`CREATE INDEX idx_dm_conversations_p1 ON ${DM_CONVERSATIONS_TABLE}(participant_one);`);
    await DB.raw(`CREATE INDEX idx_dm_conversations_p2 ON ${DM_CONVERSATIONS_TABLE}(participant_two);`);
    await DB.raw(`CREATE INDEX idx_dm_conversations_last_msg ON ${DM_CONVERSATIONS_TABLE}(last_message_at DESC);`);

    // Create unique constraint for conversation pairs (order-independent)
    await DB.raw(`
    CREATE UNIQUE INDEX idx_dm_conversations_unique_pair 
    ON ${DM_CONVERSATIONS_TABLE}(
      MIN(participant_one, participant_two),
      MAX(participant_one, participant_two)
    );
  `);
};

// Drop Table
export const dropTable = async () => {
    await DB.schema.dropTableIfExists(DM_CONVERSATIONS_TABLE);
};

// For individual table migration (when run directly)
if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");

    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${DM_CONVERSATIONS_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${DM_CONVERSATIONS_TABLE} table...`);
            await createTable();

            console.log(
                `${DM_CONVERSATIONS_TABLE} table ${dropFirst ? "recreated" : "created"}`
            );
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${DM_CONVERSATIONS_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}

/* Usage:
   npx ts-node src/features/messaging/dm_conversations.schema.ts       # Create table
   npx ts-node src/features/messaging/dm_conversations.schema.ts --drop # Recreate table
*/
