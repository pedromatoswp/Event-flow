import { Router } from 'express'
import {
  getAllRatings, getRatingById, createRating,
  updateRating, deleteRating
} from '../controllers/ratingsController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/', authenticate, requireAdmin, getAllRatings)
router.post('/', authenticate, validate([
  { field: 'event_id', required: true, type: 'number' },
  { field: 'score', required: true, type: 'number' },
]), createRating)

router.get('/:id', getRatingById)
router.put('/:id', authenticate, updateRating)
router.delete('/:id', authenticate, deleteRating)

export default router
