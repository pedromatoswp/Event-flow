import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import usersRoutes from './routes/users'
import eventsRoutes from './routes/events'
import ticketsRoutes from './routes/tickets'
import categoriesRoutes from './routes/categories'
import commentsRoutes from './routes/comments'
import ratingsRoutes from './routes/ratings'
import adminRoutes from './routes/admin'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()

app.use(cors({
  origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
const API = '/api/v1'
app.use(`${API}/auth`, authRoutes)
app.use(`${API}/users`, usersRoutes)
app.use(`${API}/events`, eventsRoutes)
app.use(`${API}/tickets`, ticketsRoutes)
app.use(`${API}/categories`, categoriesRoutes)
app.use(`${API}/comments`, commentsRoutes)
app.use(`${API}/ratings`, ratingsRoutes)
app.use(`${API}/admin`, adminRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
