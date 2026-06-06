import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface ChatAttributes {
    id: string;
    name: string | null;
    type: 'private' | 'group';
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

interface ChatCreationAttributes extends Optional<ChatAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
    public id!: string;
    public name!: string | null;
    public type!: 'private' | 'group';
    public created_by!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Chat.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM('private', 'group'),
            defaultValue: 'private'
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: 'chats',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default Chat;
