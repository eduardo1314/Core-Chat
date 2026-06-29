// frontend/src/components/chat/ChatBackgroundSelector.tsx
import React, { useRef } from 'react';
import { SOLID_COLORS, GRADIENTS, PATTERNS } from '../../constants/chatBackgrounds';
import { useChatBackgroundContext } from '../../context/ChatBackgroundContext';

interface ChatBackgroundSelectorProps {
    chatId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ChatBackgroundSelector: React.FC<ChatBackgroundSelectorProps> = ({
    chatId,
    isOpen,
    onClose
}) => {
    const { background, setBackground } = useChatBackgroundContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && chatId) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                const newBackground = { type: 'image' as const, value: imageUrl };
                setBackground(newBackground);
                localStorage.setItem(`chat_bg_${chatId}`, JSON.stringify(newBackground));
                onClose();
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelect = (type: 'solid' | 'gradient' | 'pattern', value: string) => {
        if (chatId) {
            const newBackground = { type, value };
            setBackground(newBackground);
            localStorage.setItem(`chat_bg_${chatId}`, JSON.stringify(newBackground));
            onClose();
        }
    };

    const handleReset = () => {
        if (chatId) {
            const newBackground = { type: 'default' as const, value: null };
            setBackground(newBackground);
            localStorage.setItem(`chat_bg_${chatId}`, JSON.stringify(newBackground));
            onClose();
        }
    };

    return (
        <div className="absolute top-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 w-72 max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
                ✕
            </button>

            <div className="space-y-4 mt-2">
                <div>
                    <button
                        onClick={handleReset}
                        className={`w-full px-3 py-2 text-sm rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                            background.type === 'default' ? 'ring-2 ring-blue-500' : ''
                        }`}
                    >
                        🗑️ Sin fondo
                    </button>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Colores
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                        {SOLID_COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => handleSelect('solid', color.value)}
                                className={`w-10 h-10 rounded-lg border-2 transition hover:scale-105 ${
                                    background.type === 'solid' && background.value === color.value
                                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                                        : 'border-gray-200 dark:border-gray-600'
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.label}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Gradientes
                    </p>
                    <div className="space-y-1">
                        {GRADIENTS.map((gradient) => (
                            <button
                                key={gradient.value}
                                onClick={() => handleSelect('gradient', gradient.value)}
                                className={`w-full px-3 py-2 text-sm rounded-lg text-left transition ${
                                    background.type === 'gradient' && background.value === gradient.value
                                        ? 'ring-2 ring-blue-500'
                                        : ''
                                }`}
                                style={{ background: gradient.value }}
                            >
                                <span className="text-white drop-shadow-md">{gradient.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Patrones
                    </p>
                    <div className="space-y-1">
                        {PATTERNS.map((pattern) => (
                            <button
                                key={pattern.value}
                                onClick={() => handleSelect('pattern', pattern.value)}
                                className={`w-full px-3 py-2 text-sm rounded-lg text-left border transition ${
                                    background.type === 'pattern' && background.value === pattern.value
                                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                                        : 'border-gray-200 dark:border-gray-600'
                                } hover:bg-gray-50 dark:hover:bg-gray-700`}
                                style={{ background: pattern.value }}
                            >
                                <span className="text-gray-700 dark:text-gray-300">{pattern.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Imagen personalizada
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        📷 Subir imagen
                    </button>
                </div>

                {background.type === 'image' && background.value && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Imagen actual:</p>
                        <img
                            src={background.value}
                            alt="Fondo actual"
                            className="w-full h-16 object-cover rounded-lg"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};