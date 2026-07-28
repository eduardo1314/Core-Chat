import React, { useState, useRef, useEffect } from 'react';
import { useStories } from '../../hooks/useStories';
import { useAuth } from '../../hooks/useAuth';
import type { Story } from '../../types';
import StoryEditor from '../story/StoryEditor';
import StoryViewer from '../story/StoryViewer';

// ============================================
// ICONOS
// ============================================

type IconProps = React.SVGProps<SVGSVGElement>;

/**
 * Icono de más (agregar historia)
 */
const Plus: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// ============================================
// COMPONENTE: Mi Historia
// ============================================

/**
 * Componente que muestra la historia del usuario actual
 * Aparece con un botón "+" para agregar nueva historia
 */
const MyStoryItem: React.FC<{
    user: {
        userId: string;
        username: string;
        avatar: string;
        stories: Story[];
        viewed: boolean;
    };
    onClick: () => void;
    onAddStory: () => void;
}> = ({ user, onClick, onAddStory }) => {
    const hasStories = user.stories.length > 0;

    return (
        <div 
            className="flex items-center gap-4 cursor-pointer transition rounded-lg group p-2"
            onClick={hasStories ? onClick : undefined}
        >
            {/* Avatar con anillo de gradiente si tiene historias */}
            <div className="relative flex-shrink-0">
                <div className={`
                    w-14 h-14 rounded-full p-[2px]
                    ${hasStories 
                        ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' 
                        : 'bg-gray-300 dark:bg-gray-700'
                    }
                `}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 p-[2px]">
                        <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                        />
                    </div>
                </div>

                {/* Botón "+" para agregar historia */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddStory();
                    }}
                    className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-0.5 border-2 border-white dark:border-gray-900 shadow-lg shadow-blue-500/30 hover:scale-110 transition"
                >
                    <Plus className="w-3.5 h-3.5 text-white" />
                </button>
            </div>

            {/* Información del usuario */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800 dark:text-white truncate">
                        {hasStories ? 'Mi historia' : 'Agregar historia'}
                    </h4>
                    {hasStories && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(user.stories[0]?.timestamp || Date.now()).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    {hasStories ? (
                        <span className="text-xs text-gray-400">
                            {user.stories.length} {user.stories.length === 1 ? 'historia' : 'historias'}
                        </span>
                    ) : (
                        <span className="text-xs text-blue-500 font-medium">
                            Toca para agregar
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// COMPONENTE: Story Item (Amigos)
// ============================================

/**
 * Componente que muestra la historia de un amigo
 */
const StoryListItem: React.FC<{
    user: {
        userId: string;
        username: string;
        avatar: string;
        stories: Story[];
        viewed: boolean;
    };
    onClick: () => void;
}> = ({ user, onClick }) => {
    const hasUnviewed = !user.viewed;

    return (
        <div 
            className="flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition rounded-lg group p-2"
            onClick={onClick}
        >
            {/* Avatar con anillo de gradiente si tiene historias no vistas */}
            <div className="relative flex-shrink-0">
                <div className={`
                    w-14 h-14 rounded-full p-[2px]
                    ${hasUnviewed 
                        ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' 
                        : 'bg-gray-300 dark:bg-gray-700'
                    }
                `}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 p-[2px]">
                        <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                        />
                    </div>
                </div>

                {/* Punto rojo de "nueva" historia */}
                {hasUnviewed && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                )}
            </div>

            {/* Información del usuario */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800 dark:text-white truncate">
                        {user.username}
                    </h4>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(user.stories[0]?.timestamp || Date.now()).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                        {user.stories.length} {user.stories.length === 1 ? 'historia' : 'historias'}
                    </span>
                    {hasUnviewed && (
                        <span className="text-[10px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            Nueva
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// INTERFACES
// ============================================

interface StoriesProps {
    stories?: Story[];
    currentUserId?: string;
    onStoryClick?: (storyId: string) => void;
    onViewStory?: (storyId: string) => void;
    onLikeStory?: (storyId: string) => void;
    onSendMessage?: (storyId: string, message: string) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

/**
 * Componente principal de historias
 * Muestra una lista vertical de historias de amigos y la propia
 * Permite crear nuevas historias y verlas en un viewer
 */
const Stories: React.FC<StoriesProps> = ({
    stories: propStories = [],
    currentUserId: propCurrentUserId,
    onStoryClick,
    onViewStory,
    onLikeStory,
    onSendMessage,
}) => {
    const { user } = useAuth();
    const { 
        stories: hookStories, 
        groupedStories,
        getUserStories,
        loading, 
        error,
        loadStories,
        createStory,
        deleteStory,
        likeStory,
        markAsViewed,
        leaveStory,
        refresh,
        isConnected,
    } = useStories();

    // Estados del componente
    const [selectedUserStories, setSelectedUserStories] = useState<Story[]>([]);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Obtener el ID del usuario actual
    const currentUserId = propCurrentUserId || user?.id || 'me';
    const currentUserAvatar = user?.avatar_url || '';

    // Obtener historias del usuario actual
    const myStories = getUserStories(currentUserId);

    // Agrupar historias
    const myUserGroup = {
        userId: currentUserId,
        username: 'Mi historia',
        avatar: currentUserAvatar,
        stories: myStories,
        viewed: false,
    };

    const friendsGroups = groupedStories.filter(group => group.userId !== currentUserId);

    const displayGroups = [
        myUserGroup,
        ...friendsGroups,
    ];

    /**
     * Carga inicial de historias
     */
    useEffect(() => {
        if (hookStories.length === 0 && propStories.length === 0) {
            loadStories();
        }
    }, []);

    /**
     * Maneja el click en un usuario para ver sus historias
     */
    const handleUserClick = (userId: string) => {
        const userStories = getUserStories(userId);
        if (userStories.length === 0) return;

        // Marcar historias como vistas
        userStories.forEach(story => {
            if (!story.viewed && !story.isOwn) {
                markAsViewed(story.id);
            }
        });

        setSelectedUserStories(userStories);
        setSelectedStoryIndex(0);
        setIsViewerOpen(true);

        if (onStoryClick && userStories[0]) {
            onStoryClick(userStories[0].id);
        }
    };

    /**
     * Cierra el viewer de historias
     */
    const handleCloseViewer = () => {
        setIsViewerOpen(false);
        setSelectedStoryIndex(null);
        setSelectedUserStories([]);
        if (selectedStoryIndex !== null && selectedUserStories[selectedStoryIndex]) {
            leaveStory(selectedUserStories[selectedStoryIndex].id);
        }
    };

    /**
     * Maneja el like en una historia
     */
    const handleLikeStory = (storyId: string) => {
        likeStory(storyId);
        if (onLikeStory) {
            onLikeStory(storyId);
        }
    };

    /**
     * Maneja el envío de un mensaje en una historia
     */
    const handleSendMessage = (storyId: string, message: string) => {
        if (onSendMessage) {
            onSendMessage(storyId, message);
        }
        handleCloseViewer();
    };

    /**
     * Maneja la selección de archivo para nueva historia
     */
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setSelectedFile(file);
        setShowEditor(true);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /**
     * Confirma la creación de la historia
     */
    const handleConfirmStory = async (data: {
        file: File;
        content: string;
        location: string;
        music: string;
        music_artist: string;
        music_duration: number | null;
        music_preview_url: string | null;
        backgroundColor: string;
        fontColor: string;
        fontSize: string;
        textPosition?: { x: number; y: number };
        textScale?: number;
    }) => {
        try {
            setIsUploading(true);
            
            const storyData = {
                content: data.content || '',
                location: data.location || '',
                music: data.music || '',
                music_artist: data.music_artist || '',
                music_duration: data.music_duration ?? undefined,
                music_preview_url: data.music_preview_url ?? undefined,
                backgroundColor: data.backgroundColor || '#000000',
                fontColor: data.fontColor || '#FFFFFF',
                fontSize: data.fontSize || 'medium',
                textPosition: data.textPosition,
                textScale: data.textScale,
            };

            await createStory(data.file, storyData);
            
            setShowEditor(false);
            setSelectedFile(null);
        } catch (error) {
            console.error('❌ Error al crear historia:', error);
            alert('Error al crear la historia');
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Abre el selector de archivos para agregar historia
     */
    const handleAddStory = () => {
        fileInputRef.current?.click();
    };

    // Estados de carga y error
    if (loading) {
        return (
            <div className="py-4 px-3 text-center text-gray-400 text-sm">
                Cargando historias...
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-4 px-3 text-center text-red-400 text-sm">
                Error: {error}
                <button 
                    onClick={refresh}
                    className="ml-2 text-blue-500 hover:text-blue-600 underline"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <>
            {/* ============================================
                LISTA DE HISTORIAS
                ============================================ */}
            <div className="py-2 px-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-yellow-400 to-pink-500 rounded-full" />
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                            Historias
                        </h3>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                            {displayGroups.length}
                        </span>
                        {!isConnected && (
                            <span className="text-[10px] text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                                Sin conexión
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={handleAddStory}
                        disabled={isUploading}
                        className="text-xs text-blue-500 dark:text-blue-400 font-medium hover:text-blue-600 transition disabled:opacity-50 flex items-center gap-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {isUploading ? 'Subiendo...' : 'Agregar'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>

                {/* Lista vacía */}
                {displayGroups.length === 0 || displayGroups.every(g => g.stories.length === 0) ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        <div className="text-4xl mb-2">📸</div>
                        <p>No hay historias</p>
                        <p className="text-xs mt-1">Agrega tu primera historia</p>
                        <button 
                            onClick={handleAddStory}
                            disabled={isUploading}
                            className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50"
                        >
                            {isUploading ? 'Subiendo...' : '+ Crear historia'}
                        </button>
                    </div>
                ) : (
                    /* Lista de historias */
                    <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide">
                        {displayGroups.map((user) => {
                            const isOwn = user.userId === currentUserId;
                            
                            if (isOwn) {
                                return (
                                    <MyStoryItem
                                        key={user.userId}
                                        user={user}
                                        onClick={() => handleUserClick(user.userId)}
                                        onAddStory={handleAddStory}
                                    />
                                );
                            }
                            
                            return (
                                <StoryListItem
                                    key={user.userId}
                                    user={user}
                                    onClick={() => handleUserClick(user.userId)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ============================================
                STORY VIEWER
                ============================================ */}
            {isViewerOpen && selectedStoryIndex !== null && selectedUserStories.length > 0 && (
                <StoryViewer
                    stories={selectedUserStories}
                    initialIndex={selectedStoryIndex}
                    onClose={handleCloseViewer}
                    onLike={handleLikeStory}
                    onSendMessage={handleSendMessage}
                    onViewStory={(storyId) => {
                        markAsViewed(storyId);
                        if (onViewStory) {
                            onViewStory(storyId);
                        }
                    }}
                    onDeleteStory={async (storyId) => {
                        try {
                            await deleteStory(storyId);
                            handleCloseViewer();
                            refresh();
                        } catch (error) {
                            console.error('❌ Error al eliminar historia:', error);
                            alert('Error al eliminar la historia');
                        }
                    }}
                />
            )}

            {/* ============================================
                STORY EDITOR
                ============================================ */}
            {showEditor && selectedFile && (
                <StoryEditor
                    file={selectedFile}
                    onClose={() => {
                        setShowEditor(false);
                        setSelectedFile(null);
                    }}
                    onConfirm={handleConfirmStory}
                    isUploading={isUploading}
                />
            )}

            {/* ============================================
                ESTILOS
                ============================================ */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
};

export default Stories;