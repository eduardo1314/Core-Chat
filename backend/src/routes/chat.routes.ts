import { Router } from 'express';
import { getChats, createChat, getChatMessages } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Rutas para chats
router.get('/', getChats);

// rutas para crear un nuevo chat
router.post('/', createChat);

// ruta para obtener los mensajes de un chat específico
router.get('/:chatId/messages', getChatMessages);

export default router;
