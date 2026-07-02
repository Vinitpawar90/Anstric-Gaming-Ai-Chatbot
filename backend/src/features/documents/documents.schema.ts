import DB from "../../../database/index.schema";

export const DOCUMENTS_TABLE = "documents";

export const createTable = async () => {
    await DB.schema.createTable(DOCUMENTS_TABLE, (table) => {
        table.increments("id").primary();
        table.text("name").notNullable();
        table.text("original_name").notNullable();
        table.string("file_type", 10).notNullable(); // pdf, docx, md, txt — stored as string
        table.integer("file_size").nullable();
        table.text("file_path").notNullable();
        table.integer("uploaded_by").references("id").inTable("users").notNullable();
        table.timestamp("upload_date").defaultTo(DB.fn.now());
        table.timestamp("last_updated").defaultTo(DB.fn.now());
        table.string("status", 20).defaultTo("processing"); // processing, ready, failed
        table.integer("version").defaultTo(1);
        table.integer("chunk_count").defaultTo(0);
        table.text("tags").nullable(); // JSON array stored as text (SQLite has no native array type)
        table.json("metadata").defaultTo("{}");
        table.timestamp("created_at").defaultTo(DB.fn.now());
        table.timestamp("updated_at").defaultTo(DB.fn.now());
    });

    await DB.raw(`CREATE INDEX IF NOT EXISTS idx_documents_status ON ${DOCUMENTS_TABLE}(status)`);
    await DB.raw(`CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON ${DOCUMENTS_TABLE}(uploaded_by)`);
};

export const dropTable = async () => {
    await DB.schema.dropTableIfExists(DOCUMENTS_TABLE);
};

if (require.main === module) {
    const dropFirst = process.argv.includes("--drop");
    (async () => {
        try {
            if (dropFirst) {
                console.log(`Dropping ${DOCUMENTS_TABLE} table...`);
                await dropTable();
            }
            console.log(`Creating ${DOCUMENTS_TABLE} table...`);
            await createTable();
            console.log(`${DOCUMENTS_TABLE} table ${dropFirst ? "recreated" : "created"}`);
            process.exit(0);
        } catch (error) {
            console.error(`Error with ${DOCUMENTS_TABLE} table:`, error);
            process.exit(1);
        }
    })();
}
