import { Router } from 'express'
import {
  getAllUsers, getUserById, updateUser, deleteUser,
  getUserEvents, getUserTickets, createUserByAdmin
} from '../controllers/usersController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/', authenticate, requireAdmin, getAllUsers)
router.post('/', authenticate, requireAdmin, validate([
  { field: 'name', required: true },
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, minLength: 6 },
]), createUserByAdmin)

router.get('/:id', authenticate, getUserById)
router.put('/:id', authenticate, updateUser)
router.delete('/:id', authenticate, requireAdmin, deleteUser)

router.get('/:id/events', getUserEvents)
router.get('/:id/tickets', authenticate, getUserTickets)

export default router
