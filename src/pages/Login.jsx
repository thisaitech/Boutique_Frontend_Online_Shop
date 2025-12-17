import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiLock, FiPhone, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi'
import { useGlobal } from '../context/GlobalContext'
import {
  requestOtp,
  verifyOtp,
  register,
  adminLogin,
  clearError,
  selectIsAuthenticated,
  selectUser,
  selectAuthLoading,
  selectAuthError,
  selectOtpSent,
  selectOtpPhone
} from '../store/slices/authSlice'
import toast from 'react-hot-toast'
import api from '../api/axiosConfig'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { login: contextLogin } = useGlobal() // Keep for backward compatibility during transition

  // Redux state
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const authLoading = useSelector(selectAuthLoading)
  const authError = useSelector(selectAuthError)
  const otpSentRedux = useSelector(selectOtpSent)
  const otpPhoneRedux = useSelector(selectOtpPhone)
  
  // View states: 'login', 'signup', 'forgot-password', 'otp-verify'
  const [view, setView] = useState('login')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    mobile: '',
    name: '',
    username: '', // for admin
    password: '', // for admin only
    otp: ''
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // For admin login only
  
  // Rate limiting states
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [loginCooldown, setLoginCooldown] = useState(0)
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [otpCooldown, setOtpCooldown] = useState(0)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/home')
      }
    }
  }, [isAuthenticated, user, navigate])

  // Sync Redux OTP state with local state
  useEffect(() => {
    if (otpSentRedux) {
      setOtpSent(true)
    }
  }, [otpSentRedux])

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      toast.error(authError)
      dispatch(clearError())
    }
  }, [authError, dispatch])

  // Cooldown timer for login
  useEffect(() => {
    if (loginCooldown > 0) {
      const timer = setTimeout(() => setLoginCooldown(loginCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [loginCooldown])

  // Cooldown timer for OTP
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCooldown])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validate mobile (Indian format)
  const validateMobile = (mobile) => {
    const cleaned = mobile.replace(/\D/g, '')
    return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'))
  }

  // Handle Mobile OTP Send
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()

    // Check rate limiting
    if (otpCooldown > 0) {
      toast.error(`Please wait ${otpCooldown} seconds before requesting another OTP`)
      return
    }

    const newErrors = {}

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required'
    } else if (!validateMobile(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number (10 digits)'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)

    try {
      // Send OTP via API
      const result = await dispatch(requestOtp({ phone: formData.mobile })).unwrap()
      setOtpSent(true)
      
      // Set cooldown (30 seconds)
      setOtpAttempts(prev => prev + 1)
      setOtpCooldown(30)
      // Show OTP in toast (since no SMS API - for development)
      const otp = result?.data?.otp
      if (otp) {
        toast.success(`Your OTP is: ${otp}`, { duration: 10000 })
      } else {
        toast.success(`OTP sent to ${formData.mobile}`)
      }
    } catch (error) {
      // Show actual error to user
      console.error('OTP request failed:', error)
      toast.error(error || 'Failed to send OTP. Please check if backend is running.')
      setErrors({ mobile: error || 'Failed to send OTP' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP Verification and Login
  const handleOTPLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    const newErrors = {}

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required'
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)

    try {
      // Verify OTP with backend
      const result = await dispatch(verifyOtp({
        phone: formData.mobile,
        otp: formData.otp
      })).unwrap()

      // Update context for backward compatibility
      if (result.user) {
        contextLogin({
          ...result.user,
          token: result.accessToken
        })
      }

      toast.success(`Welcome back, ${result.user?.name || 'User'}!`)
      navigate('/home')
    } catch (error) {
      console.error('OTP verification failed:', error)
      setErrors({ otp: error || 'Invalid OTP or verification failed' })
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault()

    // Check rate limiting
    if (loginCooldown > 0) {
      toast.error(`Too many attempts. Please wait ${loginCooldown} seconds`)
      return
    }

    const newErrors = {}
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)

    try {
      console.log('🔐 Attempting admin login with username:', formData.username)
      
      // Call backend API for admin authentication
      const result = await dispatch(adminLogin({
        username: formData.username,
        password: formData.password
      })).unwrap()

      console.log('✅ Admin login successful:', result)

      // Store admin flag in localStorage (simple approach)
      localStorage.setItem('thisai_admin', 'true')
      localStorage.setItem('thisai_adminUser', JSON.stringify(result.user || { name: 'Admin' }))

      console.log('📍 Admin flag stored, redirecting to /admin')
      toast.success(`Welcome, ${result.user?.name || 'Admin'}!`)
      navigate('/admin')
    } catch (apiError) {
      console.error('❌ Admin login failed. Details:', {
        message: apiError?.message || apiError,
        status: apiError?.status,
        response: apiError?.response
      })
      
      // Show error message
      setShake(true)
      setTimeout(() => setShake(false), 500)
      
      // Increment attempts and set cooldown
      setLoginAttempts(prev => prev + 1)
      const newAttempts = loginAttempts + 1
      
      // Cooldown increases with attempts: 5s, 10s, 30s, 60s
      if (newAttempts >= 5) {
        setLoginCooldown(60)
      } else if (newAttempts >= 3) {
        setLoginCooldown(30)
      } else if (newAttempts >= 2) {
        setLoginCooldown(10)
      } else {
        setLoginCooldown(5)
      }
      
      // Show specific error
      const errorMsg = apiError?.message || 'Invalid credentials - please check username and password'
      setErrors({ general: errorMsg })
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Sign Up with OTP
  const handleSignUp = async (e) => {
    e.preventDefault()

    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required'
    } else if (!validateMobile(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number (10 digits)'
    }

    // Email is optional - only validate if provided
    if (formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)

    try {
      // Request OTP for new user (same endpoint as login, with name)
      const result = await dispatch(requestOtp({ phone: formData.mobile, name: formData.name })).unwrap()

      setOtpSent(true)
      // Show OTP in toast (since no SMS API - for development)
      const otp = result?.data?.otp
      if (otp) {
        toast.success(`Your OTP is: ${otp}`, { duration: 10000 })
      } else {
        toast.success(`OTP sent to ${formData.mobile}`)
      }
    } catch (error) {
      // Show actual error to user
      console.error('OTP request failed:', error)
      toast.error(error || 'Failed to send OTP. Please check if backend is running.')
      setErrors({ mobile: error || 'Failed to send OTP' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Signup OTP Verification
  const handleSignupOTPVerify = async (e) => {
    e.preventDefault()

    const newErrors = {}

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required'
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)

    try {
      // API mode - verify OTP with backend
      const result = await dispatch(verifyOtp({
        phone: formData.mobile,
        otp: formData.otp
      })).unwrap()

      toast.success('Account created successfully!')

      // Update context for backward compatibility
      if (result.user) {
        contextLogin({
          ...result.user,
          token: result.accessToken
        })
      }

      navigate('/home')
    } catch (error) {
      console.error('Signup OTP verification failed:', error)
      setErrors({ otp: error || 'Invalid OTP or verification failed' })
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsLoading(false)
    }
  }


  const resetForm = () => {
    setFormData({
      mobile: '',
      name: '',
      username: '',
      password: '',
      otp: ''
    })
    setErrors({})
    setOtpSent(false)
    setOtpVerified(false)
    setShowPassword(false)
  }

  return (
    <div className="login-page">
      {/* Background Decorations */}
      <div className="login-bg">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
        <div className="floating-element floating-1">👗</div>
        <div className="floating-element floating-2">💎</div>
        <div className="floating-element floating-3">👘</div>
        <div className="floating-element floating-4">✨</div>
      </div>

      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Left Side - Branding */}
        <div className="login-branding">
          <motion.div
            className="branding-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="brand-logo">ThisAI Boutique</h1>
            <p className="brand-tagline">Where Tradition Meets Elegance</p>
            <div className="brand-image">
              <img src="/images/login-img.svg" alt="Fashion" />
            </div>
          </motion.div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <motion.div
            className={`login-card glass-card ${shake ? 'shake' : ''}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Header */}
            <div className="login-header">
              {view !== 'login' && (
                <button className="back-to-login" onClick={() => { setView('login'); resetForm(); }}>
                  <FiArrowLeft /> Back
                </button>
              )}
              <h2>
                {view === 'login' && 'Welcome Back'}
                {view === 'signup' && 'Create Account'}
                {view === 'otp-verify' && 'Verify OTP'}
              </h2>
              <p>
                {view === 'login' && 'Sign in to continue your fashion journey'}
                {view === 'signup' && 'Join us and start shopping'}
                {view === 'otp-verify' && 'Enter the OTP sent to your mobile'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* Customer Login - Mobile OTP */}
              {view === 'login' && !otpSent && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleSendOTP} className="login-form">
                    <div className={`input-group ${errors.mobile ? 'error' : ''}`}>
                      <div className="input-icon">
                        <FiPhone />
                      </div>
                      <input
                        type="tel"
                        name="mobile"
                        placeholder="Mobile number (10 digits)"
                        value={formData.mobile}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setFormData(prev => ({ ...prev, mobile: value }))
                          if (errors.mobile) setErrors(prev => ({ ...prev, mobile: '' }))
                        }}
                        className="login-input"
                        autoComplete="tel"
                        maxLength={10}
                      />
                      {errors.mobile && <span className="error-text">{errors.mobile}</span>}
                    </div>

                    {errors.general && (
                      <div className="general-error">{errors.general}</div>
                    )}

                    <button
                      type="submit"
                      className={`login-btn btn-primary ${isLoading || otpCooldown > 0 ? 'loading' : ''}`}
                      disabled={isLoading || otpCooldown > 0}
                    >
                      {isLoading ? <span className="loader"></span> : otpCooldown > 0 ? `Wait ${otpCooldown}s` : 'Send OTP'}
                    </button>
                  </form>

                  {/* Admin Login Link */}
                  <div className="admin-login-section">
                    <button
                      type="button"
                      className="admin-login-link"
                      onClick={() => setView('admin-login')}
                    >
                      Admin Login
                    </button>
                  </div>

                  {/* Footer Links */}
                  <div className="login-footer">
                    <p className="signup-text">
                      New to ThisAI?{' '}
                      <button
                        type="button"
                        className="signup-link"
                        onClick={() => { setView('signup'); resetForm(); }}
                      >
                        Create Account
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* OTP Verification for Login */}
              {view === 'login' && otpSent && (
                <motion.div
                  key="login-otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="otp-info">
                    <p>OTP sent to <strong>{formData.mobile}</strong></p>

                    <button
                      type="button"
                      className="change-mobile-btn"
                      onClick={() => { setOtpSent(false); setFormData(prev => ({ ...prev, otp: '' })) }}
                    >
                      Change Mobile Number
                    </button>
                  </div>

                  <form onSubmit={handleOTPLogin} className="login-form">
                    <div className={`input-group ${errors.otp ? 'error' : ''}`}>
                      <div className="input-icon">
                        <FiLock />
                      </div>
                      <input
                        type="text"
                        name="otp"
                        placeholder="Enter 6-digit OTP"
                        value={formData.otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setFormData(prev => ({ ...prev, otp: value }))
                          if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }))
                        }}
                        className="login-input"
                        maxLength={6}
                        autoFocus
                      />
                      {errors.otp && <span className="error-text">{errors.otp}</span>}
                    </div>

                    <button
                      type="submit"
                      className={`login-btn btn-primary ${isLoading ? 'loading' : ''}`}
                      disabled={isLoading}
                    >
                      {isLoading ? <span className="loader"></span> : 'Verify & Sign In'}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Admin Login */}
              {view === 'admin-login' && (
                <motion.div
                  key="admin-login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="admin-notice">
                    <p>Admin access is restricted. Contact dev team for credential recovery.</p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="login-form">
                    <div className={`input-group ${errors.username ? 'error' : ''}`}>
                      <div className="input-icon">
                        <FiUser />
                      </div>
                      <input
                        type="text"
                        name="username"
                        placeholder="Admin Username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="login-input"
                        autoComplete="username"
                      />
                      {errors.username && <span className="error-text">{errors.username}</span>}
                    </div>

                    <div className={`input-group ${errors.password ? 'error' : ''}`}>
                      <div className="input-icon">
                        <FiLock />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="login-input"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                      {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>

                    {errors.general && (
                      <div className="general-error">{errors.general}</div>
                    )}

                    <button
                      type="submit"
                      className={`login-btn btn-primary ${isLoading || loginCooldown > 0 ? 'loading' : ''}`}
                      disabled={isLoading || loginCooldown > 0}
                    >
                      {isLoading ? <span className="loader"></span> : loginCooldown > 0 ? `Wait ${loginCooldown}s` : 'Sign In as Admin'}
                    </button>
                  </form>

                  <div className="login-footer">
                    <button
                      type="button"
                      className="back-to-customer"
                      onClick={() => { setView('login'); resetForm(); }}
                    >
                      Back to Customer Login
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Sign Up */}
              {view === 'signup' && !otpSent && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleSignUp} className="login-form">
                    <div className={`input-group ${errors.name ? 'error' : ''}`}>
                      <div className="input-icon">
                        <FiUser />
                      </div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="login-input"
                        autoComplete="name"
                      />
                      {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className={`input-group ${errors.mobile ? 'error' : ''}`}>
                      <div className="input-icon">
                        <FiPhone />
                      </div>
                      <input
                        type="tel"
                        name="mobile"
                        placeholder="Mobile number (10 digits) *"
                        value={formData.mobile}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setFormData(prev => ({ ...prev, mobile: value }))
                          if (errors.mobile) setErrors(prev => ({ ...prev, mobile: '' }))
                        }}
                        className="login-input"
                        autoComplete="tel"
                        maxLength={10}
                      />
                      {errors.mobile && <span className="error-text">{errors.mobile}</span>}
                    </div>

                    <button
                      type="submit"
                      className={`login-btn btn-primary ${isLoading ? 'loading' : ''}`}
                      disabled={isLoading}
                    >
                      {isLoading ? <span className="loader"></span> : 'Send OTP'}
                    </button>
                  </form>

                  <div className="login-footer">
                    <p className="signup-text">
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="signup-link"
                        onClick={() => { setView('login'); resetForm(); }}
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Signup OTP Verification */}
              {view === 'signup' && otpSent && (
                <motion.div
                  key="signup-otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="otp-info">
                    <p>OTP sent to <strong>{formData.mobile}</strong></p>

                    <button
                      type="button"
                      className="change-mobile-btn"
                      onClick={() => { setOtpSent(false); setFormData(prev => ({ ...prev, otp: '' })) }}
                    >
                      Change Mobile Number
                    </button>
                  </div>

                  <form onSubmit={handleSignupOTPVerify} className="login-form">
                    <div className={`input-group ${errors.otp ? 'error' : ''}`}>
                      <div className="input-icon">
                        <FiLock />
                      </div>
                      <input
                        type="text"
                        name="otp"
                        placeholder="Enter 6-digit OTP"
                        value={formData.otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setFormData(prev => ({ ...prev, otp: value }))
                          if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }))
                        }}
                        className="login-input"
                        maxLength={6}
                        autoFocus
                      />
                      {errors.otp && <span className="error-text">{errors.otp}</span>}
                    </div>

                    <button
                      type="submit"
                      className={`login-btn btn-primary ${isLoading ? 'loading' : ''}`}
                      disabled={isLoading}
                    >
                      {isLoading ? <span className="loader"></span> : 'Verify & Create Account'}
                    </button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="login-page-footer">
        <p>ThisAI Technologies &copy; {new Date().getFullYear()}. All rights reserved.</p>
      </div>
    </div>
  )
}

export default Login
