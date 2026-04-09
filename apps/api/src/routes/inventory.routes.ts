import { Router } from 'express';
import { 
  getCategories, 
  createCategory, 
  getMeasurementUnits, 
  createMeasurementUnit, 
  getCatalogs, 
  createCatalog 
} from '../controllers/inventory.controller';

const router = Router();

// /categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);

// /measurement_units
router.get('/measurement_units', getMeasurementUnits);
router.post('/measurement_units', createMeasurementUnit);

// /catalogs
router.get('/catalogs', getCatalogs);
router.post('/catalogs', createCatalog);

export default router;