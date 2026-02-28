import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("No DATABASE_URL");
    return;
  }
  try {
    const connection = await mysql.createConnection(url);
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables:", tables);

    const [tasksCols] = await connection.query("DESCRIBE tasks");
    console.log("Tasks columns:", tasksCols);

    const [agentsCols] = await connection.query("DESCRIBE agents");
    console.log("Agents columns:", agentsCols);

    const [sprintsCols] = await connection.query("DESCRIBE sprints");
    console.log("Sprints columns:", sprintsCols);

    await connection.end();
  } catch (e) {
    console.error("Error connecting to DB:", e);
  }
}

main();
