import { Request, Response } from 'express';
import { userService } from '../services/user.service';

// ============================================
// 1. BUSCAR USUARIOS POR EMAIL (YA LO TIENES)
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
// 3. OBTENER ESTADO DE UN USUARIO (ONLINE/OFFLINE + LAST_SEEN) 
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
// 4. ACTUALIZAR ESTADO DE USUARIO (PATCH)
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