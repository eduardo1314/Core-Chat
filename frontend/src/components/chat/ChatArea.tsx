import React, { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Message {
    id: string;
    text: string;
    isMine: boolean;
    time: string;
}

interface ChatAreaProps {
    chatId: string | null;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: '¡Hola! ¿Cómo estás?', isMine: false, time: '10:30' },
        { id: '2', text: 'Bien, ¿y tú?', isMine: true, time: '10:31' },
        { id: '3', text: 'Muy bien, gracias', isMine: false, time: '10:32' },
    ]);

    const handleSendMessage = (text: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            isMine: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([...messages, newMessage]);
    };

    if (!chatId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-400 text-lg">Selecciona un chat para empezar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50">
            <div className="bg-white border-b border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-800">Conversación</h2>
            </div>
            
            <MessageList messages={messages} />
            <MessageInput onSendMessage={handleSendMessage} />
        </div>
    );
};

export default ChatArea;
