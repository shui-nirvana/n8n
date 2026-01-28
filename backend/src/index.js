import "dotenv/config";
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { router as apiRouter } from "./routes/api.js";
import { router as authRouter } from "./routes/authRoutes.js";

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(pinoHttp({ logger }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api", authMiddleware, apiRouter);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  logger.info({ port }, "Backend API listening");
});
