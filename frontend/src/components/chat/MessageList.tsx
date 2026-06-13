import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';

// Tipo de mensaje real del backend
interface Message {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    type: string;
    is_edited: boolean;
    is_deleted: boolean;
    reply_to: string | null;
    created_at: string;
    updated_at: string;
    sender?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}

interface MessageListProps {
    messages: Message[];
    currentUserId?: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Agrupar mensajes por fecha
    const groupByDate = (msgs: Message[]) => {
        const groups: { [key: string]: Message[] } = {};
        msgs.forEach(msg => {
            const date = new Date(msg.created_at).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    const groupedMessages = groupByDate(messages);

    // Transformar mensaje real al formato que espera MessageItem
    const transformToMessageItem = (msg: Message) => {
        return {
            id: msg.id,
            text: msg.is_deleted ? 'Mensaje eliminado' : msg.content,
            isMine: msg.user_id === currentUserId,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: msg.sender?.username,
            isEdited: msg.is_edited,
            isDeleted: msg.is_deleted
        };
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No hay mensajes aún. ¡Envía el primero!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                    <div className="flex justify-center my-4">
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                            {date}
                        </span>
                    </div>
                    {msgs.map(message => (
                        <MessageItem 
                            key={message.id} 
                            message={transformToMessageItem(message)} 
                        />
                    ))}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
