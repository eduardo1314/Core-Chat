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
    addChat: (chat: Chat) => void; // Para agregar desde WebSocket
    updateChat: (chatId: string, updates: Partial<Chat>) => void; 
    removeChat: (chatId: string) => void; // Para eliminar desde WebSocket
}

export const useChats = (): UseChatsReturn => {
    const [activeChats, setActiveChats] = useState<Chat[]>([]);
    const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    //  Prevenir múltiples llamadas simultáneas
    const isLoadingRef = useRef(false);

    const loadActiveChats = useCallback(async () => {
        // Prevenir carga si ya está cargando
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

    //  Funciones para actualizar desde WebSocket sin recargar todo
    const addChat = useCallback((chat: Chat) => {
        setActiveChats(prev => {
            // Evitar duplicados
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

    //  Mejorado: Solo recarga si es necesario
    const archiveChat = useCallback(async (chatId: string) => {
        try {
            // Actualizar localmente primero (optimista)
            const chatToArchive = activeChats.find(c => c.id === chatId);
            if (chatToArchive) {
                // Mover localmente a archivados
                setActiveChats(prev => prev.filter(c => c.id !== chatId));
                setArchivedChats(prev => [chatToArchive, ...prev]);
            }

            // Llamar al servicio
            await archiveChatService(chatId);
            
            // Recargar solo si es necesario (para sincronizar)
            // Usar setTimeout para evitar ciclos
            setTimeout(() => {
                loadActiveChats();
                loadArchivedChats();
            }, 100);
        } catch (err: any) {
            // Revertir cambio optimista
            await loadActiveChats();
            await loadArchivedChats();
            setError(err.error || 'Error al archivar chat');
        }
    }, [activeChats, loadActiveChats, loadArchivedChats]);

    const unarchiveChat = useCallback(async (chatId: string) => {
        try {
            // Actualizar localmente primero (optimista)
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

    // Mejorado: No recargar todo si no es necesario
    const createChat = useCallback(async (participantIds: string[], type = 'private', name?: string): Promise<Chat | null> => {
        try {
            const response = await createChatService({ type, name, participantIds });
            if (response.success && response.data) {
                // Agregar localmente sin recargar todo
                setActiveChats(prev => [response.data!, ...prev]);
                return response.data;
            }
            return null;
        } catch (err: any) {
            setError(err.error || 'Error al crear chat');
            return null;
        }
    }, []);

    //  Carga inicial solo una vez
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
    }, []); // Sin dependencias para evitar recargas

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