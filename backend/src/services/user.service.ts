import sequelize from '../database/config';
import { QueryTypes } from 'sequelize';
import { User } from '../models';

export interface UserSearch {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    status: string;
    last_seen?: Date | null;
}

export class UserService {
    
    // ============================================
    // 1. BUSCAR USUARIOS POR EMAIL 
    // ============================================
    async searchUsers(email: string, currentUserId: string): Promise<UserSearch | null> {
        if (!email) {
            return null;
        }
        
        const users = await sequelize.query<UserSearch>(
            `SELECT id, username, email, avatar_url, status, last_seen
             FROM users
             WHERE email LIKE :email AND id != :currentUserId
             LIMIT 5`,
            {
                replacements: { email: `%${email}%`, currentUserId },
                type: QueryTypes.SELECT
            }
        );

        const user = (users as UserSearch[])[0];

        return user || null;
    }
    
    // ============================================
    // 2. OBTENER PERFIL DE USUARIO
    // ============================================
    async getProfile(userId: string) {
        try {
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'email', 'avatar_url', 'status', 'last_seen', 'created_at']
            });
            
            return user;
        } catch (error) {
            console.error('Error en getProfile:', error);
            throw error;
        }
    }
    
    // ============================================
    // 3. OBTENER ESTADO DE UN USUARIO (ONLINE/OFFLINE )
    // ============================================
    async getUserStatus(userId: string) {
        try {
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'status', 'last_seen', 'avatar_url']
            });
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            return user;
        } catch (error) {
            console.error('Error en getUserStatus:', error);
            throw error;
        }
    }
    
    // ============================================
    // 4. ACTUALIZAR ESTADO DEL USUARIO 
    // ============================================
    async updateUserStatus(userId: string, status: 'online' | 'offline' | 'away') {
        try {
            await User.update(
                { 
                    status: status,
                    last_seen: new Date()
                },
                { where: { id: userId } }
            );
            
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'status', 'last_seen']
            });
            
            return user;
        } catch (error) {
            console.error('Error en updateUserStatus:', error);
            throw error;
        }
    }
    
    // ============================================
    // 5. ACTUALIZAR PERFIL DE USUARIO
    // ============================================
    async updateProfile(userId: string, data: { username?: string; avatar_url?: string }) {
        try {
            await User.update(data, { where: { id: userId } });
            
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'email', 'avatar_url', 'status', 'last_seen']
            });
            
            return user;
        } catch (error) {
            console.error('Error en updateProfile:', error);
            throw error;
        }
    }
}

export const userService = new UserService();