import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Play, Pause, Music, Clock, Check, Download } from 'lucide-react';
import { useMusic } from '../../hooks/useMusic';
import { Music as MusicType } from '../../types';

/**
 * Props del componente MusicSelector
 */
interface MusicSelectorProps {
    /** Indica si el modal está abierto */
    isOpen: boolean;
    /** Función para cerrar el selector */
    onClose: () => void;
    /** Función para seleccionar una canción */
    onSelect: (music: { 
        title: string; 
        artist: string; 
        albumArt?: string;
        preview_url?: string | null;
        duration?: number | null;
        full_audio_url?: string | null;
        youtube_id?: string | null;
        is_full?: boolean;
    }) => void;
}

/**
 * Componente para buscar y seleccionar música de Deezer
 * 
 * Características:
 * - Búsqueda de canciones por título/artista
 * - Reproducción de previews
 * - Selección de canción para la historia
 * - Soporte para audio completo (toggle)
 */
const MusicSelector: React.FC<MusicSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
}) => {
    // Hook para manejar la lógica de música
    const {
        songs,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        selectedSong,
        selectSong,
        clearSelection,
        isSearching,
    } = useMusic();

    // Estado para controlar qué canción está sonando
    const [playingId, setPlayingId] = useState<string | null>(null);
    // Toggle para audio completo vs preview
    const [showFullAudio, setShowFullAudio] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    /**
     * Limpia el audio al cerrar el modal
     */
    useEffect(() => {
        if (!isOpen && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlayingId(null);
        }
    }, [isOpen]);

    /**
     * Limpia la selección al cerrar el modal
     */
    useEffect(() => {
        if (!isOpen) {
            clearSelection();
        }
    }, [isOpen, clearSelection]);

    /**
     * Maneja la selección de una canción
     */
    const handleSelect = (song: MusicType) => {
        selectSong(song);
        onSelect({
            title: song.title,
            artist: song.artist,
            albumArt: song.album_art,
            preview_url: song.preview_url,
            duration: song.duration,
            full_audio_url: song.full_audio_url || null,
            youtube_id: song.youtube_id || null,
            is_full: song.is_full || false,
        });
        
        // Detener reproducción
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlayingId(null);
        }
        
        // Cerrar con delay para ver la confirmación
        setTimeout(onClose, 300);
    };

    /**
     * Maneja la reproducción/pausa del preview de la canción
     */
    const handlePlay = (song: MusicType, e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Si la misma canción está sonando, pausar
        if (playingId === song.id && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlayingId(null);
            return;
        }

        // Detener audio anterior
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Elegir entre audio completo o preview
        const audioUrl = showFullAudio && song.full_audio_url ? song.full_audio_url : song.preview_url;
        
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play().catch(() => {});
            setPlayingId(song.id);
            
            audio.onended = () => {
                setPlayingId(null);
                audioRef.current = null;
            };
        }
    };

    /**
     * Formatea la duración en formato MM:SS
     */
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-hidden animate-slideUp">
                {/* ============================================
                    HEADER
                    ============================================ */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Music className="w-4 h-4 text-blue-500" />
                        {selectedSong ? (
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                {selectedSong.title}
                            </span>
                        ) : (
                            'Música'
                        )}
                    </h3>

                    {selectedSong && (
                        <button
                            onClick={() => {
                                clearSelection();
                                onSelect({ title: '', artist: '' });
                            }}
                            className="text-xs text-red-500 hover:text-red-600 transition"
                        >
                            Quitar
                        </button>
                    )}
                    {!selectedSong && <div className="w-5" />}
                </div>

                {/* ============================================
                    BARRA DE BÚSQUEDA
                    ============================================ */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar canciones, artistas..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                            autoFocus
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================================
                    TOGGLE: AUDIO COMPLETO / PREVIEW
                    ============================================ */}
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Audio completo</span>
                    <button
                        onClick={() => setShowFullAudio(!showFullAudio)}
                        className={`relative w-10 h-5 rounded-full transition ${
                            showFullAudio ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition ${
                            showFullAudio ? 'translate-x-5' : ''
                        }`} />
                    </button>
                </div>

                {/* ============================================
                    LISTA DE CANCIONES
                    ============================================ */}
                <div className="overflow-y-auto max-h-[40vh] p-2">
                    {/* Estado de carga */}
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500 text-sm">
                            {error}
                        </div>
                    ) : songs.length === 0 ? (
                        /* Sin resultados */
                        <div className="text-center py-8 text-gray-400">
                            <Music className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No se encontraron canciones</p>
                            {searchQuery.length > 0 && (
                                <p className="text-xs mt-1 text-gray-400">
                                    Intenta con otra búsqueda
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Lista de canciones */
                        songs.map((song) => (
                            <div
                                key={song.id}
                                onClick={() => handleSelect(song)}
                                className={`
                                    flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
                                    ${selectedSong?.id === song.id 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/30' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }
                                `}
                            >
                                {/* ============================================
                                    CARÁTULA DEL ÁLBUM
                                    ============================================ */}
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                    {song.album_art ? (
                                        <img
                                            src={song.album_art}
                                            alt={song.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Music className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    
                                    {/* Botón de reproducción sobre la carátula */}
                                    {(song.preview_url || song.full_audio_url) && (
                                        <button
                                            onClick={(e) => handlePlay(song, e)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition"
                                        >
                                            {playingId === song.id ? (
                                                <Pause className="w-5 h-5 text-white" />
                                            ) : (
                                                <Play className="w-5 h-5 text-white" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* ============================================
                                    INFO DE LA CANCIÓN
                                    ============================================ */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                            {song.title}
                                        </h4>
                                        {/* Badge para audio completo */}
                                        {song.is_full && (
                                            <span className="text-[8px] font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                <Download className="w-2.5 h-2.5" />
                                                Completa
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {song.artist}
                                    </p>
                                </div>

                                {/* ============================================
                                    DURACIÓN
                                    ============================================ */}
                                {song.duration > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatDuration(song.duration)}</span>
                                    </div>
                                )}

                                {/* ============================================
                                    INDICADOR DE SELECCIÓN
                                    ============================================ */}
                                {selectedSong?.id === song.id && (
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* ============================================
                    BOTÓN DE CONFIRMACIÓN
                    ============================================ */}
                {selectedSong && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition"
                        >
                            Confirmar música
                        </button>
                    </div>
                )}
            </div>

            {/* ============================================
                ANIMACIONES CSS
                ============================================ */}
            <style>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .animate-slideUp {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .animate-fadeIn {
                    animation: fadeIn 0.2s ease both;
                }
            `}</style>
        </div>
    );
};

export default MusicSelector;