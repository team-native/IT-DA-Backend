import { Request, Response } from "express";
import { Op } from "sequelize";
import Profile from "../models/Profile";
import Project from "../models/Project";
import ProjectProfile from "../models/ProjectProfile";
import { ProfileAttributes, ProjectProfileAttributes, ProjectProfileInstance, SerializedProjectProfile } from "../types/models";

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

const tokenize = (text: unknown): string[] => {
    return String(text || "")
        .toLowerCase()
        .split(/[^a-z0-9가-힣+#.]+/g)
        .filter((word) => word.length >= 2);
};

const serializeProjectProfile = (profile: ProjectProfileInstance | null): SerializedProjectProfile | null => {
    if (!profile) return null;

    const data = profile.toJSON() as ProjectProfileAttributes;
    return {
        ...data,
        requiredRoles: parseJsonArray(data.requiredRoles)
    };
};

const buildProjectProfileMap = (
    profiles: ProjectProfileInstance[]
): Map<number, SerializedProjectProfile> => {
    return new Map(
        profiles.map((profile) => {
            const serialized = serializeProjectProfile(profile);
            return [profile.projectId, serialized!] as const;
        })
    );
};

const getRecommendations = async (req: Request, res: Response): Promise<void> => {
    const profile = await Profile.findOne({
        where: { userId: req.user!.id }
    });

    if (!profile) {
        res.status(404).json({
            error: "프로필을 먼저 작성해주세요."
        });
        return;
    }

    const profileData = profile.toJSON() as ProfileAttributes;
    const personalProjectText = parseJsonArray(profileData.projects).join(" ");
    const profileKeywords = new Set(tokenize([
        profileData.nickname,
        profileData.major,
        profileData.age,
        profileData.generation,
        profileData.githubId,
        profileData.instagramId,
        profileData.discordId,
        personalProjectText,
        profileData.introduction
    ].join(" ")));
    const profileKeywordList = [...profileKeywords];

    const projects = await Project.findAll({
        order: [["createdAt", "DESC"]]
    });
    const projectIds = projects.map((project) => project.id);
    const projectProfiles = projectIds.length
        ? await ProjectProfile.findAll({
            where: {
                projectId: {
                    [Op.in]: projectIds
                }
            }
        })
        : [];
    const projectProfileMap = buildProjectProfileMap(projectProfiles);

    const recommendations = projects.map((project) => {
        const projectProfileData = projectProfileMap.get(project.id) ?? null;

        const projectText = [
            project.name,
            project.description,
            projectProfileData?.requiredRoles?.join(" "),
            projectProfileData?.wantedPersonality,
            projectProfileData?.teamMood,
            projectProfileData?.teamFeature,
            projectProfileData?.roleDescription
        ].join(" ");

        const projectKeywords = new Set(tokenize(projectText));
        const matchedKeywords = profileKeywordList.filter((word) => projectKeywords.has(word));

        return {
            project,
            projectProfile: projectProfileData,
            score: matchedKeywords.length,
            matchedKeywords
        };
    });

    res.json(
        recommendations
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
    );
};

export { getRecommendations };
