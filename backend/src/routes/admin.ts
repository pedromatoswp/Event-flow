import { Router } from 'express'
import {
  getDashboardStats, getRevenueReport, getEventStats,
  banUser, unbanUser, forceDeleteEvent
} from '../controllers/adminController'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/dashboard', getDashboardStats)
router.get('/reports/revenue', getRevenueReport)
router.get('/reports/events', getEventStats)

router.put('/users/:id/ban', banUser)
router.put('/users/:id/unban', unbanUser)

router.delete('/events/:id', forceDeleteEvent)

export default router
