import DB from "../index.schema";

/**
 * Migration: Add profile fields to users table
 * Adds avatar, job_title, department, and bio columns
 */

export const up = async () => {
    console.log("Adding profile fields to users table...");

    await DB.schema.alterTable("users", (table) => {
        table.text("avatar").nullable();
        table.text("job_title").nullable();
        table.text("department").nullable();
        table.text("bio").nullable();
    });

    console.log("✅ Profile fields added to users table");
};

export const down = async () => {
    console.log("Removing profile fields from users table...");

    await DB.schema.alterTable("users", (table) => {
        table.dropColumn("avatar");
        table.dropColumn("job_title");
        table.dropColumn("department");
        table.dropColumn("bio");
    });

    console.log("✅ Profile fields removed from users table");
};

// Run migration if this file is executed directly
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes("--down")) {
        down()
            .then(() => {
                console.log("Migration rollback completed");
                process.exit(0);
            })
            .catch((error) => {
                console.error("Migration rollback failed:", error);
                process.exit(1);
            });
    } else {
        up()
            .then(() => {
                console.log("Migration completed");
                process.exit(0);
            })
            .catch((error) => {
                console.error("Migration failed:", error);
                process.exit(1);
            });
    }
}
