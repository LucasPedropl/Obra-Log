import { Router } from 'express';
import { getAccessProfiles } from '../controllers/accessProfiles.controller';

const router = Router();

router.get('/access_profiles', getAccessProfiles);

export default router;