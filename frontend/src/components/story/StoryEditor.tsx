import React, { useState, useRef, useEffect } from 'react';
import { 
    X, 
    Music, 
    MapPin, 
    Type, 
    Palette, 
    Trash2, 
    Smile,
    Maximize,
    Minimize,
    Sparkles,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Move,
    Minimize2,
    Maximize2
} from 'lucide-react';
import MusicSelector from './MusicSelector';
import AudioEditor from './AudioEditor';

// ============================================
// TIPOS
// ============================================


interface StoryEditorProps {
    /** Archivo multimedia seleccionado (imagen o video) */
    file: File;
    /** Función para cerrar el editor */
    onClose: () => void;
    /** Función para confirmar la creación de la historia */
    onConfirm: (data: {
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
    }) => void;
    /** Indica si está subiendo */
    isUploading?: boolean;
}

/** Posición del texto en el canvas */
interface TextPosition {
    x: number;
    y: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

/**
 * Editor de historias estilo Instagram
 * Permite añadir texto, música, colores y posicionar elementos
 */
const StoryEditor: React.FC<StoryEditorProps> = ({
    file,
    onClose,
    onConfirm,
    isUploading = false,
}) => {
    // ============================================
    // ESTADOS PRINCIPALES
    // ============================================
    
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [content, setContent] = useState('');
    const [location, setLocation] = useState('');
    const [music, setMusic] = useState('');
    const [musicArtist, setMusicArtist] = useState('');
    const [musicDuration, setMusicDuration] = useState<number | null>(null);
    const [musicPreviewUrl, setMusicPreviewUrl] = useState<string | null>(null);
    const [backgroundColor, setBackgroundColor] = useState('#000000');
    const [fontColor, setFontColor] = useState('#FFFFFF');
    const [fontSize, setFontSize] = useState('medium');
    const [isVideo, setIsVideo] = useState(false);
    
    // ============================================
    // ESTADOS DE UI 
    // ============================================
    
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFontOptions, setShowFontOptions] = useState(false);
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [showTextInput, setShowTextInput] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showMusicSelector, setShowMusicSelector] = useState(false);
    const [showAudioEditor, setShowAudioEditor] = useState(false);
    
    /** Canción seleccionada temporalmente antes de confirmar */
    const [selectedSong, setSelectedSong] = useState<{
        title: string;
        artist: string;
        previewUrl: string;
    } | null>(null);
    
    // ============================================
    // ESTADOS DE TEXTO (posición y escala)
    // ============================================
    
    const [textPosition, setTextPosition] = useState<TextPosition>({ x: 0, y: 0 });
    const [textScale, setTextScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<TextPosition>({ x: 0, y: 0 });
    const [showTextControls, setShowTextControls] = useState(false);
    
    // ============================================
    // ESTADOS DE MÚSICA (reproducción en preview)
    // ============================================
    
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isMusicMuted, setIsMusicMuted] = useState(false);
    const [musicProgress, setMusicProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // ============================================
    // REFERENCIAS
    // ============================================
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const locationInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Carga la previsualización del archivo seleccionado
     */
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setIsVideo(file.type.startsWith('video/'));

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    // ============================================
    // CONTROL DE REPRODUCCIÓN DE MÚSICA EN EL EDITOR
    // ============================================
    
    /**
     * Crea y controla el reproductor de audio para la previsualización
     */
    useEffect(() => {
        if (musicPreviewUrl && !audioRef.current) {
            const audio = new Audio(musicPreviewUrl);
            audio.loop = true;
            audio.volume = 0.3;
            audioRef.current = audio;
            
            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    setMusicProgress((audio.currentTime / audio.duration) * 100);
                }
            });
        }
        
        if (!musicPreviewUrl && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
            setIsMusicPlaying(false);
            setMusicProgress(0);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, [musicPreviewUrl]);

    /**
     * Controla la reproducción/pausa según el estado
     */
    useEffect(() => {
        if (!audioRef.current) return;
        
        if (isMusicPlaying && !isMusicMuted) {
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
        }
    }, [isMusicPlaying, isMusicMuted]);

    /**
     * Alterna la reproducción de la música
     */
    const toggleMusicPlay = () => {
        if (!musicPreviewUrl) return;
        setIsMusicPlaying(!isMusicPlaying);
    };

    /**
     * Silencia o activa el sonido de la música
     */
    const toggleMusicMute = () => {
        setIsMusicMuted(!isMusicMuted);
        if (audioRef.current) {
            audioRef.current.muted = !isMusicMuted;
        }
    };

    // ============================================
    // CONFIGURACIÓN DE COLORES Y FUENTES
    // ============================================
    
    /** Colores de fondo predefinidos */
    const backgroundColors = [
        { color: '#000000', label: 'Negro' },
        { color: '#1a1a2e', label: 'Azul oscuro' },
        { color: '#16213e', label: 'Azul marino' },
        { color: '#0f3460', label: 'Azul profundo' },
        { color: '#533483', label: 'Morado' },
        { color: '#e94560', label: 'Rojo' },
        { color: '#f5a623', label: 'Naranja' },
        { color: '#4ecdc4', label: 'Turquesa' },
        { color: '#45b7d1', label: 'Celeste' },
        { color: '#96ceb4', label: 'Verde menta' },
        { color: '#f7dc6f', label: 'Amarillo' },
        { color: '#ff6b6b', label: 'Coral' },
        { color: '#6c5ce7', label: 'Púrpura' },
        { color: '#00b894', label: 'Verde esmeralda' },
        { color: '#fd79a8', label: 'Rosa' },
        { color: '#ffb8a2', label: 'Durazno' },
        { color: '#74b9ff', label: 'Azul claro' },
        { color: '#a29bfe', label: 'Lavanda' },
    ];

    /** Colores de texto disponibles */
    const fontColors = [
        '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', 
        '#45B7D1', '#FFD93D', '#6C5CE7', '#FD79A8',
        '#00B894', '#FDCB6E', '#E17055', '#74B9FF',
    ];

    /** Tamaños de fuente disponibles */
    const fontSizes = [
        { value: 'small', label: 'Pequeño' },
        { value: 'medium', label: 'Mediano' },
        { value: 'large', label: 'Grande' },
        { value: 'xlarge', label: 'Extra Grande' },
    ];

    /**
     * Renderiza el preview en el canvas con texto y estilos
     */
    useEffect(() => {
        if (isVideo || !previewUrl) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Dibujar imagen de fondo
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Overlay de color con opacidad
            ctx.fillStyle = backgroundColor + '80';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Dibujar texto en posición personalizada
            if (content) {
                const fontSizeMap = {
                    small: Math.min(canvas.width, canvas.height) * 0.04 * textScale,
                    medium: Math.min(canvas.width, canvas.height) * 0.06 * textScale,
                    large: Math.min(canvas.width, canvas.height) * 0.08 * textScale,
                    xlarge: Math.min(canvas.width, canvas.height) * 0.1 * textScale,
                };

                const fontSizeValue = fontSizeMap[fontSize as keyof typeof fontSizeMap] || fontSizeMap.medium;
                
                ctx.fillStyle = fontColor;
                ctx.font = `bold ${fontSizeValue}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 20;

                // Posición centrada con offset
                const centerX = canvas.width / 2 + (textPosition.x * canvas.width / 100);
                const centerY = canvas.height / 2 + (textPosition.y * canvas.height / 100);

                const maxWidth = canvas.width * 0.85;
                const lines = content.split('\n');
                const lineHeight = fontSizeValue * 1.4;
                const totalHeight = lines.length * lineHeight;
                const startY = centerY - totalHeight / 2;

                // Dibujar cada línea con wrap
                lines.forEach((line, index) => {
                    let currentLine = line;
                    while (ctx.measureText(currentLine + '…').width > maxWidth && currentLine.length > 0) {
                        currentLine = currentLine.slice(0, -1);
                    }
                    if (currentLine.length < line.length) currentLine += '…';
                    
                    ctx.fillText(currentLine, centerX, startY + index * lineHeight);
                });
            }

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        };

        img.src = previewUrl;
    }, [previewUrl, content, location, music, backgroundColor, fontColor, fontSize, textPosition, textScale, isVideo]);

    // ============================================
    // MANEJADORES DE TEXTO (arrastrar y escalar)
    // ============================================

    /**
     * Inicia el arrastre del texto
     */
    const handleTextMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!content) return;
        setIsDragging(true);
        setShowTextControls(true);
        
        const container = containerRef.current;
        if (container) {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100 - 50;
            const y = ((e.clientY - rect.top) / rect.height) * 100 - 50;
            setDragOffset({ x: textPosition.x - x, y: textPosition.y - y });
        }
    };

    /**
     * Maneja el movimiento del texto durante el arrastre
     */
    const handleTextMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !containerRef.current) return;
        
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100 - 50 + dragOffset.x;
        const y = ((e.clientY - rect.top) / rect.height) * 100 - 50 + dragOffset.y;
        
        setTextPosition({
            x: Math.max(-40, Math.min(40, x)),
            y: Math.max(-40, Math.min(40, y))
        });
    };

    /**
     * Finaliza el arrastre del texto
     */
    const handleTextMouseUp = () => {
        setIsDragging(false);
    };

    /**
     * Escala el texto con la rueda del mouse
     */
    const handleWheel = (e: React.WheelEvent) => {
        if (!content) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setTextScale(Math.max(0.3, Math.min(2, textScale + delta)));
    };

    /**
     * Reinicia la posición y escala del texto
     */
    const resetTextPosition = () => {
        setTextPosition({ x: 0, y: 0 });
        setTextScale(1);
    };

    // ============================================
    // MANEJADORES PRINCIPALES
    // ============================================

    /**
     * Confirma la creación de la historia
     * Envía todos los datos al componente padre
     */
    const handleConfirm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        
        onConfirm({
            file,
            content,
            location,
            music: music,
            music_artist: musicArtist,
            music_duration: musicDuration,
            music_preview_url: musicPreviewUrl,
            backgroundColor: backgroundColor || '#000000',
            fontColor: fontColor || '#FFFFFF',
            fontSize: fontSize || 'medium',
            textPosition,
            textScale,
        });
    };

    /**
     * Elimina la imagen seleccionada y cierra el editor
     */
    const handleRemoveImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        onClose();
    };

    // ============================================
    // MANEJADORES DE INPUTS
    // ============================================

    const handleTextInputFocus = () => {
        setShowTextInput(true);
        setTimeout(() => {
            textInputRef.current?.focus();
        }, 100);
    };

    const handleLocationInputFocus = () => {
        setShowLocationInput(true);
        setTimeout(() => {
            locationInputRef.current?.focus();
        }, 100);
    };

    const handleTextInputBlur = () => {
        setTimeout(() => setShowTextInput(false), 200);
    };

    const handleLocationInputBlur = () => {
        setTimeout(() => setShowLocationInput(false), 200);
    };

    // ============================================
    // PANTALLA COMPLETA
    // ============================================

    const toggleFullscreen = () => {
        const element = document.documentElement;
        if (!isFullscreen) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
                setIsFullscreen(true);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
                <button
                    onClick={handleRemoveImage}
                    className="text-white/80 hover:text-white transition font-medium text-sm flex items-center gap-1.5"
                >
                    <X className="w-4 h-4" />
                    Cancelar
                </button>
                <h3 className="text-white font-semibold text-base tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Nueva historia
                </h3>
                <button
                    onClick={handleConfirm}
                    disabled={isUploading}
                    className="text-blue-500 hover:text-blue-400 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 px-4 py-1.5 rounded-full hover:bg-white/10"
                >
                    {isUploading ? 'Subiendo...' : 'Siguiente →'}
                </button>
            </div>

            {/* Contenido principal - Previsualización */}
            <div 
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative overflow-hidden"
                onMouseMove={handleTextMouseMove}
                onMouseUp={handleTextMouseUp}
                onMouseLeave={handleTextMouseUp}
                onWheel={handleWheel}
            >
                <div className="relative w-full max-w-md aspect-[9/16] bg-black shadow-2xl shadow-blue-500/10">
                    {isVideo ? (
                        <video
                            src={previewUrl}
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                        />
                    ) : (
                        <div className="relative w-full h-full">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Área interactiva para el texto */}
                            {content && (
                                <div
                                    className="absolute inset-0 cursor-move"
                                    onMouseDown={handleTextMouseDown}
                                    onTouchStart={(e) => {
                                        const touch = e.touches[0];
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((touch.clientX - rect.left) / rect.width) * 100 - 50;
                                        const y = ((touch.clientY - rect.top) / rect.height) * 100 - 50;
                                        setDragOffset({ x: textPosition.x - x, y: textPosition.y - y });
                                        setIsDragging(true);
                                    }}
                                    onTouchMove={(e) => {
                                        if (!isDragging) return;
                                        const touch = e.touches[0];
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((touch.clientX - rect.left) / rect.width) * 100 - 50 + dragOffset.x;
                                        const y = ((touch.clientY - rect.top) / rect.height) * 100 - 50 + dragOffset.y;
                                        setTextPosition({
                                            x: Math.max(-40, Math.min(40, x)),
                                            y: Math.max(-40, Math.min(40, y))
                                        });
                                    }}
                                    onTouchEnd={() => setIsDragging(false)}
                                >
                                    {/* Controles de texto */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white/60 text-[10px] flex items-center gap-2">
                                        <Move className="w-3 h-3" />
                                        <span>Arrastra para mover</span>
                                        <span className="w-px h-3 bg-white/20" />
                                        <span>Rueda para escalar</span>
                                    </div>
                                    
                                    {showTextControls && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white/60 text-[10px] flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTextScale(Math.max(0.3, textScale - 0.1));
                                                }}
                                                className="hover:text-white transition"
                                            >
                                                <Minimize2 className="w-3 h-3" />
                                            </button>
                                            <span className="text-white/40">{Math.round(textScale * 100)}%</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTextScale(Math.min(2, textScale + 0.1));
                                                }}
                                                className="hover:text-white transition"
                                            >
                                                <Maximize2 className="w-3 h-3" />
                                            </button>
                                            <span className="w-px h-3 bg-white/20" />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    resetTextPosition();
                                                }}
                                                className="hover:text-white transition"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Overlay de música en preview */}
                    {music && musicPreviewUrl && (
                        <div className="absolute bottom-24 left-0 right-0 px-4 flex justify-center animate-fadeInUp">
                            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-lg py-2 px-4 rounded-full border border-white/10 shadow-lg">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMusicPlay();
                                    }}
                                    className="text-white hover:text-blue-400 transition p-1"
                                >
                                    {isMusicPlaying && !isMusicMuted ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                </button>

                                <div className="flex-1 min-w-[120px]">
                                    <p className="text-white text-xs font-medium truncate">
                                        {music}
                                    </p>
                                    <p className="text-white/60 text-[10px] truncate">
                                        {musicArtist}
                                    </p>
                                </div>

                                <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-400 rounded-full transition-all duration-300"
                                        style={{ width: `${musicProgress}%` }}
                                    />
                                </div>

                                <span className="text-white/40 text-[10px] min-w-[30px]">
                                    {musicDuration || 0}s
                                </span>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMusicMute();
                                    }}
                                    className="text-white/60 hover:text-white transition p-1"
                                >
                                    {isMusicMuted ? (
                                        <VolumeX className="w-4 h-4" />
                                    ) : (
                                        <Volume2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Música sin preview (solo nombre) */}
                    {music && !musicPreviewUrl && (
                        <div className="absolute bottom-24 left-0 right-0 px-4 flex justify-center animate-fadeInUp">
                            <div className="flex items-center gap-2 text-white/90 text-xs font-medium bg-black/50 backdrop-blur-lg py-1.5 px-4 rounded-full border border-white/10 shadow-lg">
                                <Music className="w-3 h-3 text-blue-400" />
                                <span>{music}</span>
                                {musicArtist && (
                                    <span className="text-white/50">- {musicArtist}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pantalla completa */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition bg-black/30 backdrop-blur-sm p-2 rounded-full hover:bg-black/50"
                    >
                        {isFullscreen ? (
                            <Minimize className="w-4 h-4" />
                        ) : (
                            <Maximize className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* ============================================
                BARRA DE HERRAMIENTAS INFERIOR
                ============================================ */}
            <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-md border-t border-white/5 px-4 pt-3 pb-6">
                <div className="max-w-md mx-auto">
                    {/* Input de texto flotante */}
                    {showTextInput && (
                        <div className="mb-3 animate-slideUp">
                            <div className="relative">
                                <input
                                    ref={textInputRef}
                                    type="text"
                                    value={content}
                                    onChange={(e) => {
                                        setContent(e.target.value);
                                        if (e.target.value) {
                                            setShowTextControls(true);
                                        }
                                    }}
                                    placeholder="Escribe algo..."
                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg text-white placeholder-white/40 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 transition text-sm"
                                    maxLength={200}
                                    onBlur={handleTextInputBlur}
                                    autoFocus
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
                                    {content.length}/200
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Input de ubicación flotante */}
                    {showLocationInput && (
                        <div className="mb-3 animate-slideUp">
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    ref={locationInputRef}
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Agregar ubicación..."
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg text-white placeholder-white/40 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 transition text-sm"
                                    onBlur={handleLocationInputBlur}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* Botones de herramientas */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Texto */}
                        <button
                            onClick={handleTextInputFocus}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition ${
                                content ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Type className="w-5 h-5" />
                            <span className="text-[8px] font-medium">Texto</span>
                            {content && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                        </button>

                        {/* Ubicación */}
                        <button
                            onClick={handleLocationInputFocus}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition ${
                                location ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <MapPin className="w-5 h-5" />
                            <span className="text-[8px] font-medium">Ubicación</span>
                        </button>

                        {/* Música */}
                        <button
                            onClick={() => setShowMusicSelector(true)}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition relative ${
                                music ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Music className="w-5 h-5" />
                            <span className="text-[8px] font-medium">Música</span>
                            {music && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                        </button>

                        {/* Colores */}
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition relative ${
                                showColorPicker ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <div className="relative">
                                <Palette className="w-5 h-5" />
                                <div 
                                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white/30"
                                    style={{ backgroundColor: backgroundColor }}
                                />
                            </div>
                            <span className="text-[8px] font-medium">Colores</span>
                        </button>

                        {/* Emoji */}
                        <button className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition">
                            <Smile className="w-5 h-5" />
                            <span className="text-[8px] font-medium">Emoji</span>
                        </button>

                        {/* Fuente */}
                        <button
                            onClick={() => setShowFontOptions(!showFontOptions)}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition ${
                                showFontOptions ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <span className="text-sm font-bold">Aa</span>
                            <span className="text-[8px] font-medium">Fuente</span>
                        </button>

                        {/* Eliminar */}
                        <button
                            onClick={handleRemoveImage}
                            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span className="text-[8px] font-medium">Eliminar</span>
                        </button>
                    </div>

                    {/* Panel de colores */}
                    {showColorPicker && (
                        <div className="mt-3 pt-3 border-t border-white/10 animate-slideUp">
                            <div className="flex items-center gap-3">
                                <span className="text-white/50 text-[10px] font-medium min-w-[50px]">Fondo</span>
                                <div className="flex gap-1.5 flex-1 overflow-x-auto pb-1 scrollbar-hide">
                                    {backgroundColors.map((bg) => (
                                        <button
                                            key={bg.color}
                                            onClick={() => setBackgroundColor(bg.color)}
                                            className={`w-8 h-8 rounded-full flex-shrink-0 transition-all ${
                                                backgroundColor === bg.color
                                                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black scale-110'
                                                    : 'hover:scale-110'
                                            }`}
                                            style={{ backgroundColor: bg.color }}
                                            title={bg.label}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-white/50 text-[10px] font-medium min-w-[50px]">Texto</span>
                                <div className="flex gap-1.5 flex-1 overflow-x-auto pb-1 scrollbar-hide">
                                    {fontColors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setFontColor(color)}
                                            className={`w-8 h-8 rounded-full flex-shrink-0 border-2 transition-all ${
                                                fontColor === color
                                                    ? 'border-blue-500 scale-110'
                                                    : 'border-white/20 hover:scale-110'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Panel de tamaños de fuente */}
                    {showFontOptions && (
                        <div className="mt-3 pt-3 border-t border-white/10 animate-slideUp">
                            <div className="flex items-center gap-3">
                                <span className="text-white/50 text-[10px] font-medium min-w-[50px]">Tamaño</span>
                                <div className="flex gap-2 flex-1">
                                    {fontSizes.map((size) => (
                                        <button
                                            key={size.value}
                                            onClick={() => setFontSize(size.value)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                                                fontSize === size.value
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                            }`}
                                        >
                                            <span className={`
                                                ${size.value === 'small' ? 'text-[10px]' : ''}
                                                ${size.value === 'medium' ? 'text-xs' : ''}
                                                ${size.value === 'large' ? 'text-sm' : ''}
                                                ${size.value === 'xlarge' ? 'text-base' : ''}
                                            `}>
                                                A
                                            </span>
                                            <span className="block text-[8px] opacity-60 mt-0.5">
                                                {size.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================
                MODALES
                ============================================ */}

            {/* Selector de música */}
            {showMusicSelector && (
                <MusicSelector
                    isOpen={showMusicSelector}
                    onClose={() => {
                        setShowMusicSelector(false);
                    }}
                    onSelect={(selected) => {
                        setSelectedSong({
                            title: selected.title,
                            artist: selected.artist,
                            previewUrl: selected.preview_url || '',
                        });
                        setShowMusicSelector(false);
                        setShowAudioEditor(true);
                    }}
                />
            )}

            {/* Editor de audio (reproductor) */}
            {showAudioEditor && selectedSong && (
                <AudioEditor
                    previewUrl={selectedSong.previewUrl}
                    songTitle={selectedSong.title}
                    songArtist={selectedSong.artist}
                    onClose={() => {
                        setShowAudioEditor(false);
                        setSelectedSong(null);
                    }}
                    onConfirm={(audioUrl, _startTime, duration) => {
                        // Guardar la URL original de Deezer con duración de 30s
                        setMusic(selectedSong.title);
                        setMusicArtist(selectedSong.artist);
                        setMusicDuration(duration);
                        setMusicPreviewUrl(audioUrl);
                        
                        // Reproducir música en el editor
                        setTimeout(() => {
                            if (audioRef.current) {
                                audioRef.current.src = audioUrl;
                                audioRef.current.load();
                                setIsMusicPlaying(true);
                                setIsMusicMuted(false);
                                audioRef.current.play().catch(() => {});
                            }
                        }, 100);
                        
                        setShowAudioEditor(false);
                        setSelectedSong(null);
                    }}
                    isProcessing={false}
                />
            )}

            {/* ============================================
                ANIMACIONES CSS
                ============================================ */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-slideUp { animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .animate-fadeInUp { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default StoryEditor;