import DB from "../../../database/index.schema";

export const ONBOARDING_PROGRESS_TABLE = "onboarding_progress";

// Schema Definition
export const createTable = async () => {
    await DB.schema.createTable(ONBOARDING_PROGRESS_TABLE, (table) => {
        table.increments("id").primary();
        table.integer("user_id").references("id").inTable("users").onDelete("CASCADE").notNullable();
        table.integer("section_index").notNullable();
        table.boolean("completed").defaultTo(false);
        table.timestamp("completed_at").nullable();
        table.timestamp("created_at").defaultTo(DB.fn.now());

        // Unique constraint
        table.unique(["user_id", "section_index"]);
    });

    // Create index
    await DB.raw(`
    CREATE INDEX idx_onboarding_progress_user ON ${ONBOARDING_PROGRESS_TABLE}(user_id);
  `);
};

// Drop Table
export const dropTable = async () => {
    await DB.schema.dropTableIfExists(ONBOARDING_PROGRESS_TABLE);
};

// For individual table migration (when run directly)
if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");

    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${ONBOARDING_PROGRESS_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${ONBOARDING_PROGRESS_TABLE} table...`);
            await createTable();

            console.log(
                `${ONBOARDING_PROGRESS_TABLE} table ${dropFirst ? "recreated" : "created"}`
            );
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${ONBOARDING_PROGRESS_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}
