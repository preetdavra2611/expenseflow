import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateJwt, authController.me);
router.put('/settings', authenticateJwt, authController.updateSettings);

export default router;
