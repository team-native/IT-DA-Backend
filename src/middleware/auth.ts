import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "../types/auth";

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    if (!token) {
        res.status(401).json({ error: "토큰이 필요합니다." });
        return;
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET as string) as AuthTokenPayload;
        next();
    } catch {
        res.status(401).json({ error: "유효하지 않은 토큰입니다." });
    }
};

export default authMiddleware;
