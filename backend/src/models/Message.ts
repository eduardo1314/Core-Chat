import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';


interface MessageAttributes {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'video' | 'audio';
    is_edited: boolean;
    is_deleted: boolean;
    is_read: boolean;           //  para saber si está leído
    reply_to: string | null;
    metadata: any | null;       //  para reacciones, archivos, etc.
    created_at: Date;
    updated_at: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'created_at' | 'updated_at' | 'is_read' | 'metadata'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    public id!: string;
    public chat_id!: string;
    public user_id!: string;
    public content!: string;
    public type!: 'text' | 'image' | 'file' | 'video' | 'audio';
    public is_edited!: boolean;
    public is_deleted!: boolean;
    public is_read!: boolean;      
    public reply_to!: string | null;
    public metadata!: any | null;  
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
            allowNull: false,
            references: {
                model: 'chats',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('text', 'image', 'file', 'video', 'audio'),
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
        
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        reply_to: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'messages',
                key: 'id'
            }
        },
        
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null
        },
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