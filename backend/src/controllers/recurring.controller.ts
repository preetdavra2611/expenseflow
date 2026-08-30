import { Response, NextFunction } from 'express';
import { recurringService } from '../services/recurring.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { RecurringSchema } from '../types';

export class RecurringController {
  async getRecurring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const items = await recurringService.getRecurring(req.user.id);
      res.json({ success: true, recurring: items });
    } catch (err) {
      next(err);
    }
  }

  async createRecurring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = RecurringSchema.parse(req.body);
      const item = await recurringService.createRecurring(req.user.id, data);
      res.status(201).json({ success: true, recurring: item });
    } catch (err) {
      next(err);
    }
  }

  async updateRecurring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await recurringService.updateRecurring(id, req.user.id, req.body);
      res.json({ success: true, message: 'Recurring transaction updated' });
    } catch (err) {
      next(err);
    }
  }

  async deleteRecurring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await recurringService.deleteRecurring(id, req.user.id);
      res.json({ success: true, message: 'Recurring transaction deleted' });
    } catch (err) {
      next(err);
    }
  }

  async processDue(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const processedCount = await recurringService.processDueRecurring();
      res.json({ success: true, processed: processedCount });
    } catch (err) {
      next(err);
    }
  }
}

export const recurringController = new RecurringController();
