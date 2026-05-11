import { Router } from "express";
import authMiddleware from "../middleware/auth";
import { getRecommendations } from "../controllers/matchController";

const router = Router();

router.get("/recommendations", authMiddleware, getRecommendations);

export default router;
