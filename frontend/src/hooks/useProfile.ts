import { useState, useCallback, useRef, ChangeEvent } from 'react';
import { uploadAvatarService, removeAvatarService } from '../services/user.service';

export interface AvatarState {
    file: File | null;
    preview: string | null;
    loading: boolean;
    error: string | null;
    progress: number;
}

export interface AvatarActions {
    setFile: (file: File | null) => void;
    upload: () => Promise<string | null>;
    remove: () => Promise<boolean>;
    reset: () => void;
    clearError: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

interface UseAvatarProps {
    onSuccess?: (url: string) => void;
    onError?: (error: string) => void;
    currentAvatar?: string | null;
}

export const useAvatar = ({ 
    onSuccess, 
    onError, 
    currentAvatar = null 
}: UseAvatarProps = {}) => {
    const [state, setState] = useState<AvatarState>({
        file: null,
        preview: currentAvatar,
        loading: false,
        error: null,
        progress: 0
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ============================================
    // VALIDAR ARCHIVO
    // ============================================
    const validateFile = useCallback((file: File): string | null => {
        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
            return `La imagen no debe superar ${MAX_FILE_SIZE / 1024 / 1024}MB`;
        }

        // Validar tipo MIME
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Formato no permitido. Usa JPG, PNG, GIF o WEBP';
        }

        // Validar extensión
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            return 'Extensión de archivo no permitida';
        }

        return null;
    }, []);

    // ============================================
    // MANEJAR SELECCIÓN DE ARCHIVO
    // ============================================
    const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (!file) {
            setState(prev => ({ ...prev, file: null, preview: currentAvatar, error: null }));
            return;
        }

        // Validar archivo
        const validationError = validateFile(file);
        if (validationError) {
            setState(prev => ({ 
                ...prev, 
                file: null, 
                preview: currentAvatar, 
                error: validationError 
            }));
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setState(prev => ({
                ...prev,
                file,
                preview: reader.result as string,
                error: null
            }));
        };
        reader.readAsDataURL(file);

    }, [validateFile, currentAvatar]);

    // ============================================
    // SUBIR AVATAR
    // ============================================
    const upload = useCallback(async (): Promise<string | null> => {
        if (!state.file) {
            const error = 'Selecciona una imagen primero';
            setState(prev => ({ ...prev, error }));
            onError?.(error);
            return null;
        }

        setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }));

        try {
            const progressInterval = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    progress: Math.min(prev.progress + 10, 90)
                }));
            }, 200);

            const response = await uploadAvatarService(state.file);

            clearInterval(progressInterval);
            setState(prev => ({ ...prev, progress: 100 }));

            if (!response.success) {
                throw new Error(response.error || 'Error al subir avatar');
            }

            const avatarUrl = response.data?.avatar_url;
            if (!avatarUrl) {
                throw new Error(response.error || 'Error al subir avatar');
            }

            // Actualizar estado
            setState(prev => ({
                ...prev,
                file: null,
                preview: avatarUrl,
                loading: false,
                progress: 0,
                error: null
            }));

            // Limpiar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            onSuccess?.(avatarUrl);
            return avatarUrl;

        } catch (error: any) {
            const errorMessage = error?.error || error?.message || 'Error al subir el avatar';
            setState(prev => ({
                ...prev,
                loading: false,
                progress: 0,
                error: errorMessage
            }));
            onError?.(errorMessage);
            return null;
        }
    }, [state.file, onSuccess, onError]);

    // ============================================
    // ELIMINAR AVATAR
    // ============================================
    const remove = useCallback(async (): Promise<boolean> => {
        if (!currentAvatar && !state.preview) {
            setState(prev => ({ ...prev, error: 'No hay avatar para eliminar' }));
            return false;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await removeAvatarService();

            if (!response.success) {
                throw new Error(response.error || 'Error al eliminar avatar');
            }

            setState(prev => ({
                ...prev,
                file: null,
                preview: null,
                loading: false,
                error: null
            }));

            onSuccess?.('');
            return true;

        } catch (error: any) {
            const errorMessage = error?.error || error?.message || 'Error al eliminar el avatar';
            setState(prev => ({
                ...prev,
                loading: false,
                error: errorMessage
            }));
            onError?.(errorMessage);
            return false;
        }
    }, [currentAvatar, state.preview, onSuccess, onError]);

    // ============================================
    // RESET EAR ESTADO
    // ============================================
    const reset = useCallback(() => {
        setState({
            file: null,
            preview: currentAvatar,
            loading: false,
            error: null,
            progress: 0
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [currentAvatar]);

    // ============================================
    // LIMPIAR ERROR
    // ============================================
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // ============================================
    // TRIGGER FILE INPUT
    // ============================================
    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
        // Estado
        file: state.file,
        preview: state.preview,
        loading: state.loading,
        error: state.error,
        progress: state.progress,
        hasAvatar: !!state.preview,

        // Referencias
        fileInputRef,

        // Acciones
        handleFileSelect,
        upload,
        remove,
        reset,
        clearError,
        openFilePicker
    };
};