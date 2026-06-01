import { Router } from 'express'
import {
  getAllTickets,
  getMyTickets,
  getTicketById,
  purchaseTicket,
  cancelTicket,
  updateTicketStatus,
} from '../controllers/ticketsController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { asyncHandler } from '../utils/async-handler'

const router = Router()

router.get('/me', authenticate, asyncHandler(getMyTickets))
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(getAllTickets))

router.post('/purchase', authenticate, asyncHandler(purchaseTicket))

router.get('/:id', authenticate, asyncHandler(getTicketById))
router.put('/:id/cancel', authenticate, asyncHandler(cancelTicket))
router.put('/:id/status', authenticate, requireAdmin, asyncHandler(updateTicketStatus))

export default router
