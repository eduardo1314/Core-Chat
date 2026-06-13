import { useState, useEffect, useCallback } from 'react';
import { 
    getActiveChatsService,
    getArchivedChatsService,
    archiveChatService,
    unarchiveChatService,
    createChatService
} from '../services/chats.service';
import { Chat } from '../types';

interface UseChatsReturn {
    activeChats: Chat[];
    archivedChats: Chat[];
    loading: boolean;
    error: string | null;
    archiveChat: (chatId: string) => Promise<void>;
    unarchiveChat: (chatId: string) => Promise<void>;
    createChat: (participantIds: string[], type?: string, name?: string) => Promise<Chat | null>;
    loadActiveChats: () => Promise<void>;
    loadArchivedChats: () => Promise<void>;
    setActiveChats: React.Dispatch<React.SetStateAction<Chat[]>>;
}

export const useChats = (): UseChatsReturn => {
    const [activeChats, setActiveChats] = useState<Chat[]>([]);
    const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadActiveChats = useCallback(async () => {
        try {
            const response = await getActiveChatsService();
            if (response.success) {
                setActiveChats(response.data || []);
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar chats');
        }
    }, []);

    const loadArchivedChats = useCallback(async () => {
        try {
            const response = await getArchivedChatsService();
            if (response.success) {
                setArchivedChats(response.data || []);
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar archivados');
        }
    }, []);

    const archiveChat = useCallback(async (chatId: string) => {
        try {
            await archiveChatService(chatId);
            await loadActiveChats();
            await loadArchivedChats();
        } catch (err: any) {
            setError(err.error || 'Error al archivar chat');
        }
    }, [loadActiveChats, loadArchivedChats]);

    const unarchiveChat = useCallback(async (chatId: string) => {
        try {
            await unarchiveChatService(chatId);
            await loadActiveChats();
            await loadArchivedChats();
        } catch (err: any) {
            setError(err.error || 'Error al desarchivar chat');
        }
    }, [loadActiveChats, loadArchivedChats]);

    const createChat = useCallback(async (participantIds: string[], type = 'private', name?: string): Promise<Chat | null> => {
        try {
            const response = await createChatService({ type, name, participantIds });
            if (response.success && response.data) {
                await loadActiveChats();
                return response.data;
            }
            return null;
        } catch (err: any) {
            setError(err.error || 'Error al crear chat');
            return null;
        }
    }, [loadActiveChats]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([loadActiveChats(), loadArchivedChats()]);
            setLoading(false);
        };
        load();
    }, [loadActiveChats, loadArchivedChats]);

    return {
        activeChats,
        archivedChats,
        loading,
        error,
        archiveChat,
        unarchiveChat,
        createChat,
        loadActiveChats,
        loadArchivedChats,
        setActiveChats
    };
};
