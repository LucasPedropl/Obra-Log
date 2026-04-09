import { Router } from 'express';
import { getSites, getSiteById, createSite } from '../controllers/constructionSites.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Aplica autenticação em todas rotas de obras
router.use(authMiddleware);

router.get('/', getSites);
router.get('/:id', getSiteById);
router.post('/', createSite);

export default router;