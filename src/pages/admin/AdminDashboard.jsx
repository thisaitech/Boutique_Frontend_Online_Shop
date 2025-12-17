import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import {
  FiGrid, FiPackage, FiCalendar, FiSettings, FiLogOut,
  FiMenu, FiX, FiSun, FiMoon, FiUser, FiHeart, FiShoppingBag,
  FiDollarSign, FiFileText, FiImage, FiStar, FiPlus, FiShoppingCart, FiMessageSquare,
} from 'react-icons/fi'
import { useGlobal } from '../../context/GlobalContext'
import { logout as logoutAction, selectUser } from '../../store/slices/authSlice'
import {
  adminFetchOrders,
  adminFetchBookings,
  adminFetchMessages,
  adminFetchReviews,
  selectAdminOrders,
  selectAdminBookings,
  selectAdminMessages,
  selectAdminReviews
} from '../../store/slices/adminSlice'
import Overview from './Overview'
import Inventory from './Inventory'
import WomenInventory from './WomenInventory'
import KidsInventory from './KidsInventory'
import FashionInventory from './FashionInventory'
import AddProduct from './AddProduct'
import EditProduct from './EditProduct'
import Bookings from './Bookings'
import SiteContent from './SiteContent'
import Revenue from './Revenue'
import Invoices from './Invoices'
import Advertisements from './Advertisements'
import FeaturedProducts from './FeaturedProducts'
import Orders from './Orders'
import Customers from './Customers'
import Messages from './Messages'
import Reviews from './Reviews'

