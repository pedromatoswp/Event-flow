import { Router } from 'express'
import {
  getAllUsers, getUserById, updateUser, deleteUser,
  getUserEvents, getUserTickets, createUserByAdmin
} from '../controllers/usersController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'

const router = Router()

router.get('/', authenticate, requireAdmin, asyncHandler(getAllUsers))
router.post('/', authenticate, requireAdmin, validate([
  { field: 'name', required: true },
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, minLength: 6 },
]), asyncHandler(createUserByAdmin))

router.get('/:id', authenticate, asyncHandler(getUserById))
router.put('/:id', authenticate, asyncHandler(updateUser))
router.delete('/:id', authenticate, requireAdmin, asyncHandler(deleteUser))

router.get('/:id/events', asyncHandler(getUserEvents))
router.get('/:id/tickets', authenticate, asyncHandler(getUserTickets))

export default router
