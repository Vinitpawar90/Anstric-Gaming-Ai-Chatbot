import dotenv from "dotenv";
dotenv.config({ quiet: true });

import knex from "knex";
import path from "path";
import fs from "fs";

// Resolve SQLite DB file path
const dbPath = path.resolve(
  process.env.DB_PATH || path.join(__dirname, "../data/local.db")
);

// Ensure the data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const DB = knex({
  client: "better-sqlite3",
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true, // Required for SQLite
});

export default DB;

// No-op: SQLite doesn't support stored procedures/triggers
export const createProcedure = async () => {
  // Triggers are not used with SQLite — timestamps are managed at the application layer
};
