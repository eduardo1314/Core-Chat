import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../database/config';
import { RegisterDTO, LoginDTO } from '../dtos/auth.dto';

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    status?: string;
    avatar_url?: string | null;
}

export interface AuthResult {
    user: AuthUser;
    token: string;
}

export class AuthService {
    
    async register(dto: RegisterDTO): Promise<AuthResult> {
        const { username, email, password } = dto;

        // Verificar si el email ya existe
        const [existing]: any = await sequelize.query(
            'SELECT id FROM users WHERE email = :email',
            { replacements: { email }, type: 'SELECT' }
        );

        if (existing) {
            throw new Error('Email already exists');
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const id = uuidv4();

        // Crear usuario
        await sequelize.query(
            `INSERT INTO users (id, username, email, password_hash, status, last_seen, created_at, updated_at) 
             VALUES (:id, :username, :email, :password_hash, 'online', NOW(), NOW(), NOW())`,
            { replacements: { id, username, email, password_hash } }
        );

        //  Obtener el usuario recién creado con avatar_url
        const [newUser]: any = await sequelize.query(
            'SELECT id, username, email, status, avatar_url, last_seen, created_at FROM users WHERE id = :id',
            { replacements: { id }, type: 'SELECT' }
        );

        // Generar token
        const token = jwt.sign(
            { id, email, username },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        return {
            user: newUser,
            token
        };
    }

    async login(dto: LoginDTO): Promise<AuthResult> {
        const { email, password } = dto;

        // Buscar usuario
        const [user]: any = await sequelize.query(
            'SELECT id, username, email, password_hash FROM users WHERE email = :email',
            { replacements: { email }, type: 'SELECT' }
        );

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Actualizar last_seen
        await sequelize.query(
            'UPDATE users SET last_seen = NOW() WHERE id = :id',
            { replacements: { id: user.id } }
        );

        //  Obtener el usuario completo con avatar_url
        const [fullUser]: any = await sequelize.query(
            'SELECT id, username, email, status, avatar_url, last_seen, created_at FROM users WHERE id = :id',
            { replacements: { id: user.id }, type: 'SELECT' }
        );

        // Generar token
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        return {
            user: fullUser,
            token
        };
    }

    async getProfile(userId: string): Promise<AuthUser> {
        const [user]: any = await sequelize.query(
            'SELECT id, username, email, status, avatar_url, last_seen, created_at FROM users WHERE id = :id',
            { replacements: { id: userId }, type: 'SELECT' }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }
}

export const authService = new AuthService();