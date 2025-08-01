import { neon } from "@neondatabase/serverless"

// Ensure DATABASE_URL is available in the environment
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set.")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

export { sql }
