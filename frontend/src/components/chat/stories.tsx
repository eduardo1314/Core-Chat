
import React, { useState, useRef, useEffect } from 'react';

// ============================================
// ICONOS
// ============================================
type IconProps = React.SVGProps<SVGSVGElement>;

const X: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const Plus: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ChevronLeft: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRight: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const Eye: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const Pause: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
);

const Heart: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.4l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
);

const Send: React.FC<IconProps> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

// ============================================
// TIPOS
// ============================================
interface Story {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    image: string;
    timestamp: string;
    viewed?: boolean;
    isOwn?: boolean;
    likes?: number;
    hasLiked?: boolean;
    location?: string;
}

interface StoriesProps {
    stories?: Story[];
    currentUserId?: string;
    onStoryClick?: (storyId: string) => void;
    onAddStory?: () => void;
    onViewStory?: (storyId: string) => void;
    onLikeStory?: (storyId: string) => void;
    onSendMessage?: (storyId: string) => void;
}

// ============================================
// COMPONENTE: Story Item (Formato Lista Vertical)
// ============================================
const StoryListItem: React.FC<{
    story: Story;
    isOwn?: boolean;
    onClick: () => void;
}> = ({ story, isOwn, onClick }) => {
    const hasUnviewed = !story.viewed && !isOwn;

    return (
        <div 
            className="flex items-center gap-4  hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition rounded-lg group"
            onClick={onClick}
        >
            {/* Avatar con anillo */}
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
                            src={story.avatar}
                            alt={story.username}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                        />
                    </div>
                </div>

                {/* Badge "Tu historia" */}
                {isOwn && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-0.5 border-2 border-white dark:border-gray-900">
                        <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                )}

                {/* Indicador de visto */}
                {story.viewed && !isOwn && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full p-0.5 border-2 border-white dark:border-gray-900">
                        <div className="w-3.5 h-3.5 rounded-full bg-gray-400 flex items-center justify-center">
                            <Eye className="w-2 h-2 text-white" />
                        </div>
                    </div>
                )}

                {/* Indicador de no visto (punto) */}
                {hasUnviewed && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                )}
            </div>

            {/* Información */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800 dark:text-white truncate">
                        {isOwn ? 'Tu historia' : story.username}
                    </h4>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(story.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    {story.location && (
                        <span className="text-xs text-gray-400 truncate">
                            📍 {story.location}
                        </span>
                    )}
                    {story.likes && story.likes > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            ❤️ {story.likes}
                        </span>
                    )}
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
// COMPONENTE: Story Viewer 
// ============================================
const StoryViewer: React.FC<{
    stories: Story[];
    initialIndex: number;
    onClose: () => void;
    onLike?: (storyId: string) => void;
    onSendMessage?: (storyId: string) => void;
}> = ({ 
    stories, 
    initialIndex, 
    onClose, 
    onLike,
    onSendMessage 
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [replyText, setReplyText] = useState('');
    const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentStory = stories[currentIndex];
    const duration = 5000;

    useEffect(() => {
        if (currentStory) {
            setLikesCount(currentStory.likes || 0);
            setLiked(currentStory.hasLiked || false);
        }
    }, [currentStory]);

    useEffect(() => {
        if (!currentStory || isPaused) return;

        setProgress(0);
        const startTime = Date.now();

        progressInterval.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                clearInterval(progressInterval.current!);
                if (currentIndex < stories.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    onClose();
                }
            }
        }, 50);

        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, [currentIndex, currentStory, isPaused, stories.length, onClose, duration]);

    useEffect(() => {
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }

        if (showControls) {
            controlsTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }

        return () => {
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
        };
    }, [showControls]);

    const handleTogglePause = () => {
        setIsPaused(!isPaused);
        setShowControls(true);
    };

    const handleLike = () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
        if (onLike) {
            onLike(currentStory.id);
        }
    };

    const handleSendReply = () => {
        if (replyText.trim() && onSendMessage) {
            onSendMessage(currentStory.id);
            setReplyText('');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
                setShowControls(true);
            } else if (e.key === 'ArrowRight' && currentIndex < stories.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setShowControls(true);
            } else if (e.key === 'Escape') {
                onClose();
            } else if (e.key === ' ') {
                e.preventDefault();
                handleTogglePause();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, stories.length, onClose]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        setIsPaused(true);
        setShowControls(true);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX.current - touchEndX;
        const diffY = touchStartY.current - touchEndY;

        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0 && currentIndex < stories.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else if (diffX < 0 && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            }
        }
        setIsPaused(false);
    };

    if (!currentStory) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            onClick={handleTogglePause}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="relative w-full max-w-md h-full max-h-[95vh] bg-black overflow-hidden">
                {/* Barra de progreso */}
                <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex gap-1 mb-3">
                        {stories.map((_, index) => (
                            <div key={index} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                                    style={{
                                        width: index === currentIndex 
                                            ? `${progress}%` 
                                            : index < currentIndex 
                                                ? '100%' 
                                                : '0%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={currentStory.avatar}
                                alt={currentStory.username}
                                className="w-8 h-8 rounded-full object-cover border border-white/20"
                            />
                            <div>
                                <p className="text-white font-semibold text-sm leading-tight">
                                    {currentStory.username}
                                </p>
                                <p className="text-white/50 text-[10px]">
                                    {new Date(currentStory.timestamp).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    {currentStory.location && ` • ${currentStory.location}`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="text-white/70 hover:text-white transition p-1"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Imagen */}
                <div className="w-full h-full flex items-center justify-center">
                    <img
                        src={currentStory.image}
                        alt={`Historia de ${currentStory.username}`}
                        className="w-full h-full object-contain"
                        style={{
                            transform: isPaused ? 'scale(1)' : 'scale(1.02)',
                            transition: 'transform 8s ease-in-out'
                        }}
                    />
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                {showControls && (
                    <>
                        {currentIndex > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(prev => prev - 1);
                                    setShowControls(true);
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-2 rounded-full hover:bg-white/10 backdrop-blur-sm"
                            >
                                <ChevronLeft className="w-7 h-7" />
                            </button>
                        )}
                        {currentIndex < stories.length - 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(prev => prev + 1);
                                    setShowControls(true);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-2 rounded-full hover:bg-white/10 backdrop-blur-sm"
                            >
                                <ChevronRight className="w-7 h-7" />
                            </button>
                        )}
                    </>
                )}

                {isPaused && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-black/50 backdrop-blur-md rounded-full p-6 border border-white/10 shadow-2xl">
                            <Pause className="w-12 h-12 text-white" />
                        </div>
                    </div>
                )}

                <div className={`
                    absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-8
                    bg-gradient-to-t from-black/80 via-black/50 to-transparent
                    transition-all duration-300
                    ${showControls ? 'opacity-100' : 'opacity-0'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Enviar mensaje..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 text-sm px-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-white/30 transition"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleLike(); }}
                            className="p-2.5 rounded-full transition transform hover:scale-110 active:scale-95"
                        >
                            <Heart className={`w-6 h-6 transition-all ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSendReply(); }}
                            className="p-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition shadow-lg shadow-purple-500/30 transform hover:scale-105 active:scale-95"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {likesCount > 0 && (
                        <div className="mt-2 text-white/60 text-xs flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                            <span>{likesCount} {likesCount === 1 ? 'me gusta' : 'me gusta'}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// COMPONENTE PRINCIPAL - Stories 
// ============================================
const Stories: React.FC<StoriesProps> = ({
    stories = [],
    currentUserId,
    onStoryClick,
    onViewStory,
    onLikeStory,
    onSendMessage,
}) => {
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // Datos de ejemplo
    const demoStories: Story[] = [
        {
            id: '1',
            userId: 'user1',
            username: 'Ana García',
            avatar: 'https://i.pravatar.cc/150?img=1',
            image: 'https://picsum.photos/seed/story1/600/800',
            timestamp: new Date().toISOString(),
            viewed: false,
            location: 'Barcelona, España',
            likes: 142,
            hasLiked: false,
        },
        {
            id: '2',
            userId: 'user2',
            username: 'Carlos Ruiz',
            avatar: 'https://i.pravatar.cc/150?img=2',
            image: 'https://picsum.photos/seed/story2/600/800',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            viewed: false,
            location: 'Madrid, España',
            likes: 89,
            hasLiked: false,
        },
        {
            id: '3',
            userId: 'user3',
            username: 'María López',
            avatar: 'https://i.pravatar.cc/150?img=3',
            image: 'https://picsum.photos/seed/story3/600/800',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            viewed: true,
            likes: 234,
            hasLiked: true,
        },
        {
            id: '4',
            userId: 'user4',
            username: 'Pedro Sánchez',
            avatar: 'https://i.pravatar.cc/150?img=4',
            image: 'https://picsum.photos/seed/story4/600/800',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            viewed: true,
            location: 'Valencia, España',
            likes: 56,
            hasLiked: false,
        },
        {
            id: '5',
            userId: 'user5',
            username: 'Laura Martínez',
            avatar: 'https://i.pravatar.cc/150?img=5',
            image: 'https://picsum.photos/seed/story5/600/800',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            viewed: true,
            likes: 312,
            hasLiked: true,
        },
         {
            id: '5',
            userId: 'user5',
            username: 'Laura Martínez',
            avatar: 'https://i.pravatar.cc/150?img=5',
            image: 'https://picsum.photos/seed/story5/600/800',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            viewed: true,
            likes: 312,
            hasLiked: true,
        },
         {
            id: '5',
            userId: 'user5',
            username: 'Laura Martínez',
            avatar: 'https://i.pravatar.cc/150?img=5',
            image: 'https://picsum.photos/seed/story5/600/800',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            viewed: true,
            likes: 312,
            hasLiked: true,
        },
         {
            id: '5',
            userId: 'user5',
            username: 'Laura Martínez',
            avatar: 'https://i.pravatar.cc/150?img=5',
            image: 'https://picsum.photos/seed/story5/600/800',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            viewed: true,
            likes: 312,
            hasLiked: true,
        },
         {
            id: '5',
            userId: 'user5',
            username: 'Laura Martínez',
            avatar: 'https://i.pravatar.cc/150?img=5',
            image: 'https://picsum.photos/seed/story5/600/800',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            viewed: true,
            likes: 312,
            hasLiked: true,
        },
         {
            id: '5',
            userId: 'user5',
            username: 'Laura Martínez',
            avatar: 'https://i.pravatar.cc/150?img=5',
            image: 'https://picsum.photos/seed/story5/600/800',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            viewed: true,
            likes: 312,
            hasLiked: true,
        },
         {
            id: '5',
            userId: 'user5',
            username: 'Laura Martínez',
            avatar: 'https://i.pravatar.cc/150?img=5',
            image: 'https://picsum.photos/seed/story5/600/800',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            viewed: true,
            likes: 312,
            hasLiked: true,
        },
    ];

    const displayStories = stories.length > 0 ? stories : demoStories;

    const ownStory: Story = {
        id: 'own',
        userId: currentUserId || 'me',
        username: 'Mi historia',
        avatar: 'https://i.pravatar.cc/150?img=8',
        image: '',
        timestamp: new Date().toISOString(),
        isOwn: true,
        viewed: false,
        likes: 0,
    };

    const sortedStories = [
        ownStory,
        ...displayStories.filter(s => !s.viewed && !s.isOwn),
        ...displayStories.filter(s => s.viewed && !s.isOwn),
    ];

    const handleStoryClick = (index: number) => {
        setSelectedStoryIndex(index);
        setIsViewerOpen(true);
        if (onStoryClick) {
            onStoryClick(sortedStories[index].id);
        }
        if (onViewStory && !sortedStories[index].viewed) {
            onViewStory(sortedStories[index].id);
        }
    };

    const handleCloseViewer = () => {
        setIsViewerOpen(false);
        setSelectedStoryIndex(null);
    };

    return (
        <>
            {/* Stories - Formato Lista Vertical */}
            <div>
                {/* Header con título */}
                <div className="flex items-center justify-between  ">
                    <div className="flex items-center gap-2">
                        <div className="h-5 bg-gradient-to-b from-yellow-400 to-pink-500 rounded-full" />
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                            Historias
                        </h3>
                    
                    </div>
                    <button 
                        onClick={() => {
                            // Función para agregar historia
                            console.log('➕ Agregar historia');
                        }}
                        className="text-xs text-blue-500 dark:text-blue-400 font-medium hover:text-blue-600 transition"
                    >
                        + Agregar
                    </button>
                </div>

                {/* Lista vertical de historias */}
                <div className=" ">
                    {sortedStories.map((story, index) => (
                        <StoryListItem
                            key={story.id}
                            story={story}
                            isOwn={story.isOwn}
                            onClick={() => handleStoryClick(index)}
                        />
                    ))}
                </div>
            </div>

            {/* Story Viewer Modal */}
            {isViewerOpen && selectedStoryIndex !== null && (
                <StoryViewer
                    stories={sortedStories}
                    initialIndex={selectedStoryIndex}
                    onClose={handleCloseViewer}
                    onLike={onLikeStory}
                    onSendMessage={onSendMessage}
                />
            )}

            
        </>
    );
};

export default Stories;