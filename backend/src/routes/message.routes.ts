// src/routes/message.routes.ts
import { Router } from 'express';
import { 
    sendMessage, 
    getMessages, 
    getLatestMessages,
    editMessage, 
    deleteMessage,
    markAsRead,
    getUnreadCount,
    getTotalUnreadCount
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
// GET /api/messages/:chatId?page=1&limit=30
router.get('/:chatId', getMessages);

//  Obtener últimos mensajes (carga inicial)
// GET /api/messages/:chatId/latest?limit=20
router.get('/:chatId/latest', getLatestMessages);

// Obtener no leídos de un chat
// GET /api/messages/:chatId/unread
router.get('/:chatId/unread', getUnreadCount);

//  Obtener total de no leídos (todos los chats)
// GET /api/messages/unread/total
router.get('/unread/total', getTotalUnreadCount);

//  Editar mensaje
router.put('/:messageId', editMessage);

//  Eliminar mensaje
router.delete('/:messageId', deleteMessage);

//  Marcar como leído
router.post('/read', markAsRead);

export default router;