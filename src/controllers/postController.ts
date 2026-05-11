import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { FindOptions } from "sequelize";
import Post from "../models/Post";
import { PostAttributes, PostInstance } from "../types/models";

const postResponseOptions: FindOptions = {
    attributes: { exclude: ["editPassword"] }
};

const sendServerError = (res: Response): void => {
    res.status(500).json({ error: "서버 에러가 발생했습니다." });
};

const serializePost = (post: PostInstance): Omit<PostAttributes, "editPassword"> => {
    const { editPassword: _password, ...postData } = post.toJSON();
    return postData;
};

const getPosts = async (_req: Request, res: Response): Promise<void> => {
    try {
        const posts = await Post.findAll({
            ...postResponseOptions,
            order: [["createdAt", "DESC"]]
        });

        res.json(posts);
    } catch {
        sendServerError(res);
    }
};

const getPost = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const post = await Post.findByPk(req.params.id, postResponseOptions);

        if (!post) {
            res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
            return;
        }

        res.json(post);
    } catch {
        sendServerError(res);
    }
};

const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { author, editPassword, title, content } = req.body as {
            author?: string;
            editPassword?: string;
            title?: string;
            content?: string;
        };

        if (!author || !editPassword || !title || !content) {
            res.status(400).json({
                error: "작성자, 비밀번호, 제목, 내용을 모두 입력해주세요."
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(editPassword, 10);

        const post = await Post.create({
            author,
            editPassword: hashedPassword,
            title,
            content
        });

        res.status(201).json(serializePost(post));
    } catch {
        sendServerError(res);
    }
};

const updatePost = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
            return;
        }

        const { editPassword, author, title, content } = req.body as {
            editPassword?: string;
            author?: string;
            title?: string;
            content?: string;
        };

        if (!editPassword) {
            res.status(400).json({ error: "비밀번호를 입력해주세요." });
            return;
        }

        const isPasswordValid = await bcrypt.compare(editPassword, post.editPassword);

        if (!isPasswordValid) {
            res.status(403).json({ error: "비밀번호가 일치하지 않습니다." });
            return;
        }

        await post.update({
            author: author ?? post.author,
            title: title ?? post.title,
            content: content ?? post.content
        });

        res.json(serializePost(post));
    } catch {
        sendServerError(res);
    }
};

const deletePost = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
            return;
        }

        const { editPassword } = req.body as { editPassword?: string };

        if (!editPassword) {
            res.status(400).json({ error: "비밀번호를 입력해주세요." });
            return;
        }

        const isPasswordValid = await bcrypt.compare(editPassword, post.editPassword);

        if (!isPasswordValid) {
            res.status(403).json({ error: "비밀번호가 일치하지 않습니다." });
            return;
        }

        await post.destroy();

        res.json({ message: "게시물이 삭제되었습니다." });
    } catch {
        sendServerError(res);
    }
};

export { getPosts, getPost, createPost, updatePost, deletePost };
