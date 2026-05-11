import { DataTypes, ModelStatic } from "sequelize";
import sequelize from "../config/db";
import { timestampFields, timestampOptions } from "./timestamps";
import { ProjectMemberInstance } from "../types/models";

const ProjectMember = sequelize.define("ProjectMember", {
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    memo: {
        type: DataTypes.TEXT
    },
    ...timestampFields
}, timestampOptions) as ModelStatic<ProjectMemberInstance>;

export default ProjectMember;
