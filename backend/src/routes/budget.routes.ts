import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJwt);

router.get('/', budgetController.getBudgets);
router.post('/', budgetController.upsertBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;
