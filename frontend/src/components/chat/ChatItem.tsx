import React, { useState, useRef, useEffect } from 'react';

interface ChatItemProps {
    chat: any;
    displayName: string;
    avatar: string;
    avatarBg: string;
    isOnline: boolean;
    lastSeen: string | null;
    unreadCount: number;
    selectedChatId: string | null;
    user: any;
    avatarUrl?: string | null;
    typingUsers?: Map<string, string>;
    onSelectChat: (chatId: string, displayName: string, chatAvatar?: string | null, isOnline?: boolean, lastSeen?: string | null) => void;
    onClearUnread: (chatId: string) => void;
    onMarkAsRead: (chatId: string) => void;
    onArchiveChat: (chatId: string) => void;
    onUnarchiveChat: (chatId: string) => void;
    onDeleteChat: (chatId: string, displayName: string) => void;
    showArchiveButton: boolean;
}

const ChatItem: React.FC<ChatItemProps> = ({
    chat,
    displayName,
    avatar,
    avatarBg,
    isOnline,
    lastSeen,
    unreadCount,
    selectedChatId,
    user,
    avatarUrl,
    typingUsers = new Map(),
    onSelectChat,
    onClearUnread,
    onArchiveChat,
    onUnarchiveChat,
    onDeleteChat,
    showArchiveButton
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [, forceUpdate] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    useEffect(() => { setImageError(false); }, [avatar]);

    useEffect(() => {
        const i = setInterval(() => forceUpdate(p => p + 1), 10000);
        return () => clearInterval(i);
    }, []);

    const handleSelect = () => {
        if (chat.id === selectedChatId) return;
        onClearUnread(chat.id);
        onSelectChat(chat.id, displayName, avatarUrl || null, isOnline, lastSeen);
    };


    // funciones de palomitas en lista de chats
    const renderMessageStatusIcon = () => {
        if (!chat.lastMessage || chat.lastMessage.sender?.id !== user?.id) return null;
        const isRead = chat.lastMessage.is_read === true;
        const s = chat.lastMessage.status;
        if (isRead || s === 'read') return (
            <span className="relative flex items-center">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(3, 0)"/>
                </svg>
            </span>
        );
        if (s === 'delivered') return (
            <span className="relative flex items-center">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 13l4 4L19 7" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(3, 0)"/>
                </svg>
            </span>
        );
        if (s === 'sent') return (
            <span className="relative flex items-center">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 13l4 4L19 7" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(3, 0)"/>
                </svg>
            </span>
        );
        if (s === 'pending' || chat.lastMessage.pending) return (
            <svg className="w-3 h-3 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
            </svg>
        );
        return null;
    };

    //formato de tiempo de mensaje en chat
    const formatRelativeTime = (d: string) => {
        const diff = (Date.now() - new Date(d).getTime()) / 60000;
        if (diff < 1) return 'Ahora';
        if (diff < 60) return `${Math.floor(diff)} min`;
        if (diff < 1440) return `${Math.floor(diff / 60)} h`;
        if (diff < 10080) return `${Math.floor(diff / 1440)} d`;
        return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const renderTypingIndicator = () => {
        if (!typingUsers?.has(chat.id)) return null;
        return (
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex gap-[3px]">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs text-emerald-500 font-medium animate-pulse">escribiendo...</span>
            </div>
        );
    };

    const renderAvatar = () => {
        const isImg = avatar?.startsWith('http');
        if (isImg && !imageError) return (
            <div className="relative">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-blue-200 dark:group-hover:ring-blue-900/50 group-hover:shadow-xl transition-all duration-300">
                    <img src={avatar} alt={displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={() => setImageError(true)} loading="lazy" />
                </div>
                {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-[3px] ring-white dark:ring-gray-900 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    </span>
                )}
            </div>
        );
        return (
            <div className="relative">
                <div className={`w-12 h-12 bg-gradient-to-br ${avatarBg} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white dark:ring-gray-800 group-hover:shadow-xl transition-all duration-300`}>
                    {avatar === '👤' || avatar === '💬' ? <span className="text-xl">{avatar}</span> : <span>{displayName?.charAt(0).toUpperCase() || '?'}</span>}
                </div>
                {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-[3px] ring-white dark:ring-gray-900 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    </span>
                )}
            </div>
        );
    };

    const isSelected = selectedChatId === chat.id;

    return (
        <div className={`relative flex items-center group transition-all duration-300 ${
            isSelected 
                ? 'bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent dark:from-blue-900/20 dark:via-blue-900/10 dark:to-transparent' 
                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
        }`}>
            {isSelected && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/50"></div>
            )}

            <div
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                onClick={handleSelect}
                className={`flex items-start gap-3 p-3.5 flex-1 cursor-pointer transition-all duration-200 ${isPressed ? 'scale-[0.98]' : ''}`}
            >
                <div className="relative flex-shrink-0 mt-0.5">
                    {renderAvatar()}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg shadow-red-500/30 ring-[3px] ring-white dark:ring-gray-900">
                            {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-baseline gap-2">
                        <h3 className={`font-semibold truncate text-[15px] ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' 
                            : unreadCount > 0 ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                            {displayName}
                        </h3>
                    </div>

                    {typingUsers?.has(chat.id) ? renderTypingIndicator() : chat.lastMessage ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="flex-shrink-0">{renderMessageStatusIcon()}</span>
                            <p className={`text-[13px] truncate leading-relaxed ${
                                unreadCount > 0 ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                                {chat.lastMessage.sender?.id === user?.id && (
                                    <span className="text-gray-400 dark:text-gray-500 font-medium">Tú: </span>
                                )}
                                {chat.lastMessage.content}
                            </p>
                        </div>
                    ) : (
                        <p className="text-[13px] text-gray-400 dark:text-gray-600 italic mt-0.5">Sin mensajes aún</p>
                    )}
                </div>
            </div>

            <div className="relative flex-shrink-0 mr-2 self-start mt-4 flex flex-col items-center gap-0.5" ref={menuRef}>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className={`p-1.5 rounded-xl transition-all duration-200 ${
                        showMenu 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' 
                            : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100'
                    }`}
                    title="Opciones"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                    </svg>
                </button>

                {chat.lastMessage && (
                    <span className={`text-[10px] font-medium whitespace-nowrap ${
                        unreadCount > 0 ? 'text-blue-500 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                        {formatRelativeTime(chat.lastMessage.created_at)}
                    </span>
                )}

                {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 py-2 z-50 overflow-hidden animate-in">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700/50">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Opciones</p>
                        </div>
                        {showArchiveButton ? (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onArchiveChat(chat.id); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition font-medium"
                                >
                                    Archivar chat
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDeleteChat(chat.id, displayName); }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition font-medium border-t border-gray-100 dark:border-gray-700/50"
                                >
                                    Eliminar chat
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onUnarchiveChat(chat.id); }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition font-medium"
                            >
                                Desarchivar chat
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatItem;