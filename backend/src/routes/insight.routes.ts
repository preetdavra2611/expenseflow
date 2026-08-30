import { Router } from 'express';
import { insightController } from '../controllers/insight.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJwt);

router.get('/', insightController.getInsights);

export default router;
