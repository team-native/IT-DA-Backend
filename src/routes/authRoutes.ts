import { Router } from "express";
import {
    register,
    login,
    sendCode,
    verifyCode,
    deleteUser
} from "../controllers/authController";
import authMiddleware from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/send-code", sendCode);
router.post("/verify-code", verifyCode);

router.delete("/me", authMiddleware, deleteUser);

export default router;
