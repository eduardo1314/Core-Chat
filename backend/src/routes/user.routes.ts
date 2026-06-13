import { Router } from 'express';
import { searchUsers } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/search', searchUsers);

export default router;
