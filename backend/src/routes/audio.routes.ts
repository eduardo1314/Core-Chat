
import { Router } from 'express';
import { AudioController } from '../controllers/audio.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const audioController = new AudioController();

router.use(authenticate);

//  Obtener duración
router.get('/duration', audioController.getDuration);

export default router;