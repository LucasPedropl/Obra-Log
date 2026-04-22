import { Router } from 'express';
import {
	getAccessProfiles,
	createAccessProfile,
	updateAccessProfile,
	deleteAccessProfile,
} from '../controllers/accessProfiles.controller';

const router = Router();

router.get('/access_profiles', getAccessProfiles);
router.post('/access_profiles', createAccessProfile);
router.put('/access_profiles/:id', updateAccessProfile);
router.delete('/access_profiles/:id', deleteAccessProfile);

export default router;
