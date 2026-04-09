import { Router } from 'express';
import { deleteDatabase } from '../controllers/admin.controller';

const router = Router();

router.post('/admin/delete-database', deleteDatabase);

export default router;