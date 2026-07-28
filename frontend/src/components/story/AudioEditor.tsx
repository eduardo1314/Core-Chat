import React from 'react';
import { X, Play, Pause, Music } from 'lucide-react';
import { useAudioEditor } from '../../hooks/useAudioEditor';


interface AudioEditorProps {
    /** URL del preview de la canción (de Deezer) */
    previewUrl: string;
    songTitle: string;
    songArtist: string;
    onClose: () => void;
    onConfirm: (audioUrl: string, startTime: number, duration: number) => void;
    isProcessing?: boolean;
}

/**
 *  
 * El procesamiento y subida a Cloudinary se realiza en StoryController
 */
const AudioEditor: React.FC<AudioEditorProps> = ({
    previewUrl,
    songTitle,
    songArtist,
    onClose,
    onConfirm,
    isProcessing: externalProcessing = false,
}) => {
    // Hook para controlar la reproducción del audio
    const {
        duration,
        currentTime,
        isPlaying,
        error,
        isLoaded,
        togglePlay,
        seek,
        formattedCurrentTime,
        formattedDuration,
        audioRef,
    } = useAudioEditor({
        previewUrl,
    });

    const isProcessing = externalProcessing;

    /**
     * Maneja el click en la barra de progreso para hacer seek
     */
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration || !audioRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const newTime = Math.max(0, Math.min(x * duration, duration));
        seek(newTime);
    };

    /**
     * Confirma la selección y pasa la URL original con duración de 30 segundos
     * El audio se subirá a Cloudinary en StoryController
     */
    const handleConfirm = () => {
        // Pasamos la URL original de Deezer con duración fija de 30 segundos
        onConfirm(
            previewUrl, // URL original de Deezer
            0, // startTime en 0
            30 // duración fija de 30 segundos
        );
    };

    if (!previewUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                        disabled={isProcessing}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Music className="w-5 h-5 text-blue-500" />
                        Vista previa
                    </h3>

                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing || !isLoaded}
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Procesando...' : 'Listo'}
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Info de la canción */}
                    <div className="text-center">
                        <h4 className="font-semibold text-gray-800 dark:text-white text-lg">
                            {songTitle}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {songArtist}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Duración: {formattedDuration}
                        </p>
                    </div>

                    {/* Barra de progreso */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                                {formattedCurrentTime}
                            </span>
                            <span className="text-gray-400">
                                {formattedDuration}
                            </span>
                        </div>

                        <div
                            className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                            onClick={handleProgressClick}
                        >
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-100"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Botón de reproducción */}
                    <div className="flex justify-center py-2">
                        <button
                            onClick={togglePlay}
                            disabled={!isLoaded || isProcessing}
                            className="p-4 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            {isPlaying ? (
                                <Pause className="w-8 h-8" />
                            ) : (
                                <Play className="w-8 h-8" />
                            )}
                        </button>
                    </div>

                  

                    {/* Errores */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-sm p-2 rounded-lg text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioEditor;