import { Op } from 'sequelize';
import Story from '../models/Story';
import logger from '../utils/logger';

// ============================================
// LIMPIAR HISTORIAS EXPIRADAS AL INICIAR
// ============================================
export const cleanStoriesOnStartup = async () => {
    try {
        const now = new Date();

        // Buscar historias expiradas
        const expiredStories = await Story.findAll({
            where: {
                expires_at: {
                    [Op.lt]: now,
                },
                is_active: true,
            },
            attributes: ['id', 'user_id', 'expires_at'],
        });

        if (expiredStories.length === 0) {
            logger.info('🧹 No hay historias expiradas para limpiar al iniciar');
            return;
        }

        // Eliminar todas las historias expiradas
        const deleted = await Story.destroy({
            where: {
                expires_at: {
                    [Op.lt]: now,
                },
            },
        });

        logger.info(`🧹 ${deleted} historias expiradas eliminadas al iniciar servidor`);

        // Mostrar detalles de las eliminadas
        expiredStories.forEach(story => {
            logger.info(`   - Historia ${story.id} expiró a las ${story.expires_at}`);
        });

    } catch (error) {
        logger.error('❌ Error al limpiar historias expiradas al iniciar:', error);
    }
};