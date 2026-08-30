import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJwt);

router.get('/csv', exportController.exportCSV);
router.get('/excel', exportController.exportExcel);
router.get('/pdf', exportController.exportPDF);

export default router;
