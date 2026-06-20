import { Request, Response } from 'express';
import { friendService } from '../services/friend.service';
import { Server } from 'socket.io';

// ============================================
// FUNCIÓN AUXILIAR PARA EMITIR EVENTOS
// ============================================
const emitSocketEvent = (io: Server, event: string, data: any) => {
    if (io) {
        io.emit(event, data);
        console.log(`📤 [Socket] Evento emitido: ${event}`, data);
    }
};

// ============================================
// ENVIAR SOLICITUD DE AMISTAD
// ============================================
export const sendFriendRequest = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;
        
        const friendRequest = await friendService.sendFriendRequest(userId, friendId);
        
        //  Emitir evento WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(friendId).emit('friend-request-received', {
                fromUserId: userId,
                requestId: friendRequest.id,
                timestamp: new Date().toISOString()
            });
        }
        
        res.status(201).json({ success: true, data: friendRequest });
    } catch (error: any) {
        console.error('Send friend request error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// ACEPTAR SOLICITUD DE AMISTAD
// ============================================
export const acceptFriendRequest = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;
        
        const friendRequest = await friendService.acceptFriendRequest(userId, requestId);
        
        //  Emitir evento WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(friendRequest.user_id).emit('friend-request-accepted', {
                byUserId: userId,
                requestId: requestId,
                timestamp: new Date().toISOString()
            });
            
            io.to(userId).emit('friend-status-updated', {
                userId: friendRequest.user_id,
                status: 'accepted',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({ success: true, data: friendRequest });
    } catch (error: any) {
        console.error('Accept friend request error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// RECHAZAR SOLICITUD DE AMISTAD
// ============================================
export const rejectFriendRequest = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;
        
        const friendRequest = await friendService.getFriendRequestById(requestId);
        await friendService.rejectFriendRequest(userId, requestId);
        
        // Emitir evento WebSocket
        const io = req.app.get('io');
        if (io && friendRequest) {
            io.to(friendRequest.user_id).emit('friend-request-rejected', {
                byUserId: userId,
                requestId: requestId,
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({ success: true, message: 'Solicitud rechazada' });
    } catch (error: any) {
        console.error('Reject friend request error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
//  BLOQUEAR USUARIO 
// ============================================
export const blockUser = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;
        
        const block = await friendService.blockUser(userId, friendId);
        
        // Emitir por WebSocket
        const io = req.app.get('io');
        if (io) {
            // 1. Notificar al usuario bloqueado
            io.to(friendId).emit('user-blocked', {
                blockedBy: userId,
                timestamp: new Date().toISOString()
            });

            // 2. Notificar al usuario que bloqueó
            io.to(userId).emit('user-status-updated', {
                userId: friendId,
                status: 'blocked',
                timestamp: new Date().toISOString()
            });

            // 3. Notificar a todos (amigos comunes)
            io.emit('friend-status-changed', {
                userId: userId,
                friendId: friendId,
                status: 'blocked',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({ success: true, data: block });
    } catch (error: any) {
        console.error('Block user error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// DESBLOQUEAR USUARIO 
// ============================================
export const unblockUser = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;
        
        await friendService.unblockUser(userId, friendId);
        
        //  Emitir por WebSocket
        const io = req.app.get('io');
        if (io) {
            // 1. Notificar al usuario desbloqueado
            io.to(friendId).emit('user-unblocked', {
                unblockedBy: userId,
                timestamp: new Date().toISOString()
            });

            // 2. Notificar al usuario que desbloqueó
            io.to(userId).emit('user-status-updated', {
                userId: friendId,
                status: 'accepted',
                timestamp: new Date().toISOString()
            });

            // 3. Notificar a todos
            io.emit('friend-status-changed', {
                userId: userId,
                friendId: friendId,
                status: 'accepted',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({ success: true, message: 'Usuario desbloqueado' });
    } catch (error: any) {
        console.error('Unblock user error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// OBTENER LISTA DE AMIGOS
// ============================================
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

// ============================================
// OBTENER SOLICITUDES PENDIENTES
// ============================================
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

// ============================================
// OBTENER SOLICITUDES ENVIADAS
// ============================================
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

// ============================================
// OBTENER SUGERENCIAS DE AMIGOS
// ============================================
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

// ============================================
// VERIFICAR ESTADO DE AMISTAD
// ============================================
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