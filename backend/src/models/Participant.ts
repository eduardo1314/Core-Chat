import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface ParticipantAttributes {
    id: string;
    chat_id: string;
    user_id: string;
    role: 'admin' | 'member';
    last_read_at: Date;
    joined_at: Date;
    is_archived: boolean;
    archived_at: Date | null;
}

interface ParticipantCreationAttributes extends Optional<ParticipantAttributes, 'id' | 'joined_at' | 'is_archived' | 'archived_at'> {}

class Participant extends Model<ParticipantAttributes, ParticipantCreationAttributes> implements ParticipantAttributes {
    public id!: string;
    public chat_id!: string;
    public user_id!: string;
    public role!: 'admin' | 'member';
    public last_read_at!: Date;
    public joined_at!: Date;
    public is_archived!: boolean;
    public archived_at!: Date | null;
}

Participant.init(
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
        role: {
            type: DataTypes.ENUM('admin', 'member'),
            defaultValue: 'member'
        },
        last_read_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        joined_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        is_archived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        archived_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'participants',
        timestamps: true,
        createdAt: 'joined_at',
        updatedAt: false
    }
);

export default Participant;
