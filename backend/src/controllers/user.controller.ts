import { Request, Response } from 'express';
import { userService } from '../services/user.service';


// ============================================
// 1. BUSCAR USUARIOS POR EMAIL
// ============================================
export const searchUsers = async (req: any, res: Response) => {
    try {
        const { email } = req.query;
        const currentUserId = req.user.id;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email requerido' 
            });
        }
        
        const user = await userService.searchUsers(email as string, currentUserId);
        
        res.json({ success: true, data: user || null });
    } catch (error) {
        console.error('❌ Search users error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al buscar usuario' 
        });
    }
};

// ============================================
// 2. OBTENER PERFIL DE USUARIO
// ============================================
export const getProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        
        const user = await userService.getProfile(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }
        
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener perfil' 
        });
    }
};

// ============================================
// 3. OBTENER ESTADO DE UN USUARIO
// ============================================
export const getUserStatus = async (req: any, res: Response) => {
    try {
        const { userId } = req.params;
        
        const user = await userService.getUserStatus(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }
        
        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                status: user.status,
                last_seen: user.last_seen,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('❌ Get user status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener estado del usuario' 
        });
    }
};

// ============================================
// 4. ACTUALIZAR ESTADO DE USUARIO
// ============================================
export const updateUserStatus = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { status } = req.body;
        
        if (!status || !['online', 'offline', 'away'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Estado inválido. Debe ser: online, offline o away' 
            });
        }
        
        const user = await userService.updateUserStatus(userId, status);
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('❌ Update user status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar estado' 
        });
    }
};

// ============================================
// 5. ACTUALIZAR PERFIL
// ============================================
export const updateProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { username, avatar_url } = req.body;
        
        const user = await userService.updateProfile(userId, { username, avatar_url });
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar perfil' 
        });
    }
};


// ============================================
//  6. SUBIR AVATAR 
// ============================================
export const uploadAvatar = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se recibió ninguna imagen'
            });
        }

        console.log(`📸 Usuario ${userId} subiendo avatar...`);

        // 1. Obtener avatar anterior ANTES de subir el nuevo
        const user = await userService.getProfile(userId);
        const oldAvatarUrl = user?.avatar_url;

        // 2. Subir NUEVO avatar a Cloudinary
        const avatarUrl = await userService.uploadAvatar(req.file, userId);
        console.log(`✅ Nuevo avatar subido: ${avatarUrl}`);

        // 3. Guardar NUEVA URL en base de datos
        const updatedUser = await userService.updateProfile(userId, { 
            avatar_url: avatarUrl 
        });

        // 4. Eliminar avatar ANTERIOR (después de guardar el nuevo)
        if (oldAvatarUrl) {
            await userService.deleteAvatar(oldAvatarUrl);
            console.log(`✅ Avatar anterior eliminado de Cloudinary`);
        }

        // Emitir evento de socket
        const io = req.app.get('io');
        if (io) {
            io.emit('user-avatar-updated', {
                userId,
                avatarUrl: avatarUrl, 
                user: updatedUser
            });
        }

        res.json({
            success: true,
            data: {
                avatar_url: avatarUrl,  
                user: updatedUser
            },
            message: 'Foto de perfil actualizada correctamente'
        });

    } catch (error: any) {
        console.error('❌ Error al subir avatar:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al subir la imagen'
        });
    }
};

// ============================================
//  7. ELIMINAR AVATAR 
// ============================================
export const removeAvatar = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        const user = await userService.getProfile(userId);
        if (user?.avatar_url) {
            await userService.deleteAvatar(user.avatar_url);
        }

        const updatedUser = await userService.updateProfile(userId, { 
            avatar_url: null 
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('user-avatar-updated', {
                userId,
                avatarUrl: null,
                user: updatedUser
            });
        }

        res.json({
            success: true,
            data: { user: updatedUser },
            message: 'Foto de perfil eliminada'
        });

    } catch (error: any) {
        console.error('❌ Error al eliminar avatar:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};