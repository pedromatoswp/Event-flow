import { Router } from 'express'
import {
  getAllTickets, getTicketById, purchaseTicket,
  cancelTicket, updateTicketStatus
} from '../controllers/ticketsController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/', authenticate, requireAdmin, getAllTickets)
router.post('/', authenticate, validate([
  { field: 'event_id', required: true, type: 'number' },
  { field: 'quantity', required: true, type: 'number' },
]), purchaseTicket)

router.get('/:id', authenticate, getTicketById)
router.put('/:id/cancel', authenticate, cancelTicket)
router.put('/:id/status', authenticate, requireAdmin, updateTicketStatus)

export default router
