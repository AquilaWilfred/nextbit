/// <reference types="node" />
import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("🔴 DATABASE_URL is not set in .env file.");
    process.exit(1);
  }

  let sql: ReturnType<typeof postgres> | undefined;
  try {
    console.log("🗄️  Connecting to database...");
    
    // Ensure migrations always use the direct connection, not the pooler
    const directUrl = connectionString.replace("-pooler", "");
    
    sql = postgres(directUrl, {
      ssl: 'require',
      connect_timeout: 30,
      max: 1,
    });
    const db = drizzle(sql);
    console.log("🚀 Starting database migration...");

    await migrate(db, { migrationsFolder: "./drizzle", migrationsTable: "__drizzle_migrations__" });
    
    console.log("✅ Migrations applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    if (sql) await sql.end();
    process.exit(0);
  }
}

runMigrations();