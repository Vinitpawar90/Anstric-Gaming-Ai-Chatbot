import DB from "../../../database/index.schema";

export const AI_CONFIG_TABLE = "ai_config";

// Schema Definition
export const createTable = async () => {
    await DB.schema.createTable(AI_CONFIG_TABLE, (table) => {
        table.increments("id").primary();
        table.text("model_name").notNullable();
        table.decimal("temperature", 3, 2).defaultTo(0.7);
        table.integer("top_k_chunks").defaultTo(5);
        table.decimal("similarity_threshold", 3, 2).defaultTo(0.70);
        table.timestamp("updated_at").defaultTo(DB.fn.now());
    });
};

// Drop Table
export const dropTable = async () => {
    await DB.schema.dropTableIfExists(AI_CONFIG_TABLE);
};

// Seed default configuration
export const seedTable = async () => {
    const exists = await DB(AI_CONFIG_TABLE).first();

    if (!exists) {
        await DB(AI_CONFIG_TABLE).insert({
            model_name: "llama-3.1-70b-versatile",
            temperature: 0.7,
            top_k_chunks: 5,
            similarity_threshold: 0.70
        });
        console.log("✓ Default AI configuration seeded");
    }
};

// For individual table migration (when run directly)
if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");

    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${AI_CONFIG_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${AI_CONFIG_TABLE} table...`);
            await createTable();
            await seedTable();

            console.log(
                `${AI_CONFIG_TABLE} table ${dropFirst ? "recreated" : "created"}`
            );
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${AI_CONFIG_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}
