import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // Increased timeout for larger API responses
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', token.substring(0, 20) + '...');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('Unauthorized - clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login/signup page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear auth and redirect if we're not already on login/signup pages
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/signup';
      
      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use setTimeout to avoid navigation during render
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
)

export const authAPI = {
  signup: async (data: { name: string; email: string; password: string; fingerprint?: string }) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  login: async (data: { email: string; password: string; fingerprint?: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

export const blogAPI = {
  getBlogs: async (params?: {
    status?: string
    category?: string
    search?: string
    isFeatured?: boolean
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const response = await api.get('/blogs', { params })
    return response.data
  },
  getBlogBySlug: async (slug: string) => {
    const response = await api.get(`/blogs/slug/${slug}`)
    return response.data
  },
  getBlogById: async (id: string) => {
    const response = await api.get(`/blogs/${id}`)
    return response.data
  },
  createBlog: async (data: any) => {
    const response = await api.post('/blogs', data)
    return response.data
  },
  updateBlog: async (id: string, data: any) => {
    const response = await api.put(`/blogs/${id}`, data)
    return response.data
  },
  deleteBlog: async (id: string) => {
    const response = await api.delete(`/blogs/${id}`)
    return response.data
  },
  publishBlog: async (id: string) => {
    const response = await api.patch(`/blogs/${id}/publish`)
    return response.data
  },
  unpublishBlog: async (id: string) => {
    const response = await api.patch(`/blogs/${id}/unpublish`)
    return response.data
  },
}

export const categoryAPI = {
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },
  getCategoryBySlug: async (slug: string) => {
    const response = await api.get(`/categories/slug/${slug}`)
    return response.data
  },
  createCategory: async (data: { name: string; description?: string; image?: string }) => {
    const response = await api.post('/categories', data)
    return response.data
  },
  updateCategory: async (id: string, data: { name?: string; description?: string; image?: string }) => {
    const response = await api.put(`/categories/${id}`, data)
    return response.data
  },
  deleteCategory: async (id: string) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  },
}

export const commentAPI = {
  getCommentsByBlog: async (blogId: string) => {
    const response = await api.get(`/comments/blog/${blogId}`)
    return response.data
  },
  createComment: async (blogId: string, data: { content: string; parentComment?: string }) => {
    const response = await api.post(`/comments/blog/${blogId}`, data)
    return response.data
  },
  updateComment: async (id: string, data: { content: string }) => {
    const response = await api.put(`/comments/${id}`, data)
    return response.data
  },
  deleteComment: async (id: string) => {
    const response = await api.delete(`/comments/${id}`)
    return response.data
  },
}

export const notificationAPI = {
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/notifications', { params })
    return response.data
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all')
    return response.data
  },
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },
  createNotification: async (data: { title: string; message: string; type: string; link?: string }) => {
    const response = await api.post('/notifications', data)
    return response.data
  },
}

export const uploadAPI = {
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  uploadMultipleImages: async (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    const response = await api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Add these new methods to the existing prizeAPI object in frontend/src/services/api.ts

export const prizeAPI = {
  createPrize: async (data: { type: string; amount: number; description: string }) => {
    const response = await api.post('/prizes', data)
    return response.data
  },
  getUserPrizes: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/prizes', { params })
    return response.data
  },
  claimPrize: async (id: string, paymentInfo: {
  fullName: string;
  paymentMethod: string;
  accountNumber: string;
  bankName: string;
}) => {
  const response = await api.post(`/prizes/${id}/claim`, paymentInfo)
  return response.data
},

// Add new method
markPrizeAsPaid: async (id: string) => {
  const response = await api.patch(`/prizes/admin/${id}/mark-paid`)
  return response.data
},
  // NEW ADMIN ENDPOINTS
  getAllPrizes: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/prizes/admin/all', { params })
    return response.data
  },
  approvePrize: async (id: string) => {
    const response = await api.patch(`/prizes/admin/${id}/approve`)
    return response.data
  },
  rejectPrize: async (id: string, reason?: string) => {
    const response = await api.patch(`/prizes/admin/${id}/reject`, { reason })
    return response.data
  },
  expirePrizes: async () => {
    const response = await api.post('/prizes/admin/expire')
    return response.data
  },
}

// Update your api.ts with these methods

// Update your api.ts - Replace the spinAPI object with this:

export const spinAPI = {
  // Validate spin (rate limiting only - no prize decision)
  spin: async (fingerprint: string) => {
    const response = await api.post('/spins/validate', { fingerprint });
    return response.data;
  },

  // Save prize (called AFTER frontend determines win) - UPDATED ENDPOINT
  savePrize: async (data: { 
    type: string; 
    amount: number; 
    description: string;
    fingerprint: string;
  }) => {
    const response = await api.post('/prizes/from-spin', data); // Changed from /prizes to /prizes/from-spin
    return response.data;
  },

  // Create pending prize for anonymous users
  createPendingPrize: async (data: {
    fingerprint: string;
    result: string;
    amount: number;
    description: string;
  }) => {
    const response = await api.post('/spins/pending-prize', data);
    return response.data;
  },

  // Get spin statistics
  getStats: async (fingerprint: string) => {
    const response = await api.get('/spins/stats', { params: { fingerprint } });
    return response.data;
  },

  // Get configuration
  getConfig: async () => {
    const response = await api.get('/spins/config');
    return response.data;
  },

  // Claim pending prizes (called after login/signup)
  claimPending: async (fingerprint: string) => {
    const response = await api.post('/spins/claim-pending', { fingerprint });
    return response.data;
  },
};


export default api