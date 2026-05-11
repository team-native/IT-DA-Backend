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
    res.status(500).json({ error: "?쒕쾭 ?먮윭媛 諛쒖깮?덉뒿?덈떎." });
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
            res.status(400).json({ error: "?대찓?쇱쓣 ?낅젰?댁＜?몄슂." });
            return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await EmailCode.destroy({ where: { email } });
        await EmailCode.create({ email, code });

        await mailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "?대찓???몄쬆 肄붾뱶",
            text: `?몄쬆 肄붾뱶: ${code}`
        });

        res.json({ message: "?몄쬆 肄붾뱶媛 ?꾩넚?섏뿀?듬땲??" });
    } catch {
        sendServerError(res);
    }
};

const verifyCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code } = req.body as { email?: string; code?: string };

        if (!email || !code) {
            res.status(400).json({ error: "?대찓?쇨낵 ?몄쬆 肄붾뱶瑜??낅젰?댁＜?몄슂." });
            return;
        }

        const record = await EmailCode.findOne({
            where: { email, code }
        });

        if (!record) {
            res.status(400).json({ error: "?몄쬆 肄붾뱶媛 ?쇱튂?섏? ?딆뒿?덈떎." });
            return;
        }

        res.json({ message: "?대찓???몄쬆???꾨즺?섏뿀?듬땲??" });
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
                error: "?대찓?? 鍮꾨?踰덊샇, ?대쫫, ?몄쬆 肄붾뱶瑜?紐⑤몢 ?낅젰?댁＜?몄슂."
            });
            return;
        }

        const validCode = await EmailCode.findOne({
            where: { email, code }
        });

        if (!validCode) {
            res.status(400).json({ error: "?대찓???몄쬆???꾩슂?⑸땲??" });
            return;
        }

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            res.status(409).json({ error: "?대? 媛?낅맂 ?대찓?쇱엯?덈떎." });
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
            message: "?ъ슜??媛?낆씠 ?꾨즺?섏뿀?듬땲??",
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
            res.status(400).json({ error: "?대찓?쇨낵 鍮꾨?踰덊샇瑜??낅젰?댁＜?몄슂." });
            return;
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            res.status(401).json({ error: "?대찓???먮뒗 鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎." });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            res.status(401).json({ error: "?대찓???먮뒗 鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎." });
            return;
        }

        res.json({
            message: "濡쒓렇?몃릺?덉뒿?덈떎.",
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

        res.json({ message: "?ъ슜????젣媛 ?꾨즺?섏뿀?듬땲??" });
    } catch {
        sendServerError(res);
    }
};

export { register, login, sendCode, verifyCode, deleteUser };
