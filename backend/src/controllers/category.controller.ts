import { Response, NextFunction } from 'express';
import { prisma } from '../config';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CategorySchema } from '../types';

export class CategoryController {
  async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string | undefined;

      const where: any = {
        userId: req.user.id,
      };

      if (type) {
        where.type = type;
      }

      let categories = await prisma.category.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });

      if (categories.length === 0) {
        const { authService } = await import('../services/auth.service');
        await authService.seedUserDefaultCategories(req.user.id);
        categories = await prisma.category.findMany({
          where,
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });
      }

      res.json({ success: true, categories });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = CategorySchema.parse(req.body);

      const category = await prisma.category.create({
        data: {
          userId: req.user.id,
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
          isDefault: false,
        },
      });

      res.status(201).json({ success: true, category });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = CategorySchema.partial().parse(req.body);

      const category = await prisma.category.updateMany({
        where: { id, userId: req.user.id },
        data,
      });

      res.json({ success: true, category });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if transactions exist for this category
      const txCount = await prisma.transaction.count({
        where: { categoryId: id, userId: req.user.id },
      });

      if (txCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category with ${txCount} existing transactions. Reassign them first.`,
        });
      }

      await prisma.category.deleteMany({
        where: { id, userId: req.user.id },
      });

      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
