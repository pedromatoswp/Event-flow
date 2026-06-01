import { Router } from 'express'
import {
  getDashboardStats, getRevenueReport, getEventStats,
  banUser, unbanUser, forceDeleteEvent
} from '../controllers/adminController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { asyncHandler } from '../utils/async-handler'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/dashboard', asyncHandler(getDashboardStats))
router.get('/reports/revenue', asyncHandler(getRevenueReport))
router.get('/reports/events', asyncHandler(getEventStats))

router.put('/users/:id/ban', asyncHandler(banUser))
router.put('/users/:id/unban', asyncHandler(unbanUser))

router.delete('/events/:id', asyncHandler(forceDeleteEvent))

export default router
