import { Router } from "express";
import { getStats, getFunnel, getHeatmap, getRiskTrends, getDashboardSummary } from "./controller.js";

const router = Router();

// /api/v1/admin/observability/*
router.get("/summary", getDashboardSummary);
router.get("/stats", getStats);
router.get("/funnel", getFunnel);
router.get("/heatmap", getHeatmap);
router.get("/risk-trends", getRiskTrends);

export default router;
