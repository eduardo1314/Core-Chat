import { Router } from 'express';
import { getMensaje, getConfig } from '../controllers/mensaje.controller';

const router = Router();

router.get('/mensaje', getMensaje);
router.get('/config', getConfig);

export default router;
