import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJwt);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
