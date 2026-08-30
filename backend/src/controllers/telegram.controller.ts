import { Request, Response, NextFunction } from 'express';
import { telegramService } from '../services/telegram.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class TelegramController {
  /**
   * Telegram Webhook POST Handler
   */
  async webhook(req: Request, res: Response, _next: NextFunction) {
    try {
      const update = req.body;
      if (!update || !update.update_id) {
        return res.status(400).json({ ok: false, message: 'Invalid Telegram update payload' });
      }

      // Process update in background or immediately
      await telegramService.processUpdate(update);
      // Return 200 OK immediately as required by Telegram Webhook API
      return res.json({ ok: true });
    } catch (err: any) {
      console.error('Webhook error:', err);
      // Still return 200 OK so Telegram doesn't retry endlessly on application level errors
      return res.json({ ok: true, error: err.message });
    }
  }

  /**
   * Telegram Simulator Endpoint: Allows user to test Telegram input directly from dashboard
   */
  async simulate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, message: 'Text message is required' });
      }

      const user = req.user;
      const fakeMessageId = `sim_${Date.now()}`;
      const fakeChatId = 999999;

      const result = await telegramService.processNaturalLanguageMessage(
        fakeChatId,
        user,
        text,
        fakeMessageId
      );

      return res.json({
        success: true,
        reply: result.replyText || 'Message processed.',
        handled: result.handled,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const telegramController = new TelegramController();
