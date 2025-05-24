import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware";
import {
  addApplication,
  listApplications,
  subscribe,
  unsubscribe,
  getStatusHistory,
} from "../controllers/applicationController";

const router = express.Router();

router.post("/", authenticateJWT, addApplication);
router.get("/", listApplications);
router.post("/:appId/subscribe", authenticateJWT, subscribe);
router.post("/:appId/unsubscribe", authenticateJWT, unsubscribe);
router.get("/:appId/status-history", getStatusHistory);

export default router;
