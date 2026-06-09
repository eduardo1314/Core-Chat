import { Request, Response } from 'express';
import { friendService } from '../services/friend.service';



//funcion para enviar solicitud de amistad
export const sendFriendRequest = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;
        
        const friendRequest = await friendService.sendFriendRequest(userId, friendId);
        
        res.status(201).json({ success: true, data: friendRequest });
    } catch (error: any) {
        console.error('Send friend request error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


//funcion para aceptar solicitud de amistad
export const acceptFriendRequest = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;
        
        const friendRequest = await friendService.acceptFriendRequest(userId, requestId);
        
        res.json({ success: true, data: friendRequest });
    } catch (error: any) {
        console.error('Accept friend request error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


//funcion para rechar solicitud de amistad
export const rejectFriendRequest = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;
        
        await friendService.rejectFriendRequest(userId, requestId);
        
        res.json({ success: true, message: 'Solicitud rechazada' });
    } catch (error: any) {
        console.error('Reject friend request error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


//funcion para  bloquear un amuigo
export const blockUser = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;
        
        const block = await friendService.blockUser(userId, friendId);
        
        res.json({ success: true, data: block });
    } catch (error: any) {
        console.error('Block user error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

//funcion para desbloquear un usuario
export const unblockUser = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;
        
        await friendService.unblockUser(userId, friendId);
        
        res.json({ success: true, message: 'Usuario desbloqueado' });
    } catch (error: any) {
        console.error('Unblock user error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


//funcion para obtener lista de amigos
export const getFriends = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        
        const friends = await friendService.getFriends(userId);
        
        res.json({ success: true, data: friends });
    } catch (error: any) {
        console.error('Get friends error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


//funcion para obtener lista de solicitudes pendientes
export const getPendingRequests = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        
        const requests = await friendService.getPendingRequests(userId);
        
        res.json({ success: true, data: requests });
    } catch (error: any) {
        console.error('Get pending requests error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


//funcion para obtener lista de solicitudes enviadas
export const getSentRequests = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        
        const requests = await friendService.getSentRequests(userId);
        
        res.json({ success: true, data: requests });
    } catch (error: any) {
        console.error('Get sent requests error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


//funcion para obtener sugerencias de amigos
export const getFriendSuggestions = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const suggestions = await friendService.getFriendSuggestions(userId, limit);
        
        res.json({ success: true, data: suggestions });
    } catch (error: any) {
        console.error('Get friend suggestions error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

//funcion para verificar estado de amistad con otro usuario
export const checkFriendship = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;
        
        const status = await friendService.checkFriendship(userId, friendId);
        
        res.json({ success: true, data: status });
    } catch (error: any) {
        console.error('Check friendship error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};
