import { Router } from 'express'
import {
  getAllEvents, getEventById, createEvent, updateEvent, deleteEvent,
  getEventComments, getEventRatings
} from '../controllers/eventsController'
import { authenticate, optionalAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/', optionalAuth, getAllEvents)
router.post('/', authenticate, validate([
  { field: 'title', required: true, minLength: 3 },
  { field: 'date', required: true },
  { field: 'location', required: true },
  { field: 'capacity', required: true, type: 'number' },
  { field: 'price', required: true, type: 'number' },
  { field: 'category_id', required: true, type: 'number' },
]), createEvent)

router.get('/:id', optionalAuth, getEventById)
router.put('/:id', authenticate, updateEvent)
router.delete('/:id', authenticate, deleteEvent)

router.get('/:id/comments', getEventComments)
router.get('/:id/ratings', getEventRatings)

export default router
