import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ChatBackground {
    type: 'default' | 'solid' | 'gradient' | 'image' | 'pattern';
    value: string | null;
}

interface ChatBackgroundContextType {
    background: ChatBackground;
    setBackground: (background: ChatBackground) => void;
    updateBackground: (chatId: string, type: ChatBackground['type'], value: string | null) => void;
    getBackgroundStyles: () => React.CSSProperties;
    loading: boolean;
    isDarkMode: boolean;
}

const ChatBackgroundContext = createContext<ChatBackgroundContextType | undefined>(undefined);

export const useChatBackgroundContext = () => {
    const context = useContext(ChatBackgroundContext);
    if (!context) {
        throw new Error('useChatBackgroundContext must be used within a ChatBackgroundProvider');
    }
    return context;
};

interface ChatBackgroundProviderProps {
    children: ReactNode;
    chatId: string | null;
}

export const ChatBackgroundProvider: React.FC<ChatBackgroundProviderProps> = ({ children, chatId }) => {
    const [background, setBackground] = useState<ChatBackground>({
        type: 'default',
        value: null
    });
    const [loading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // ============================================
    // DETECTAR MODO OSCURO (GLOBAL)
    // ============================================
    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        checkDarkMode();

        const observer = new MutationObserver(() => {
            checkDarkMode();
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // ============================================
    // CARGAR FONDO DEL LOCALSTORAGE
    // ============================================
    useEffect(() => {
        if (!chatId) {
            setBackground({ type: 'default', value: null });
            return;
        }

        const saved = localStorage.getItem(`chat_bg_${chatId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setBackground(parsed);
            } catch (error) {
                console.error('Error al cargar fondo:', error);
                setBackground({ type: 'default', value: null });
            }
        } else {
            setBackground({ type: 'default', value: null });
        }
    }, [chatId]);

    // ============================================
    // ACTUALIZAR FONDO
    // ============================================
    const updateBackground = (id: string, type: ChatBackground['type'], value: string | null) => {
        const newBackground = { type, value };
        setBackground(newBackground);
        if (id) {
            localStorage.setItem(`chat_bg_${id}`, JSON.stringify(newBackground));
        }
    };

    // ============================================
    // OBTENER ESTILOS CSS 
    // ============================================
    const getBackgroundStyles = (): React.CSSProperties => {
        switch (background.type) {
            case 'solid':
                return { backgroundColor: background.value || '#ffffff' };
            case 'gradient':
                return { background: background.value || 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' };
            case 'image':
                return {
                    backgroundImage: `url(${background.value})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                };
            case 'pattern':
                return {
                    background: background.value || 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)',
                    backgroundSize: '20px 20px'
                };
            default:
                return {
                    backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f2f5'
                };
        }
    };

    return (
        <ChatBackgroundContext.Provider value={{
            background,
            setBackground,
            updateBackground,
            getBackgroundStyles,
            loading,
            isDarkMode
        }}>
            {children}
        </ChatBackgroundContext.Provider>
    );
};