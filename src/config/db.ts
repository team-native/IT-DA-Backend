import { Sequelize } from "sequelize";

const sequelize = new Sequelize("itda", "root", process.env.DB_PASSWORD, {
    host: "localhost",
    dialect: "mysql",
    logging: false
});

export default sequelize;
