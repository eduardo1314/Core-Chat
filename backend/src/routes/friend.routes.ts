import { Router } from 'express';
import { sendFriendRequest, acceptFriendRequest, getFriends, rejectFriendRequest, blockUser, unblockUser, getPendingRequests, getSentRequests, getFriendSuggestions, checkFriendship } from '../controllers/friend.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);


// ruta para obtener lista de amigos
router.get('/', getFriends);

// ruta para enviar solicitud amistad
router.post('/request', sendFriendRequest);

// ruta para aceptar solicutud de amistad
router.put('/accept/:requestId', acceptFriendRequest);

// ruta para rechazar solicitud de amistad
router.put('/reject/:requestId', rejectFriendRequest);

// ruta para bloquear un usuario
router.post('/block', blockUser);

// ruta para desbloquear un usuario
router.delete('/unblock/:friendId', unblockUser);

// ruta para obtener solicitudes pendientes
router.get('/requests/pending', getPendingRequests);

// ruta para obtener solicitudes enviadas
router.get('/requests/sent', getSentRequests);

// ruta para obtener sugerencias de amigos
router.get('/suggestions', getFriendSuggestions);

// ruta para verificar estado de amistad con otro usuario
router.get('/check/:friendId', checkFriendship);



export default router;
