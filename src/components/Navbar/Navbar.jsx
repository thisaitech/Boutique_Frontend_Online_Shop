import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiSun, FiMoon, FiShoppingBag, FiUser, FiMenu, FiX,
  FiPackage, FiSettings, FiLogOut, FiChevronDown, FiHeart
} from 'react-icons/fi'
import { useGlobal } from '../../context/GlobalContext'
import { useDispatch } from 'react-redux'
import { logout as reduxLogout } from '../../store/slices/authSlice'
import CartDrawer from '../CartDrawer/CartDrawer'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, cartCount, darkMode, toggleDarkMode, logout, siteConfig } = useGlobal()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const searchRef = useRef(null)
  const profileRef = useRef(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false)
  }, [navigate])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/women?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    try {
      // Dispatch Redux logout (clears tokens and calls backend)
      await dispatch(reduxLogout()).unwrap()
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Also call context logout to clear context state
    logout()
    
    // Navigate to login
    navigate('/login')
  }

  const navLinks = [
    { path: '/home', label: 'Home' },
    { path: '/women', label: 'Women' },
    { path: '/kids', label: 'Kids' },
    { path: '/fashion', label: 'Fashion' },
    { path: '/service', label: 'Service' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' }
  ]

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/home" className="navbar-logo">
            <span className="logo-text">ThisAI</span>
            <span className="logo-highlight">Boutique</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Nav Actions */}
          <div className="nav-actions">
            {/* Desktop Only Actions */}
            <div className="desktop-actions">
              {/* Search Icon Button */}
              <div className="nav-action search-wrapper" ref={searchRef}>
                <button
                  className="action-btn search-btn"
                  onClick={() => setShowSearch(!showSearch)}
                  aria-label="Search"
                >
                  <FiSearch />
                </button>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      className="search-dropdown glass-card"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <form onSubmit={handleSearch} className="search-form">
                        <FiSearch className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="search-submit">
                          Search
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Orders Icon */}
              <div className="nav-action">
                <button
                  className="action-btn orders-btn"
                  onClick={() => {
                    if (!user) {
                      navigate('/login')
                      return
                    }
                    navigate('/orders')
                  }}
                  aria-label="My Orders"
                >
                  <FiPackage />
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <div className="nav-action">
                <button
                  className="action-btn theme-toggle"
                  onClick={toggleDarkMode}
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <FiSun /> : <FiMoon />}
                </button>
              </div>
            </div>

            {/* Cart - Visible on all screens */}
            <div className="nav-action cart-wrapper">
              <button
                className="action-btn cart-btn"
                onClick={() => {
                  if (!user) {
                    navigate('/login')
                    return
                  }
                  setShowCart(true)
                }}
                aria-label="Shopping cart"
              >
                <FiShoppingBag />
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </button>
            </div>

            {/* Desktop Only - Profile Dropdown / Login Button */}
            <div className="desktop-profile">
              {user ? (
                <div className="nav-action profile-wrapper" ref={profileRef}>
                  <button
                    className="action-btn profile-btn"
                    onClick={() => setShowProfile(!showProfile)}
                    aria-label="User menu"
                  >
                    <FiUser />
                    <FiChevronDown className={`chevron ${showProfile ? 'rotate' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        className="profile-dropdown glass-card"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="profile-header">
                          <div className="profile-avatar">
                            {user?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="profile-info">
                            <span className="profile-name">{user?.name || 'User'}</span>
                            <span className="profile-role">{user?.role === 'admin' ? 'Administrator' : 'Customer'}</span>
                          </div>
                        </div>

                        <div className="profile-menu">
                          <Link to="/orders" className="profile-menu-item" onClick={() => setShowProfile(false)}>
                            <FiPackage />
                            <span>My Orders</span>
                          </Link>
                          {user?.role === 'customer' && (
                            <Link to="/wishlist" className="profile-menu-item" onClick={() => setShowProfile(false)}>
                              <FiHeart />
                              <span>Wishlist</span>
                            </Link>
                          )}
                          <Link to="/settings" className="profile-menu-item" onClick={() => setShowProfile(false)}>
                            <FiSettings />
                            <span>Settings</span>
                          </Link>
                          <div className="profile-menu-divider"></div>
                          <button className="profile-menu-item logout" onClick={handleLogout}>
                            <FiLogOut />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  className="action-btn login-btn"
                  onClick={() => navigate('/login')}
                  aria-label="Login"
                >
                  <FiUser />
                  <span className="login-text">Login</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle - Mobile Only */}
            <div className="nav-action mobile-menu-toggle">
              <button
                className="action-btn mobile-menu-btn"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Menu"
              >
                {showMobileMenu ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {showMobileMenu && (
          <div
            className={`mobile-nav-overlay ${showMobileMenu ? 'show' : ''}`}
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Mobile Navigation Sidebar */}
        <div className={`mobile-nav ${showMobileMenu ? 'show' : ''}`}>
              <ul className="mobile-nav-links">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <NavLink
                      to={link.path}
                      className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* Mobile Search */}
              <div className="mobile-search">
                <form onSubmit={(e) => { handleSearch(e); setShowMobileMenu(false); }} className="mobile-search-form">
                  <FiSearch className="mobile-search-icon" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>

              <div className="mobile-nav-actions">
                {user ? (
                  <>
                    <Link
                      to="/orders"
                      className="mobile-action"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FiPackage />
                      <span>My Orders</span>
                    </Link>
                    {user?.role === 'customer' && (
                      <Link
                        to="/wishlist"
                        className="mobile-action"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <FiHeart />
                        <span>Wishlist</span>
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      className="mobile-action"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <FiSettings />
                      <span>Settings</span>
                    </Link>
                    <button className="mobile-action" onClick={toggleDarkMode}>
                      {darkMode ? <FiSun /> : <FiMoon />}
                      <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button className="mobile-action logout" onClick={handleLogout}>
                      <FiLogOut />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="mobile-action" onClick={toggleDarkMode}>
                      {darkMode ? <FiSun /> : <FiMoon />}
                      <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button className="mobile-action" onClick={() => { navigate('/login'); setShowMobileMenu(false); }}>
                      <FiUser />
                      <span>Login</span>
                    </button>
                  </>
                )}
              </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} />
    </>
  )
}

export default Navbar
