import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJwt);

router.get('/summary', dashboardController.getSummary);
router.get('/categories', dashboardController.getCategories);
router.get('/monthly', dashboardController.getMonthly);
router.get('/daily', dashboardController.getDaily);

export default router;
