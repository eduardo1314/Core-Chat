import { useState, useEffect, useCallback, useRef } from 'react';
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
    addChat: (chat: Chat) => void;
    updateChat: (chatId: string, updates: Partial<Chat>) => void;
    removeChat: (chatId: string) => void;
}

export const useChats = (): UseChatsReturn => {
    const [activeChats, setActiveChats] = useState<Chat[]>([]);
    const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const isLoadingRef = useRef(false);

    const loadActiveChats = useCallback(async () => {
        if (isLoadingRef.current) {
            console.log('⏳ Ya cargando chats activos, omitiendo...');
            return;
        }
        
        isLoadingRef.current = true;
        try {
            const response = await getActiveChatsService();
            if (response.success) {
                setActiveChats(response.data || []);
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar chats');
        } finally {
            isLoadingRef.current = false;
        }
    }, []);

    const loadArchivedChats = useCallback(async () => {
        if (isLoadingRef.current) {
            console.log('⏳ Ya cargando chats archivados, omitiendo...');
            return;
        }
        
        isLoadingRef.current = true;
        try {
            const response = await getArchivedChatsService();
            if (response.success) {
                setArchivedChats(response.data || []);
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar archivados');
        } finally {
            isLoadingRef.current = false;
        }
    }, []);

    const addChat = useCallback((chat: Chat) => {
        setActiveChats(prev => {
            if (prev.some(c => c.id === chat.id)) {
                console.log('⚠️ Chat ya existe en activos:', chat.id);
                return prev;
            }
            return [chat, ...prev];
        });
    }, []);

    const updateChat = useCallback((chatId: string, updates: Partial<Chat>) => {
        setActiveChats(prev => 
            prev.map(chat => 
                chat.id === chatId ? { ...chat, ...updates } : chat
            )
        );
        
        setArchivedChats(prev => 
            prev.map(chat => 
                chat.id === chatId ? { ...chat, ...updates } : chat
            )
        );
    }, []);

    const removeChat = useCallback((chatId: string) => {
        setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
        setArchivedChats(prev => prev.filter(chat => chat.id !== chatId));
    }, []);

    const archiveChat = useCallback(async (chatId: string) => {
        try {
            const chatToArchive = activeChats.find(c => c.id === chatId);
            if (chatToArchive) {
                setActiveChats(prev => prev.filter(c => c.id !== chatId));
                setArchivedChats(prev => [chatToArchive, ...prev]);
            }

            await archiveChatService(chatId);
            
            setTimeout(() => {
                loadActiveChats();
                loadArchivedChats();
            }, 100);
        } catch (err: any) {
            await loadActiveChats();
            await loadArchivedChats();
            setError(err.error || 'Error al archivar chat');
        }
    }, [activeChats, loadActiveChats, loadArchivedChats]);

    const unarchiveChat = useCallback(async (chatId: string) => {
        try {
            const chatToUnarchive = archivedChats.find(c => c.id === chatId);
            if (chatToUnarchive) {
                setArchivedChats(prev => prev.filter(c => c.id !== chatId));
                setActiveChats(prev => [chatToUnarchive, ...prev]);
            }

            await unarchiveChatService(chatId);
            
            setTimeout(() => {
                loadActiveChats();
                loadArchivedChats();
            }, 100);
        } catch (err: any) {
            await loadActiveChats();
            await loadArchivedChats();
            setError(err.error || 'Error al desarchivar chat');
        }
    }, [archivedChats, loadActiveChats, loadArchivedChats]);

    //  createChat con nombre del otro usuario para chats privados
    const createChat = useCallback(async (participantIds: string[], type = 'private', name?: string): Promise<Chat | null> => {
        try {
            //  Si es privado y no se proporcionó nombre, el nombre será el del otro usuario
            let chatName = name;
            if (type === 'private' && !chatName && participantIds.length === 1) {
                chatName = null as any; // Dejar que el backend maneje el nombre
            }
            
            const response = await createChatService({ type, name: chatName || undefined, participantIds });
            if (response.success && response.data) {
                setActiveChats(prev => [response.data!, ...prev]);
                return response.data;
            }
            return null;
        } catch (err: any) {
            setError(err.error || 'Error al crear chat');
            return null;
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        
        const load = async () => {
            if (!mounted) return;
            setLoading(true);
            await Promise.all([loadActiveChats(), loadArchivedChats()]);
            if (mounted) setLoading(false);
        };
        
        load();
        
        return () => {
            mounted = false;
        };
    }, []);

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
        setActiveChats,
        addChat,    
        updateChat, 
        removeChat  
    };
};