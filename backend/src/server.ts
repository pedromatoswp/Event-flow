import type { Server } from 'http'
import app from './app'
import { testConnection } from './config/database'

const PORT = Number(process.env['PORT'] ?? 3001)

let server: Server | undefined

function shutdown(signal: string): void {
  console.log(`\n${signal} received — closing server...`)
  if (!server) {
    process.exit(0)
    return
  }
  server.close((err) => {
    if (err) {
      console.error('Error closing server:', err)
      process.exit(1)
      return
    }
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

async function bootstrap(): Promise<void> {
  await testConnection()

  server = app.listen(PORT, () => {
    console.log(`🚀 EventFlow API running on http://localhost:${PORT}`)
    console.log(`📋 Health check: http://localhost:${PORT}/health`)
    console.log(`🌍 Environment: ${process.env['NODE_ENV'] ?? 'development'}`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${PORT} is already in use. Stop the other process or change PORT in .env`
      )
    } else {
      console.error('Server error:', err)
    }
    process.exit(1)
  })
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
