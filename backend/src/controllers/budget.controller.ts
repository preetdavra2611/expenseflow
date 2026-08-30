import { Response, NextFunction } from 'express';
import { budgetService } from '../services/budget.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BudgetSchema } from '../types';

export class BudgetController {
  async getBudgets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const budgets = await budgetService.getUserBudgets(req.user.id);
      res.json({ success: true, budgets });
    } catch (err) {
      next(err);
    }
  }

  async upsertBudget(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = BudgetSchema.parse(req.body);
      const budget = await budgetService.upsertBudget(
        req.user.id,
        data.categoryId,
        data.amount,
        data.period
      );
      res.status(201).json({ success: true, budget });
    } catch (err) {
      next(err);
    }
  }

  async deleteBudget(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await budgetService.deleteBudget(id, req.user.id);
      res.json({ success: true, message: 'Budget removed successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const budgetController = new BudgetController();
