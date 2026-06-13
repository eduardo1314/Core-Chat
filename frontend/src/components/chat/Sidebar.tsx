import React, { useState } from 'react';
import { useFriends } from '../../hooks/useFriends';
import { useChats } from '../../hooks/useChats';
import { useAuth } from '../../hooks/useAuth';
import { searchUsersService } from '../../services/user.service';

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
        loadPendingRequests
    } = useFriends();
    const { activeChats, archivedChats, createChat, archiveChat, unarchiveChat } = useChats();
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendEmail, setFriendEmail] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'requests' | 'archived'>('chats');

  const startChat = async (friendId: string) => {
    // Primero buscar si ya existe un chat
    const existingChat = activeChats.find(chat => 
        chat.type === 'private' && 
        chat.Participants?.some((p: any) => p.id === friendId)
    );
    
    if (existingChat) {
        onSelectChat(existingChat.id);
        return;
    }
    
    // Solo crear si no existe y el amigo existe
    if (friendId && friendId !== user?.id) {
        const newChat = await createChat([friendId], 'private');
        if (newChat) {
            onSelectChat(newChat.id);
        }
    }
};

    const handleArchiveChat = async (chatId: string) => {
        await archiveChat(chatId);
        if (selectedChatId === chatId) {
            onSelectChat(null);
        }
    };

    const handleUnarchiveChat = async (chatId: string) => {
        await unarchiveChat(chatId);
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

    if (friendsLoading) {
        return (
            <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Cargando...</div>
                </div>
            </div>
        );
    }

    // Función para renderizar la lista de chats (CORREGIDA)
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
                    
                    if (chat.type === 'private') {
                        // Buscar el otro participante
                        if (chat.Participants && chat.Participants.length > 0) {
                            const otherUser = chat.Participants.find((p: any) => p.id !== user?.id);
                            if (otherUser && otherUser.username) {
                                displayName = otherUser.username;
                                avatar = displayName.charAt(0).toUpperCase();
                                avatarBg = 'from-blue-500 to-cyan-500';
                            }
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
                                <div className={`w-12 h-12 bg-gradient-to-r ${avatarBg} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                    {avatar === '👤' || avatar === '💬' ? avatar : avatar}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-gray-800 dark:text-white">{displayName}</h3>
                                        {chat.lastMessage && (
                                            <span className="text-xs text-gray-400">
                                                {new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    {chat.lastMessage && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {chat.lastMessage.sender.id === user?.id ? 'Tú: ' : ''}
                                            {chat.lastMessage.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {showArchiveButton && (
                                <button
                                    onClick={() => handleArchiveChat(chat.id)}
                                    className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition"
                                    title="Archivar"
                                >
                                    📦
                                </button>
                            )}
                            {!showArchiveButton && (
                                <button
                                    onClick={() => handleUnarchiveChat(chat.id)}
                                    className="mr-4 p-2 text-gray-400 hover:text-green-500 transition opacity-0 group-hover:opacity-100"
                                    title="Desarchivar"
                                >
                                    📂
                                </button>
                            )}
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
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                            activeTab === 'chats' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        💬 Chats
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
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
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
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition shadow-md"
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
                        {friends.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <div className="text-4xl mb-2">👥</div>
                                <p>No hay amigos aún</p>
                                <p className="text-xs mt-1">Agrega amigos para chatear</p>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <div
                                    key={friend.id}
                                    onClick={() => startChat(friend.friend!.id)}
                                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition group"
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition">
                                            {friend.friend!.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
                                            friend.friend!.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                        }`}></div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-800 dark:text-white">{friend.friend!.username}</h3>
                                        <p className="text-xs text-gray-400">{friend.friend!.status === 'online' ? 'En línea' : 'Desconectado'}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </div>
                            ))
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
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                                        {req.friend?.username?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-white">{req.friend?.username}</p>
                                                        <p className="text-xs text-gray-500">📨 Quiere ser tu amigo</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
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
                                                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500">
                                                    {req.friend?.username?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800 dark:text-white">{req.friend?.username}</p>
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
