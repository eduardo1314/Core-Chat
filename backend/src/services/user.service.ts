import sequelize from '../database/config';
import { QueryTypes } from 'sequelize';
import { User } from '../models';
import cloudinary from '../config/cloudinary';
import sharp from 'sharp';

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
   async updateProfile(userId: string, data: { username?: string; avatar_url?: string | null }) {
    try {
        const updateData: any = {};
        if (data.username !== undefined) updateData.username = data.username;
        if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
        
        await User.update(updateData, { where: { id: userId } });
        
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'avatar_url', 'status', 'last_seen']
        });
        
        return user;
    } catch (error) {
        console.error('Error en updateProfile:', error);
        throw error;
    }
}

    // ============================================
    // 6. SUBIR AVATAR A CLOUDINARY 
    // ============================================
    async uploadAvatar(file: Express.Multer.File, userId: string): Promise<string> {
        try {
            console.log(`📤 Subiendo avatar para usuario ${userId}...`);

            // 1. Optimizar imagen con Sharp
            const optimizedBuffer = await sharp(file.buffer)
                .resize(400, 400, { 
                    fit: 'cover',
                    position: 'centre'
                })
                .webp({ quality: 80 })
                .toBuffer();

            // 2. Subir a Cloudinary
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'corechat/avatars',
                        public_id: `user_${userId}`,
                        format: 'webp',
                        transformation: [
                            { width: 400, height: 400, crop: 'fill' },
                            { quality: 'auto:good' }
                        ]
                    },
                    (error, result) => {
                        if (error) {
                            console.error('❌ Error en Cloudinary:', error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                uploadStream.end(optimizedBuffer);
            });

            const avatarUrl = (result as any).secure_url;
            console.log(`✅ Avatar subido exitosamente: ${avatarUrl}`);
            
            return avatarUrl;

        } catch (error) {
            console.error('❌ Error al subir a Cloudinary:', error);
            throw error;
        }
    }

    // ============================================
    // 7. ELIMINAR AVATAR DE CLOUDINARY 
    // ============================================
    async deleteAvatar(avatarUrl: string): Promise<void> {
        try {
            if (!avatarUrl) return;

            // Extraer public_id de la URL
            const parts = avatarUrl.split('/');
            const filename = parts[parts.length - 1];
            const publicId = `corechat/avatars/${filename.split('.')[0]}`;

            await cloudinary.uploader.destroy(publicId);
            console.log(`✅ Avatar eliminado de Cloudinary`);

        } catch (error) {
            console.error('❌ Error al eliminar avatar de Cloudinary:', error);
        }
    }
}

export const userService = new UserService();