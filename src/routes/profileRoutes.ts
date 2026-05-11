import { Router } from "express";
import authMiddleware from "../middleware/auth";
import {
    getProfiles,
    getProfile,
    getMyProfile,
    upsertMyProfile,
    deleteMyProfile
} from "../controllers/profileController";

const router = Router();

router.get("/", getProfiles);
router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, upsertMyProfile);
router.delete("/me", authMiddleware, deleteMyProfile);
router.get("/:userId", getProfile);

export default router;
