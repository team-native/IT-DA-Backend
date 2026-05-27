import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import EmailCode from "../models/EmailCode";
import User from "../models/User";
import { AuthTokenPayload } from "../types/auth";
import { UserAttributes, UserInstance } from "../types/models";

const createToken = (user: UserAttributes): string => {
    const payload: AuthTokenPayload = { id: user.id, email: user.email };
    return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "1h" });
};

const toSafeUser = (user: UserInstance): Omit<UserAttributes, "password"> => {
    const data = user.toJSON();
    const { password: _password, ...safeUser } = data;
    return safeUser;
};

const sendServerError = (res: Response): void => {
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
};

const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body as { email?: string };

        if (!email) {
            res.status(400).json({ error: "이메일을 입력해주세요." });
            return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await EmailCode.destroy({ where: { email } });
        await EmailCode.create({ email, code });

        await mailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "이메일 인증 코드",
            text: `인증 코드: ${code}`
        });

        res.json({ message: "인증 코드가 전송되었습니다." });
    } catch {
        sendServerError(res);
    }
};

const verifyCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code } = req.body as { email?: string; code?: string };

        if (!email || !code) {
            res.status(400).json({ error: "이메일과 인증 코드를 입력해주세요." });
            return;
        }

        const record = await EmailCode.findOne({
            where: { email, code }
        });

        if (!record) {
            res.status(400).json({ error: "인증 코드가 일치하지 않습니다." });
            return;
        }

        res.json({ message: "이메일 인증이 완료되었습니다." });
    } catch {
        sendServerError(res);
    }
};

const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name, code } = req.body as {
            email?: string;
            password?: string;
            name?: string;
            code?: string;
        };

        if (!email || !password || !name || !code) {
            res.status(400).json({
                error: "이메일, 비밀번호, 이름, 인증 코드를 입력해주세요."
            });
            return;
        }

        const validCode = await EmailCode.findOne({
            where: { email, code }
        });

        if (!validCode) {
            res.status(400).json({ error: "이메일 인증이 필요합니다." });
            return;
        }

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            res.status(409).json({ error: "이미 가입된 이메일입니다." });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            name
        });

        await EmailCode.destroy({ where: { email } });

        res.status(201).json({
            message: "회원가입이 완료되었습니다.",
            user: toSafeUser(user)
        });
    } catch {
        sendServerError(res);
    }
};

const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as { email?: string; password?: string };

        if (!email || !password) {
            res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요." });
            return;
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            res.status(401).json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            res.status(401).json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." });
            return;
        }

        res.json({
            message: "로그인되었습니다.",
            token: createToken(user),
            user: toSafeUser(user)
        });
    } catch {
        sendServerError(res);
    }
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        await User.destroy({
            where: { id: req.user!.id }
        });

        res.json({ message: "사용자 삭제가 완료되었습니다." });
    } catch {
        sendServerError(res);
    }
};

export { register, login, sendCode, verifyCode, deleteUser };
