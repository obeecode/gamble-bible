import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Header from './components/Header'

import { initGA, trackPageView } from './services/analytics';
import { useEffect } from 'react'

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
import AdminPrizeManagement from './pages/admin/AdminPrizeManagement'

import Prizes from './pages/Prizes'

// New category pages
import Bonuses from './pages/Bonuses'
import ComingSoonPage from './pages/ComingSoonPage'

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
  useEffect(() => {
    initGA(); // Initialize GA once when app loads
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Separate component to track page views
function AppContent() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
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
        <Route path="/bonuses" element={<Bonuses />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="blogs" element={<AdminBlogList />} />
          <Route path="blogs/new" element={<AdminBlogEditor />} />
          <Route path="blogs/:id" element={<AdminBlogEditor />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="prizes" element={<AdminPrizeManagement />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch-all for undefined routes */}
        <Route path="*" element={<ComingSoonPage />} />
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
  );
}

export default App;