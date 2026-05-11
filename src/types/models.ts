import { Model, Optional } from "sequelize";

export interface TimestampAttributes {
    createdAt: number;
    updatedAt: number;
}

export interface UserAttributes extends TimestampAttributes {
    id: number;
    email: string;
    password: string;
    name: string;
}

export type UserCreationAttributes = Optional<UserAttributes, "id" | "createdAt" | "updatedAt">;

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {}

export interface EmailCodeAttributes extends TimestampAttributes {
    id: number;
    email: string;
    code: string;
}

export type EmailCodeCreationAttributes = Optional<EmailCodeAttributes, "id" | "createdAt" | "updatedAt">;

export interface EmailCodeInstance extends Model<EmailCodeAttributes, EmailCodeCreationAttributes>, EmailCodeAttributes {}

export interface PostAttributes extends TimestampAttributes {
    id: number;
    author: string;
    editPassword: string;
    title: string;
    content: string;
}

export type PostCreationAttributes = Optional<PostAttributes, "id" | "createdAt" | "updatedAt">;

export interface PostInstance extends Model<PostAttributes, PostCreationAttributes>, PostAttributes {}

export interface ProfileAttributes extends TimestampAttributes {
    id: number;
    userId: number;
    nickname: string;
    major: string;
    age: number | null;
    generation: string | null;
    githubId: string | null;
    instagramId: string | null;
    discordId: string | null;
    projects: string;
    introduction: string | null;
    isPrivate: boolean;
    privateFields: string;
}

export type ProfileCreationAttributes = Optional<
    ProfileAttributes,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "age"
    | "generation"
    | "githubId"
    | "instagramId"
    | "discordId"
    | "projects"
    | "introduction"
    | "isPrivate"
    | "privateFields"
>;

export interface ProfileInstance extends Model<ProfileAttributes, ProfileCreationAttributes>, ProfileAttributes {}

export interface ProjectAttributes extends TimestampAttributes {
    id: number;
    ownerId: number;
    name: string;
    description: string | null;
    communicationLink: string | null;
    status: string;
}

export type ProjectCreationAttributes = Optional<
    ProjectAttributes,
    "id" | "createdAt" | "updatedAt" | "description" | "communicationLink" | "status"
>;

export interface ProjectInstance extends Model<ProjectAttributes, ProjectCreationAttributes>, ProjectAttributes {}

export interface ProjectProfileAttributes extends TimestampAttributes {
    id: number;
    projectId: number;
    requiredRoles: string;
    wantedPersonality: string | null;
    teamMood: string | null;
    teamFeature: string | null;
    roleDescription: string | null;
}

export type ProjectProfileCreationAttributes = Optional<
    ProjectProfileAttributes,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "requiredRoles"
    | "wantedPersonality"
    | "teamMood"
    | "teamFeature"
    | "roleDescription"
>;

export interface ProjectProfileInstance
    extends Model<ProjectProfileAttributes, ProjectProfileCreationAttributes>,
        ProjectProfileAttributes {}

export interface ProjectMemberAttributes extends TimestampAttributes {
    id: number;
    projectId: number;
    userId: number | null;
    name: string;
    role: string;
    memo: string | null;
}

export type ProjectMemberCreationAttributes = Optional<
    ProjectMemberAttributes,
    "id" | "createdAt" | "updatedAt" | "userId" | "memo"
>;

export interface ProjectMemberInstance
    extends Model<ProjectMemberAttributes, ProjectMemberCreationAttributes>,
        ProjectMemberAttributes {}

export interface FeedbackAttributes extends TimestampAttributes {
    id: number;
    projectId: number;
    userId: number | null;
    author: string;
    content: string;
}

export type FeedbackCreationAttributes = Optional<
    FeedbackAttributes,
    "id" | "createdAt" | "updatedAt" | "userId"
>;

export interface FeedbackInstance extends Model<FeedbackAttributes, FeedbackCreationAttributes>, FeedbackAttributes {}

export interface ScheduleAttributes extends TimestampAttributes {
    id: number;
    projectId: number;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string | null;
    status: string;
}

export type ScheduleCreationAttributes = Optional<
    ScheduleAttributes,
    "id" | "createdAt" | "updatedAt" | "description" | "endDate" | "status"
>;

export interface ScheduleInstance extends Model<ScheduleAttributes, ScheduleCreationAttributes>, ScheduleAttributes {}

export interface SerializedProfile extends Omit<ProfileAttributes, "projects" | "privateFields"> {
    projects: string[];
    privateFields: string[];
}

export interface SerializedProjectProfile extends Omit<ProjectProfileAttributes, "requiredRoles"> {
    requiredRoles: string[];
}
