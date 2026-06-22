import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFriends } from '../../hooks/useFriends';
import { useChats } from '../../hooks/useChats';
import { useAuth } from '../../hooks/useAuth';
import { searchUsersService } from '../../services/user.service';
import { deleteChatService } from '../../services/chats.service';
import { getUnreadCountService, getTotalUnreadCountService } from '../../services/messages.service';
import FriendMenu from '../common/FriendMenu';
import { formatLastSeen } from '../../../utils/formatLastSeen';
import { Chat } from "../../types";
import { useSocket } from '../../hooks/useSocket';
import ChatItem from './ChatItem';

// ============================================
// TIPOS E INTERFACES
// ============================================
interface SidebarProps {
    onSelectChat: (chatId: string | null, chatName?: string, isOnline?: boolean, lastSeen?: string | null) => void;
    selectedChatId: string | null;
    onClearUnread?: (chatId: string) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId, onClearUnread }) => {
    const { user } = useAuth();

    // ============================================
    // HOOKS
    // ============================================
    const {
        friends,
        pendingRequests,
        sentRequests,
        loading: friendsLoading,
        sendRequest,
        acceptRequest,
        rejectRequest,
        loadPendingRequests,
        blockUser,
        loadFriends
    } = useFriends();

    const {
        activeChats,
        archivedChats,
        createChat,
        archiveChat,
        unarchiveChat,
        loadActiveChats,
        loadArchivedChats
    } = useChats();

    const { onUnreadUpdate, offUnreadUpdate, markAsRead, socket, onNewMessage, offNewMessage } = useSocket();

    // ============================================
    // ESTADOS LOCALES
    // ============================================
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendEmail, setFriendEmail] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'requests' | 'archived'>('chats');
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
    const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());
    const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
    const [totalUnread, setTotalUnread] = useState(0);
    const lastChatCreationRef = useRef<number>(0);

    // ============================================
    // FUNCIÓN PARA VERIFICAR SI ESTÁ REALMENTE EN LÍNEA
    // ============================================
    const isActuallyOnline = useCallback((status: string | undefined, lastSeen: string | null | undefined): boolean => {
        if (status !== 'online') return false;
        if (!lastSeen) return false;
        
        const now = Date.now();
        const lastSeenDate = new Date(lastSeen).getTime();
        const diffSeconds = (now - lastSeenDate) / 1000;
        
        return diffSeconds < 120;
    }, []);

    // ============================================
    // LIMPIAR NO LEÍDOS DE UN CHAT
    // ============================================
    const clearUnreadCount = useCallback((chatId: string) => {
        const currentCount = unreadCounts.get(chatId) || 0;
        
        setUnreadCounts(prev => {
            const newMap = new Map(prev);
            newMap.delete(chatId);
            return newMap;
        });
        
        if (currentCount > 0) {
            setTotalUnread(prev => Math.max(0, prev - currentCount));
        }
    }, [unreadCounts]);

    // ============================================
    // ACTUALIZAR CONTADOR DE NO LEÍDOS
    // ============================================
    const updateUnreadCount = useCallback((chatId: string, count: number) => {
        if (selectedChatId === chatId) {
            count = 0;
        }
        
        setUnreadCounts(prev => {
            const newMap = new Map(prev);
            if (count > 0) {
                newMap.set(chatId, count);
            } else {
                newMap.delete(chatId);
            }
            
            let total = 0;
            for (const c of newMap.values()) {
                total += c;
            }
            setTotalUnread(total);
            
            return newMap;
        });
    }, [selectedChatId]);

    // ============================================
    // ESCUCHAR UNREAD-UPDATE Y RECARGAR CHATS
    // ============================================
    useEffect(() => {
        const handleUnreadUpdate = async (data: { chatId: string; count: number }) => {
            if (data.count > 0) {
                await loadActiveChats();
            }
            updateUnreadCount(data.chatId, data.count);
        };

        onUnreadUpdate(handleUnreadUpdate);

        return () => {
            offUnreadUpdate(handleUnreadUpdate);
        };
    }, [onUnreadUpdate, offUnreadUpdate, updateUnreadCount, loadActiveChats]);

    // ============================================
    // ESCUCHAR NUEVOS MENSAJES
    // ============================================
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = async (data: any) => {
            const chatId = data.chat_id || data.chatId;
            if (!chatId) return;

            const chatExists = activeChats.some(chat => chat.id === chatId);
            if (!chatExists) {
                await loadActiveChats();
            }
        };

        onNewMessage(handleNewMessage);

        return () => {
            offNewMessage(handleNewMessage);
        };
    }, [socket, onNewMessage, offNewMessage, activeChats, loadActiveChats]);

    // ============================================
    // RESPALDO: Recargar chats cada 30 segundos
    // ============================================
    useEffect(() => {
        const interval = setInterval(() => {
            loadActiveChats();
        }, 30000);

        return () => {
            clearInterval(interval);
        };
    }, [loadActiveChats]);

    // ============================================
    // Cargar conteo de no leídos (INICIAL)
    // ============================================
    useEffect(() => {
        const loadUnreadCounts = async () => {
            try {
                const totalResponse = await getTotalUnreadCountService();
                if (totalResponse.success) {
                    setTotalUnread(totalResponse.data?.totalUnread || 0);
                }

                const counts = new Map<string, number>();
                for (const chat of activeChats) {
                    try {
                        const response = await getUnreadCountService(chat.id);
                        if (response.success) {
                            const count = response.data?.unreadCount || 0;
                            if (count > 0) {
                                counts.set(chat.id, count);
                            }
                        }
                    } catch (error) {
                        console.error(`Error al obtener no leídos del chat ${chat.id}:`, error);
                    }
                }
                setUnreadCounts(counts);
            } catch (error) {
                console.error('❌ Error al cargar no leídos:', error);
            }
        };

        if (activeChats.length > 0) {
            loadUnreadCounts();
        }
    }, [activeChats]);

    // ============================================
    // FUNCIÓN PARA BUSCAR CHAT PRIVADO EXISTENTE
    // ============================================
    const findExistingPrivateChat = useCallback((friendId: string) => {
        const allChats = [...activeChats, ...archivedChats];
        
        return allChats.find(chat => {
            if (chat.type !== 'private') return false;
            
            if (chat.Participants && chat.Participants.length > 0) {
                const hasFriend = chat.Participants.some((p: any) => p.id === friendId || p.user_id === friendId);
                const hasCurrentUser = chat.Participants.some((p: any) => p.id === user?.id || p.user_id === user?.id);
                if (hasFriend && hasCurrentUser) return true;
            }
            
            if (chat.Users && chat.Users.length > 0) {
                const hasFriend = chat.Users.some((u: any) => u.id === friendId);
                const hasCurrentUser = chat.Users.some((u: any) => u.id === user?.id);
                if (hasFriend && hasCurrentUser) return true;
            }
            
            if (chat.name === friendId) return true;
            
            return false;
        });
    }, [activeChats, archivedChats, user]);

    // Cargar nombres personalizados
    useEffect(() => {
        const saved = localStorage.getItem('customFriendNames');
        if (saved) {
            try {
                setCustomNames(new Map(Object.entries(JSON.parse(saved))));
            } catch (error) {
                console.error('Error al cargar nombres personalizados:', error);
            }
        }
    }, []);

    // Cargar usuarios bloqueados
    useEffect(() => {
        const loadBlocked = async () => {
            const blocked = friends.filter(f => f.status === 'blocked');
            const blockedIds = blocked
                .map(f => f.friend?.id)
                .filter((id): id is string => id !== undefined && id !== null);
            setBlockedUsers(new Set(blockedIds));
        };
        loadBlocked();
    }, [friends]);

    // ============================================
    // FUNCIONES PRINCIPALES para ver info de usuario
    // ============================================

    const getFriendInfoFromChat = useCallback((chat: Chat) => {
        if (chat.type !== 'private') {
            return { 
                displayName: chat.name || 'Chat', 
                isOnline: false, 
                lastSeen: null, 
                avatar: '💬',
                avatarBg: 'from-purple-500 to-pink-500'
            };
        }

        let displayName = '';
        let avatar = '';
        let avatarBg = 'from-blue-500 to-cyan-500';
        let friendId = '';
        let isOnline = false;
        let lastSeen: string | null = null;

        if (chat.Participants && chat.Participants.length > 0) {
            const otherUser = chat.Participants.find((p: any) => p.id !== user?.id);
            if (otherUser) {
                friendId = otherUser.id;
                const username = otherUser.User?.username || otherUser.username || otherUser.user_id || otherUser.id;
                displayName = customNames.get(otherUser.id) || username || 'Usuario';
                avatar = displayName.charAt(0).toUpperCase();
            }
        }

        if (!friendId && chat.Users && chat.Users.length > 0) {
            const otherUser = chat.Users.find((u: any) => u.id !== user?.id);
            if (otherUser) {
                friendId = otherUser.id;
                displayName = customNames.get(otherUser.id) || otherUser.username || 'Usuario';
                avatar = displayName.charAt(0).toUpperCase();
            }
        }

        if (!friendId && chat.name) {
            displayName = chat.name;
            avatar = displayName.charAt(0).toUpperCase();
        }

        if (!displayName) {
            displayName = 'Usuario';
            avatar = '👤';
            avatarBg = 'from-gray-500 to-gray-600';
        }

        if (friendId) {
            const friendData = friends.find(f => f.friend?.id === friendId || f.user_id === friendId);
            if (friendData?.friend) {
                const status = friendData.friend.status;
                const lastSeenRaw = friendData.friend.last_seen || null;
                isOnline = isActuallyOnline(status, lastSeenRaw);
                lastSeen = lastSeenRaw;
            }
        }

        return { displayName, avatar, avatarBg, friendId, isOnline, lastSeen };
    }, [user, customNames, friends, isActuallyOnline]);



    const startChat = useCallback(async (friendId: string, friendName: string) => {
        if (!friendId || isCreatingChat) return;

        const now = Date.now();
        if (now - lastChatCreationRef.current < 1000) {
            console.log('⏳ Preveniendo creación duplicada de chat');
            return;
        }

        if (blockedUsers.has(friendId)) {
            alert('❌ No puedes chatear con un usuario bloqueado');
            return;
        }

        setIsCreatingChat(true);
        lastChatCreationRef.current = now;

        try {
            const existingChat = findExistingPrivateChat(friendId);
            
            if (existingChat) {
                const isArchived = archivedChats.some(c => c.id === existingChat.id);
                if (isArchived) {
                    await unarchiveChat(existingChat.id);
                    await loadActiveChats();
                    await loadArchivedChats();
                }

                const friendData = friends.find(f => f.friend?.id === friendId);
                const status = friendData?.friend?.status;
                const lastSeen = friendData?.friend?.last_seen || null;
                const isOnline = isActuallyOnline(status, lastSeen);
                
                if (socket) {
                    markAsRead(existingChat.id);
                }
                
                onSelectChat(
                    existingChat.id,
                    friendName,
                    isOnline,
                    lastSeen
                );
                return;
            }

            const newChat = await createChat([friendId], 'private', friendName);
            if (newChat) {
                await loadActiveChats();
                const friendData = friends.find(f => f.friend?.id === friendId);
                const status = friendData?.friend?.status;
                const lastSeen = friendData?.friend?.last_seen || null;
                const isOnline = isActuallyOnline(status, lastSeen);
                
                onSelectChat(
                    newChat.id,
                    friendName,
                    isOnline,
                    lastSeen
                );
            }
        } catch (error) {
            console.error('Error al crear chat:', error);
            alert('❌ Error al crear el chat');
        } finally {
            setIsCreatingChat(false);
        }
    }, [findExistingPrivateChat, blockedUsers, createChat, unarchiveChat, loadActiveChats, loadArchivedChats, friends, onSelectChat, isActuallyOnline, archivedChats, socket, markAsRead]);

    const handleEditName = useCallback((friendId: string, newName: string) => {
        setCustomNames(prev => new Map(prev).set(friendId, newName));
        const saved = JSON.parse(localStorage.getItem('customFriendNames') || '{}');
        saved[friendId] = newName;
        localStorage.setItem('customFriendNames', JSON.stringify(saved));
    }, []);

    const handleDeleteChat = useCallback(async (chatId: string, chatName: string) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el chat con ${chatName}?`)) return;

        try {
            await deleteChatService(chatId);
            await loadActiveChats();
            await loadArchivedChats();
            if (selectedChatId === chatId) onSelectChat(null);
            alert('✅ Chat eliminado');
        } catch (error) {
            alert('❌ Error al eliminar chat');
        }
    }, [selectedChatId, onSelectChat, loadActiveChats, loadArchivedChats]);

    const handleBlockUser = useCallback(async (friendId: string | undefined, friendName: string) => {
        if (!friendId) {
            alert('❌ Error: ID de usuario no válido');
            return;
        }
        if (!window.confirm(`¿Estás seguro de que quieres bloquear a ${friendName}?`)) return;

        try {
            await blockUser(friendId);
            await loadFriends();
            setBlockedUsers(prev => new Set([...prev, friendId]));
            alert(`✅ Usuario ${friendName} bloqueado`);
        } catch (error) {
            alert('❌ Error al bloquear usuario');
        }
    }, [blockUser, loadFriends]);

    const handleArchiveChat = useCallback(async (chatId: string) => {
        await archiveChat(chatId);
        await loadActiveChats();
        await loadArchivedChats();
        if (selectedChatId === chatId) onSelectChat(null);
    }, [archiveChat, loadActiveChats, loadArchivedChats, selectedChatId, onSelectChat]);

    const handleUnarchiveChat = useCallback(async (chatId: string) => {
        await unarchiveChat(chatId);
        await loadActiveChats();
        await loadArchivedChats();
        onSelectChat(chatId);
    }, [unarchiveChat, loadActiveChats, loadArchivedChats, onSelectChat]);

    const handleSearchUser = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendEmail) return;

        setSearching(true);
        setSearchError('');
        setSearchResult(null);

        try {
            const response = await searchUsersService(friendEmail);
            if (response.success && response.data) {
                setSearchResult(response.data);
            } else {
                setSearchError('Usuario no encontrado');
            }
        } catch (err) {
            setSearchError('Error al buscar usuario');
        } finally {
            setSearching(false);
        }
    }, [friendEmail]);

    const handleSendFriendRequest = useCallback(async (friendId: string) => {
        try {
            await sendRequest(friendId);
            setSearchResult(null);
            setFriendEmail('');
            setShowAddFriend(false);
            alert('✅ Solicitud de amistad enviada');
        } catch (err) {
            alert('❌ Error al enviar solicitud');
        }
    }, [sendRequest]);

    const acceptedFriends = useMemo(() =>
        friends.filter(f => f.status === 'accepted'),
        [friends]
    );

    const renderChatList = useCallback((chats: any[], showArchiveButton = true) => (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {chats.length === 0 ? (
            <div className="p-50 text-center text-gray-400 text-sm">
                <div className="text-4xl mb-4">{showArchiveButton ? '💬' : '📦'}</div>
                <p>{showArchiveButton ? 'No hay chats aún' : 'No hay chats archivados'}</p>
                {showArchiveButton && <p className="text-xs mt-1">Agrega amigos para empezar</p>}
            </div>
        ) : (
            chats.map(chat => {
                const { displayName, avatar, avatarBg, isOnline, lastSeen } = getFriendInfoFromChat(chat);
                const unreadCount = unreadCounts.get(chat.id) || 0;

                return (
                    <ChatItem
                        key={chat.id}
                        chat={chat}
                        displayName={displayName}
                        avatar={avatar}
                        avatarBg={avatarBg}
                        isOnline={isOnline}
                        lastSeen={lastSeen}
                        unreadCount={unreadCount}
                        selectedChatId={selectedChatId}
                        user={user}
                        onSelectChat={onSelectChat}
                        onClearUnread={clearUnreadCount}
                        onMarkAsRead={(chatId) => {
                            if (socket) {
                                markAsRead(chatId);
                            }
                        }}
                        onArchiveChat={handleArchiveChat}
                        onUnarchiveChat={handleUnarchiveChat}
                        onDeleteChat={handleDeleteChat}
                        showArchiveButton={showArchiveButton}
                    />
                );
            })
        )}
    </div>
), [getFriendInfoFromChat, onSelectChat, selectedChatId, unreadCounts, user, handleDeleteChat, handleArchiveChat, handleUnarchiveChat, clearUnreadCount, onClearUnread, socket, markAsRead]);

    if (friendsLoading) {
        return (
            <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Cargando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 mb-2">
    {[
        { id: 'chats', label: '💬 Chats', badge: totalUnread },
        { id: 'friends', label: '👥 Amigos' },
        { id: 'requests', label: '📨 Solicitudes', badge: pendingRequests.length },
        { id: 'archived', label: '📦 Archivados' }
    ].map(tab => (
        <button
            key={tab.id}
            onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'requests') loadPendingRequests();
            }}
            className={`flex-1 py-2  font-medium rounded-lg transition relative flex items-center justify-center ${
                activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
        >
            <span className="flex items-center justify-center gap-1">
                {tab.label}
                {tab.badge ? (
                    <span className="ml-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1.5 animate-pulse">
                        {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                ) : null}
            </span>
        </button>
    ))}
