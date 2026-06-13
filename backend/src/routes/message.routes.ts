import { Router } from 'express';
import { 
    sendMessage, 
    getMessages, 
    editMessage, 
    deleteMessage,
    markAsRead,
    getUnreadCount
} from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', sendMessage);
router.get('/:chatId', getMessages);
router.get('/:chatId/unread', getUnreadCount);  
router.put('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);
router.post('/read', markAsRead);

export default router;