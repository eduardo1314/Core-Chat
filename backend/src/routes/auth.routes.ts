import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();


// rutas de registro
router.post('/register', register);



// rutas de login
router.post('/login', login);


// ruta para obtener el perfil del usuario autenticado
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
