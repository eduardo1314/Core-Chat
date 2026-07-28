import { cleanStoriesOnStartup } from './cleanOnStartup';
import './cleanExpiredStories';
import logger from '../utils/logger';

/**
 * Inicia todos los jobs programados
 */
export const startScheduler = async () => {
    try {
        // Limpiar historias expiradas al iniciar
        await cleanStoriesOnStartup();
        logger.info('✅ Limpieza inicial de historias completada');
        logger.info('⏰ Job de limpieza de historias activo (cada hora)');
    } catch (error) {
        logger.error('❌ Error al iniciar scheduler:', error);
        throw error;
    }
};