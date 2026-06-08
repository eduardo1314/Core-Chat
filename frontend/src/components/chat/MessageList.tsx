import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';

interface Message {
    id: string;
    text: string;
    isMine: boolean;
    time: string;
}

interface MessageListProps {
    messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Agrupar mensajes por fecha (simplificado)
    const groupByDate = (msgs: Message[]) => {
        const groups: { [key: string]: Message[] } = {};
        msgs.forEach(msg => {
            const date = new Date().toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    const groupedMessages = groupByDate(messages);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                    <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {date}
                        </span>
                    </div>
                    {msgs.map(message => (
                        <MessageItem key={message.id} message={message} />
                    ))}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
