import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFriends } from '../../hooks/useFriends';
import { useChats } from '../../hooks/useChats';
import { useAuth } from '../../hooks/useAuth';
import { searchUsersService } from '../../services/user.service';
import { deleteChatService } from '../../services/chats.service';
import { getUnreadCountService, getTotalUnreadCountService } from '../../services/messages.service'; 
import FriendMenu from '../common/FriendMenu';

interface SidebarProps {
    onSelectChat: (chatId: string | null) => void;
    selectedChatId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
    const { user } = useAuth();
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
        unblockUser,
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
    
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendEmail, setFriendEmail] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'requests' | 'archived'>('chats');
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
    const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());
    const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map()); // ✅ NUEVO: conteo de no leídos por chat
    const [totalUnread, setTotalUnread] = useState(0); // ✅ NUEVO: total de no leídos
    
    // Ref para prevenir clics múltiples
    const [lastChatCreation, setLastChatCreation] = useState<number>(0);

    // Cargar nombres personalizados guardados
    useEffect(() => {
        const saved = localStorage.getItem('customFriendNames');
        if (saved) {
            setCustomNames(new Map(Object.entries(JSON.parse(saved))));
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

    // ✅ NUEVO: Cargar conteo de no leídos
    const loadUnreadCounts = useCallback(async () => {
        try {
            // Obtener total de no leídos
            const totalResponse = await getTotalUnreadCountService();
            if (totalResponse.success) {
                setTotalUnread(totalResponse.data?.totalUnread || 0);
            }

            // Obtener no leídos por chat
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
    }, [activeChats]);

    // ✅ Cargar no leídos cuando cambian los chats
    useEffect(() => {
        if (activeChats.length > 0) {
            loadUnreadCounts();
        }
    }, [activeChats, loadUnreadCounts]);

    // ✅ CORREGIDO: Buscar en TODOS los chats y prevenir duplicados
    const startChat = async (friendId: string, friendName: string) => {
        if (!friendId || isCreatingChat) return;
        
        const now = Date.now();
        if (now - lastChatCreation < 1000) {
            console.log('⏳ Preveniendo creación duplicada de chat');
            return;
        }
        
        if (blockedUsers.has(friendId)) {
            alert('❌ No puedes chatear con un usuario bloqueado');
            return;
        }
        
        setIsCreatingChat(true);
        setLastChatCreation(now);
        
        try {
            const allChats = [...activeChats, ...archivedChats];
            
            const existingChat = allChats.find(chat => {
                if (chat.type !== 'private') return false;
                const participants = chat.Participants || [];
                const hasFriend = participants.some((p: any) => p.id === friendId);
                const hasCurrentUser = participants.some((p: any) => p.id === user?.id);
                return hasFriend && hasCurrentUser;
            });
            
            if (existingChat) {
                const isArchived = archivedChats.some(c => c.id === existingChat.id);
                if (isArchived) {
                    await unarchiveChat(existingChat.id);
                    await loadActiveChats();
                    await loadArchivedChats();
                }
                onSelectChat(existingChat.id);
                return;
            }
            
            const newChat = await createChat([friendId], 'private', friendName);
            if (newChat) {
                await loadActiveChats();
                onSelectChat(newChat.id);
            }
        } catch (error) {
            console.error('Error al crear chat:', error);
            alert('❌ Error al crear el chat');
        } finally {
            setIsCreatingChat(false);
        }
    };

    // ✅ Función para actualizar el nombre del chat
    const handleEditName = (friendId: string, newName: string) => {
        setCustomNames(prev => new Map(prev).set(friendId, newName));
        const saved = JSON.parse(localStorage.getItem('customFriendNames') || '{}');
        saved[friendId] = newName;
        localStorage.setItem('customFriendNames', JSON.stringify(saved));
    };

    const handleDeleteChat = async (chatId: string, chatName: string) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el chat con ${chatName}?`)) {
            try {
                await deleteChatService(chatId);
                await loadActiveChats();
                await loadArchivedChats();
                if (selectedChatId === chatId) {
                    onSelectChat(null);
                }
                alert('✅ Chat eliminado');
            } catch (error) {
                alert('❌ Error al eliminar chat');
            }
        }
    };

    const handleBlockUser = async (friendId: string | undefined, friendName: string) => {
        if (!friendId) {
            alert('❌ Error: ID de usuario no válido');
            return;
        }
        if (window.confirm(`¿Estás seguro de que quieres bloquear a ${friendName}?`)) {
            try {
                await blockUser(friendId);
                await loadFriends();
                setBlockedUsers(prev => new Set([...prev, friendId]));
                alert(`✅ Usuario ${friendName} bloqueado`);
            } catch (error) {
                alert('❌ Error al bloquear usuario');
            }
        }
    };

    const handleArchiveChat = async (chatId: string) => {
        await archiveChat(chatId);
        await loadActiveChats();
        await loadArchivedChats();
        if (selectedChatId === chatId) {
            onSelectChat(null);
        }
    };

    const handleUnarchiveChat = async (chatId: string) => {
        await unarchiveChat(chatId);
        await loadActiveChats();
        await loadArchivedChats();
        onSelectChat(chatId);
    };

    const handleSearchUser = async (e: React.FormEvent) => {
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
    };

    const handleSendFriendRequest = async (friendId: string) => {
        try {
            await sendRequest(friendId);
            setSearchResult(null);
            setFriendEmail('');
            setShowAddFriend(false);
            alert('✅ Solicitud de amistad enviada');
        } catch (err) {
            alert('❌ Error al enviar solicitud');
        }
    };

    // ✅ Memoizar amigos aceptados
    const acceptedFriends = useMemo(() => 
        friends.filter(f => f.status === 'accepted'),
        [friends]
    );

    if (friendsLoading) {
        return (
            <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Cargando...</div>
                </div>
            </div>
        );
    }

    // ✅ Renderizar lista de chats con indicador de no leídos
    const renderChatList = (chats: any[], showArchiveButton = true) => (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {chats.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                    <div className="text-4xl mb-2">{showArchiveButton ? '💬' : '📦'}</div>
                    <p>{showArchiveButton ? 'No hay chats aún' : 'No hay chats archivados'}</p>
                    {showArchiveButton && <p className="text-xs mt-1">Agrega amigos para empezar</p>}
                </div>
            ) : (
                chats.map(chat => {
                    let displayName = '';
                    let avatar = '';
                    let avatarBg = '';
                    const unreadCount = unreadCounts.get(chat.id) || 0; // ✅ Obtener no leídos
                    
                    if (chat.type === 'private') {
                        if (chat.Participants && chat.Participants.length > 0) {
                            const otherUser = chat.Participants.find((p: any) => p.id !== user?.id);
                            if (otherUser && otherUser.username) {
                                displayName = customNames.get(otherUser.id) || otherUser.username;
                                avatar = displayName.charAt(0).toUpperCase();
                                avatarBg = 'from-blue-500 to-cyan-500';
                            }
                        }
                        
                        if (!displayName && chat.name) {
                            displayName = chat.name;
                            avatar = displayName.charAt(0).toUpperCase();
                            avatarBg = 'from-blue-500 to-cyan-500';
                        }
                        
                        if (!displayName) {
                            displayName = 'Usuario';
                            avatar = '👤';
                            avatarBg = 'from-gray-500 to-gray-600';
                        }
                    } else if (chat.type === 'group') {
                        displayName = chat.name || 'Grupo';
                        avatar = displayName.charAt(0).toUpperCase();
                        avatarBg = 'from-purple-500 to-pink-500';
                    } else {
                        displayName = 'Chat';
                        avatar = '💬';
                        avatarBg = 'from-blue-500 to-cyan-500';
                    }
                    
                    return (
                        <div
                            key={chat.id}
                            className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            <div
                                onClick={() => onSelectChat(chat.id)}
                                className={`flex items-center gap-3 p-4 flex-1 cursor-pointer ${
                                    selectedChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                }`}
                            >
                                <div className="relative">
                                    <div className={`w-12 h-12 bg-gradient-to-r ${avatarBg} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                        {avatar === '👤' || avatar === '💬' ? avatar : avatar}
                                    </div>
                                    {/* ✅ Indicador de no leídos */}
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-gray-800 dark:text-white truncate">
                                            {displayName}
                                        </h3>
                                        {chat.lastMessage && (
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                {new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    {chat.lastMessage && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {chat.lastMessage.sender?.id === user?.id ? 'Tú: ' : ''}
                                            {chat.lastMessage.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 mr-2 flex-shrink-0">
                                {showArchiveButton && (
                                    <>
                                        <button
                                            onClick={() => handleDeleteChat(chat.id, displayName)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                            title="Eliminar chat"
                                        >
                                            🗑️
                                        </button>
                                        <button
                                            onClick={() => handleArchiveChat(chat.id)}
                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition"
                                            title="Archivar"
                                        >
                                            📦
                                        </button>
                                    </>
                                )}
                                {!showArchiveButton && (
                                    <button
                                        onClick={() => handleUnarchiveChat(chat.id)}
                                        className="p-2 text-gray-400 hover:text-green-500 transition opacity-0 group-hover:opacity-100"
                                        title="Desarchivar"
                                    >
                                        📂
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    return (
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* Header con tabs */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition relative ${
                            activeTab === 'chats' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        💬 Chats
                        {/* ✅ Total de no leídos en el tab */}
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                                {totalUnread > 9 ? '9+' : totalUnread}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                            activeTab === 'friends' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        👥 Amigos
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('requests');
                            loadPendingRequests();
                        }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition relative ${
                            activeTab === 'requests' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        📨 Solicitudes
                        {pendingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                            activeTab === 'archived' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        📦 Archivados
                    </button>
                </div>
                
                {/* Botón agregar amigo */}
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
                
                {/* Panel de búsqueda */}
                {showAddFriend && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">🔍 Busca por email</p>
                        <form onSubmit={handleSearchUser} className="flex gap-2">
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={friendEmail}
                                onChange={(e) => setFriendEmail(e.target.value)}
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
                                            {searchResult.username.charAt(0).toUpperCase()}
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

            {/* Contenido según tab activo */}
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
                                    const isOnline = friend.friend?.status === 'online';
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
                                                    }`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-800 dark:text-white truncate">{displayName}</h3>
                                                    <p className="text-xs text-gray-400">{isOnline ? 'En línea' : 'Desconectado'}</p>
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
                                {/* Solicitudes recibidas */}
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
                                
                                {/* Solicitudes enviadas */}
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
                                                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
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