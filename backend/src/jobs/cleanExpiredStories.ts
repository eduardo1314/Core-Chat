import cron from 'node-cron';
import { Op } from 'sequelize';
import Story from '../models/Story';
import User from '../models/User';
import Friend from '../models/Friend';
import logger from '../utils/logger';
import { userSockets } from '../socket';

// ============================================
//NOTIFICAR EXPIRACIÓN A AMIGOS
// ============================================
const notifyFriendsStoryExpired = async (storyId: string, userId: string) => {
    try {
        // Obtener amigos del usuario
        const friends = await Friend.findAll({
            where: {
                user_id: userId,
                status: 'accepted',
            },
            attributes: ['friend_id'],
        });

        const friendIds = friends.map(f => f.friend_id);

        // Obtener el socket.io (io) desde el módulo de socket
        const { io } = require('../socket');

        // Notificar a cada amigo
        friendIds.forEach(friendId => {
            const socketIds = userSockets.get(friendId);
            if (socketIds && socketIds.size > 0) {
                io.to(`user_${friendId}`).emit('story-expired', {
                    storyId,
                    userId,
                    timestamp: new Date().toISOString(),
                });
            }
        });

        // Notificar al propio usuario
        io.to(`user_${userId}`).emit('story-expired', {
            storyId,
            userId,
            timestamp: new Date().toISOString(),
        });

        logger.info(`📨 Notificada expiración de historia ${storyId}`);

    } catch (error) {
        logger.error('❌ Error al notificar expiración:', error);
    }
};

// ============================================
//  LIMPIAR HISTORIAS EXPIRADAS
// ============================================
const cleanExpiredStories = async () => {
    try {
        const now = new Date();

        // 1. Buscar historias expiradas
        const expiredStories = await Story.findAll({
            where: {
                expires_at: {
                    [Op.lt]: now,
                },
                is_active: true,
            },
            attributes: ['id', 'user_id'],
        });

        if (expiredStories.length === 0) {
            logger.info('🧹 No hay historias expiradas para limpiar');
            return;
        }

        logger.info(`🧹 Encontradas ${expiredStories.length} historias expiradas`);

        // 2. Notificar y eliminar cada una
        for (const story of expiredStories) {
            // Notificar a los amigos
            await notifyFriendsStoryExpired(story.id, story.user_id);

            // Eliminar de la base de datos (soft delete)
            await story.destroy();

            logger.info(`🗑️ Historia ${story.id} eliminada (expiró a las ${story.expires_at})`);
        }

        logger.info(`✅ ${expiredStories.length} historias expiradas eliminadas correctamente`);

    } catch (error) {
        logger.error('❌ Error al limpiar historias expiradas:', error);
    }
};

// ============================================
// CONFIGURAR CRON JOB
// ============================================

// Ejecutar cada hora (a los 0 minutos)
// Cron syntax: "minuto hora día-del-mes mes día-de-la-semana"
// "0 * * * *" = Cada hora en point
cron.schedule('0 * * * *', async () => {
    logger.info('🔄 Ejecutando limpieza de historias expiradas...');
    await cleanExpiredStories();
});

// ============================================
// EXPORTAR PARA USAR EN EL SERVIDOR
// ============================================
export { cleanExpiredStories };

logger.info('⏰ Job de limpieza de historias configurado (cada hora)');