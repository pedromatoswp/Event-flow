import { Router } from 'express'
import { register, login, me, changePassword } from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { asyncHandler } from '../utils/async-handler'

const router = Router()

router.post('/register', validate([
  { field: 'name', required: true, type: 'string', minLength: 2 },
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, type: 'string', minLength: 6 },
]), asyncHandler(register))

router.post('/login', validate([
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, type: 'string' },
]), asyncHandler(login))

router.get('/me', authenticate, asyncHandler(me))

router.put('/change-password', authenticate, validate([
  { field: 'current_password', required: true, type: 'string' },
  { field: 'new_password', required: true, type: 'string', minLength: 6 },
]), asyncHandler(changePassword))

export default router
