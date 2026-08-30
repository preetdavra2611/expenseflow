import { Router } from 'express';
import { recurringController } from '../controllers/recurring.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJwt);

router.get('/', recurringController.getRecurring);
router.post('/', recurringController.createRecurring);
router.post('/process-due', recurringController.processDue);
router.put('/:id', recurringController.updateRecurring);
router.delete('/:id', recurringController.deleteRecurring);

export default router;
