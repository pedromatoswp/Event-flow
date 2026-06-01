import { Router } from 'express'
import {
  getAllCategories, getCategoryById, getCategoryEvents,
  createCategory, updateCategory, deleteCategory
} from '../controllers/categoriesController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'

const router = Router()

router.get('/', asyncHandler(getAllCategories))
router.post('/', authenticate, requireAdmin, validate([
  { field: 'name', required: true, minLength: 2 },
]), asyncHandler(createCategory))

router.get('/:id', asyncHandler(getCategoryById))
router.get('/:id/events', asyncHandler(getCategoryEvents))
router.put('/:id', authenticate, requireAdmin, asyncHandler(updateCategory))
router.delete('/:id', authenticate, requireAdmin, asyncHandler(deleteCategory))

export default router
