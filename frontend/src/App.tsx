import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Header from './components/Header'

import Footer from './components/Footer'

import BlogPost from './pages/BlogPost'
import Reviews from './pages/Reviews'
import CasinoReviews from './pages/CasinoReviews'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBlogList from './pages/admin/AdminBlogList'
import AdminBlogEditor from './pages/admin/AdminBlogEditor'
import AdminSettings from './pages/admin/AdminSettings'
import AdminCategories from './pages/admin/AdminCategories'
import AdminPrizeManagement from './pages/admin/AdminPrizeManagement' // NEW

import Prizes from './pages/Prizes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="app">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/casino-reviews" element={<CasinoReviews />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/prizes" element={<Prizes />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="blogs" element={<AdminBlogList />} />
                <Route path="blogs/new" element={<AdminBlogEditor />} />
                <Route path="blogs/:id" element={<AdminBlogEditor />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="prizes" element={<AdminPrizeManagement />} /> {/* NEW */}
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
            {!window.location.pathname.startsWith('/admin') && <Footer />}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App