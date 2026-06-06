import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../database/config';
import { RegisterData, LoginData, AuthResponse, UserProfile } from '../types/auth';



export class AuthService {
    async register(data: RegisterData): Promise<AuthResponse> {
        // Verificar si el email ya existe
        const [existing]: any = await sequelize.query(
            'SELECT id FROM users WHERE email = :email',
            { replacements: { email: data.email }, type: 'SELECT' }
        );

        if (existing) {
            throw new Error('Email already exists');
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(data.password, salt);
        const id = uuidv4();

        // Crear usuario
        await sequelize.query(
            `INSERT INTO users (id, username, email, password_hash, status, last_seen, created_at, updated_at) 
             VALUES (:id, :username, :email, :password_hash, 'online', NOW(), NOW(), NOW())`,
            {
                replacements: {
                    id,
                    username: data.username,
                    email: data.email,
                    password_hash
                }
            }
        );

        // Obtener el usuario creado
        const [user]: any = await sequelize.query(
            'SELECT id, username, email FROM users WHERE id = :id',
            { replacements: { id }, type: 'SELECT' }
        );

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        };
    }

    async login(data: LoginData): Promise<AuthResponse> {
        // Buscar usuario por email
        const [user]: any = await sequelize.query(
            'SELECT id, username, email, password_hash FROM users WHERE email = :email',
            { replacements: { email: data.email }, type: 'SELECT' }
        );

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Actualizar last_seen
        await sequelize.query(
            'UPDATE users SET last_seen = NOW() WHERE id = :id',
            { replacements: { id: user.id } }
        );

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        };
    }

    async getProfile(userId: string): Promise<UserProfile> {
    const [user]: any = await sequelize.query(
        'SELECT id, username, email, status, avatar_url, last_seen, created_at FROM users WHERE id = :id',
        { replacements: { id: userId }, type: 'SELECT' }
    );

    if (!user) {
        throw new Error('User not found');
    }

    return user as UserProfile;
}
}

export const authService = new AuthService();