import './AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  // Keep darkMode from context (UI state only)
  const { darkMode, toggleDarkMode } = useGlobal()

  // Get data from Redux
  const user = useSelector(selectUser)
  const orders = useSelector(selectAdminOrders)
  const appointments = useSelector(selectAdminBookings)
  const messages = useSelector(selectAdminMessages)
  const reviews = useSelector(selectAdminReviews)

  // Fetch data on mount
  useEffect(() => {
    dispatch(adminFetchOrders())
    dispatch(adminFetchBookings())
    dispatch(adminFetchMessages())
    dispatch(adminFetchReviews())
  }, [dispatch])

  // State management - simple and clear
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992)
  const [isCollapsed, setIsCollapsed] = useState(false) // Desktop: collapse state
  const [isOpen, setIsOpen] = useState(false) // Mobile: open state

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992
      setIsMobile(mobile)
      if (mobile) {
        setIsCollapsed(false)
        setIsOpen(false)
      } else {
        setIsOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [location.pathname, isMobile])

  const handleLogout = async () => {
    try {
      await dispatch(logoutAction()).unwrap()
      localStorage.removeItem('thisai_user')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API fails
      localStorage.removeItem('thisai_accessToken')
      localStorage.removeItem('thisai_refreshToken')
      localStorage.removeItem('thisai_user')
      navigate('/login')
    }
  }

  // Calculate notification counts - only count actual pending items from database
  const pendingOrdersCount = (orders || []).filter(order =>
    order.status === 'pending' || order.status === 'processing'
  ).length

  const pendingBookingsCount = (appointments || []).filter(apt =>
    apt.status === 'pending'
  ).length

  const unreadMessagesCount = (messages || []).filter(msg =>
    msg.status === 'unread'
  ).length

  // Count reviews from last 7 days as "new"
  const newReviewsCount = (reviews || []).filter(review => {
    if (!review.createdAt) return false
    const reviewDate = new Date(review.createdAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return reviewDate >= sevenDaysAgo
  }).length


  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
    { path: '/admin/add-product', label: 'Add Product', icon: FiPlus, highlight: true },
    { path: '/admin/inventory', label: 'All Inventory', icon: FiPackage },
    { path: '/admin/orders', label: 'Orders', icon: FiShoppingCart, badge: pendingOrdersCount },
     { path: '/admin/invoices', label: 'Invoices', icon: FiFileText },
     { path: '/admin/bookings', label: 'Bookings', icon: FiCalendar, badge: pendingBookingsCount },
    { path: '/admin/messages', label: 'Messages', icon: FiMessageSquare, badge: unreadMessagesCount },
    { path: '/admin/reviews', label: 'Reviews', icon: FiStar, badge: newReviewsCount },
      { path: '/admin/revenue', label: 'Revenue', icon: FiDollarSign },
       { path: '/admin/customers', label: 'Customers', icon: FiUser },
     
          { path: '/admin/featured', label: 'Featured Products', icon: FiStar },
     { path: '/admin/women', label: 'Women', icon: FiUser },
    { path: '/admin/kids', label: 'Kids', icon: FiHeart },
    { path: '/admin/fashion', label: 'Fashion', icon: FiShoppingBag },
 
 
    
    
    // { path: '/admin/offline-market', label: 'Offline Market', icon: FiHome },
   
    { path: '/admin/advertisements', label: 'Ads Manager', icon: FiImage },
    
    
    
    { path: '/admin/content', label: 'Site Content', icon: FiSettings }
  ]

  // Generate CSS classes
  const getDashboardClass = () => {
    let className = 'admin-dashboard'
    if (!isMobile && isCollapsed) className += ' sidebar-collapsed'
    if (isMobile && isOpen) className += ' mobile-menu-open'
    return className
  }

  const getSidebarClass = () => {
    let className = 'admin-sidebar glass-card'
    if (!isMobile && isCollapsed) className += ' collapsed'
    if (isMobile && isOpen) className += ' open'
    return className
  }

  return (
    <div className={getDashboardClass()}>
      {/* Sidebar */}
      <aside className={getSidebarClass()}>
        <div className="sidebar-header">
          {/* Brand logo */}
          {(isMobile || !isCollapsed) && (
            <div className="admin-brand">
              <span className="brand-text">ThisAI</span>
              <span className="brand-highlight">Admin</span>
            </div>
          )}
          
          {/* Toggle/Close button */}
          {isMobile ? (
            <button
              className="sidebar-close-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
              }}
              type="button"
              aria-label="Close menu"
            >
              <FiX />
            </button>
          ) : (
            <button
              className="sidebar-toggle"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsCollapsed(!isCollapsed)
              }}
              type="button"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <FiMenu /> : <FiX />}
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div key={item.path} className="nav-item-wrapper">
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
                onClick={() => {
                  if (isMobile) {
                    setIsOpen(false)
                  }
                }}
              >
                <div className="nav-item-inner">
                  <item.icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="profile-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'Admin'}</span>
              <span className="profile-role">Administrator</span>
            </div>
          </div>

          <div className="sidebar-actions">
            <button
              className="action-btn"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            <button
              className="action-btn logout"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header glass-card">
          {isMobile && (
            <button
              className="mobile-menu-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(true)
              }}
              type="button"
              aria-label="Open menu"
            >
              <FiMenu />
            </button>
          )}

          <div className="header-content">
            <h1>Admin Panel</h1>
            <p>Manage your boutique</p>
          </div>

          <div className="header-actions">
            <button
              className="theme-btn"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Routes location={location} key={location.pathname}>
            <Route index element={<Overview />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="women" element={<WomenInventory />} />
            <Route path="kids" element={<KidsInventory />} />
            <Route path="fashion" element={<FashionInventory />} />
            <Route path="add-product" element={<AddProduct />} />
            <Route path="edit-product/:productId" element={<EditProduct />} />
            <Route path="featured" element={<FeaturedProducts />} />
            <Route path="customers" element={<Customers />} />
            <Route path="revenue" element={<Revenue />} />
            <Route path="orders" element={<Orders />} />
            {/* <Route path="offline-market" element={<OfflineMarket />} /> */}
            <Route path="invoices" element={<Invoices />} />
            <Route path="advertisements" element={<Advertisements />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="messages" element={<Messages />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="content" element={<SiteContent />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="sidebar-overlay active"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default AdminDashboard
