import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

export async function testDatabaseConnection(): Promise<void> {
  await pool.query("SELECT 1");
}
