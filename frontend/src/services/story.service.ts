import api from './api';
import { Story, CreateStoryData  } from '../types';


// ============================================
// 1. OBTENER HISTORIAS DE AMIGOS
// ============================================
export const getFriendsStories = async (): Promise<Story[]> => {
    const response = await api.get('/stories/friends');
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.error || 'Error al obtener historias');
};

// ============================================
// 2. CREAR HISTORIA (CON ARCHIVO)
// ============================================
export const createStory = async (
    file: File,
    data: CreateStoryData = {}
): Promise<Story> => {
    const formData = new FormData();
    
    // Siempre enviar el archivo
    formData.append('media', file);
    
    // Siempre enviar estos campos (con valores por defecto)
    formData.append('content', data.content || '');
    formData.append('location', data.location || '');
    formData.append('backgroundColor', data.backgroundColor || '#000000');
    formData.append('fontColor', data.fontColor || '#FFFFFF');
    formData.append('fontSize', data.fontSize || 'medium');
    
    // Música - solo si existen
    if (data.music) formData.append('music', data.music);
    if (data.music_artist) formData.append('music_artist', data.music_artist);
    if (data.music_duration) formData.append('music_duration', String(data.music_duration));
    if (data.music_preview_url) formData.append('music_preview_url', data.music_preview_url);
    
    // Posición y escala del texto
    if (data.textPosition) {
        formData.append('textPosition', JSON.stringify(data.textPosition));
    }
    if (data.textScale) {
        formData.append('textScale', String(data.textScale));
    }

    const response = await api.post('/stories', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.error || 'Error al crear historia');
};

// ============================================
// 3. OBTENER MIS HISTORIAS
// ============================================
export const getMyStories = async (): Promise<Story[]> => {
    const response = await api.get('/stories/me');
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.error || 'Error al obtener tus historias');
};

// ============================================
// 4. OBTENER UNA HISTORIA ESPECÍFICA
// ============================================
export const getStoryById = async (storyId: string): Promise<Story> => {
    const response = await api.get(`/stories/${storyId}`);
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.error || 'Error al obtener historia');
};

// ============================================
// 5. DAR/QUITAR LIKE
// ============================================
export const toggleLike = async (storyId: string): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await api.post(`/stories/${storyId}/like`);
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.error || 'Error al procesar like');
};

// ============================================
// 6. ELIMINAR HISTORIA
// ============================================
export const deleteStory = async (storyId: string): Promise<void> => {
    const response = await api.delete(`/stories/${storyId}`);
    if (!response.data.success) {
        throw new Error(response.data.error || 'Error al eliminar historia');
    }
};