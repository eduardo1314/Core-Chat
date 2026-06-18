import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { 
    searchUsers,
    getProfile,
    getUserStatus,
    updateUserStatus,
    updateProfile
} from '../controllers/user.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============================================
// RUTAS DE USUARIO
// ============================================

// Buscar usuarios por email
router.get('/search', searchUsers);

//  Obtener mi perfil
router.get('/me', getProfile);

//  Obtener estado de un usuario (online/offline + last_seen)
router.get('/:userId/status', getUserStatus);

//  Actualizar mi estado (online/offline/away)
router.patch('/me/status', updateUserStatus);

//  Actualizar mi perfil
router.patch('/me', updateProfile);

export default router;