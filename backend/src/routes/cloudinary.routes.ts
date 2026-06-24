import { Router } from 'express';
import { uploadAvatar, removeAvatar } from '../controllers/user.controller';
import { uploadAvatar as uploadMiddleware } from '../middlewares/upload.middleware';
import { authenticate } from '../middlewares/auth.middleware';


const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir avatar
router.post('/avatar', uploadMiddleware, uploadAvatar);

// Eliminar avatar
router.delete('/avatar', removeAvatar);

export default router;