import { Router } from 'express';
import { telegramController } from '../controllers/telegram.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

// Telegram Webhook receiver (called by Telegram servers)
router.post('/webhook', telegramController.webhook);

// Telegram Simulator (called from dashboard web app to test bot responses)
router.post('/simulate', authenticateJwt, telegramController.simulate);

export default router;
