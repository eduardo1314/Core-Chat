import { Friend, User } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export interface FriendResponse {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    action_user_id: string;
    created_at: Date;
    updated_at: Date;
    friend?: {
        id: string;
        username: string;
        email: string;
        avatar_url: string | null;
        status: string;
    };
}

export class FriendService {
    
    // ============================================
    // ENVIAR SOLICITUD DE AMISTAD
    // ============================================
    async sendFriendRequest(userId: string, friendId: string): Promise<FriendResponse> {
        if (userId === friendId) {
            throw new Error('No puedes agregarte a ti mismo');
        }
        
        const friendExists = await User.findByPk(friendId);
        if (!friendExists) {
            throw new Error('Usuario no encontrado');
        }
        
        const existingRequest = await Friend.findOne({
            where: {
                [Op.or]: [
                    { user_id: userId, friend_id: friendId },
                    { user_id: friendId, friend_id: userId }
                ]
            }
        });
        
        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                //  Si la solicitud es de friendId → userId, aceptarla automáticamente
                if (existingRequest.user_id === friendId && existingRequest.friend_id === userId) {
                    console.log(`🔄 Aceptando solicitud pendiente de ${friendId} → ${userId}`);
                    return this.acceptFriendRequest(userId, existingRequest.id);
                }
                throw new Error('Ya existe una solicitud pendiente');
            }
            if (existingRequest.status === 'accepted') {
                throw new Error('Ya son amigos');
            }
            if (existingRequest.status === 'blocked') {
                throw new Error('No puedes enviar solicitud a este usuario');
            }
        }
        
        const friendRequest = await Friend.create({
            id: uuidv4(),
            user_id: userId,
            friend_id: friendId,
            action_user_id: userId,
            status: 'pending'
        });
        
        return this.formatFriendResponse(friendRequest, userId);
    }
    
    // ============================================
    // ACEPTAR SOLICITUD DE AMISTAD - CORREGIDO
    // ============================================
    async acceptFriendRequest(userId: string, requestId: string): Promise<FriendResponse> {
        const friendRequest = await Friend.findOne({
            where: {
                id: requestId,
                friend_id: userId,
                status: 'pending'
            }
        });
        
        if (!friendRequest) {
            throw new Error('Solicitud no encontrada');
        }
        
        //  Actualizar la solicitud existente
        await friendRequest.update({ status: 'accepted' });
        
        //  CREAR LA AMISTAD EN LA DIRECCIÓN INVERSA
        const inverseExists = await Friend.findOne({
            where: {
                user_id: friendRequest.friend_id,
                friend_id: friendRequest.user_id,
                status: 'accepted'
            }
        });
        
        if (!inverseExists) {
            await Friend.create({
                id: uuidv4(),
                user_id: friendRequest.friend_id,
                friend_id: friendRequest.user_id,
                action_user_id: userId,
                status: 'accepted'
            });
            console.log(`✅ Amistad inversa creada: ${friendRequest.friend_id} → ${friendRequest.user_id}`);
        }
        
        return this.formatFriendResponse(friendRequest, userId);
    }
    
    // ============================================
    // RECHAZAR SOLICITUD DE AMISTAD
    // ============================================
    async rejectFriendRequest(userId: string, requestId: string): Promise<void> {
        const friendRequest = await Friend.findOne({
            where: {
                id: requestId,
                friend_id: userId,
                status: 'pending'
            }
        });
        
        if (!friendRequest) {
            throw new Error('Solicitud no encontrada');
        }
        
        await friendRequest.destroy();
    }
    
    // ============================================
    // OBTENER SOLICITUD POR ID 
    // ============================================
    async getFriendRequestById(requestId: string): Promise<any> {
        const friendRequest = await Friend.findByPk(requestId);
        if (!friendRequest) {
            throw new Error('Solicitud no encontrada');
        }
        return friendRequest;
    }
    
    // ============================================
    // BLOQUEAR USUARIO
    // ============================================
    async blockUser(userId: string, friendId: string): Promise<FriendResponse> {
        await Friend.destroy({
            where: {
                [Op.or]: [
                    { user_id: userId, friend_id: friendId },
                    { user_id: friendId, friend_id: userId }
                ]
            }
        });
        
        const block = await Friend.create({
            id: uuidv4(),
            user_id: userId,
            friend_id: friendId,
            action_user_id: userId,
            status: 'blocked'
        });
        
        return this.formatFriendResponse(block, userId);
    }
    
    // ============================================
    // DESBLOQUEAR USUARIO
    // ============================================
    async unblockUser(userId: string, friendId: string): Promise<void> {
        await Friend.destroy({
            where: {
                user_id: userId,
                friend_id: friendId,
                status: 'blocked'
            }
        });
    }
    
    // ============================================
    // OBTENER AMIGOS
    // ============================================
    async getFriends(userId: string): Promise<FriendResponse[]> {
        const friends = await Friend.findAll({
            where: {
                [Op.or]: [
                    { user_id: userId, status: ['accepted', 'blocked'] },
                    { friend_id: userId, status: ['accepted', 'blocked'] }
                ]
            }
        });
        
        const result: FriendResponse[] = [];
        
        for (const friend of friends) {
            const friendId = friend.user_id === userId ? friend.friend_id : friend.user_id;
            const user = await User.findByPk(friendId, {
                attributes: ['id', 'username', 'email', 'avatar_url', 'status']
            });
            
            if (user) {
                result.push({
                    id: friend.id,
                    user_id: friend.user_id,
                    friend_id: friend.friend_id,
                    status: friend.status,
                    action_user_id: friend.action_user_id,
                    created_at: friend.created_at,
                    updated_at: friend.updated_at,
                    friend: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        avatar_url: user.avatar_url,
                        status: user.status
                    }
                });
            }
        }
        
        return result;
    }
    
    // ============================================
    // OBTENER SOLICITUDES PENDIENTES
    // ============================================
    async getPendingRequests(userId: string): Promise<FriendResponse[]> {
        const requests = await Friend.findAll({
            where: {
                friend_id: userId,
                status: 'pending'
            }
        });
        
        const result: FriendResponse[] = [];
        
        for (const request of requests) {
            const user = await User.findByPk(request.user_id, {
                attributes: ['id', 'username', 'email', 'avatar_url', 'status']
            });
            
            if (user) {
                result.push({
                    id: request.id,
                    user_id: request.user_id,
                    friend_id: request.friend_id,
                    status: request.status,
                    action_user_id: request.action_user_id,
                    created_at: request.created_at,
                    updated_at: request.updated_at,
                    friend: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        avatar_url: user.avatar_url,
                        status: user.status
                    }
                });
            }
        }
        
        return result;
    }
    
    // ============================================
    // OBTENER SOLICITUDES ENVIADAS
    // ============================================
    async getSentRequests(userId: string): Promise<FriendResponse[]> {
        const requests = await Friend.findAll({
            where: {
                user_id: userId,
                status: 'pending'
            }
        });
        
        const result: FriendResponse[] = [];
        
        for (const request of requests) {
            const user = await User.findByPk(request.friend_id, {
                attributes: ['id', 'username', 'email', 'avatar_url', 'status']
            });
            
            if (user) {
                result.push({
                    id: request.id,
                    user_id: request.user_id,
                    friend_id: request.friend_id,
                    status: request.status,
                    action_user_id: request.action_user_id,
                    created_at: request.created_at,
                    updated_at: request.updated_at,
                    friend: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        avatar_url: user.avatar_url,
                        status: user.status
                    }
                });
            }
        }
        
        return result;
    }
    
    // ============================================
    // VERIFICAR ESTADO DE AMISTAD
    // ============================================
    async checkFriendship(userId: string, friendId: string): Promise<{ status: string; isFriend: boolean }> {
        const friendship = await Friend.findOne({
            where: {
                [Op.or]: [
                    { user_id: userId, friend_id: friendId },
                    { user_id: friendId, friend_id: userId }
                ]
            }
        });
        
        if (!friendship) {
            return { status: 'none', isFriend: false };
        }
        
        return {
            status: friendship.status,
            isFriend: friendship.status === 'accepted'
        };
    }
    
    // ============================================
    // OBTENER SUGERENCIAS DE AMIGOS
    // ============================================
    async getFriendSuggestions(userId: string, limit = 10): Promise<any[]> {
        const existingRelations = await Friend.findAll({
            where: {
                [Op.or]: [
                    { user_id: userId },
                    { friend_id: userId }
                ]
            },
            attributes: ['user_id', 'friend_id']
        });
        
        const excludedIds = new Set<string>();
        excludedIds.add(userId);
        
        existingRelations.forEach(rel => {
            excludedIds.add(rel.user_id);
            excludedIds.add(rel.friend_id);
        });
        
        const suggestions = await User.findAll({
            where: {
                id: { [Op.notIn]: Array.from(excludedIds) }
            },
            attributes: ['id', 'username', 'email', 'avatar_url', 'status'],
            limit
        });
        
        return suggestions;
    }
    
    // ============================================
    // FORMATO DE RESPUESTA
    // ============================================
    private formatFriendResponse(friend: any, currentUserId: string): FriendResponse {
        return {
            id: friend.id,
            user_id: friend.user_id,
            friend_id: friend.friend_id,
            status: friend.status,
            action_user_id: friend.action_user_id,
            created_at: friend.created_at,
            updated_at: friend.updated_at
        };
    }
}

export const friendService = new FriendService();