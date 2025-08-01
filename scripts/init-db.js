import { neon } from "@neondatabase/serverless"
import "dotenv/config" // Load environment variables from .env file

const sql = neon(process.env.DATABASE_URL)

async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        global_name TEXT,
        warnings INTEGER DEFAULT 0,
        is_criminal BOOLEAN DEFAULT FALSE,
        last_warning_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS guild_members (
        user_id TEXT REFERENCES users(id),
        guild_id TEXT NOT NULL,
        warnings_in_guild INTEGER DEFAULT 0,
        is_banned_in_guild BOOLEAN DEFAULT FALSE,
        last_action_at TIMESTAMP,
        PRIMARY KEY (user_id, guild_id)
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS raid_detection_logs (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        join_timestamp TIMESTAMP DEFAULT NOW()
      );
    `

    console.log("Database tables created or already exist.")
  } catch (error) {
    console.error("Error initializing database:", error)
  } finally {
    // In a serverless environment, the connection might close automatically.
    // For a script, you might want to explicitly end it if using a persistent client.
    // For neon-serverless, it manages connections per query.
  }
}

initializeDatabase()
