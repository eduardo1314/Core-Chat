import { Request, Response } from 'express';
import { storyService } from '../services/story.service';
import cloudinary from '../config/cloudinary';
import {
    uploadStoryMedia,
    deleteFromCloudinary,
    getPublicIdFromUrl,
    uploadAudioToCloudinary
} from '../services/cloudinary.service';
import logger from '../utils/logger';
import Friend from '../models/Friend';
import Story from '../models/Story';
import User from '../models/User';
import axios from 'axios';

interface AuthRequest extends Request {
    user?: { id: string; [key: string]: any };
    file?: Express.Multer.File;
}

export class StoryController {

    // ============================================
    // 1. CREAR HISTORIA
    // ============================================
    createStory = async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                });
            }

            const userId = req.user.id;
            const { 
                content, 
                location, 
                music, 
                music_artist, 
                music_duration, 
                music_preview_url,
                videoUrl, 
                backgroundColor, 
                fontColor, 
                fontSize,
                textPosition,
                textScale
            } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'La imagen o video es requerido',
                });
            }

            // 1. Subir imagen a Cloudinary
            const uploadResult = await uploadStoryMedia(req.file.buffer, req.file.mimetype);
            
            // 2. Procesar audio si existe
            let savedMusicPreviewUrl = null;
            if (music_preview_url && music_preview_url !== 'null' && music_preview_url !== 'undefined' && music_preview_url.trim() !== '') {
                try {
                    const audioResponse = await axios.get(music_preview_url, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                    });
                    
                    if (audioResponse.data.length > 0) {
                        savedMusicPreviewUrl = await uploadAudioToCloudinary(
                            Buffer.from(audioResponse.data),
                            userId
                        );
                    }
                } catch (error) {
                    logger.error('Error al procesar audio:', error);
                    savedMusicPreviewUrl = null;
                }
            }

            // 3. Parsear textPosition
            let parsedTextPosition = null;
            if (textPosition) {
                try {
                    parsedTextPosition = typeof textPosition === 'string' 
                        ? JSON.parse(textPosition) 
                        : textPosition;
                } catch (e) {
                    parsedTextPosition = null;
                }
            }

            // 4. Crear historia en base de datos
            const story = await storyService.createStory({
                userId,
                imageUrl: uploadResult.url,
                videoUrl: videoUrl || null,
                content: content || null,
                location: location || null,
                music: music || null,
                music_artist: music_artist || null,
                music_duration: music_duration ? parseInt(music_duration) : null,
                music_preview_url: savedMusicPreviewUrl,
                backgroundColor: backgroundColor || '#000000',
                fontColor: fontColor || '#FFFFFF',
                fontSize: fontSize || 'medium',
                textPosition: parsedTextPosition,
                textScale: textScale ? parseFloat(textScale) : 1,
            });

            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'avatar_url'],
            });
                // 5. Preparar datos de la historia para enviar a amigos
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
                backgroundColor: story.background_color,
                fontColor: story.font_color,
                fontSize: story.font_size,
                textPosition: story.text_position,
                textScale: story.text_scale,
                timestamp: story.created_at,
                viewed: false,
                likes: 0,
                hasLiked: false,
                isOwn: true,
                expiresAt: story.expires_at,
                viewsCount: 0,
                duration: uploadResult.duration || null,
            };

            // Emitir vía Socket.IO
            const io = req.app.get('io');
            const friends = await Friend.findAll({
                where: { user_id: userId, status: 'accepted' },
                attributes: ['friend_id'],
            });

            const friendIds = friends.map(f => f.friend_id);

            friendIds.forEach(friendId => {
                io.to(`user_${friendId}`).emit('new-story', { ...storyData, isOwn: false });
            });

            io.to(`user_${userId}`).emit('new-story', { ...storyData, isOwn: true });

            res.status(201).json({
                success: true,
                data: storyData,
                message: 'Historia creada exitosamente',
            });

        } catch (error: any) {
            logger.error('Error al crear historia:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al crear historia',
            });
        }
    };

    // ============================================
    // 2. OBTENER HISTORIAS DE AMIGOS
    // ============================================
    getFriendsStories = async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                });
            }

            const stories = await storyService.getFriendsStories(req.user.id);

            res.json({
                success: true,
                data: stories,
                total: stories.length,
            });

        } catch (error: any) {
            logger.error('Error al obtener historias de amigos:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al obtener historias',
            });
        }
    };

    // ============================================
    // 3. OBTENER UNA HISTORIA ESPECÍFICA
    // ============================================
    getStory = async (req: AuthRequest, res: Response) => {
        try {
            const { storyId } = req.params;
            
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                });
            }

            const story = await storyService.getStoryById(storyId, req.user.id);

            res.json({
                success: true,
                data: story,
            });

        } catch (error: any) {
            logger.error('Error al obtener historia:', error);
            res.status(404).json({
                success: false,
                error: error.message || 'Historia no encontrada',
            });
        }
    };

    // ============================================
    // 4. OBTENER MIS HISTORIAS
    // ============================================
    getMyStories = async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                });
            }

            const stories = await storyService.getUserStories(req.user.id);

            res.json({
                success: true,
                data: stories,
                total: stories.length,
            });

        } catch (error: any) {
            logger.error('Error al obtener tus historias:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al obtener tus historias',
            });
        }
    };

    // ============================================
    // 5. DAR/QUITAR LIKE
    // ============================================
    toggleLike = async (req: AuthRequest, res: Response) => {
        try {
            const { storyId } = req.params;
            
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                });
            }

            const result = await storyService.toggleLike(storyId, req.user.id);

            const io = req.app.get('io');
            const story = await Story.findByPk(storyId);
            
            if (story) {
                io.to(`user_${story.user_id}`).emit('story-like-updated', {
                    storyId,
                    userId: req.user.id,
                    liked: result.liked,
                    likesCount: result.likesCount,
                    timestamp: new Date().toISOString(),
                });

                io.to(`story_${storyId}`).emit('story-like-updated', {
                    storyId,
                    userId: req.user.id,
                    liked: result.liked,
                    likesCount: result.likesCount,
                    timestamp: new Date().toISOString(),
                });
            }

            res.json({
                success: true,
                data: result,
                message: result.liked ? 'Like agregado' : 'Like eliminado',
            });

        } catch (error: any) {
            logger.error('Error al procesar like:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al procesar like',
            });
        }
    };

    // ============================================
    // 6. ELIMINAR HISTORIA
    // ============================================
    deleteStory = async (req: AuthRequest, res: Response) => {
        try {
            const { storyId } = req.params;
            
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                });
            }

            const userId = req.user.id;
            const story = await Story.findByPk(storyId);

            if (!story) {
                return res.status(404).json({
                    success: false,
                    error: 'Historia no encontrada',
                });
            }

            if (story.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permiso para eliminar esta historia',
                });
            }

            // 1. Eliminar imagen de Cloudinary
            if (story.image_url) {
                const publicId = getPublicIdFromUrl(story.image_url);
                if (publicId) {
                    try {
                        await deleteFromCloudinary(publicId);
                    } catch (error) {
                        logger.error('Error al eliminar imagen:', error);
                    }
                }
            }

            // 2. Eliminar audio de Cloudinary
            if (story.music_preview_url) {
                const audioPublicId = getPublicIdFromUrl(story.music_preview_url);
                if (audioPublicId) {
                    try {
                        const result = await cloudinary.uploader.destroy(audioPublicId, {
                            resource_type: 'video',
                            invalidate: true,
                        });
                        
                        // Fallback: intentar sin extensión
                        if (result.result === 'not found') {
                            const publicIdWithoutExt = audioPublicId.replace(/\.(mp3|wav|aac|m4a)$/, '');
                            if (publicIdWithoutExt !== audioPublicId) {
                                await cloudinary.uploader.destroy(publicIdWithoutExt, {
                                    resource_type: 'video',
                                    invalidate: true,
                                });
                            }
                        }
                    } catch (error) {
                        logger.error('Error al eliminar audio:', error);
                    }
                }
            }

            // 3. Eliminar de la base de datos
            await story.destroy();

            // 4. Notificar vía Socket.IO
            const io = req.app.get('io');
            const friends = await Friend.findAll({
                where: { user_id: userId, status: 'accepted' },
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

            res.json({
                success: true,
                message: 'Historia eliminada exitosamente',
            });

        } catch (error: any) {
            logger.error('Error al eliminar historia:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al eliminar historia',
            });
        }
    };
}