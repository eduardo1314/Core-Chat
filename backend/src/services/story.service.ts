import { Op } from 'sequelize';
import Story from '../models/Story';
import User from '../models/User';
import Friend from '../models/Friend';
import logger from '../utils/logger';

export class StoryService {

    // ============================================
    // 1. CREAR HISTORIA - SOLO GUARDA EN BD
    // ============================================
    async createStory(data: {
        userId: string;
        imageUrl: string;
        videoUrl?: string | null;
        content?: string | null;
        location?: string | null;
        music?: string | null;
        music_artist?: string | null;
        music_duration?: number | null;
        music_preview_url?: string | null;
        backgroundColor?: string | null;
        fontColor?: string | null;
        fontSize?: string | null;
        textPosition?: { x: number; y: number } | null;
        textScale?: number | null;
    }) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        logger.info('🎵 Creando historia con música:', {
            music: data.music,
            music_artist: data.music_artist,
            music_duration: data.music_duration,
            music_preview_url: data.music_preview_url ? '✅ Presente' : '❌ No presente',
        });

        let textPositionString = null;
        if (data.textPosition) {
            textPositionString = JSON.stringify(data.textPosition);
        }

        const story = await Story.create({
            user_id: data.userId,
            image_url: data.imageUrl,
            video_url: data.videoUrl || null,
            content: data.content || null,
            location: data.location || null,
            music: data.music || null,
            music_artist: data.music_artist || null,
            music_duration: data.music_duration || null,
            music_preview_url: data.music_preview_url || null,
            background_color: data.backgroundColor || '#000000',
            font_color: data.fontColor || '#FFFFFF',
            font_size: data.fontSize || 'medium',
            text_position: textPositionString,
            text_scale: data.textScale || 1,
            expires_at: expiresAt,
            viewed_by: [],
            views_count: 0,
            likes: [],
            likes_count: 0,
            comments: [],
            comments_count: 0,
            is_active: true,
        });

        logger.info('✅ Historia creada:', {
            id: story.id,
            music: story.music,
            music_artist: story.music_artist,
            music_preview_url: story.music_preview_url ? '✅ Guardado' : '❌ No guardado',
            background_color: story.background_color,
            font_color: story.font_color,
            font_size: story.font_size,
        });

