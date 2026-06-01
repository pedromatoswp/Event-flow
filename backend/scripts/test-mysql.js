require("dotenv").config();
const mysql = require("mysql2/promise");

async function main() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  console.log("Testing MySQL with:", {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
  });

  try {
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    });

    const [ping] = await conn.query("SELECT 1 AS ok");
    const [tables] = await conn.query("SHOW TABLES");
    console.log("✅ Connected to database:", config.database);
    console.log("   Ping:", ping[0]);
    console.log("   Tables count:", tables.length);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    if (err.code) console.error("   Code:", err.code);

    try {
      const conn = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
      });
      const [dbs] = await conn.query("SHOW DATABASES");
      const eventDbs = dbs
        .map((r) => r.Database)
        .filter((n) => String(n).toLowerCase().includes("event"));
      console.log("\nAvailable Event* databases on server:", eventDbs);
      await conn.end();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}

main();
