import { Request, Response } from "express";
import Project from "../models/Project";
import ProjectProfile from "../models/ProjectProfile";
import ProjectMember from "../models/ProjectMember";
import Feedback from "../models/Feedback";
import Schedule from "../models/Schedule";
import { ProjectInstance, ProjectProfileAttributes, ProjectProfileInstance, SerializedProjectProfile } from "../types/models";

const MESSAGE = {
    projectNotFound: "프로젝트를 찾을 수 없습니다.",
    projectNameRequired: "프로젝트 이름을 입력해주세요.",
    onlyOwnerUpdate: "프로젝트 생성자만 수정할 수 있습니다.",
    onlyOwnerDelete: "프로젝트 생성자만 삭제할 수 있습니다.",
    onlyOwnerProfile: "프로젝트 생성자만 프로젝트 프로필을 수정할 수 있습니다.",
    projectDeleted: "프로젝트가 삭제되었습니다.",
    projectProfileDeleted: "프로젝트 프로필이 삭제되었습니다.",
    projectProfileNotFound: "프로젝트 프로필을 찾을 수 없습니다.",
    onlyOwnerRole: "프로젝트 생성자만 역할을 관리할 수 있습니다.",
    nameRoleRequired: "이름과 역할을 입력해주세요.",
    memberNotFound: "팀원을 찾을 수 없습니다.",
    memberDeleted: "팀원이 삭제되었습니다.",
    onlyMemberFeedback: "프로젝트 참가자만 피드백을 작성할 수 있습니다.",
    authorContentRequired: "작성자와 내용을 입력해주세요.",
    onlyOwnerSchedule: "프로젝트 생성자만 일정을 관리할 수 있습니다.",
    scheduleRequired: "일정 제목과 시작일을 입력해주세요.",
    scheduleNotFound: "일정을 찾을 수 없습니다.",
    scheduleDeleted: "일정이 삭제되었습니다."
};

const findProject = async (id: string): Promise<ProjectInstance | null> => Project.findByPk(id);
const isOwner = (project: ProjectInstance, userId: number): boolean => project.ownerId === userId;

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

const serializeProjectProfile = (profile: ProjectProfileInstance | null): SerializedProjectProfile | null => {
    if (!profile) return null;

    const data = profile.toJSON() as ProjectProfileAttributes;
    return {
        ...data,
        requiredRoles: parseJsonArray(data.requiredRoles)
    };
};

const isProjectMember = async (projectId: number, userId: number): Promise<boolean> => {
    const member = await ProjectMember.findOne({
        where: { projectId, userId }
    });

    return Boolean(member);
};

const getProjects = async (_req: Request, res: Response): Promise<void> => {
    const projects = await Project.findAll({
        order: [["createdAt", "DESC"]]
    });

    res.json(projects);
};

const getProject = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    const [projectProfile, members, feedbacks, schedules] = await Promise.all([
        ProjectProfile.findOne({ where: { projectId: project.id } }),
        ProjectMember.findAll({ where: { projectId: project.id } }),
        Feedback.findAll({ where: { projectId: project.id }, order: [["createdAt", "DESC"]] }),
        Schedule.findAll({ where: { projectId: project.id }, order: [["startDate", "ASC"]] })
    ]);

    res.json({
        ...project.toJSON(),
        projectProfile: serializeProjectProfile(projectProfile),
        members,
        feedbacks,
        schedules
    });
};

const createProject = async (req: Request, res: Response): Promise<void> => {
    const { name, description, communicationLink } = req.body as {
        name?: string;
        description?: string;
        communicationLink?: string;
    };

    if (!name) {
        res.status(400).json({ error: MESSAGE.projectNameRequired });
        return;
    }

    const project = await Project.create({
        ownerId: req.user!.id,
        name,
        description: description ?? null,
        communicationLink: communicationLink ?? null
    });

    res.status(201).json(project);
};

const updateProject = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerUpdate });
        return;
    }

    const { name, description, communicationLink, status } = req.body as {
        name?: string;
        description?: string;
        communicationLink?: string;
        status?: string;
    };

    await project.update({
        name: name ?? project.name,
        description: description ?? project.description,
        communicationLink: communicationLink ?? project.communicationLink,
        status: status ?? project.status
    });

    res.json(project);
};

const deleteProject = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerDelete });
        return;
    }

    await Promise.all([
        ProjectProfile.destroy({ where: { projectId: project.id } }),
        ProjectMember.destroy({ where: { projectId: project.id } }),
        Feedback.destroy({ where: { projectId: project.id } }),
        Schedule.destroy({ where: { projectId: project.id } })
    ]);
    await project.destroy();

    res.json({ message: MESSAGE.projectDeleted });
};

const getProjectProfile = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    const projectProfile = await ProjectProfile.findOne({
        where: { projectId: project.id }
    });

    if (!projectProfile) {
        res.status(404).json({ error: MESSAGE.projectProfileNotFound });
        return;
    }

    res.json(serializeProjectProfile(projectProfile));
};

const upsertProjectProfile = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerProfile });
        return;
    }

    const {
        requiredRoles,
        wantedPersonality,
        teamMood,
        teamFeature,
        roleDescription
    } = req.body as Record<string, unknown>;

    const payload = {
        projectId: project.id,
        requiredRoles: JSON.stringify(parseJsonArray(requiredRoles)),
        wantedPersonality: wantedPersonality ? String(wantedPersonality) : null,
        teamMood: teamMood ? String(teamMood) : null,
        teamFeature: teamFeature ? String(teamFeature) : null,
        roleDescription: roleDescription ? String(roleDescription) : null
    };

    const existingProfile = await ProjectProfile.findOne({ where: { projectId: project.id } });
    const savedProfile = existingProfile
        ? await existingProfile.update(payload)
        : await ProjectProfile.create(payload);

    res.status(existingProfile ? 200 : 201).json(serializeProjectProfile(savedProfile));
};

