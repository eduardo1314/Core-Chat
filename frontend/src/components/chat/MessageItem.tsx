import React from 'react';

interface Message {
    id: string;
    text: string;
    isMine: boolean;
    time: string;
}

interface MessageItemProps {
    message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
    return (
        <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    message.isMine
                        ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm rounded-bl-none'
                }`}
            >
                <p className="text-sm break-words">{message.text}</p>
                <span
                    className={`text-xs mt-1 block ${
                        message.isMine ? 'text-purple-200 dark:text-purple-300' : 'text-gray-400 dark:text-gray-500'
                    }`}
                >
                    {message.time}
                </span>
            </div>
        </div>
    );
};

export default MessageItem;