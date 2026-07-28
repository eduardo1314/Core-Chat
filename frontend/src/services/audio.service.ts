import api from './api';


// ============================================
// OBTENER DURACIÓN DEL AUDIO
// ============================================
export const getAudioDuration = async (previewUrl: string): Promise<number> => {
    try {
        const response = await api.get('/audio/duration', {
            params: { previewUrl },
        });

        if (response.data.success) {
            return response.data.data.duration;
        }
        return 30;
    } catch (error) {
        console.error('Error al obtener duración:', error);
        return 30;
    }
};