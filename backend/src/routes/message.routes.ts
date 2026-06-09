import { Router } from 'express';
import { 
    sendMessage, 
    getMessages, 
    editMessage, 
    deleteMessage,
    markAsRead
} from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);


// ruta para enviar un mensaje
router.post('/', sendMessage);

// ruta para obtener los mensajes de un chat específico
router.get('/:chatId', getMessages);

// ruta para editar un mensaje
router.put('/:messageId', editMessage);

// ruta para eliminar un mensaje
router.delete('/:messageId', deleteMessage);

// ruta para marcar un mensaje como leido
router.post('/read', markAsRead);

export default router;
