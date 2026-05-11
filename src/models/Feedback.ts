import { DataTypes, ModelStatic } from "sequelize";
import sequelize from "../config/db";
import { timestampFields, timestampOptions } from "./timestamps";
import { FeedbackInstance } from "../types/models";

const Feedback = sequelize.define("Feedback", {
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    ...timestampFields
}, timestampOptions) as ModelStatic<FeedbackInstance>;

export default Feedback;
