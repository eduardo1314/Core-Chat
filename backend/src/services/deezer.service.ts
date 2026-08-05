import axios from 'axios';

// ============================================
// INTERFACES
// ============================================
interface DeezerApiResponse {
    data: Array<any>;
}

export interface DeezerTrack {
    id: string;
    title: string;
    artist: string;
    album: string;
    album_art: string;
    duration: number;
    preview_url: string | null;
}

// ============================================
// BUSCAR CANCIONES EN DEEZER
// ============================================
export const searchDeezerTracks = async (
    query: string,
    limit: number = 20
): Promise<DeezerTrack[]> => {
    try {
        const response = await axios.get<DeezerApiResponse>('https://api.deezer.com/search', {
            params: { q: query, limit }
        });

        return response.data.data.map((track: any) => ({
            id: track.id.toString(),
            title: track.title,
            artist: track.artist.name,
            album: track.album.title,
            album_art: track.album.cover_medium,
            duration: track.duration,
            preview_url: track.preview,
        }));
    } catch (error) {
        console.error('❌ Error en Deezer:', error);
        return [];
    }
};

// ============================================
// CANCIONES POPULARES EN DEEZER
// ============================================
export const getDeezerPopularTracks = async (limit: number = 50): Promise<DeezerTrack[]> => {
    try {
        const response = await axios.get<DeezerApiResponse>('https://api.deezer.com/chart/0/tracks', {
            params: { limit }
        });

        return response.data.data.map((track: any) => ({
            id: track.id.toString(),
            title: track.title,
            artist: track.artist.name,
            album: track.album.title,
            album_art: track.album.cover_medium,
            duration: track.duration,
            preview_url: track.preview,
        }));
    } catch (error) {
        console.error('❌ Error en Deezer:', error);
        return [];
    }
};