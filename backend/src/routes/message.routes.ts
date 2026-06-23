import { Router } from 'express';
import { 
    sendMessage, 
    getMessages, 
    getLatestMessages,
    editMessage, 
    deleteMessage,
    markAsRead,
    getUnreadCount,
    getTotalUnreadCount,
    confirmMessageDelivered
} from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============================================
// RUTAS DE MENSAJES
// ============================================

//  Enviar mensaje
router.post('/', sendMessage);

// Obtener mensajes de un chat (con paginación)
router.get('/:chatId', getMessages);

//  Obtener últimos mensajes (carga inicial)
router.get('/:chatId/latest', getLatestMessages);

// Obtener no leídos de un chat
router.get('/:chatId/unread', getUnreadCount);

//  Obtener total de no leídos (todos los chats)
router.get('/unread/total', getTotalUnreadCount);

// src/routes/message.routes.ts
router.post('/delivered', confirmMessageDelivered);

//  Editar mensaje
router.put('/:messageId', editMessage);

//  Eliminar mensaje
router.delete('/:messageId', deleteMessage);

//  Marcar como leído
router.post('/read', markAsRead);

export default router;