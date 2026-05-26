import app from './app'
import { testConnection } from './config/database'

const PORT = Number(process.env['PORT'] ?? 3001)

async function bootstrap(): Promise<void> {
  await testConnection()

  app.listen(PORT, () => {
    console.log(`🚀 EventFlow API running on http://localhost:${PORT}`)
    console.log(`📋 Health check: http://localhost:${PORT}/health`)
    console.log(`🌍 Environment: ${process.env['NODE_ENV'] ?? 'development'}`)
  })
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
