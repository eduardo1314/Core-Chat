import { Request, Response } from 'express';
import { getAudioDuration } from '../services/audio.service';

interface AuthRequest extends Request {
    user?: { id: string; [key: string]: any };
}

export class AudioController {

    // ============================================
    // OBTENER DURACIÓN DEL AUDIO
    // ============================================
    getDuration = async (req: AuthRequest, res: Response) => {
        try {
            const { previewUrl } = req.query;

            if (!previewUrl || typeof previewUrl !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'URL de preview requerida',
                });
            }

            const duration = await getAudioDuration(previewUrl);

            res.json({
                success: true,
                data: { duration },
            });

        } catch (error: any) {
            console.error('❌ Error al obtener duración:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al obtener duración',
            });
        }
    };
}