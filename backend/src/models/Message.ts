import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface MessageAttributes {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    type: 'text' | 'image' | 'file';
    is_edited: boolean;
    is_deleted: boolean;
    reply_to: string | null;
    created_at: Date;
    updated_at: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    public id!: string;
    public chat_id!: string;
    public user_id!: string;
    public content!: string;
    public type!: 'text' | 'image' | 'file';
    public is_edited!: boolean;
    public is_deleted!: boolean;
    public reply_to!: string | null;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Message.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        chat_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('text', 'image', 'file'),
            defaultValue: 'text'
        },
        is_edited: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        reply_to: {
            type: DataTypes.UUID,
            allowNull: true
        }
        ,
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        tableName: 'messages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default Message;
