import { DataTypes, ModelStatic } from "sequelize";
import sequelize from "../config/db";
import { timestampFields, timestampOptions } from "./timestamps";
import { UserInstance } from "../types/models";

const User = sequelize.define("User", {
    email: {
        type: DataTypes.STRING,
        unique: true
    },
    password: {
        type: DataTypes.STRING
    },
    name: {
        type: DataTypes.STRING
    },
    ...timestampFields
}, timestampOptions) as ModelStatic<UserInstance>;

export default User;
