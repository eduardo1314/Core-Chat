import { useState, useEffect, useCallback, useRef } from 'react';
import { getMessagesService, sendMessageService } from '../services/messages.service';
import { Message } from '../types';

interface UseMessagesReturn {
    messages: Message[];
    loading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<Message | null>;
    loadMessages: () => Promise<void>;
}

export const useMessages = (chatId: string | null): UseMessagesReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const loadMessages = useCallback(async () => {
        if (!chatId) return;
        
        try {
            const response = await getMessagesService(chatId);
            if (response.success && isMounted.current) {
                setMessages(response.data?.messages || []);
            }
        } catch (err: any) {
            if (isMounted.current) {
                setError(err.error || 'Error al cargar mensajes');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [chatId]);

    const sendMessage = useCallback(async (content: string): Promise<Message | null> => {
        if (!chatId) return null;
        
        try {
            const response = await sendMessageService(chatId, content);
            const newMessage = response.data;
            if (response.success && newMessage) {
                setMessages(prev => [...prev, newMessage]);
                return newMessage;
            }
            return null;
        } catch (err: any) {
            setError(err.error || 'Error al enviar mensaje');
            return null;
        }
    }, [chatId]);

    useEffect(() => {
        if (chatId) {
            loadMessages();
        }
    }, [chatId, loadMessages]);

    return {
        messages,
        loading,
        error,
        sendMessage,
        loadMessages
    };
};