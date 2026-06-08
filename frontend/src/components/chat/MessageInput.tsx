import React, { useState } from 'react';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Enviar
                </button>
            </div>
        </form>
    );
};

export default MessageInput;
