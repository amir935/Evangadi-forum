import express from "express";
import { db } from "./db/config.js";
import { mainRouter } from "./src/api/routes.js";
import { errorHandler } from "./src/middleware/error-handler.js";
import cors from "cors";
import ensureSchema from "./db/migrate.js";

const app = express();
const port = process.env.PORT || 3777;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api", mainRouter);

app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connection = await db.getConnection();
    const [rows] = await db.query("SELECT DATABASE() AS databaseName");
    console.log("Backend connected to:", rows[0].databaseName);

    await ensureSchema();

    console.log("Database connection established successfully.");
    connection.release();
  } catch (error) {
    console.warn(
      "MySQL database not reachable (" + error.message + "). Starting backend in in-memory dev mode."
    );
  }

  app.listen(port, (err) => {
    if (err) {
      console.error("Failed to start the server:", err.message);
      process.exit(1);
    }
    console.log(`Server running on port http://localhost:${port}`);
  });
};

startServer();
