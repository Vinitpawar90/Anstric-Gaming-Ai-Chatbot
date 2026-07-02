import DB from "../../../database/index.schema";

export const ONBOARDING_TEMPLATES_TABLE = "onboarding_templates";

// Schema Definition
export const createTable = async () => {
    await DB.schema.createTable(ONBOARDING_TEMPLATES_TABLE, (table) => {
        table.increments("id").primary();
        table.text("title").notNullable();
        table.json("sections").notNullable();
        table.timestamp("created_at").defaultTo(DB.fn.now());
        table.timestamp("updated_at").defaultTo(DB.fn.now());
    });
};

// Drop Table
export const dropTable = async () => {
    await DB.schema.dropTableIfExists(ONBOARDING_TEMPLATES_TABLE);
};

// Seed default template
export const seedTable = async () => {
    const exists = await DB(ONBOARDING_TEMPLATES_TABLE).first();

    if (!exists) {
        await DB(ONBOARDING_TEMPLATES_TABLE).insert({
            title: "Employee Onboarding",
            sections: JSON.stringify([
                {
                    day: 1,
                    title: "Welcome & Company Overview",
                    description: "Learn about our mission, vision, and culture",
                    documents: []
                },
                {
                    day: 2,
                    title: "Policies & Procedures",
                    description: "Understand company policies and HR procedures",
                    documents: []
                },
                {
                    day: 3,
                    title: "Tools & Systems",
                    description: "Get familiar with our tools and systems",
                    documents: []
                }
            ])
        });
        console.log("✓ Default onboarding template seeded");
    }
};

// For individual table migration (when run directly)
if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");

    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${ONBOARDING_TEMPLATES_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${ONBOARDING_TEMPLATES_TABLE} table...`);
            await createTable();
            await seedTable();

            console.log(
                `${ONBOARDING_TEMPLATES_TABLE} table ${dropFirst ? "recreated" : "created"}`
            );
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${ONBOARDING_TEMPLATES_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}
