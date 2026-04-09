import { Router } from 'express';
import {
	getCompanies,
	getCompanyUsers,
	createCompany,
	deleteCompany,
	getUserCompanies,
	getCompanyInstances,
	createCompanyInstance,
} from '../controllers/companies.controller';

const router = Router();

// /admin/companies routes
router.get('/admin/companies', getCompanies);
router.get('/admin/companies/:id/users', getCompanyUsers);
router.post('/admin/companies', createCompany);
router.delete('/admin/companies/:id', deleteCompany);

// /users/companies route
router.get('/users/:userId/companies', getUserCompanies);

// Instance routes
router.get('/companies/:id/instances', getCompanyInstances);
router.post('/companies/:id/instances', createCompanyInstance);

export default router;