        return story;
    }

    // ============================================
    // 2. OBTENER HISTORIAS DE AMIGOS
    // ============================================
    async getFriendsStories(userId: string) {
        try {
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
            }) as Array<Story & { user?: User }>;

            return stories.map(story => {
                let textPosition = null;
                if (story.text_position) {
                    try {
                        textPosition = JSON.parse(story.text_position);
                    } catch (e) {
                        textPosition = null;
                    }
                }

                return {
                    id: story.id,
                    userId: story.user_id,
                    username: story.user?.username || 'Usuario',
                    avatar: story.user?.avatar_url || '',
                    image: story.image_url,
                    video: story.video_url,
                    content: story.content,
                    location: story.location,
                    music: story.music,
                    music_artist: story.music_artist,
                    music_duration: story.music_duration,
                    music_preview_url: story.music_preview_url,
                    backgroundColor: story.background_color,
                    fontColor: story.font_color,
                    fontSize: story.font_size,
                    textPosition: textPosition,
                    textScale: story.text_scale,
                    timestamp: story.created_at,
                    viewed: story.viewed_by.includes(userId),
                    likes: story.likes_count,
                    hasLiked: story.likes.includes(userId),
                    isOwn: story.user_id === userId,
                    expiresAt: story.expires_at,
                    viewsCount: story.views_count,
                };
            });
        } catch (error) {
            logger.error('❌ Error al obtener historias de amigos:', error);
            return [];
        }
    }

    // ============================================
    // 3. OBTENER UNA HISTORIA POR ID
    // ============================================
    async getStoryById(storyId: string, userId: string) {
        try {
            const story = await Story.findByPk(storyId, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar_url'],
                    },
                ],
            }) as (Story & { user?: User }) | null;

            if (!story) {
                throw new Error('Historia no encontrada');
            }

            if (new Date(story.expires_at) < new Date()) {
                throw new Error('Esta historia ha expirado');
            }

            if (!story.viewed_by.includes(userId)) {
                story.viewed_by.push(userId);
                story.views_count = story.viewed_by.length;
                await story.save();
            }

            let textPosition = null;
            if (story.text_position) {
                try {
                    textPosition = JSON.parse(story.text_position);
                } catch (e) {
                    textPosition = null;
                }
            }

            return {
                id: story.id,
                userId: story.user_id,
                username: story.user?.username || 'Usuario',
                avatar: story.user?.avatar_url || '',
                image: story.image_url,
                video: story.video_url,
                content: story.content,
                location: story.location,
                music: story.music,
                music_artist: story.music_artist,
                music_duration: story.music_duration,
                music_preview_url: story.music_preview_url,
                backgroundColor: story.background_color,
                fontColor: story.font_color,
                fontSize: story.font_size,
                textPosition: textPosition,
                textScale: story.text_scale,
                timestamp: story.created_at,
                viewed: story.viewed_by.includes(userId),
                likes: story.likes_count,
                hasLiked: story.likes.includes(userId),
                isOwn: story.user_id === userId,
                expiresAt: story.expires_at,
                viewsCount: story.views_count,
            };
        } catch (error) {
            logger.error('❌ Error al obtener historia por ID:', error);
            throw error;
        }
    }

    // ============================================
    // 4. OBTENER MIS HISTORIAS
    // ============================================
    async getUserStories(userId: string) {
        try {
            const stories = await Story.findAll({
                where: {
                    user_id: userId,
                    expires_at: {
                        [Op.gt]: new Date(),
                    },
                    is_active: true,
                },
                order: [['created_at', 'DESC']],
            });

            return stories.map(story => {
                let textPosition = null;
                if (story.text_position) {
                    try {
                        textPosition = JSON.parse(story.text_position);
                    } catch (e) {
                        textPosition = null;
                    }
                }

                return {
                    id: story.id,
                    image: story.image_url,
                    video: story.video_url,
                    content: story.content,
                    location: story.location,
                    music: story.music,
                    music_artist: story.music_artist,
                    music_duration: story.music_duration,
                    music_preview_url: story.music_preview_url,
                    backgroundColor: story.background_color,
                    fontColor: story.font_color,
                    fontSize: story.font_size,
                    textPosition: textPosition,
                    textScale: story.text_scale,
                    timestamp: story.created_at,
                    views: story.views_count,
                    likes: story.likes_count,
                    expiresAt: story.expires_at,
                    isActive: story.is_active,
                };
            });
        } catch (error) {
            logger.error('❌ Error al obtener mis historias:', error);
            return [];
        }
    }

    // ============================================
    // 5. DAR/QUITAR LIKE
    // ============================================
    async toggleLike(storyId: string, userId: string) {
        try {
            const story = await Story.findByPk(storyId);
            
            if (!story) {
                throw new Error('Historia no encontrada');
            }

            const hasLiked = story.likes.includes(userId);
            let newLikes: string[];

            if (hasLiked) {
                newLikes = story.likes.filter(id => id !== userId);
                await story.update({ 
                    likes: newLikes,
                    likes_count: newLikes.length 
                });
                return { liked: false, likesCount: newLikes.length };
            } else {
                newLikes = [...story.likes, userId];
                await story.update({ 
                    likes: newLikes,
                    likes_count: newLikes.length 
                });
                return { liked: true, likesCount: newLikes.length };
            }
        } catch (error) {
            logger.error('❌ Error al toggle like:', error);
            throw error;
        }
    }

    // ============================================
    // 6. ELIMINAR HISTORIA (SOLO PROPIETARIO)
    // ============================================
    async deleteStory(storyId: string, userId: string) {
        try {
            const story = await Story.findByPk(storyId);
            
            if (!story) {
                throw new Error('Historia no encontrada');
            }

            if (story.user_id !== userId) {
                throw new Error('No tienes permiso para eliminar esta historia');
            }

            await story.destroy();
            return story;
        } catch (error) {
            logger.error('❌ Error al eliminar historia:', error);
            throw error;
        }
    }

    // ============================================
    // 7. ELIMINAR HISTORIAS EXPIRADAS (PARA CRON JOB)
    // ============================================
    async deleteExpiredStories(): Promise<number> {
        try {
            const deleted = await Story.destroy({
                where: {
                    expires_at: {
                        [Op.lt]: new Date(),
                    },
                },
            });
            return deleted;
        } catch (error) {
            logger.error('❌ Error al eliminar historias expiradas:', error);
            return 0;
        }
    }

    // ============================================
    // 8. VERIFICAR SI UNA HISTORIA EXISTE Y ESTÁ ACTIVA
    // ============================================
    async checkStoryExists(storyId: string): Promise<boolean> {
        try {
            const story = await Story.findOne({
                where: {
                    id: storyId,
                    is_active: true,
                    expires_at: {
                        [Op.gt]: new Date(),
                    },
                },
            });
            return !!story;
        } catch (error) {
            logger.error('❌ Error al verificar existencia de historia:', error);
            return false;
        }
    }

    // ============================================
    // 9. OBTENER QUIENES VIERON UNA HISTORIA 
    // ============================================
    async getStoryViewers(storyId: string, userId: string) {
        try {
            const story = await Story.findByPk(storyId);

            if (!story) {
                throw new Error('Historia no encontrada');
            }

            if (story.user_id !== userId) {
                throw new Error('No tienes permiso para ver esta información');
            }

            const viewers = await User.findAll({
                where: {
                    id: {
                        [Op.in]: story.viewed_by || []
                    }
                },
                attributes: ['id', 'username', 'avatar_url', 'status'],
                order: [['username', 'ASC']],
            });

            return {
                viewers,
                total: viewers.length,
                viewsCount: story.views_count || 0,
            };
        } catch (error) {
            logger.error('❌ Error al obtener viewers:', error);
            throw error;
        }
    }

    // ============================================
    // 10. OBTENER QUIENES DIERON LIKE A UNA HISTORIA 
    // ============================================
    async getStoryLikers(storyId: string, userId: string) {
        try {
            const story = await Story.findByPk(storyId);

            if (!story) {
                throw new Error('Historia no encontrada');
            }

            if (story.user_id !== userId) {
                throw new Error('No tienes permiso para ver esta información');
            }

            const likers = await User.findAll({
                where: {
                    id: {
                        [Op.in]: story.likes || []
                    }
                },
                attributes: ['id', 'username', 'avatar_url', 'status'],
                order: [['username', 'ASC']],
            });

            return {
                likers,
                total: likers.length,
                likesCount: story.likes_count || 0,
            };
        } catch (error) {
            logger.error('❌ Error al obtener likers:', error);
            throw error;
        }
    }
}

export const storyService = new StoryService();