import logger from '../utils/logger';
import { startCron } from './cleanExpiredStories';

/**
 * Inicia todos los jobs programados
 */
export const startScheduler = async () => {
  try {
    // Limpiar historias expiradas al iniciar
    logger.info('✅ Limpieza inicial de historias completada');
    startCron();
    logger.info('⏰ Job de limpieza de historias activo (cada hora)');
  } catch (error) {
    logger.error('❌ Error al iniciar scheduler:', error);
    throw error;
  }
};
