import { Request, Response } from 'express';
import { userService } from '../services/user.service';

export const searchUsers = async (req: any, res: Response) => {
    try {
        const { email } = req.query;
        const currentUserId = req.user.id;
        
        if (!email) {
            res.status(400).json({ success: false, error: 'Email requerido' });
            return;
        }
        
        const user = await userService.searchUsers(email as string, currentUserId);
        
        res.json({ success: true, data: user || null });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, error: 'Error al buscar usuario' });
    }
};
