import { useChatBackgroundContext } from '../context/ChatBackgroundContext';

export const useChatBackground = () => {
    const context = useChatBackgroundContext();
    return context;
};