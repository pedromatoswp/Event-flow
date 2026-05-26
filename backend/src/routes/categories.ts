import { Router } from 'express'
import {
  getAllCategories, getCategoryById, getCategoryEvents,
  createCategory, updateCategory, deleteCategory
} from '../controllers/categoriesController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/', getAllCategories)
router.post('/', authenticate, requireAdmin, validate([
  { field: 'name', required: true, minLength: 2 },
]), createCategory)

router.get('/:id', getCategoryById)
router.get('/:id/events', getCategoryEvents)
router.put('/:id', authenticate, requireAdmin, updateCategory)
router.delete('/:id', authenticate, requireAdmin, deleteCategory)

export default router
