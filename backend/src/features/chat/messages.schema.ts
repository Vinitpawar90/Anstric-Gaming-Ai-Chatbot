import DB from "../../../database/index.schema";

export const MESSAGES_TABLE = "messages";

// Schema Definition
export const createTable = async () => {
  await DB.schema.createTable(MESSAGES_TABLE, (table) => {
    table.increments("id").primary();
    table
      .integer("session_id")
      .notNullable()
      .references("id")
      .inTable("chat_sessions")
      .onDelete("CASCADE");
    table.text("content").notNullable();
    table.text("role").notNullable().checkIn(["user", "assistant"]);
    table.string("feedback", 20).nullable();
    table.text("feedback_comment").nullable();
    table.timestamp("created_at").defaultTo(DB.fn.now());
  });

  await DB.raw(`CREATE INDEX IF NOT EXISTS idx_messages_feedback ON ${MESSAGES_TABLE}(feedback)`);
};

// Drop Table
export const dropTable = async () => {
  await DB.schema.dropTableIfExists(MESSAGES_TABLE);
};

// For individual table migration (when run directly)
if (require.main === module) {
  const dropFirst = process.argv.includes("--drop");

  (async () => {
    try {
      if (dropFirst) {
        console.log(`Dropping ${MESSAGES_TABLE} table...`);
        await dropTable();
      }
      console.log(`Creating ${MESSAGES_TABLE} table...`);
      await createTable();


      console.log(
        `${MESSAGES_TABLE} table ${dropFirst ? "recreated" : "created"}`
      );
      process.exit(0);
    } catch (error) {
      console.error(`Error with ${MESSAGES_TABLE} table:`, error);
      process.exit(1);
    }
  })();
}

/* Usage:
   npx ts-node src/database/messages.schema.ts       # Create table
   npx ts-node src/database/messages.schema.ts --drop # Recreate table
*/