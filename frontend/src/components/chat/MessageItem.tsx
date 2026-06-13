import React from 'react';

interface MessageItemProps {
    message: {
        id: string;
        text: string;
        isMine: boolean;
        time: string;
        senderName?: string;
        isEdited?: boolean;
        isDeleted?: boolean;
    };
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
    return (
        <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    message.isMine
                        ? 'bg-blue-500 text-white dark:bg-blue-600 rounded-br-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm rounded-bl-none'
                }`}
            >
                {!message.isMine && message.senderName && (
                    <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">
                        {message.senderName}
                    </p>
                )}
                <p className="text-sm break-words">{message.text}</p>
                <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs ${message.isMine ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {message.time}
                    </span>
                    {message.isEdited && !message.isDeleted && (
                        <span className={`text-xs ${message.isMine ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
                            (editado)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
