import DB from "../../../database/index.schema";

export const NOTIFICATIONS_TABLE = "notifications";

// Schema Definition
export const createTable = async () => {
    await DB.schema.createTable(NOTIFICATIONS_TABLE, (table) => {
        table.increments("id").primary();
        table.integer("user_id").references("id").inTable("users").onDelete("CASCADE").nullable();
        table.text("type").notNullable();
        table.text("message").notNullable();
        table.json("metadata").defaultTo("{}");
        table.boolean("read").defaultTo(false);
        table.timestamp("created_at").defaultTo(DB.fn.now());
    });

    await DB.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON ${NOTIFICATIONS_TABLE}(user_id)`);
    await DB.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON ${NOTIFICATIONS_TABLE}(read)`);
    await DB.raw(`CREATE INDEX IF NOT EXISTS idx_notifications_created ON ${NOTIFICATIONS_TABLE}(created_at DESC)`);
};

// Drop Table
export const dropTable = async () => {
    await DB.schema.dropTableIfExists(NOTIFICATIONS_TABLE);
};

// For individual table migration (when run directly)
if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");

    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${NOTIFICATIONS_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${NOTIFICATIONS_TABLE} table...`);
            await createTable();

            console.log(
                `${NOTIFICATIONS_TABLE} table ${dropFirst ? "recreated" : "created"}`
            );
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${NOTIFICATIONS_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}
