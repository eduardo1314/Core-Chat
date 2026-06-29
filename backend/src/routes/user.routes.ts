import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { 
    searchUsers,
    getProfile,
    getUserStatus,
    updateUserStatus,
    updateProfile,
    uploadAvatar,     
    removeAvatar       
} from '../controllers/user.controller';
import { uploadAvatar as uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

// ============================================
// RUTAS DE USUARIO
// ============================================

// Buscar usuarios por email
router.get('/search', searchUsers);

// Obtener mi perfil
router.get('/me', getProfile);

// Obtener estado de un usuario 
router.get('/:userId/status', getUserStatus);

// Actualizar mi estado 
router.patch('/me/status', updateUserStatus);

// Actualizar mi perfil
router.patch('/me', updateProfile);



// Subir avatar (con Multer)
router.post('/avatar', uploadMiddleware, uploadAvatar);

// Eliminar avatar
router.delete('/avatar', removeAvatar);

export default router;