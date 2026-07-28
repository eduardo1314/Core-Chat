import api from './api';

import { Music } from '../types';


// ============================================
// 🎵 OBTENER CANCIONES POPULARES
// ============================================
export const getPopularSongs = async (limit: number = 50): Promise<Music[]> => {
    try {
        const response = await api.get('/music/popular', { params: { limit } });
        if (response.data.success) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error al obtener canciones populares:', error);
        return [];
    }
};

// ============================================
// 🎵 BUSCAR CANCIONES
// ============================================
export const searchSongs = async (query: string): Promise<Music[]> => {
    try {
        if (!query || query.length < 2) {
            return [];
        }
        
        const response = await api.get('/music/search', { params: { query } });
        if (response.data.success) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error al buscar canciones:', error);
        return [];
    }
};

// ============================================
// 🎵 DESCARGAR CANCIÓN COMPLETA
// ============================================
export const downloadFullSong = async (videoUrl: string): Promise<{ url: string }> => {
    const response = await api.post('/music/download', { videoUrl });
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.error || 'Error al descargar canción');
};