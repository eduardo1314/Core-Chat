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
    onSelectChat,
    onClearUnread,
    onMarkAsRead,
    onArchiveChat,
    onUnarchiveChat,
    onDeleteChat,
    showArchiveButton
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [imageError, setImageError] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setImageError(false);
    }, [avatar]);

    const handleSelect = () => {
        onClearUnread(chat.id);
        onMarkAsRead(chat.id);
        onSelectChat(chat.id, displayName, avatarUrl || null, isOnline, lastSeen);
    };

    const renderAvatar = () => {
        const isImageUrl = avatar?.startsWith('http') || avatar?.startsWith('https');

        if (isImageUrl && !imageError) {
            return (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 shadow-md">
                    <img
                        src={avatar}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                </div>
            );
        }

        if (avatar === '👤' || avatar === '💬' || avatar.length <= 2) {
            return (
                <div className={`w-12 h-12 bg-gradient-to-r ${avatarBg} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
                    {avatar === '👤' || avatar === '💬' ? avatar : avatar}
                </div>
            );
        }

        return (
            <div className={`w-12 h-12 bg-gradient-to-r ${avatarBg} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
                {displayName?.charAt(0).toUpperCase() || '?'}
            </div>
        );
    };

    return (
        <div className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 transition relative">
            <div
                onClick={handleSelect}
                className={`flex items-start gap-3 p-4 flex-1 cursor-pointer ${
                    selectedChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
            >
                <div className="relative flex-shrink-0 mt-1">
                    {renderAvatar()}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {chat.lastMessage.sender?.id === user?.id ? 'Tú: ' : ''}
                            {chat.lastMessage.content}
                        </p>
                    )}
                </div>
            </div>

            <div className="relative flex-shrink-0 mr-3 self-start mt-5" ref={menuRef}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    title="Opciones del chat"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                    </svg>
                </button>

                {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                        {showArchiveButton ? (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        onArchiveChat(chat.id);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition"
                                >
                                    <span className="w-5 text-center"></span>
                                    Archivar chat
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        onDeleteChat(chat.id, displayName);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition border-t border-gray-200 dark:border-gray-700"
                                >
                                    <span className="w-5 text-center"></span>
                                    Eliminar chat
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    onUnarchiveChat(chat.id);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition"
                            >
                                <span className="w-5 text-center"></span>
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