import { Router } from 'express';
import { StoryController } from '../controllers/story.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadStory } from '../middlewares/upload.middleware';

const router = Router();
const storyController = new StoryController();

router.use(authenticate);

// Obtener historias de amigos
router.get('/friends', storyController.getFriendsStories);
// Crear historia
router.post('/', uploadStory, storyController.createStory);

// Mis historias
router.get('/me', storyController.getMyStories);

// Obtener historia específica
router.get('/:storyId', storyController.getStory);

// Dar/quitar like
router.post('/:storyId/like', storyController.toggleLike);

// Eliminar historia
router.delete('/:storyId', storyController.deleteStory);


// Obtener quienes vieron una historia
router.get('/:storyId/viewers', storyController.getStoryViewers);

// Obtener quienes dieron like a una historia
router.get('/:storyId/likers', storyController.getStoryLikers);

export default router;