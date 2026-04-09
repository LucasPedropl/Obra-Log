import { Router } from 'express';
import { 
  createAdminUser, 
  resetUserPassword, 
  getTenantUsers, 
  createTenantUser 
} from '../controllers/users.controller';

const router = Router();

// /admin/users operations
router.post('/admin/users', createAdminUser);
router.post('/admin/users/:userId/reset-password', resetUserPassword);

// /tenant/users operations
router.get('/tenant/users', getTenantUsers);
router.post('/tenant/users', createTenantUser);

export default router;