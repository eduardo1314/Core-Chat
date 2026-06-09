import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface FriendAttributes {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    action_user_id: string;
    created_at: Date;
    updated_at: Date;
}

interface FriendCreationAttributes extends Optional<FriendAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Friend extends Model<FriendAttributes, FriendCreationAttributes> implements FriendAttributes {
    public id!: string;
    public user_id!: string;
    public friend_id!: string;
    public status!: 'pending' | 'accepted' | 'blocked';
    public action_user_id!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Friend.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
        },
        friend_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
            defaultValue: 'pending'
        },
        action_user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
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
        tableName: 'friends',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default Friend;
