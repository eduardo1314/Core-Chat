import React, { useState, useRef, useEffect } from 'react';

interface FriendMenuProps {
    friendName: string;
    friendEmail: string;
    friendStatus: string;
    onSendMessage: () => void;
    onEditName: (newName: string) => void;
    onBlock: () => void;
}

const FriendMenu: React.FC<FriendMenuProps> = ({
    friendName,
    friendEmail,
    onSendMessage,
    onEditName,
    onBlock
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(friendName);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsEditing(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSaveName = () => {
        if (newName.trim() && newName !== friendName) {
            onEditName(newName.trim());
        }
        setIsEditing(false);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Opciones"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {friendName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{friendName}</p>
                                <p className="text-xs text-gray-500 truncate">{friendEmail}</p>
                            </div>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleSaveName}
                                    className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                                >
                                    Guardar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setNewName(friendName);
                                    }}
                                    className="flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    onSendMessage();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                            >
                                <span className="text-lg">💬</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Enviar mensaje</span>
                            </button>

                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
                            >
                                <span className="text-lg">✏️</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Editar nombre</span>
                            </button>

                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                            <button
                                onClick={() => {
                                    onBlock();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left"
                            >
                                <span className="text-lg">🚫</span>
                                <span className="text-sm text-red-600 dark:text-red-400">Bloquear</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default FriendMenu;
