import { DataTypes, ModelStatic } from "sequelize";
import sequelize from "../config/db";
import { timestampFields, timestampOptions } from "./timestamps";
import { ProjectProfileInstance } from "../types/models";

const ProjectProfile = sequelize.define("ProjectProfile", {
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    requiredRoles: {
        type: DataTypes.TEXT,
        defaultValue: "[]"
    },
    wantedPersonality: {
        type: DataTypes.STRING
    },
    teamMood: {
        type: DataTypes.STRING
    },
    teamFeature: {
        type: DataTypes.TEXT
    },
    roleDescription: {
        type: DataTypes.TEXT
    },
    ...timestampFields
}, timestampOptions) as ModelStatic<ProjectProfileInstance>;

export default ProjectProfile;
