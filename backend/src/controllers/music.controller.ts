import { Request, Response } from 'express';
import { searchDeezerTracks, getDeezerPopularTracks } from '../services/deezer.service';

interface AuthRequest extends Request {
    user?: { id: string; [key: string]: any };
}

export class MusicController {

    // ============================================
    // BUSCAR CANCIONES (SOLO DEEZER)
    // ============================================
    searchSongs = async (req: AuthRequest, res: Response) => {
        try {
            const { query, limit } = req.query;
            
            if (!query || typeof query !== 'string' || query.length < 2) {
                return res.json({
                    success: true,
                    data: [],
                    total: 0,
                });
            }

            console.log('🔍 Buscando en Deezer:', query);
            
            const songs = await searchDeezerTracks(query, Number(limit) || 20);

            // Formatear para el frontend
            const formattedSongs = songs.map(song => ({
                ...song,
                full_audio_url: null,
                youtube_id: null,
                is_full: false,
            }));

            res.json({
                success: true,
                data: formattedSongs,
                total: formattedSongs.length,
            });
        } catch (error: any) {
            console.error('❌ Error al buscar canciones:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al buscar canciones',
            });
        }
    };

    // ============================================
    // CANCIONES POPULARES (SOLO DEEZER)
    // ============================================
    getPopularSongs = async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const songs = await getDeezerPopularTracks(limit);

            res.json({
                success: true,
                data: songs,
                total: songs.length,
            });
        } catch (error: any) {
            console.error('❌ Error al obtener canciones populares:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error al obtener canciones',
            });
        }
    };

}