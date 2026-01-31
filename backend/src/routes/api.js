import express from "express";
import {
  triggerWebhook,
  listExecutions,
  getExecution,
} from "../services/n8nClient.js";
import { Pool } from "pg";

export const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

router.post("/workflows/:id/trigger", async (req, res) => {
  try {
    const result = await triggerWebhook(req.params.id, req.body || {});
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ error: "trigger_failed", message: e.message });
  }
});

router.get("/executions", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM automation_logs ORDER BY created_at DESC LIMIT 50"
    );
    // Wrap in { data: ... } to match frontend expectation
    res.json({ data: rows });
  } catch (e) {
    res.json({ data: [] });
  }
});

router.get("/executions/:id", async (req, res) => {
  try {
    const result = await getExecution(req.params.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "get_failed", message: e.message });
  }
});

router.get("/metrics", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int AS total_logs,
        COUNT(*) FILTER (WHERE status = 'success')::int AS success,
        COUNT(*) FILTER (WHERE status = 'error')::int AS error,
        COALESCE(AVG(duration_ms),0)::float AS avg_duration_ms
      FROM automation_logs
    `);
    res.json(rows[0] || {});
  } catch (e) {
    res.json({ total_logs: 0, success: 0, error: 0, avg_duration_ms: 0 });
  }
});

router.post("/logs", async (req, res) => {
  const { workflow_id, execution_id, status, duration_ms, message } =
    req.body || {};
  try {
    await pool.query(
      `INSERT INTO automation_logs (workflow_id, execution_id, status, duration_ms, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [workflow_id, execution_id, status, duration_ms, message],
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "log_failed", message: e.message });
  }
});