const deleteProjectProfile = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerProfile });
        return;
    }

    const deletedCount = await ProjectProfile.destroy({
        where: { projectId: project.id }
    });

    if (!deletedCount) {
        res.status(404).json({ error: MESSAGE.projectProfileNotFound });
        return;
    }

    res.json({ message: MESSAGE.projectProfileDeleted });
};

const getMembers = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    const members = await ProjectMember.findAll({
        where: { projectId: project.id },
        order: [["createdAt", "ASC"]]
    });

    res.json({
        projectId: project.id,
        count: members.length,
        members
    });
};

const getMember = async (req: Request<{ projectId: string; memberId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);
    const member = await ProjectMember.findByPk(req.params.memberId);

    if (!project || !member || member.projectId !== project.id) {
        res.status(404).json({ error: MESSAGE.memberNotFound });
        return;
    }

    res.json(member);
};

const checkMyMembership = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    const member = await ProjectMember.findOne({
        where: {
            projectId: project.id,
            userId: req.user!.id
        }
    });

    const owner = isOwner(project, req.user!.id);

    res.json({
        projectId: project.id,
        userId: req.user!.id,
        isOwner: owner,
        isMember: Boolean(member),
        canWriteFeedback: owner || Boolean(member),
        member
    });
};

const addMember = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerRole });
        return;
    }

    const { userId, name, role, memo } = req.body as {
        userId?: number;
        name?: string;
        role?: string;
        memo?: string;
    };

    if (!name || !role) {
        res.status(400).json({ error: MESSAGE.nameRoleRequired });
        return;
    }

    const member = await ProjectMember.create({
        projectId: project.id,
        userId: userId ?? null,
        name,
        role,
        memo: memo ?? null
    });

    res.status(201).json(member);
};

const updateMember = async (req: Request<{ projectId: string; memberId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);
    const member = await ProjectMember.findByPk(req.params.memberId);

    if (!project || !member || member.projectId !== project.id) {
        res.status(404).json({ error: MESSAGE.memberNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerRole });
        return;
    }

    const { userId, name, role, memo } = req.body as {
        userId?: number;
        name?: string;
        role?: string;
        memo?: string;
    };

    await member.update({
        userId: userId ?? member.userId,
        name: name ?? member.name,
        role: role ?? member.role,
        memo: memo ?? member.memo
    });

    res.json(member);
};

const deleteMember = async (req: Request<{ projectId: string; memberId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);
    const member = await ProjectMember.findByPk(req.params.memberId);

    if (!project || !member || member.projectId !== project.id) {
        res.status(404).json({ error: MESSAGE.memberNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerRole });
        return;
    }

    await member.destroy();

    res.json({ message: MESSAGE.memberDeleted });
};

const addFeedback = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    const canWriteFeedback = isOwner(project, req.user!.id)
        || await isProjectMember(project.id, req.user!.id);

    if (!canWriteFeedback) {
        res.status(403).json({ error: MESSAGE.onlyMemberFeedback });
        return;
    }

    const { author, content } = req.body as { author?: string; content?: string };

    if (!author || !content) {
        res.status(400).json({ error: MESSAGE.authorContentRequired });
        return;
    }

    const feedback = await Feedback.create({
        projectId: project.id,
        userId: req.user!.id,
        author,
        content
    });

    res.status(201).json(feedback);
};

const addSchedule = async (req: Request<{ projectId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);

    if (!project) {
        res.status(404).json({ error: MESSAGE.projectNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerSchedule });
        return;
    }

    const { title, description, startDate, endDate, status } = req.body as {
        title?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    };

    if (!title || !startDate) {
        res.status(400).json({ error: MESSAGE.scheduleRequired });
        return;
    }

    const schedule = await Schedule.create({
        projectId: project.id,
        title,
        description: description ?? null,
        startDate,
        endDate: endDate ?? null,
        status: status ?? "todo"
    });

    res.status(201).json(schedule);
};

const updateSchedule = async (req: Request<{ projectId: string; scheduleId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);
    const schedule = await Schedule.findByPk(req.params.scheduleId);

    if (!project || !schedule || schedule.projectId !== project.id) {
        res.status(404).json({ error: MESSAGE.scheduleNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerSchedule });
        return;
    }

    const { title, description, startDate, endDate, status } = req.body as {
        title?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    };

    await schedule.update({
        title: title ?? schedule.title,
        description: description ?? schedule.description,
        startDate: startDate ?? schedule.startDate,
        endDate: endDate ?? schedule.endDate,
        status: status ?? schedule.status
    });

    res.json(schedule);
};

const deleteSchedule = async (req: Request<{ projectId: string; scheduleId: string }>, res: Response): Promise<void> => {
    const project = await findProject(req.params.projectId);
    const schedule = await Schedule.findByPk(req.params.scheduleId);

    if (!project || !schedule || schedule.projectId !== project.id) {
        res.status(404).json({ error: MESSAGE.scheduleNotFound });
        return;
    }

    if (!isOwner(project, req.user!.id)) {
        res.status(403).json({ error: MESSAGE.onlyOwnerSchedule });
        return;
    }

    await schedule.destroy();

    res.json({ message: MESSAGE.scheduleDeleted });
};

export {
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
};
