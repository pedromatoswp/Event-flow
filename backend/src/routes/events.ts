import { Router } from 'express'
import {
  getAllEvents, getEventById, createEvent, updateEvent, deleteEvent,
  getEventComments, getEventRatings, getFavoriteEvents, toggleFavorite,
} from '../controllers/eventsController'
import { authenticate, optionalAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'

const router = Router()

router.get('/', optionalAuth, asyncHandler(getAllEvents))
router.get('/favorites', authenticate, asyncHandler(getFavoriteEvents))
router.post('/:id/favorite', authenticate, asyncHandler(toggleFavorite))
router.post('/', authenticate, validate([
  { field: 'title', required: true, minLength: 3 },
  { field: 'date', required: true },
  { field: 'location', required: true },
  { field: 'capacity', required: true, type: 'number' },
  { field: 'category_id', required: true, type: 'number' },
]), asyncHandler(createEvent))

router.get('/:id', optionalAuth, asyncHandler(getEventById))
router.put('/:id', authenticate, asyncHandler(updateEvent))
router.delete('/:id', authenticate, asyncHandler(deleteEvent))

router.get('/:id/comments', asyncHandler(getEventComments))
router.get('/:id/ratings', asyncHandler(getEventRatings))

export default router
