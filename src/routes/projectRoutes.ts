import { Router } from "express";
import authMiddleware from "../middleware/auth";
import {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectProfile,
    upsertProjectProfile,
    deleteProjectProfile,
    getMembers,
    getMember,
    checkMyMembership,
    addMember,
    updateMember,
    deleteMember,
    addFeedback,
    addSchedule,
    updateSchedule,
    deleteSchedule
} from "../controllers/projectController";

const router = Router();

router.get("/", getProjects);
router.get("/:projectId", getProject);
router.post("/", authMiddleware, createProject);
router.patch("/:projectId", authMiddleware, updateProject);
router.delete("/:projectId", authMiddleware, deleteProject);

router.get("/:projectId/profile", getProjectProfile);
router.put("/:projectId/profile", authMiddleware, upsertProjectProfile);
router.delete("/:projectId/profile", authMiddleware, deleteProjectProfile);

router.get("/:projectId/members", getMembers);
router.get("/:projectId/members/me", authMiddleware, checkMyMembership);
router.get("/:projectId/members/:memberId", getMember);
router.post("/:projectId/members", authMiddleware, addMember);
router.patch("/:projectId/members/:memberId", authMiddleware, updateMember);
router.delete("/:projectId/members/:memberId", authMiddleware, deleteMember);

router.post("/:projectId/feedbacks", authMiddleware, addFeedback);

router.post("/:projectId/schedules", authMiddleware, addSchedule);
router.patch("/:projectId/schedules/:scheduleId", authMiddleware, updateSchedule);
router.delete("/:projectId/schedules/:scheduleId", authMiddleware, deleteSchedule);

export default router;
