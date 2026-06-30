/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import statsRoutes from './routes/statistics.js'
import qcRoutes from './routes/qc.js'
import { isQCEnabled } from './config/appConfig.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/statistics', statsRoutes)
app.use('/api', qcRoutes)

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const frontendDir = path.join(__dirname, '../dist');
  app.use(express.static(frontendDir));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
  });
}

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * server info
 */
app.use(
  '/api/info',
  (req: Request, res: Response, next: NextFunction): void => {
    const host = req.hostname;
    const port = process.env.PORT || '3001';
    const protocol = req.protocol;
    res.status(200).json({
      success: true,
      apiUrl: `${protocol}://${host}:${port}/api`,
      serverHost: host,
      serverPort: port,
      qcModule: {
        enabled: isQCEnabled(),
      },
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
