import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface AuthTokenPayload extends JwtPayload {
    id: number;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user: AuthTokenPayload;
}
