import { useState, useEffect, useCallback } from 'react';
import { getPopularSongs, searchSongs} from '../services/music.service';
import { Music as MusicType } from '../types';

interface UseMusicReturn {
    songs: MusicType[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedSong: MusicType | null;
    selectSong: (song: MusicType) => void;
    clearSelection: () => void;
    loadPopularSongs: () => Promise<void>;
    searchSongsByQuery: (query: string) => Promise<void>;
    isSearching: boolean;
}

export const useMusic = (): UseMusicReturn => {
    const [songs, setSongs] = useState<MusicType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSong, setSelectedSong] = useState<MusicType | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // ============================================
    // 1. CARGAR CANCIONES POPULARES
    // ============================================
    const loadPopularSongs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getPopularSongs(30);
            setSongs(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar canciones');
            console.error('Error al cargar canciones:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================
    // 2. BUSCAR CANCIONES
    // ============================================
    const searchSongsByQuery = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            await loadPopularSongs();
            return;
        }

        try {
            setIsSearching(true);
            setLoading(true);
            setError(null);
            const data = await searchSongs(query);
            setSongs(data);
        } catch (err: any) {
            setError(err.message || 'Error al buscar canciones');
            console.error('Error al buscar canciones:', err);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [loadPopularSongs]);

    // ============================================
    // 3. SELECCIONAR CANCIÓN
    // ============================================
    const selectSong = useCallback((song: MusicType) => {
        setSelectedSong(song);
    }, []);

    // ============================================
    // 4. LIMPIAR SELECCIÓN
    // ============================================
    const clearSelection = useCallback(() => {
        setSelectedSong(null);
    }, []);

    // ============================================
    // 5. BUSCAR CON DEBOUNCE
    // ============================================
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            loadPopularSongs();
            return;
        }

        const debounceTimer = setTimeout(() => {
            searchSongsByQuery(searchQuery);
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, loadPopularSongs, searchSongsByQuery]);

    // ============================================
    // 6. CARGAR INICIAL
    // ============================================
    useEffect(() => {
        loadPopularSongs();
    }, []);

    return {
        songs,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        selectedSong,
        selectSong,
        clearSelection,
        loadPopularSongs,
        searchSongsByQuery,
        isSearching,
    };
};