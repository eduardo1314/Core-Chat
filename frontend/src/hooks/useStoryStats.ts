import { useState, useCallback } from 'react';
import { getStoryViewers, getStoryLikers } from '../services/story.service';
import { User } from '../types';

interface UseStoryStatsReturn {
    viewers: User[];
    likers: User[];
    viewsCount: number;
    likesCount: number;
    loading: boolean;
    error: string | null;
    loadStats: (storyId: string) => Promise<void>;
}

export const useStoryStats = (): UseStoryStatsReturn => {
    const [viewers, setViewers] = useState<User[]>([]);
    const [likers, setLikers] = useState<User[]>([]);
    const [viewsCount, setViewsCount] = useState(0);
    const [likesCount, setLikesCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStats = useCallback(async (storyId: string) => {
        if (!storyId) {
            setError('ID de historia no proporcionado');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [viewersData, likersData] = await Promise.all([
                getStoryViewers(storyId),
                getStoryLikers(storyId),
            ]);

            setViewers(viewersData.viewers || []);
            setViewsCount(viewersData.viewsCount || 0);
            setLikers(likersData.likers || []);
            setLikesCount(likersData.likesCount || 0);

        } catch (err: any) {
            console.error('❌ Error al cargar estadísticas:', err);
            setError(err.message || 'Error al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        viewers,
        likers,
        viewsCount,
        likesCount,
        loading,
        error,
        loadStats,
    };
};