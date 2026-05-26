import { Router } from 'express'
import {
  getAllComments, getCommentById, createComment,
  updateComment, deleteComment
} from '../controllers/commentsController'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/', authenticate, requireAdmin, getAllComments)
router.post('/', authenticate, validate([
  { field: 'event_id', required: true, type: 'number' },
  { field: 'content', required: true, minLength: 1 },
]), createComment)

router.get('/:id', getCommentById)
router.put('/:id', authenticate, validate([
  { field: 'content', required: true, minLength: 1 },
]), updateComment)
router.delete('/:id', authenticate, deleteComment)

export default router
