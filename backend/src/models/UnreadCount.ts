import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/config';


export class UnreadCount extends Model {
    public id!: string;
    public chat_id!: string;
    public user_id!: string;
    public count!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

UnreadCount.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        chat_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'chats',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'unread_counts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['chat_id', 'user_id'],
                name: 'unread_counts_chat_user_unique',
            },
        ],
    }
);

export default UnreadCount;