import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface UserAttributes {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    avatar_url?: string | null;
    status: 'online' | 'offline' | 'away';
    last_seen: Date;
    created_at: Date;
    updated_at: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public username!: string;
    public email!: string;
    public password_hash!: string;
    public avatar_url!: string | null;
    public status!: 'online' | 'offline' | 'away';
    public last_seen!: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password_hash: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        avatar_url: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('online', 'offline', 'away'),
            defaultValue: 'offline'
        },
        last_seen: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
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
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default User;
