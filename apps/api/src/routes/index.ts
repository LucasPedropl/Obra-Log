import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

// Roteadores das entidades
import constructionSitesRoutes from './constructionSites.routes';
import companiesRoutes from './companies.routes';
import usersRoutes from './users.routes';
import inventoryRoutes from './inventory.routes';
import accessProfilesRoutes from './accessProfiles.routes';
import collaboratorsRoutes from './collaborators.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Healthcheck público
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GEPLANO API is running' });
});

// Middleware global de autenticação
router.use('/api', authMiddleware);

// Montagem das rotas globais no namespace /api/
router.use('/api/construction_sites', constructionSitesRoutes);
router.use('/api', companiesRoutes);
router.use('/api', usersRoutes);
router.use('/api', inventoryRoutes);
router.use('/api', accessProfilesRoutes);
router.use('/api', collaboratorsRoutes);
router.use('/api', adminRoutes);

export default router;