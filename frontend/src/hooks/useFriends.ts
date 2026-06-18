import { useState, useEffect, useCallback } from 'react';
import { 
    getFriendsService,
    getPendingRequestsService,
    getSentRequestsService,
    getFriendSuggestionsService,
    sendFriendRequestService,
    acceptFriendRequestService,
    rejectFriendRequestService,  
    blockUserService,
    unblockUserService,
    checkFriendshipService
} from '../services/friends.service';
import { Friend, FriendRequest } from '../types';
import { useSocket } from './useSocket';

interface UseFriendsReturn {
    friends: Friend[];
    pendingRequests: FriendRequest[];
    sentRequests: FriendRequest[];
    suggestions: any[];
    loading: boolean;
    error: string | null;
    sendRequest: (friendId: string) => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    rejectRequest: (requestId: string) => Promise<void>;
    blockUser: (friendId: string) => Promise<void>;
    unblockUser: (friendId: string) => Promise<void>;
    checkFriendship: (friendId: string) => Promise<{ status: string; isFriend: boolean }>;
    loadFriends: () => Promise<void>;
    loadPendingRequests: () => Promise<void>;
    loadSentRequests: () => Promise<void>;
    loadSuggestions: () => Promise<void>;
}

export const useFriends = (): UseFriendsReturn => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // OBTENER EVENTOS DEL SOCKET
    const { 
        onUserOnline, 
        offUserOnline, 
        onUserOffline, 
        offUserOffline,
        onUserStatusUpdated,
        offUserStatusUpdated
    } = useSocket();

    // ============================================
    // FUNCIONES DE CARGA
    // ============================================

    const loadFriends = useCallback(async () => {
        try {
            const response = await getFriendsService();
            if (response.success) {
                setFriends(response.data || []);
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar amigos');
        }
    }, []);

    const loadPendingRequests = useCallback(async () => {
        try {
            const response = await getPendingRequestsService();
            if (response.success) {
                setPendingRequests(response.data || []);
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar solicitudes');
        }
    }, []);

    const loadSentRequests = useCallback(async () => {
        try {
            const response = await getSentRequestsService();
            if (response.success) {
                setSentRequests(response.data || []);
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar solicitudes enviadas');
        }
    }, []);

    const loadSuggestions = useCallback(async () => {
        try {
            const response = await getFriendSuggestionsService();
            if (response.success) {
                setSuggestions(response.data || []);
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar sugerencias');
        }
    }, []);

    // ============================================
    // FUNCIONES DE ACCIÓN
    // ============================================

    const sendRequest = useCallback(async (friendId: string) => {
        try {
            await sendFriendRequestService(friendId);
            await loadPendingRequests();
            await loadSuggestions();
        } catch (err: any) {
            setError(err.error || 'Error al enviar solicitud');
            throw err;
        }
    }, [loadPendingRequests, loadSuggestions]);

    const acceptRequest = useCallback(async (requestId: string) => {
        try {
            await acceptFriendRequestService(requestId);
            await loadFriends();
            await loadPendingRequests();
        } catch (err: any) {
            setError(err.error || 'Error al aceptar solicitud');
            throw err;
        }
    }, [loadFriends, loadPendingRequests]);

    const rejectRequest = useCallback(async (requestId: string) => {
        try {
            await rejectFriendRequestService(requestId); 
            await loadPendingRequests();
        } catch (err: any) {
            setError(err.error || 'Error al rechazar solicitud');
            throw err;
        }
    }, [loadPendingRequests]);

    const blockUser = useCallback(async (friendId: string) => {
        try {
            await blockUserService(friendId);
            await loadFriends();
        } catch (err: any) {
            setError(err.error || 'Error al bloquear usuario');
            throw err;
        }
    }, [loadFriends]);

    const unblockUser = useCallback(async (friendId: string) => {
        try {
            await unblockUserService(friendId);
            await loadFriends();
        } catch (err: any) {
            setError(err.error || 'Error al desbloquear usuario');
            throw err;
        }
    }, [loadFriends]);

    const checkFriendship = useCallback(async (friendId: string) => {
        try {
            const response = await checkFriendshipService(friendId);
            return response.data || { status: 'none', isFriend: false };
        } catch (err: any) {
            return { status: 'none', isFriend: false };
        }
    }, []);

    // ============================================
    //  ESCUCHAR EVENTOS DE ONLINE/OFFLINE
    // ============================================

    useEffect(() => {
        // Cuando un amigo se conecta
        const handleUserOnline = (data: { userId: string; timestamp: string }) => {
            console.log(`🟢 Amigo ${data.userId} está en línea`);
            setFriends(prev => 
                prev.map(friend => {
                    const isFriend = friend.friend?.id === data.userId || friend.user_id === data.userId;
                    if (isFriend && friend.friend) {
                        return {
                            ...friend,
                            friend: {
                                ...friend.friend,
                                status: 'online',
                                last_seen: data.timestamp
                            }
                        };
                    }
                    return friend;
                })
            );
        };

        // Cuando un amigo se desconecta
        const handleUserOffline = (data: { userId: string; timestamp: string }) => {
            console.log(`🔴 Amigo ${data.userId} está offline`);
            setFriends(prev => 
                prev.map(friend => {
                    const isFriend = friend.friend?.id === data.userId || friend.user_id === data.userId;
                    if (isFriend && friend.friend) {
                        return {
                            ...friend,
                            friend: {
                                ...friend.friend,
                                status: 'offline',
                                last_seen: data.timestamp
                            }
                        };
                    }
                    return friend;
                })
            );
        };

        // Cuando se actualiza el estado de un amigo
        const handleUserStatusUpdated = (data: { userId: string; status: string; last_seen: string }) => {
            console.log(`📌 Estado de amigo ${data.userId} actualizado: ${data.status}`);
            setFriends(prev => 
                prev.map(friend => {
                    const isFriend = friend.friend?.id === data.userId || friend.user_id === data.userId;
                    if (isFriend && friend.friend) {
                        return {
                            ...friend,
                            friend: {
                                ...friend.friend,
                                status: data.status,
                                last_seen: data.last_seen
                            }
                        };
                    }
                    return friend;
                })
            );
        };

        //  Registrar listeners
        onUserOnline(handleUserOnline);
        onUserOffline(handleUserOffline);
        onUserStatusUpdated(handleUserStatusUpdated);

        //  Limpiar listeners al desmontar
        return () => {
            offUserOnline(handleUserOnline);
            offUserOffline(handleUserOffline);
            offUserStatusUpdated(handleUserStatusUpdated);
        };
    }, [onUserOnline, offUserOnline, onUserOffline, offUserOffline, onUserStatusUpdated, offUserStatusUpdated]);

    // ============================================
    // CARGA INICIAL
    // ============================================

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([
                loadFriends(),
                loadPendingRequests(),
                loadSentRequests(),
                loadSuggestions()
            ]);
            setLoading(false);
        };
        loadAll();
    }, [loadFriends, loadPendingRequests, loadSentRequests, loadSuggestions]);

    return {
        friends,
        pendingRequests,
        sentRequests,
        suggestions,
        loading,
        error,
        sendRequest,
        acceptRequest,
        rejectRequest,
        blockUser,
        unblockUser,
        checkFriendship,
        loadFriends,
        loadPendingRequests,
        loadSentRequests,
        loadSuggestions
    };
};