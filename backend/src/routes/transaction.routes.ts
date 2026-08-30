import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.post('/undo', transactionController.undoTransaction);
router.post('/parse-nlp', transactionController.parseNLP);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

export default router;
