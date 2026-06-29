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
    updateLastMessage: (chatId: string, messageData: { 
        id: string; 
        content: string; 
        created_at: string; 
        status?: 'pending' | 'sent' | 'delivered' | 'read';
        is_read?: boolean;
        type?: string;  
        sender: { id: string; username: string; } 
    }) => void;
}

export const useChats = (): UseChatsReturn => {
    const [activeChats, setActiveChats] = useState<Chat[]>([]);
    const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const isLoadingRef = useRef(false);

    // ============================================
    // CARGAR CHATS ACTIVOS
    // ============================================
    const loadActiveChats = useCallback(async () => {
        if (isLoadingRef.current) return;
        
        isLoadingRef.current = true;
        try {
            const response = await getActiveChatsService();
            if (response.success) {
                const backendChats = response.data || [];
                
                setActiveChats(prev => {
                    const merged = backendChats.map((backendChat: Chat) => {
                        const existingChat = prev.find(c => c.id === backendChat.id);
                        
                        if (existingChat?.lastMessage && existingChat.updated_at) {
                            const existingTime = new Date(existingChat.updated_at).getTime();
                            const backendTime = new Date(backendChat.updated_at || 0).getTime();
                            
                            if (existingTime >= backendTime) {
                                return {
                                    ...backendChat,
                                    lastMessage: existingChat.lastMessage,
                                    updated_at: existingChat.updated_at
                                };
                            }
                        }
                        
                        return backendChat;
                    });
                    
                    // funcion de ordenamiento de chats
                    return merged.sort((a, b) => {
                        const timeA = a.lastMessage?.created_at 
                            ? new Date(a.lastMessage.created_at).getTime() 
                            : new Date(a.updated_at || 0).getTime();
                        const timeB = b.lastMessage?.created_at 
                            ? new Date(b.lastMessage.created_at).getTime() 
                            : new Date(b.updated_at || 0).getTime();
                        return timeB - timeA;
                    });
                });
            }
        } catch (err: any) {
            setError(err.error || 'Error al cargar chats');
        } finally {
            isLoadingRef.current = false;
        }
    }, []);

    // ============================================
    // CARGAR CHATS ARCHIVADOS
    // ============================================
    const loadArchivedChats = useCallback(async () => {
        if (isLoadingRef.current) return;
        
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

    // ============================================
    // AGREGAR CHAT
    // ============================================
    const addChat = useCallback((chat: Chat) => {
        setActiveChats(prev => {
            if (prev.some(c => c.id === chat.id)) return prev;
            return [chat, ...prev];
        });
    }, []);

    // ============================================
    // ACTUALIZAR CHAT
    // ============================================
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

    // ============================================
    // ELIMINAR CHAT
    // ============================================
    const removeChat = useCallback((chatId: string) => {
        setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
        setArchivedChats(prev => prev.filter(chat => chat.id !== chatId));
    }, []);

    // ============================================
    // ACTUALIZAR ÚLTIMO MENSAJE
    // ============================================
    const updateLastMessage = useCallback((chatId: string, messageData: { 
        id: string; 
        content: string; 
        created_at: string; 
        status?: 'pending' | 'sent' | 'delivered' | 'read';
        is_read?: boolean;
        type?: string;
        sender: { id: string; username: string; } 
    }) => {
        setActiveChats(prev => {
            const chatIndex = prev.findIndex(chat => chat.id === chatId);
            
            if (chatIndex === -1) return prev;
            
            const updatedChat = {
                ...prev[chatIndex],
                lastMessage: {
                    id: messageData.id,
                    content: messageData.content,
                    created_at: messageData.created_at,
                    status: messageData.status || 'sent',
                    is_read: messageData.is_read || false,
                    sender: messageData.sender,
                    sender_id: messageData.sender.id,
                    chat_id: chatId,
                    type: messageData.type || 'text'
                },
                updated_at: messageData.created_at
            };
            
            const newList = prev.filter(chat => chat.id !== chatId);
            return [updatedChat, ...newList];
        });
        
        setArchivedChats(prev => 
            prev.map(chat => {
                if (chat.id === chatId) {
                    return {
                        ...chat,
                        lastMessage: {
                            id: messageData.id,
                            content: messageData.content,
                            created_at: messageData.created_at,
                            status: messageData.status || 'sent',
                            is_read: messageData.is_read || false,
                            sender: messageData.sender,
                            sender_id: messageData.sender.id,
                            chat_id: chatId,
                            type: messageData.type || 'text'
                        },
                        updated_at: messageData.created_at
                    };
                }
                return chat;
            })
        );
    }, []);

    // ============================================
    // ARCHIVAR CHAT
    // ============================================
    const archiveChat = useCallback(async (chatId: string) => {
        try {
            const chatToArchive = activeChats.find(c => c.id === chatId);
            if (chatToArchive) {
                setActiveChats(prev => prev.filter(c => c.id !== chatId));
                setArchivedChats(prev => [chatToArchive, ...prev]);
            }

            await archiveChatService(chatId);
        } catch (err: any) {
            setError(err.error || 'Error al archivar chat');
        }
    }, [activeChats]);

    // ============================================
    // DESARCHIVAR CHAT
    // ============================================
    const unarchiveChat = useCallback(async (chatId: string) => {
        try {
            const chatToUnarchive = archivedChats.find(c => c.id === chatId);
            if (chatToUnarchive) {
                setArchivedChats(prev => prev.filter(c => c.id !== chatId));
                setActiveChats(prev => [chatToUnarchive, ...prev]);
            }

            await unarchiveChatService(chatId);
        } catch (err: any) {
            setError(err.error || 'Error al desarchivar chat');
        }
    }, [archivedChats]);

    // ============================================
    // CREAR CHAT
    // ============================================
    const createChat = useCallback(async (participantIds: string[], type = 'private', name?: string): Promise<Chat | null> => {
        try {
            let chatName = name;
            if (type === 'private' && !chatName && participantIds.length === 1) {
                chatName = null as any;
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

    // ============================================
    // CARGA INICIAL
    // ============================================
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
        removeChat,
        updateLastMessage
    };
};