import { DataTypes, ModelStatic } from "sequelize";
import sequelize from "../config/db";
import { timestampFields, timestampOptions } from "./timestamps";
import { PostInstance } from "../types/models";

const Post = sequelize.define("Post", {
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    editPassword: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    ...timestampFields
}, timestampOptions) as ModelStatic<PostInstance>;

export default Post;
