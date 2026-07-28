import { searchDeezerTracks } from './deezer.service';

export interface DeezerTrack {
    id: string;
    title: string;
    artist: string;
    album: string;
    album_art: string;
    duration: number;
    preview_url: string | null;
}

export interface MusicResult extends DeezerTrack {
    full_audio_url: string | null;
    youtube_id: string | null;
    is_full: boolean;
}

export const searchMusicWithFullAudio = async (
    query: string,
    limit: number = 20
): Promise<MusicResult[]> => {
    try {
        
        // Solo Deezer
        const deezerResults = await searchDeezerTracks(query, limit);
        console.log(`✅ Deezer: ${deezerResults.length} resultados`);
        
        return deezerResults.map((track) => ({
            ...track,
            full_audio_url: null,
            youtube_id: null,
            is_full: false,
        }));

    } catch (error) {
        console.error('❌ Error al buscar música:', error);
        return [];
    }
};

