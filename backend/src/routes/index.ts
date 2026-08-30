import { Router } from 'express';
import authRoutes from './auth.routes';
import telegramRoutes from './telegram.routes';
import transactionRoutes from './transaction.routes';
import categoryRoutes from './category.routes';
import budgetRoutes from './budget.routes';
import recurringRoutes from './recurring.routes';
import dashboardRoutes from './dashboard.routes';
import insightRoutes from './insight.routes';
import exportRoutes from './export.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/telegram', telegramRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/recurring', recurringRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/insights', insightRoutes);
router.use('/export', exportRoutes);

export default router;
