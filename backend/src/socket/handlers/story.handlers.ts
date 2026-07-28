import { Server, Socket } from 'socket.io';
import Story from '../../models/Story';
import User from '../../models/User';
import Friend from '../../models/Friend';
import logger from '../../utils/logger';
import { Op } from 'sequelize';

export const setupStoryHandlers = (io: Server, socket: Socket) => {

    // ============================================
    // 1. CREAR NUEVA HISTORIA
    // ============================================
    socket.on('new-story', async (data) => {
        try {
            const userId = socket.data.userId;
            const { 
                imageUrl, 
                content, 
                location, 
                music, 
                music_artist, 
                music_duration, 
                music_preview_url,
                videoUrl, 
                backgroundColor, 
                fontColor, 
                fontSize 
            } = data;

            // Validar que la imagen sea obligatoria
            if (!imageUrl) {
                socket.emit('story-error', {
                    error: 'La imagen es requerida',
                });
                return;
            }

            // 1. Guardar en base de datos
            const story = await Story.create({
                user_id: userId,
                image_url: imageUrl,
                video_url: videoUrl || null,
                content: content || null,
                location: location || null,
                music: music || null,
                music_artist: music_artist || null,
                music_duration: music_duration || null,
                music_preview_url: music_preview_url || null,
                background_color: backgroundColor || '#000000',
                font_color: fontColor || '#FFFFFF',
                font_size: fontSize || 'medium',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });

            // 2. Obtener datos del usuario
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'avatar_url'],
            });

            // 3. Obtener amigos del usuario (aceptados)
            const friends = await Friend.findAll({
                where: {
                    user_id: userId,
                    status: 'accepted',
                },
                attributes: ['friend_id'],
            });

            const friendIds = friends.map(f => f.friend_id);

            // 4. Formatear respuesta para el frontend
            const storyData = {
                id: story.id,
                userId: story.user_id,
                username: user?.username || 'Usuario',
                avatar: user?.avatar_url || '',
                image: story.image_url,
                video: story.video_url,
                content: story.content,
                location: story.location,
                music: story.music,
                music_artist: story.music_artist,
                music_duration: story.music_duration,
                music_preview_url: story.music_preview_url,
                timestamp: story.created_at,
                viewed: false,
                likes: 0,
                hasLiked: false,
                expiresAt: story.expires_at,
            };

            // 5. Emitir a todos los amigos del usuario
            friendIds.forEach(friendId => {
                io.to(`user_${friendId}`).emit('new-story', storyData);
            });

            // 6. También emitir al propio usuario
            io.to(`user_${userId}`).emit('new-story', {
                ...storyData,
                isOwn: true,
            });

            // 7. Confirmar al usuario que creó la historia
            socket.emit('story-created', {
                success: true,
                data: storyData,
                message: 'Historia creada exitosamente',
            });

            logger.info(`📸 Nueva historia de usuario ${userId} con música: ${music || 'sin música'}`);

        } catch (error) {
            logger.error('❌ Error al crear historia:', error);
            socket.emit('story-error', {
                error: 'Error al crear la historia',
                details: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    });

    // ============================================
    // 2. DAR LIKE A UNA HISTORIA
    // ============================================
    socket.on('story-like', async (data) => {
        try {
            const userId = socket.data.userId;
            const { storyId } = data;

            if (!storyId) {
                socket.emit('story-error', {
                    error: 'ID de historia requerido',
                });
                return;
            }

            const story = await Story.findByPk(storyId);
            if (!story) {
                socket.emit('story-error', {
                    error: 'Historia no encontrada',
                });
                return;
            }

            if (new Date(story.expires_at) < new Date()) {
                socket.emit('story-error', {
                    error: 'Esta historia ha expirado',
                });
                return;
            }

            const likeIndex = story.likes.indexOf(userId);
            let liked: boolean;
            let likesCount: number;

            if (likeIndex > -1) {
                story.likes.splice(likeIndex, 1);
                liked = false;
            } else {
                story.likes.push(userId);
                liked = true;
            }

            story.likes_count = story.likes.length;
            await story.save();

            io.to(`user_${story.user_id}`).emit('story-like-updated', {
                storyId,
                userId,
                liked,
                likesCount: story.likes_count,
                timestamp: new Date().toISOString(),
            });

            io.to(`story_${storyId}`).emit('story-like-updated', {
                storyId,
                userId,
                liked,
                likesCount: story.likes_count,
                timestamp: new Date().toISOString(),
            });

            socket.emit('story-like-confirmed', {
                storyId,
                liked,
                likesCount: story.likes_count,
            });

        } catch (error) {
            logger.error('❌ Error al procesar like:', error);
            socket.emit('story-error', {
                error: 'Error al procesar like',
            });
        }
    });

    // ============================================
    // 3. MARCAR HISTORIA COMO VISTA
    // ============================================
    socket.on('story-viewed', async (data) => {
        try {
            const userId = socket.data.userId;
            const { storyId } = data;

            if (!storyId) {
                return;
            }

            const story = await Story.findByPk(storyId);
            if (!story) {
                return;
            }

            if (!story.viewed_by.includes(userId)) {
                story.viewed_by.push(userId);
                story.views_count = story.viewed_by.length;
                await story.save();

                io.to(`user_${story.user_id}`).emit('story-viewed-by', {
                    storyId,
                    viewerId: userId,
                    viewsCount: story.views_count,
                    timestamp: new Date().toISOString(),
                });

                socket.emit('story-viewed-confirmed', {
                    storyId,
                    success: true,
                });

                logger.info(`👀 Usuario ${userId} vio historia ${storyId}`);
            }

        } catch (error) {
            logger.error('❌ Error al marcar historia como vista:', error);
        }
    });

    // ============================================
    // 4. UNIRSE A UNA SALA DE HISTORIA
    // ============================================
    socket.on('join-story', (storyId) => {
        if (!storyId) return;
        
        socket.join(`story_${storyId}`);
        logger.info(`👀 Usuario ${socket.data.userId} viendo historia ${storyId} en tiempo real`);
        
        socket.emit('story-joined', {
            storyId,
            success: true,
        });
    });

    // ============================================
    // 5. SALIR DE UNA SALA DE HISTORIA
    // ============================================
    socket.on('leave-story', (storyId) => {
        if (!storyId) return;
        
        socket.leave(`story_${storyId}`);
        logger.info(`👋 Usuario ${socket.data.userId} salió de historia ${storyId}`);
        
        socket.emit('story-left', {
            storyId,
            success: true,
        });
    });

    // ============================================
    // 6. ELIMINAR HISTORIA (SOLO EL PROPIETARIO)
    // ============================================
    socket.on('delete-story', async (data) => {
        try {
            const userId = socket.data.userId;
            const { storyId } = data;

            if (!storyId) {
                socket.emit('story-error', {
                    error: 'ID de historia requerido',
                });
                return;
            }

            const story = await Story.findByPk(storyId);
            if (!story) {
                socket.emit('story-error', {
                    error: 'Historia no encontrada',
                });
                return;
            }

            if (story.user_id !== userId) {
                socket.emit('story-error', {
                    error: 'No tienes permiso para eliminar esta historia',
                });
                return;
            }

            await story.destroy();

            const friends = await Friend.findAll({
                where: {
                    user_id: userId,
                    status: 'accepted',
                },
                attributes: ['friend_id'],
            });

            const friendIds = friends.map(f => f.friend_id);

            friendIds.forEach(friendId => {
                io.to(`user_${friendId}`).emit('story-deleted', {
                    storyId,
                    userId,
                    timestamp: new Date().toISOString(),
                });
            });

            io.to(`user_${userId}`).emit('story-deleted', {
                storyId,
                userId,
                timestamp: new Date().toISOString(),
            });

            io.to(`story_${storyId}`).emit('story-deleted', {
                storyId,
                userId,
                timestamp: new Date().toISOString(),
            });

            socket.emit('story-deleted-confirmed', {
                storyId,
                success: true,
                message: 'Historia eliminada exitosamente',
            });

            logger.info(`🗑️ Usuario ${userId} eliminó historia ${storyId}`);

        } catch (error) {
            logger.error('❌ Error al eliminar historia:', error);
            socket.emit('story-error', {
                error: 'Error al eliminar la historia',
            });
        }
    });

    // ============================================
    // 7. OBTENER HISTORIAS DE AMIGOS (AL CONECTARSE)
    // ============================================
    socket.on('get-stories', async () => {
        try {
            const userId = socket.data.userId;

            const friends = await Friend.findAll({
                where: {
                    user_id: userId,
                    status: 'accepted',
                },
                attributes: ['friend_id'],
            });

            const friendIds = friends.map(f => f.friend_id);
            friendIds.push(userId);

            const stories = await Story.findAll({
                where: {
                    user_id: {
                        [Op.in]: friendIds,
                    },
                    expires_at: {
                        [Op.gt]: new Date(),
                    },
                    is_active: true,
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
                order: [['created_at', 'DESC']],
            });

            const storiesData = stories.map((storyInstance: any) => {
                const user = storyInstance.user as any | undefined;
                return {
                    id: storyInstance.id,
                    userId: storyInstance.user_id,
                    username: user?.username || 'Usuario',
                    avatar: user?.avatar_url || '',
                    image: storyInstance.image_url,
                    video: storyInstance.video_url,
                    content: storyInstance.content,
                    location: storyInstance.location,
                    music: storyInstance.music,
                    music_artist: storyInstance.music_artist,
                    music_duration: storyInstance.music_duration,
                    music_preview_url: storyInstance.music_preview_url,
                    timestamp: storyInstance.created_at,
                    viewed: Array.isArray(storyInstance.viewed_by) ? storyInstance.viewed_by.includes(userId) : false,
                    likes: storyInstance.likes_count,
                    hasLiked: Array.isArray(storyInstance.likes) ? storyInstance.likes.includes(userId) : false,
                    isOwn: storyInstance.user_id === userId,
                    expiresAt: storyInstance.expires_at,
                };
            });

            socket.emit('stories-list', {
                success: true,
                data: storiesData,
                total: storiesData.length,
                timestamp: new Date().toISOString(),
            });

            logger.info(`📋 Enviadas ${storiesData.length} historias a usuario ${userId}`);

        } catch (error) {
            logger.error('❌ Error al obtener historias:', error);
            socket.emit('story-error', {
                error: 'Error al obtener historias',
            });
        }
    });

    // ============================================
    // 8. NOTIFICAR CUANDO UNA HISTORIA EXPIRE
    // ============================================
    const notifyStoryExpired = async (storyId: string, userId: string) => {
        try {
            const friends = await Friend.findAll({
                where: {
                    user_id: userId,
                    status: 'accepted',
                },
                attributes: ['friend_id'],
            });

            const friendIds = friends.map(f => f.friend_id);

            friendIds.forEach(friendId => {
                io.to(`user_${friendId}`).emit('story-expired', {
                    storyId,
                    userId,
                    timestamp: new Date().toISOString(),
                });
            });

            io.to(`user_${userId}`).emit('story-expired', {
                storyId,
                userId,
                timestamp: new Date().toISOString(),
            });

            logger.info(`⏰ Historia ${storyId} expirada para usuario ${userId}`);

        } catch (error) {
            logger.error('❌ Error al notificar expiración:', error);
        }
    };

    return {
        notifyStoryExpired,
    };
};