</div>

                <button
                    onClick={() => {
                        setShowAddFriend(!showAddFriend);
                        setSearchResult(null);
                        setSearchError('');
                        setFriendEmail('');
                    }}
                    className="w-full mt-2 py-2.5 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Amigo
                </button>

                {showAddFriend && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">🔍 Busca por email</p>
                        <form onSubmit={handleSearchUser} className="flex gap-2">
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={friendEmail}
                                onChange={e => setFriendEmail(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={searching}
                                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                            >
                                {searching ? '...' : 'Buscar'}
                            </button>
                        </form>

                        {searching && <div className="mt-3 text-center text-gray-500 text-sm">Buscando usuario...</div>}
                        {searchError && <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">{searchError}</div>}

                        {searchResult && (
                            <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                                            {searchResult.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{searchResult.username}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{searchResult.email}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className={`w-2 h-2 rounded-full ${searchResult.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                <span className="text-xs text-gray-400">{searchResult.status === 'online' ? 'En línea' : 'Offline'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSendFriendRequest(searchResult.id)}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition shadow-md flex-shrink-0"
                                    >
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'chats' && renderChatList(activeChats, true)}
                {activeTab === 'archived' && renderChatList(archivedChats, false)}

                {activeTab === 'friends' && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {acceptedFriends.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <div className="text-4xl mb-2">👥</div>
                                <p>No hay amigos aún</p>
                                <p className="text-xs mt-1">Agrega amigos para chatear</p>
                            </div>
                        ) : (
                            <>
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amigos</h3>
                                </div>
                                {acceptedFriends.map(friend => {
                                    const originalName = friend.friend?.username || 'Usuario';
                                    const displayName = customNames.get(friend.friend!.id) || originalName;
                                    const status = friend.friend?.status;
                                    const lastSeen = friend.friend?.last_seen || null;
                                    const isOnline = isActuallyOnline(status, lastSeen);
                                    const avatar = displayName.charAt(0).toUpperCase();

                                    return (
                                        <div
                                            key={friend.id}
                                            className="flex items-center justify-between p-4 transition group border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {avatar}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
                                                        isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                                    }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-800 dark:text-white truncate">{displayName}</h3>
                                                    <p className="text-xs">
                                                        {isOnline ? (
                                                            <span className="text-green-500">🟢 En línea</span>
                                                        ) : (
                                                            <span className="text-gray-500">{formatLastSeen(lastSeen)}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                                <FriendMenu
                                                    friendName={displayName}
                                                    friendEmail={friend.friend?.email || ''}
                                                    friendStatus={friend.friend?.status || 'offline'}
                                                    onSendMessage={() => startChat(friend.friend!.id, displayName)}
                                                    onEditName={(newName) => handleEditName(friend.friend!.id, newName)}
                                                    onBlock={() => handleBlockUser(friend.friend?.id, displayName)}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div>
                        {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <div className="text-4xl mb-2">📨</div>
                                <p>No hay solicitudes</p>
                            </div>
                        ) : (
                            <>
                                {pendingRequests.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recibidas</h3>
                                        </div>
                                        {pendingRequests.map(req => (
                                            <div key={req.id} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                                                        {req.friend?.username?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-800 dark:text-white truncate">{req.friend?.username}</p>
                                                        <p className="text-xs text-gray-500">📨 Quiere ser tu amigo</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => acceptRequest(req.id)}
                                                        className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition shadow-sm"
                                                    >
                                                        Aceptar
                                                    </button>
                                                    <button
                                                        onClick={() => rejectRequest(req.id)}
                                                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition shadow-sm"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {sentRequests.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Enviadas</h3>
                                        </div>
                                        {sentRequests.map(req => (
                                            <div key={req.id} className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 opacity-70">
                                                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
                                                    {req.friend?.username?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 dark:text-white truncate">{req.friend?.username}</p>
                                                    <p className="text-xs text-yellow-500 flex items-center gap-1">
                                                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                                        Pendiente...
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;