import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { QueryTypes } from "sequelize";
import sequelize from "./config/db";
import postRoutes from "./routes/postRoutes";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import matchRoutes from "./routes/matchRoutes";
import projectRoutes from "./routes/projectRoutes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.use(express.json());

app.use("/posts", postRoutes);
app.use("/auth", authRoutes);
app.use("/profiles", profileRoutes);
app.use("/matches", matchRoutes);
app.use("/projects", projectRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

const TIMESTAMP_TABLES = [
    "Users",
    "EmailCodes",
    "Posts",
    "Profiles",
    "Projects",
    "ProjectProfiles",
    "ProjectMembers",
    "Feedbacks",
    "Schedules"
];

const MIGRATION_COLUMN_NAMES = ["createdAt", "updatedAt", "createdAtUnix", "updatedAtUnix"];
const NUMERIC_COLUMN_TYPES = new Set(["int", "integer", "bigint", "mediumint", "smallint", "tinyint"]);

interface ColumnInfo {
    TABLE_NAME: string;
    COLUMN_NAME: string;
    DATA_TYPE: string;
}

const getTimestampColumnsByTable = async (): Promise<Map<string, Map<string, string>>> => {
    const columns = await sequelize.query<ColumnInfo>(
        `
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME IN (?)
                AND COLUMN_NAME IN (?)
        `,
        {
            replacements: [TIMESTAMP_TABLES, MIGRATION_COLUMN_NAMES],
            type: QueryTypes.SELECT
        }
    );

    return columns.reduce((tableMap, column) => {
        const currentColumns = tableMap.get(column.TABLE_NAME) ?? new Map<string, string>();
        currentColumns.set(column.COLUMN_NAME, column.DATA_TYPE);
        tableMap.set(column.TABLE_NAME, currentColumns);
        return tableMap;
    }, new Map<string, Map<string, string>>());
};

const addColumnIfMissing = async (
    tableName: string,
    columnName: string,
    tableColumns: Map<string, string>
): Promise<void> => {
    if (!tableColumns.has(columnName)) {
        await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` INTEGER NULL`);
        tableColumns.set(columnName, "integer");
    }
};

const migrateTableTimestamps = async (
    tableName: string,
    tableColumns: Map<string, string>
): Promise<void> => {
    const createdAtType = tableColumns.get("createdAt");
    const updatedAtType = tableColumns.get("updatedAt");

    if (!createdAtType || !updatedAtType) return;
    if (NUMERIC_COLUMN_TYPES.has(createdAtType) && NUMERIC_COLUMN_TYPES.has(updatedAtType)) return;

    await addColumnIfMissing(tableName, "createdAtUnix", tableColumns);
    await addColumnIfMissing(tableName, "updatedAtUnix", tableColumns);
    await sequelize.query(
        `UPDATE \`${tableName}\` SET \`createdAtUnix\` = COALESCE(UNIX_TIMESTAMP(\`createdAt\`), FLOOR(UNIX_TIMESTAMP())), \`updatedAtUnix\` = COALESCE(UNIX_TIMESTAMP(\`updatedAt\`), FLOOR(UNIX_TIMESTAMP()))`
    );
    await sequelize.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`createdAt\``);
    await sequelize.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`updatedAt\``);
    await sequelize.query(`ALTER TABLE \`${tableName}\` CHANGE \`createdAtUnix\` \`createdAt\` INTEGER NOT NULL`);
    await sequelize.query(`ALTER TABLE \`${tableName}\` CHANGE \`updatedAtUnix\` \`updatedAt\` INTEGER NOT NULL`);
};

const migrateUnixTimestamps = async (): Promise<void> => {
    const timestampColumnsByTable = await getTimestampColumnsByTable();

    for (const tableName of TIMESTAMP_TABLES) {
        await migrateTableTimestamps(tableName, timestampColumnsByTable.get(tableName) ?? new Map());
    }
};

const startServer = async (): Promise<void> => {
    await migrateUnixTimestamps();
    await sequelize.sync({ alter: true });
    console.log("MySQL Connected and models synchronized.");

    app.listen(PORT, HOST, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

void startServer().catch((err: unknown) => {
    console.error(err);
});
