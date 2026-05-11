import { Request, Response } from "express";
import Profile from "../models/Profile";
import { ProfileAttributes, ProfileInstance, SerializedProfile } from "../types/models";

const ALLOWED_PRIVATE_FIELDS = [
    "age",
    "generation",
    "githubId",
    "instagramId",
    "discordId",
    "projects",
    "introduction"
] as const;

type AllowedPrivateField = typeof ALLOWED_PRIVATE_FIELDS[number];

const parseJsonArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String);
    if (!value) return [];

    try {
        const parsed = JSON.parse(String(value));
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
};

const parseBoolean = (value: unknown): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return Boolean(value);
};

const normalizePrivateFields = (privateFields: unknown): AllowedPrivateField[] => {
    return parseJsonArray(privateFields).filter((field): field is AllowedPrivateField => {
        return ALLOWED_PRIVATE_FIELDS.includes(field as AllowedPrivateField);
    });
};

const serializeProfile = (profile: ProfileInstance): SerializedProfile => {
    const data = profile.toJSON() as ProfileAttributes;
    return {
        ...data,
        projects: parseJsonArray(data.projects),
        privateFields: normalizePrivateFields(data.privateFields)
    };
};

const toPublicProfile = (profile: ProfileInstance): Partial<SerializedProfile> => {
    const data: Partial<SerializedProfile> = { ...serializeProfile(profile) };
    const privateFields = data.privateFields ?? [];

    for (const field of privateFields) {
        delete data[field as keyof SerializedProfile];
    }

    return data;
};

const getProfiles = async (_req: Request, res: Response): Promise<void> => {
    const profiles = await Profile.findAll({
        where: { isPrivate: false },
        order: [["createdAt", "DESC"]]
    });

    res.json(profiles.map(toPublicProfile));
};

const getProfile = async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
    const profile = await Profile.findOne({
        where: { userId: req.params.userId }
    });

    if (!profile) {
        res.status(404).json({ error: "프로필을 찾을 수 없습니다." });
        return;
    }

    if (profile.isPrivate) {
        res.status(403).json({ error: "비공개 프로필입니다." });
        return;
    }

    res.json(toPublicProfile(profile));
};

const getMyProfile = async (req: Request, res: Response): Promise<void> => {
    const profile = await Profile.findOne({
        where: { userId: req.user!.id }
    });

    if (!profile) {
        res.status(404).json({ error: "프로필을 찾을 수 없습니다." });
        return;
    }

    res.json(serializeProfile(profile));
};

const upsertMyProfile = async (req: Request, res: Response): Promise<void> => {
    const {
        nickname,
        major,
        age,
        generation,
        githubId,
        instagramId,
        discordId,
        projects,
        project,
        introduction,
        instroduction,
        isPrivate,
        privateFields
    } = req.body as Record<string, unknown>;

    if (!nickname || !major) {
        res.status(400).json({
            error: "닉네임과 전공을 입력해주세요."
        });
        return;
    }

    const profileProjects = projects ?? project;
    const profileIntroduction = introduction ?? instroduction;

    const payload = {
        userId: req.user!.id,
        nickname: String(nickname),
        major: String(major),
        age: age ? Number(age) : null,
        generation: generation ? String(generation) : null,
        githubId: githubId ? String(githubId) : null,
        instagramId: instagramId ? String(instagramId) : null,
        discordId: discordId ? String(discordId) : null,
        projects: JSON.stringify(parseJsonArray(profileProjects)),
        introduction: profileIntroduction ? String(profileIntroduction) : null,
        isPrivate: parseBoolean(isPrivate),
        privateFields: JSON.stringify(normalizePrivateFields(privateFields))
    };

    const existingProfile = await Profile.findOne({ where: { userId: req.user!.id } });
    const savedProfile = existingProfile
        ? await existingProfile.update(payload)
        : await Profile.create(payload);

    res.status(existingProfile ? 200 : 201).json(serializeProfile(savedProfile));
};

const deleteMyProfile = async (req: Request, res: Response): Promise<void> => {
    const deletedCount = await Profile.destroy({
        where: { userId: req.user!.id }
    });

    if (!deletedCount) {
        res.status(404).json({ error: "프로필을 찾을 수 없습니다." });
        return;
    }

    res.json({ message: "프로필이 삭제되었습니다." });
};

export { getProfiles, getProfile, getMyProfile, upsertMyProfile, deleteMyProfile };
