import DB from "../../../database/index.schema";

export const USERS_TABLE = "users";

export const createTable = async () => {
  await DB.schema.createTable(USERS_TABLE, (table) => {
    table.increments("id").primary();
    table.text("name").notNullable();
    table.text("email").unique().notNullable();
    table.text("password").notNullable();
    table.text("phone_number").nullable();
    table.string("role", 20).defaultTo("employee");
    table.boolean("onboarding_completed").defaultTo(false);
    table.timestamp("last_login").nullable();
    // Invitation fields
    table.text("invitation_token").unique().nullable();
    table.timestamp("invitation_expires").nullable();
    table.integer("invited_by").references("id").inTable(USERS_TABLE).nullable();
    // Audit fields
    table.integer("created_by").notNullable();
    table.timestamp("created_at").defaultTo(DB.fn.now());
    table.integer("updated_by").nullable();
    table.timestamp("updated_at").defaultTo(DB.fn.now());
    table.boolean("is_deleted").defaultTo(false);
    table.integer("deleted_by").nullable();
    table.timestamp("deleted_at").nullable();
  });

  await DB.raw(`CREATE INDEX IF NOT EXISTS idx_users_role ON ${USERS_TABLE}(role)`);
};

export const dropTable = async () => {
  await DB.schema.dropTableIfExists(USERS_TABLE);
};

if (require.main === module) {
  const dropFirst = process.argv.includes("--drop");
  (async () => {
    try {
      if (dropFirst) {
        console.log(`Dropping ${USERS_TABLE} table...`);
        await dropTable();
      }
      console.log(`Creating ${USERS_TABLE} table...`);
      await createTable();
      console.log(`${USERS_TABLE} table ${dropFirst ? "recreated" : "created"}`);
      process.exit(0);
    } catch (error) {
      console.error(`Error with ${USERS_TABLE} table:`, error);
      process.exit(1);
    }
  })();
}
