import React, { useState, useRef, useEffect } from 'react';
import { useAvatar } from '../hooks/useProfile';

interface ProfileProps {
    currentAvatar?: string | null;
    onAvatarUpdated?: (url: string) => void;
    onAvatarRemoved?: () => void;
    onError?: (error: string) => void;
    className?: string;
    size?: number;
}

const Profile: React.FC<ProfileProps> = ({
    currentAvatar,
    onAvatarUpdated,
    onError,
    className = '',
    size = 120
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const {
        fileInputRef,
        preview,
        loading,
        error,
        progress,
        hasAvatar,
        upload,
        remove,
        clearError,
        openFilePicker,
        handleFileSelect  
    } = useAvatar({
        currentAvatar,
        onSuccess: onAvatarUpdated,
        onError
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Input oculto - CAMBIADO onChange */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}  
                className="hidden"
            />

            <div 
                className="relative rounded-full overflow-hidden cursor-pointer border-4 border-white shadow-lg hover:opacity-90 transition-opacity"
                style={{
                    width: size,
                    height: size,
                }}
                onClick={openFilePicker}
            >
                {preview ? (
                    <img 
                        src={preview} 
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white">
                        <span className="text-4xl">👤</span>
                        <span className="text-xs mt-1 font-medium">Subir</span>
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-green-400 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="mt-2 text-xs font-medium">{progress}%</span>
                    </div>
                )}

                {!loading && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                )}
            </div>

            {hasAvatar && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700"
                        title="Opciones de avatar"
                    >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    upload();
                                }}
                                disabled={loading}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition disabled:opacity-50"
                            >
                                Guardar avatar
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    remove();
                                }}
                                disabled={loading}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition border-t border-gray-200 dark:border-gray-700 disabled:opacity-50"
                            >
                                Eliminar avatar
                            </button>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-full min-w-[200px] bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg px-4 py-2 text-center shadow-lg">
                    <span>{error}</span>
                    <button
                        onClick={clearError}
                        className="ml-2 font-bold hover:text-red-800 dark:hover:text-red-300 transition"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export default Profile;