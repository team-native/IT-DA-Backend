import { DataTypes, ModelStatic } from "sequelize";
import sequelize from "../config/db";
import { timestampFields, timestampOptions } from "./timestamps";
import { ProjectInstance } from "../types/models";

const Project = sequelize.define("Project", {
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    communicationLink: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "active"
    },
    ...timestampFields
}, timestampOptions) as ModelStatic<ProjectInstance>;

export default Project;
