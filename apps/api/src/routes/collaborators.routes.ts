import { Router } from 'express';
import { getCollaborators, createCollaborator } from '../controllers/collaborators.controller';

const router = Router();

router.get('/collaborators', getCollaborators);
router.post('/collaborators', createCollaborator);

export default router;