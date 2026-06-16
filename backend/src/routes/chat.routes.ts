import { Router } from 'express';
import { 
    getChats, 
    createChat, 
    getChatMessages,
    getActiveChats,
    getArchivedChats,
    archiveChat,
    unarchiveChat,
    getChatById,
    deleteChat
} from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Rutas específicas primero
router.get('/active', getActiveChats);
router.get('/archived', getArchivedChats);

// Rutas con parámetros después
router.get('/', getChats);
router.post('/', createChat);
router.get('/:chatId', getChatById);
router.get('/:chatId/messages', getChatMessages);
router.put('/:chatId/archive', archiveChat);
router.delete('/:chatId', deleteChat);
router.put('/:chatId/unarchive', unarchiveChat);

export default router;