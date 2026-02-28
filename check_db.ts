import "dotenv/config";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("No DATABASE_URL");
    return;
  }
  const pool = new pg.Pool({
    connectionString: url,
  });
  try {
    const client = await pool.connect();
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", tables.rows);

    if (tables.rows.some(r => r.table_name === 'tasks')) {
      const tasksCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks'");
      console.log("Tasks columns:", tasksCols.rows);
    }

    client.release();
    await pool.end();
  } catch (e) {
    console.error("Error connecting to DB:", e);
  }
}

main();
