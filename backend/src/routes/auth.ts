import { Router } from 'express'
import { register, login, me, changePassword } from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.post('/register', validate([
  { field: 'name', required: true, type: 'string', minLength: 2 },
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, type: 'string', minLength: 6 },
]), register)

router.post('/login', validate([
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, type: 'string' },
]), login)

router.get('/me', authenticate, me)

router.put('/change-password', authenticate, validate([
  { field: 'current_password', required: true, type: 'string' },
  { field: 'new_password', required: true, type: 'string', minLength: 6 },
]), changePassword)

export default router
