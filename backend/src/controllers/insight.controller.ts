import { Response, NextFunction } from 'express';
import { insightService } from '../services/insight.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class InsightController {
  async getInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const insights = await insightService.generateInsights(req.user.id);
      res.json({ success: true, insights });
    } catch (err) {
      next(err);
    }
  }
}

export const insightController = new InsightController();
