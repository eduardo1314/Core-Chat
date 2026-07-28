import { useState, useRef, useEffect, useCallback } from 'react';
import { getAudioDuration } from '../services/audio.service';

// ============================================
// INTERFACES
// ============================================

/**
 * Props para el hook useAudioEditor
 */
interface UseAudioEditorProps {
    /** URL del audio a cargar */
    previewUrl: string;
}

/**
 * Retorno del hook useAudioEditor
 */
interface UseAudioEditorReturn {
    // Estados del audio
    duration: number;
    currentTime: number;
    isPlaying: boolean;
    error: string | null;
    isLoaded: boolean;
    
    // Controles
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    
    // Info
    formattedCurrentTime: string;
    formattedDuration: string;
    audioRef: React.RefObject<HTMLAudioElement | null>;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook personalizado para manejar la reproducción de audio
 * (Solo reproducción, sin edición de fragmentos)
 * 
 * @param props - Configuración del hook
 * @returns Objeto con estados y funciones para controlar el audio
 */
export const useAudioEditor = ({
    previewUrl,
}: UseAudioEditorProps): UseAudioEditorReturn => {
    // Estados principales del audio
    const [duration, setDuration] = useState<number>(30);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    /**
     * Formatea un tiempo en segundos a formato MM:SS
     */
    const formatTime = useCallback((seconds: number): string => {
        if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    /**
     * Carga el audio y configura los event listeners
     */
    useEffect(() => {
        if (!previewUrl) {
            setError('No hay URL de audio');
            return;
        }

        // Limpiar audio anterior
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }

        const audio = new Audio(previewUrl);
        audioRef.current = audio;
        setIsLoaded(false);
        setError(null);

        // Event listeners del audio
        const handleLoadedMetadata = () => {
            const audioDuration = audio.duration || 30;
            setDuration(audioDuration);
            setIsLoaded(true);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        const handleError = () => {
            setError('Error al cargar el audio');
            setIsLoaded(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // Obtener duración desde el servicio (fallback)
        const loadDuration = async () => {
            try {
                const dur = await getAudioDuration(previewUrl);
                if (dur && dur > 0) {
                    setDuration(dur);
                }
            } catch (err) {
                console.log('Usando duración del audio directamente');
            }
        };
        loadDuration();

        // Cleanup
        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
    }, [previewUrl]);

    /**
     * Reproduce el audio desde el inicio
     */
    const play = useCallback(() => {
        if (!audioRef.current || !isLoaded) {
            setError('El audio no está listo');
            return;
        }
        
        audioRef.current.play()
            .then(() => {
                setIsPlaying(true);
                setError(null);
            })
            .catch((err) => {
                setError('Error al reproducir el audio');
                console.error(err);
            });
    }, [isLoaded]);

    /**
     * Pausa la reproducción del audio
     */
    const pause = useCallback(() => {
        if (!audioRef.current) return;
        
        audioRef.current.pause();
        setIsPlaying(false);
    }, []);

    /**
     * Alterna entre reproducción y pausa
     */
    const togglePlay = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, play, pause]);

    /**
     * Avanza a un punto específico del audio
     * @param time 
     */
    const seek = useCallback((time: number) => {
        if (!audioRef.current) return;
        
        const seekTime = Math.max(0, Math.min(time, duration));
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
    }, [duration]);

    // Formatos de tiempo para mostrar en la UI
    const formattedCurrentTime = formatTime(currentTime);
    const formattedDuration = formatTime(duration);

    return {
        duration,
        currentTime,
        isPlaying,
        error,
        isLoaded,
        play,
        pause,
        togglePlay,
        seek,
        formattedCurrentTime,
        formattedDuration,
        audioRef,
    };
};

export default useAudioEditor;