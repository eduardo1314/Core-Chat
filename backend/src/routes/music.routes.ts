import { Router } from 'express';
import { MusicController } from '../controllers/music.controller';

const router = Router();
const musicController = new MusicController();


//  Canciones populares
router.get('/popular', musicController.getPopularSongs);

//  - Buscar canciones (Deezer)
router.get('/search', musicController.searchSongs);

//  Descargar canción completa

export default router;