import { DataTypes, ModelStatic } from "sequelize";
import sequelize from "../config/db";
import { timestampFields, timestampOptions } from "./timestamps";
import { ProfileInstance } from "../types/models";

const Profile = sequelize.define("Profile", {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    nickname: {
        type: DataTypes.STRING
    },
    major: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER
    },
    generation: {
        type: DataTypes.STRING
    },
    githubId: {
        type: DataTypes.STRING
    },
    instagramId: {
        type: DataTypes.STRING
    },
    discordId: {
        type: DataTypes.STRING
    },
    projects: {
        type: DataTypes.TEXT,
        defaultValue: "[]"
    },
    introduction: {
        type: DataTypes.TEXT
    },
    isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    privateFields: {
        type: DataTypes.TEXT,
        defaultValue: "[]"
    },
    ...timestampFields
}, timestampOptions) as ModelStatic<ProfileInstance>;

export default Profile;
