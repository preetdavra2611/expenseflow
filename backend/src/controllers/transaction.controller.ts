import { Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { aiParserService } from '../services/aiParser.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TransactionSchema } from '../types';

export class TransactionController {
  async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        search,
        categoryId,
        type,
        paymentMethod,
        dateRange,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await transactionService.getTransactions(req.user.id, {
        search: search ? String(search) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
        type: type ? (String(type) as any) : undefined,
        paymentMethod: paymentMethod ? (String(paymentMethod) as any) : undefined,
        dateRange: dateRange ? (String(dateRange) as any) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
        sortBy: sortBy ? String(sortBy) : undefined,
        sortOrder: sortOrder ? (String(sortOrder) as any) : undefined,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getTransactionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(id, req.user.id);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      res.json({ success: true, transaction });
    } catch (err) {
      next(err);
    }
  }

  async createTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = TransactionSchema.parse(req.body);
      const transaction = await transactionService.createFromParsed(
        req.user.id,
        {
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          category: data.categoryId, // will be resolved
          description: data.description,
          merchant: data.merchant,
          paymentMethod: data.paymentMethod,
          date: data.transactionDate,
          notes: data.notes,
        }
      );

      res.status(201).json({ success: true, ...transaction });
    } catch (err) {
      next(err);
    }
  }

  async updateTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await transactionService.updateTransaction(id, req.user.id, req.body);
      res.json({ success: true, transaction: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await transactionService.deleteTransaction(id, req.user.id);
      res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async undoTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const undone = await transactionService.undoLatestTransaction(req.user.id);
      if (!undone) {
        return res.status(404).json({ success: false, message: 'No transaction to undo' });
      }
      res.json({ success: true, transaction: undone });
    } catch (err) {
      next(err);
    }
  }

  async parseNLP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, message: 'Text is required' });
      }
      const result = await aiParserService.parseMessage(text, req.user.timezone);
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }
}

export const transactionController = new TransactionController();
