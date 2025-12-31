export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface User {
  _id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface HealthResponse {
  message: string
  timestamp: string
  status: string
}