import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.json({
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  })
})

export const healthRouter = router