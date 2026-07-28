import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send, Pause, Music, Volume2, VolumeX, Trash2 } from 'lucide-react';
import type { Story } from '../../types';
import { useAuth } from '../../hooks/useAuth';

// ============================================
// TIPOS
// ============================================


interface StoryViewerProps {
    /** Lista de historias a mostrar */
    stories: Story[];
    /** Índice inicial de la historia a mostrar */
    initialIndex: number;
    /** Función para cerrar el viewer */
    onClose: () => void;
    /** Función para dar/ quitar like */
    onLike?: (storyId: string) => void;
    /** Función para enviar un mensaje */
    onSendMessage?: (storyId: string, message: string) => void;
    /** Función para marcar historia como vista */
    onViewStory?: (storyId: string) => void;
    /** Función para eliminar historia (solo propietario) */
    onDeleteStory?: (storyId: string) => void;
}

// ============================================
// COMPONENTE
// ============================================


const StoryViewer: React.FC<StoryViewerProps> = ({
    stories,
    initialIndex,
    onClose,
    onLike,
    onSendMessage,
    onViewStory,
    onDeleteStory,
}) => {
    const { user } = useAuth();
    
    // ============================================
    // ESTADOS
    // ============================================
    
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [replyText, setReplyText] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [showMusicInfo, setShowMusicInfo] = useState(true);
    const [musicDuration, setMusicDuration] = useState<number | null>(null);
    const [storyDuration, setStoryDuration] = useState<number>(5000);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ============================================
    // REFERENCIAS
    // ============================================
    
    const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const startTimeRef = useRef<number>(0);

    const currentStory = stories[currentIndex];

    /** Verifica si el usuario actual es el propietario de la historia */
    const isOwner = currentStory?.isOwn || (user?.id === currentStory?.userId);

    /**
     * Calcula la duración de la historia basada en la música o el video
     */
    const calculateDuration = (story: Story): number => {
        if (!story) return 5000;
        if (story.video) return 10000;
        if (story.music_duration && story.music_duration > 0) {
            const durationMs = Math.min(story.music_duration * 1000, 30000);
            return Math.max(durationMs, 5000);
        }
        if (story.music_preview_url) {
            return 15000;
        }
        return 5000;
    };

    /**
     * Obtiene el tamaño de fuente según el valor guardado
     */
    const getFontSize = (size: string | null | undefined): string => {
        const sizes: Record<string, string> = {
            small: '1rem',
            medium: '1.5rem',
            large: '2rem',
            xlarge: '2.5rem',
        };
        return sizes[size || 'medium'] || '1.5rem';
    };

    // ============================================
    // INICIALIZACIÓN AL CAMBIAR DE HISTORIA
    // ============================================
    
    useEffect(() => {
        if (currentStory) {
            setProgress(0);
            setLikesCount(currentStory.likes || 0);
            setLiked(currentStory.hasLiked || false);

            const duration = calculateDuration(currentStory);
            setStoryDuration(duration);
            setMusicDuration(currentStory.music_duration || null);

            if (!currentStory.viewed && onViewStory) {
                onViewStory(currentStory.id);
            }

            startTimeRef.current = Date.now();
        }
    }, [currentStory]);

    // ============================================
    // REPRODUCCIÓN DE MÚSICA
    // ============================================
    
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }

        if (currentStory?.music_preview_url && !isPaused) {
            try {
                const audio = new Audio(currentStory.music_preview_url);
                audio.loop = true;
                audio.volume = 0.3;
                audio.muted = isMuted;

                audio.addEventListener('loadedmetadata', () => {
                    if (audio.duration && audio.duration > 0) {
                        const realDuration = Math.min(audio.duration, 30);
                        setMusicDuration(realDuration);
                        const newDuration = Math.max(realDuration * 1000, 5000);
                        setStoryDuration(newDuration);
                    }
                });

                audio.play().catch((err) => {
                    console.log('Error al reproducir música:', err);
                });

                audioRef.current = audio;

                return () => {
                    audio.pause();
                    audio.currentTime = 0;
                    audioRef.current = null;
                };
            } catch (error) {
                console.log('Error al crear audio:', error);
            }
        }
    }, [currentStory?.id, currentStory?.music_preview_url, isPaused]);

    /** Controla el silencio de la música */
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;

            if (!isMuted && !isPaused) {
                audioRef.current.play().catch(() => {});
            }
        }
    }, [isMuted]);

    /** Controla la pausa/reproducción de la música */
    useEffect(() => {
        if (audioRef.current) {
            if (isPaused) {
                audioRef.current.pause();
            } else if (!isMuted) {
                audioRef.current.play().catch(() => {});
            }
        }
    }, [isPaused]);

    /** Limpia el audio al cerrar */
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, []);

    // ============================================
    // CONTROL DE PROGRESO
    // ============================================
    
    useEffect(() => {
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }

        if (isPaused || !currentStory) {
            return;
        }

        // Para videos: usar el evento timeupdate del video
        if (currentStory.video && videoRef.current) {
            const video = videoRef.current;
            const handleTimeUpdate = () => {
                if (video.duration) {
                    const newProgress = (video.currentTime / video.duration) * 100;
                    setProgress(newProgress);

                    if (newProgress >= 100) {
                        goToNextStory();
                    }
                }
            };

            video.addEventListener('timeupdate', handleTimeUpdate);
            video.play().catch(() => {});

            return () => {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.pause();
            };
        }

        // Para imágenes: usar intervalo
        const startTime = Date.now();
        const durationMs = storyDuration;

        progressInterval.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / durationMs) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                clearInterval(progressInterval.current!);
                progressInterval.current = null;
                goToNextStory();
            }
        }, 50);

        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
        };
    }, [currentStory, currentIndex, isPaused, storyDuration]);

    // ============================================
    // NAVEGACIÓN ENTRE HISTORIAS
    // ============================================

    /** Avanza a la siguiente historia */
    const goToNextStory = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setShowControls(true);
            setShowMusicInfo(true);
            setProgress(0);
        } else {
            onClose();
        }
    };

    /** Retrocede a la historia anterior */
    const goToPreviousStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setShowControls(true);
            setShowMusicInfo(true);
            setProgress(0);
        }
    };

    /**
     * Elimina la historia actual (solo propietario)
     */
    const handleDeleteStory = () => {
        if (onDeleteStory && currentStory) {
            onDeleteStory(currentStory.id);
            setShowDeleteConfirm(false);
            if (stories.length <= 1) {
                onClose();
            } else {
                goToNextStory();
            }
        }
    };

    // ============================================
    // AUTO-OCULTAR CONTROLES
    // ============================================
    
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

    /** Auto-oculta la info de música después de 5 segundos */
    useEffect(() => {
        if (currentStory?.music_preview_url) {
            const timer = setTimeout(() => {
                setShowMusicInfo(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentStory?.id]);

    // ============================================
    // HANDLERS DE INTERACCIÓN
    // ============================================

    /** Alterna pausa/reproducción */
    const handleTogglePause = () => {
        setIsPaused(!isPaused);
        setShowControls(true);

        if (currentStory?.video && videoRef.current) {
            if (isPaused) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    };

    /** Alterna like */
    const handleLike = () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
        if (onLike) {
            onLike(currentStory.id);
        }
    };

    /** Envía un mensaje de respuesta */
    const handleSendReply = () => {
        if (replyText.trim() && onSendMessage) {
            onSendMessage(currentStory.id, replyText);
            setReplyText('');
        }
    };

    /** Alterna silencio de la música (visible para todos) */
    const handleToggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        setShowControls(true);
    };

    // ============================================
    // NAVEGACIÓN POR TECLADO
    // ============================================
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPreviousStory();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToNextStory();
            } else if (e.key === 'Escape') {
                onClose();
            } else if (e.key === ' ') {
                e.preventDefault();
                handleTogglePause();
            } else if (e.key === 'm') {
                setIsMuted(!isMuted);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, stories.length, isMuted]);

    // ============================================
    // NAVEGACIÓN POR TOUCH
    // ============================================
    
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
            if (diffX > 0) {
                goToNextStory();
            } else {
                goToPreviousStory();
            }
        }
        setIsPaused(false);
    };

    if (!currentStory) return null;

    const displayDuration = musicDuration || currentStory?.music_duration || 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            onClick={handleTogglePause}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="relative w-full max-w-md h-full max-h-[95vh] bg-black overflow-hidden">
                {/* ============================================
                    BARRA DE PROGRESO
                    ============================================ */}
                <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex gap-1 mb-3">
                        {stories.map((_, index) => (
                            <div
                                key={index}
                                className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden"
                            >
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                                    style={{
                                        width:
                                            index === currentIndex
                                                ? `${progress}%`
                                                : index < currentIndex
                                                ? '100%'
                                                : '0%',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ============================================
                        HEADER CON CONTROLES
                        ============================================ */}
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
                                    {isOwner && (
                                        <span className="ml-2 text-[10px] text-blue-400 font-normal">
                                            (Tú)
                                        </span>
                                    )}
                                </p>
                                <p className="text-white/50 text-[10px]">
                                    {new Date(currentStory.timestamp).toLocaleTimeString(
                                        'es-ES',
                                        {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }
                                    )}
                                    {currentStory.location &&
                                        ` • ${currentStory.location}`}
                                    {displayDuration > 0 && (
                                        <span className="ml-2 text-white/40">
                                            🎵 {Math.floor(displayDuration)}s
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Controles superiores */}
                        <div className="flex items-center gap-1">
                            {/* Botón de silenciar - visible para todos */}
                            {currentStory.music_preview_url && (
                                <button
                                    onClick={handleToggleMute}
                                    className="text-white/60 hover:text-white transition p-2 rounded-full hover:bg-white/10"
                                    title={
                                        isMuted
                                            ? 'Activar sonido'
                                            : 'Silenciar música'
                                    }
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-4 h-4" />
                                    ) : (
                                        <Volume2 className="w-4 h-4" />
                                    )}
                                </button>
                            )}

                            {/* Botón de eliminar - SOLO visible para el propietario */}
                            {isOwner && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(true);
                                    }}
                                    className="text-white/60 hover:text-red-400 transition p-2 rounded-full hover:bg-red-500/10"
                                    title="Eliminar historia"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}

                            {/* Botón de cerrar - visible para todos */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="text-white/70 hover:text-white transition p-2 rounded-full hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ============================================
                    CONTENIDO DE LA HISTORIA
                    ============================================ */}
                <div className="w-full h-full flex items-center justify-center relative">
                    {currentStory.video ? (
                        <video
                            ref={videoRef}
                            src={currentStory.video}
                            className="w-full h-full object-contain"
                            muted={isMuted}
                            playsInline
                            loop={false}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div className="relative w-full h-full">
                            <img
                                src={currentStory.image}
                                alt={`Historia de ${currentStory.username}`}
                                className="w-full h-full object-cover"
                                style={{
                                    transform: isPaused ? 'scale(1)' : 'scale(1.02)',
                                    transition: 'transform 8s ease-in-out',
                                }}
                            />

                            {/* Overlay de color de fondo */}
                            {currentStory.backgroundColor && (
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        backgroundColor:
                                            currentStory.backgroundColor,
                                        opacity: 0.3,
                                    }}
                                />
                            )}

                            {/* Texto con posición y estilos guardados */}
                            {currentStory.content && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none px-6"
                                    style={{
                                        color: currentStory.fontColor || '#FFFFFF',
                                        fontSize: getFontSize(
                                            currentStory.fontSize
                                        ),
                                    }}
                                >
                                    <p
                                        className="text-center font-bold leading-tight max-w-full break-words"
                                        style={{
                                            textShadow:
                                                '0 0 30px rgba(0,0,0,0.7), 0 0 60px rgba(0,0,0,0.3)',
                                            transform: `scale(${
                                                currentStory.textScale || 1
                                            })`,
                                            marginTop: `${
                                                (currentStory.textPosition?.y ||
                                                    0) + 0
                                            }%`,
                                            marginLeft: `${
                                                (currentStory.textPosition?.x ||
                                                    0) + 0
                                            }%`,
                                        }}
                                    >
                                        {currentStory.content}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ============================================
                    INFO DE MÚSICA FLOTANTE
                    ============================================ */}
                {currentStory.music_preview_url && showMusicInfo && (
                    <div className="absolute bottom-24 left-0 right-0 px-4 flex justify-center animate-fadeInUp">
                        <div className="flex items-center gap-2 text-white/90 text-xs font-medium bg-black/50 backdrop-blur-lg py-1.5 px-4 rounded-full border border-white/10 shadow-lg">
                            <Music className="w-3 h-3 text-green-400 animate-pulse" />
                            <span>
                                {currentStory.music}
                                {currentStory.music_artist &&
                                    ` - ${currentStory.music_artist}`}
                            </span>
                            {displayDuration > 0 && (
                                <span className="text-white/50 text-[10px]">
                                    {Math.floor(displayDuration / 60)}:
                                    {(Math.floor(displayDuration) % 60)
                                        .toString()
                                        .padStart(2, '0')}
                                </span>
                            )}
                            {isMuted && (
                                <span className="text-red-400 text-[10px]">
                                    🔇
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Overlay gradiente inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                {/* ============================================
                    CONTROLES DE NAVEGACIÓN
                    ============================================ */}
                {showControls && (
                    <>
                        {currentIndex > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToPreviousStory();
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
                                    goToNextStory();
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition p-2 rounded-full hover:bg-white/10 backdrop-blur-sm"
                            >
                                <ChevronRight className="w-7 h-7" />
                            </button>
                        )}
                    </>
                )}

                {/* ============================================
                    INDICADOR DE PAUSA
                    ============================================ */}
                {isPaused && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-black/50 backdrop-blur-md rounded-full p-6 border border-white/10 shadow-2xl">
                            <Pause className="w-12 h-12 text-white" />
                        </div>
                    </div>
                )}

                {/* ============================================
                    MODAL DE CONFIRMACIÓN PARA ELIMINAR
                    ============================================ */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                                ¿Eliminar historia?
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteStory();
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================
                    ACCIONES INFERIORES
                    ============================================ */}
                <div
                    className={`
                        absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-8
                        bg-gradient-to-t from-black/80 via-black/50 to-transparent
                        transition-all duration-300
                        ${showControls ? 'opacity-100' : 'opacity-0'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Enviar mensaje..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && handleSendReply()
                                }
                                className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 text-sm px-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-white/30 transition"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLike();
                            }}
                            className="p-2.5 rounded-full transition transform hover:scale-110 active:scale-95"
                        >
                            <Heart
                                className={`w-6 h-6 transition-all ${
                                    liked
                                        ? 'fill-red-500 text-red-500'
                                        : 'text-white'
                                }`}
                            />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSendReply();
                            }}
                            className="p-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition shadow-lg shadow-purple-500/30 transform hover:scale-105 active:scale-95"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {likesCount > 0 && (
                        <div className="mt-2 text-white/60 text-xs flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                            <span>
                                {likesCount}{' '}
                                {likesCount === 1 ? 'me gusta' : 'me gusta'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================
                ANIMACIONES CSS
                ============================================ */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(8px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .animate-fadeInUp {
                    animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
            `}</style>
        </div>
    );
};

export default StoryViewer;