import { DataTypes, ModelStatic } from "sequelize";
import sequelize from "../config/db";
import { timestampFields, timestampOptions } from "./timestamps";
import { EmailCodeInstance } from "../types/models";

const EmailCode = sequelize.define("EmailCode", {
    email: DataTypes.STRING,
    code: DataTypes.STRING,
    ...timestampFields
}, timestampOptions) as ModelStatic<EmailCodeInstance>;

export default EmailCode;
