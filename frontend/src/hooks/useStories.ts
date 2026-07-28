import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from './useSocket';
import { Story, UserStories, CreateStoryData } from '../types';
import {
    getFriendsStories,
    createStory,
    deleteStory,
    toggleLike,
} from '../services/story.service';

export const useStories = () => {
    const { socket, isConnected } = useSocket();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ============================================
    // AGRUPAR HISTORIAS POR USUARIO
    // ============================================
    const groupedStories = useMemo((): UserStories[] => {
        const grouped: { [key: string]: UserStories } = {};

        stories.forEach((story) => {
            if (!grouped[story.userId]) {
                grouped[story.userId] = {
                    userId: story.userId,
                    username: story.username,
                    avatar: story.avatar,
                    stories: [],
                    viewed: true,
                    lastUpdated: story.timestamp,
                };
            }

            if (story.isOwn || !story.viewed) {
                grouped[story.userId].viewed = false;
            }

            grouped[story.userId].stories.push(story);
            
            if (new Date(story.timestamp) > new Date(grouped[story.userId].lastUpdated)) {
                grouped[story.userId].lastUpdated = story.timestamp;
            }
        });

        return Object.values(grouped).sort((a, b) => {
            if (!a.viewed && b.viewed) return -1;
            if (a.viewed && !b.viewed) return 1;
            return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        });
    }, [stories]);

    // ============================================
    // OBTENER HISTORIAS DE UN USUARIO ESPECÍFICO
    // ============================================
    const getUserStories = useCallback((userId: string): Story[] => {
        return stories
            .filter(s => s.userId === userId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [stories]);

    // ============================================
    // OBTENER LA PRIMERA HISTORIA DE UN USUARIO
    // ============================================
    const getFirstStory = useCallback((userId: string): Story | undefined => {
        const userStories = getUserStories(userId);
        return userStories[0];
    }, [getUserStories]);

    // ============================================
    // 1. CARGAR HISTORIAS
    // ============================================
    const loadStories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getFriendsStories();
            setStories(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar historias');
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================
    // 2. CREAR HISTORIA
    // ============================================
    const createNewStory = useCallback(async (file: File, data: CreateStoryData = {}) => {
        try {
            setError(null);
            const newStory = await createStory(file, data);
            
            if (!isConnected) {
                setStories(prev => [newStory, ...prev]);
            }
            
            return newStory;
        } catch (err: any) {
            setError(err.message || 'Error al crear historia');
            throw err;
        }
    }, [isConnected]);

    // ============================================
    // 3. ELIMINAR HISTORIA
    // ============================================
    const removeStory = useCallback(async (storyId: string) => {
        try {
            setError(null);
            await deleteStory(storyId);
            setStories(prev => prev.filter(story => story.id !== storyId));
        } catch (err: any) {
            setError(err.message || 'Error al eliminar historia');
            throw err;
        }
    }, []);

    // ============================================
    // 4. DAR/QUITAR LIKE
    // ============================================
    const likeStory = useCallback(async (storyId: string) => {
        try {
            setError(null);
            const result = await toggleLike(storyId);
            
            setStories(prev => prev.map(story => 
                story.id === storyId
                    ? { 
                        ...story, 
                        likes: result.likesCount, 
                        hasLiked: result.liked 
                    }
                    : story
            ));
            
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al procesar like');
            throw err;
        }
    }, []);

    // ============================================
    // 5. ESCUCHAR EVENTOS DE SOCKET
    // ============================================
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNewStory = (story: Story) => {
            setStories(prev => {
                if (prev.some(s => s.id === story.id)) return prev;
                return [story, ...prev];
            });
        };

        const handleLikeUpdate = (data: { 
            storyId: string; 
            userId: string; 
            liked: boolean; 
            likesCount: number 
        }) => {
            setStories(prev => prev.map(story => 
                story.id === data.storyId
                    ? { ...story, likes: data.likesCount, hasLiked: data.liked }
                    : story
            ));
        };

        const handleStoryDeleted = (data: { storyId: string; userId: string }) => {
            setStories(prev => prev.filter(story => story.id !== data.storyId));
        };

        const handleStoryExpired = (data: { storyId: string; userId: string }) => {
            setStories(prev => prev.filter(story => story.id !== data.storyId));
        };

        const handleStoryViewed = (data: { 
            storyId: string; 
            viewerId: string; 
            viewsCount: number 
        }) => {
            setStories(prev => prev.map(story => 
                story.id === data.storyId
                    ? { ...story, viewsCount: data.viewsCount }
                    : story
            ));
        };

        socket.on('new-story', handleNewStory);
        socket.on('story-like-updated', handleLikeUpdate);
        socket.on('story-deleted', handleStoryDeleted);
        socket.on('story-expired', handleStoryExpired);
        socket.on('story-viewed-by', handleStoryViewed);

        return () => {
            socket.off('new-story', handleNewStory);
            socket.off('story-like-updated', handleLikeUpdate);
            socket.off('story-deleted', handleStoryDeleted);
            socket.off('story-expired', handleStoryExpired);
            socket.off('story-viewed-by', handleStoryViewed);
        };
    }, [socket, isConnected]);

    // ============================================
    // 6. MARCAR HISTORIA COMO VISTA (SOCKET)
    // ============================================
    const markAsViewed = useCallback((storyId: string) => {
        if (socket && isConnected) {
            socket.emit('story-viewed', { storyId });
            socket.emit('join-story', storyId);
        }
    }, [socket, isConnected]);

    // ============================================
    // 7. SALIR DE SALA DE HISTORIA
    // ============================================
    const leaveStory = useCallback((storyId: string) => {
        if (socket && isConnected) {
            socket.emit('leave-story', storyId);
        }
    }, [socket, isConnected]);

    // ============================================
    // 8. RECARGAR HISTORIAS
    // ============================================
    const refresh = useCallback(() => {
        loadStories();
    }, [loadStories]);

    return {
        stories,
        groupedStories,
        getUserStories,
        getFirstStory,
        loading,
        error,
        loadStories,
        createStory: createNewStory,
        deleteStory: removeStory,
        likeStory,
        markAsViewed,
        leaveStory,
        refresh,
        socket,
        isConnected,
    };
};