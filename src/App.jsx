import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { useGlobal } from './context/GlobalContext'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useRef, useState } from 'react'
import { fetchPublicConfig, selectSiteConfig } from './store/slices/siteConfigSlice'
import { initializeAuth, selectAuthLoading } from './store/slices/authSlice'

// Layout Components
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import PageLoader from './components/PageLoader/PageLoader'
import BackToTop from './components/BackToTop/BackToTop'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'

// Pages
import Login from './pages/Login'
import Home from './pages/Home'
import Women from './pages/Women'
import Kids from './pages/Kids'
import Fashion from './pages/Fashion'
import ProductDetail from './pages/ProductDetail'
import Service from './pages/Service'
import About from './pages/About'
import Contact from './pages/Contact'
import Orders from './pages/Orders'
import Settings from './pages/Settings'
import Wishlist from './pages/Wishlist'
import Checkout from './pages/Checkout'
import Review from './pages/Review'
import AdminDashboard from './pages/admin/AdminDashboard'

// Scroll Restoration Component - saves/restores scroll position on navigation
function ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const scrollPositions = useRef({})
  const previousPath = useRef(null)

  useEffect(() => {
    // Save scroll position of previous page before navigating away
    if (previousPath.current && previousPath.current !== location.pathname) {
      scrollPositions.current[previousPath.current] = window.scrollY
      sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions.current))
    }

    // Load saved positions from sessionStorage
    const saved = sessionStorage.getItem('scrollPositions')
    if (saved) {
      try {
        scrollPositions.current = JSON.parse(saved)
      } catch (e) {
        scrollPositions.current = {}
      }
    }

    // On POP navigation (back/forward), restore scroll position
    if (navigationType === 'POP') {
      const savedPosition = scrollPositions.current[location.pathname]
      if (savedPosition !== undefined) {
        // Use setTimeout to ensure the page has rendered
        setTimeout(() => {
          window.scrollTo({ top: savedPosition, behavior: 'instant' })
        }, 50)
      }
    }

    previousPath.current = location.pathname
  }, [location.pathname, navigationType])

  return null
}

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user: contextUser } = useGlobal()
  const reduxUser = useSelector((state) => state.auth.user)
  const isAuthenticated = useSelector((state) => !!state.auth.accessToken)
  const isAdmin = localStorage.getItem('thisai_admin') === 'true'

  // For admin routes, check localStorage flag
  if (allowedRoles && allowedRoles.includes('admin')) {
    if (!isAdmin) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  // Use Redux user if available (API authenticated), otherwise fall back to context
  const user = reduxUser || contextUser

  // Check if user is authenticated (either via Redux or context)
  if (!user && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />
  }

  return children
}

// Layout wrapper for authenticated pages
function AuthenticatedLayout({ children }) {
  const dispatch = useDispatch()
  const siteConfig = useSelector(selectSiteConfig)
  const location = useLocation()
  const isHomePage = location.pathname === '/home'
  const hideFooter = location.pathname === '/checkout'

  // Fetch site config on mount
  useEffect(() => {
    dispatch(fetchPublicConfig())
  }, [dispatch])

  // Only show flash sale if it exists in database and is enabled
  const showFlashSale = isHomePage &&
    siteConfig?.showFlashSale &&
    siteConfig?.flashSaleText &&
    siteConfig.flashSaleText.trim()

  return (
    <>
      <Navbar />
      {/* Flash Sale Ticker - Only if configured in DB */}
      {showFlashSale && (
        <div
          className="flash-sale-ticker"
          style={{
            background: siteConfig?.flashSaleColor
              ? `linear-gradient(135deg, ${siteConfig.flashSaleColor} 0%, ${siteConfig.flashSaleColor}dd 100%)`
              : 'var(--gradient-primary)'
          }}
        >
          <div className="ticker-content">
            <span className="ticker-text" style={{ color: 'white' }}>{siteConfig.flashSaleText.trim()}</span>
            <span className="ticker-text" style={{ color: 'white' }}>{siteConfig.flashSaleText.trim()}</span>
          </div>
        </div>
      )}
      <main className="main-content">
        {children}
      </main>
      {!hideFooter && <Footer />}
      {!hideFooter && <BackToTop />}
    </>
  )
}

function App() {
  const dispatch = useDispatch()
  const { user, isLoading } = useGlobal()
  const authLoading = useSelector(selectAuthLoading)
  const location = useLocation()
  const [routeLoading, setRouteLoading] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)
  const hasMounted = useRef(false)

  // Initialize auth on app mount - validates tokens and refreshes if needed
  useEffect(() => {
    const initAuth = async () => {
      try {
        await dispatch(initializeAuth()).unwrap()
      } catch (error) {
        console.log('Auth initialization failed:', error)
      } finally {
        setAuthInitialized(true)
      }
    }
    initAuth()
  }, [dispatch])

  // Trigger loader briefly on route changes (skip very first paint)  /admin/orders
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    setRouteLoading(true)
    const timer = setTimeout(() => setRouteLoading(false), 450)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const showLoader = isLoading || routeLoading || (authLoading && !authInitialized)

  return (
    <ErrorBoundary>
      <div className="app">
        {showLoader && <PageLoader />}
        <ScrollRestoration />
        <Toaster
        position="top-right"
        containerStyle={{
          zIndex: 999999
        }}
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999999
          },
          success: {
            iconTheme: {
              primary: '#FF8C42',
              secondary: '#FFF'
            }
          },
          error: {
            iconTheme: {
              primary: '#e74c3c',
              secondary: '#FFF'
            }
          }
        }}
      />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Route */}
          <Route
            path="/login"
            element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace /> : <Login />}
          />

          {/* Root Redirect */}
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />

          {/* Public Shop Routes - No login required */}
          <Route
            path="/home"
            element={
              <AuthenticatedLayout>
                <Home />
              </AuthenticatedLayout>
            }
          />

          <Route
            path="/women"
            element={
              <AuthenticatedLayout>
                <Women />
              </AuthenticatedLayout>
            }
          />

          <Route
            path="/kids"
            element={
              <AuthenticatedLayout>
                <Kids />
              </AuthenticatedLayout>
            }
          />

          <Route
            path="/fashion"
            element={
              <AuthenticatedLayout>
                <Fashion />
              </AuthenticatedLayout>
            }
          />

          {/* Legacy redirect from /shop to /women */}
          <Route
            path="/shop"
            element={<Navigate to="/women" replace />}
          />

          <Route
            path="/product/:id"
            element={
              <AuthenticatedLayout>
                <ProductDetail />
              </AuthenticatedLayout>
            }
          />

          <Route
            path="/service"
            element={
              <AuthenticatedLayout>
                <Service />
              </AuthenticatedLayout>
            }
          />

          <Route
            path="/about"
            element={
              <AuthenticatedLayout>
                <About />
              </AuthenticatedLayout>
            }
          />

          <Route
            path="/contact"
            element={
              <AuthenticatedLayout>
                <Contact />
              </AuthenticatedLayout>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <AuthenticatedLayout>
                  <Orders />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/review"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <AuthenticatedLayout>
                  <Review />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <AuthenticatedLayout>
                  <Settings />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <AuthenticatedLayout>
                  <Wishlist />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <AuthenticatedLayout>
                  <Checkout />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  )
}

export default App
