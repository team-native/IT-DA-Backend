import { DataTypes } from "sequelize";
import { TimestampAttributes } from "../types/models";

interface TimestampedInstance {
    isNewRecord: boolean;
    createdAt?: number;
    updatedAt?: number;
}

const getUnixTimestamp = (): number => Math.floor(Date.now() / 1000);

const timestampFields = {
    createdAt: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
};

const timestampOptions = {
    timestamps: false,
    hooks: {
        beforeValidate(instance: TimestampedInstance) {
            const now = getUnixTimestamp();
            if (instance.isNewRecord) {
                instance.createdAt = instance.createdAt || now;
                instance.updatedAt = instance.updatedAt || now;
                return;
            }

            instance.updatedAt = now;
        },
        beforeCreate(instance: TimestampedInstance) {
            const now = getUnixTimestamp();
            instance.createdAt = instance.createdAt || now;
            instance.updatedAt = instance.updatedAt || now;
        },
        beforeUpdate(instance: TimestampedInstance) {
            instance.updatedAt = getUnixTimestamp();
        }
    }
};

export { timestampFields, timestampOptions, getUnixTimestamp };
export type { TimestampAttributes };
