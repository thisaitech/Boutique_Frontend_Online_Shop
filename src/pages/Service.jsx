import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiScissors,
  FiCalendar,
  FiPhone,
  FiUser,
  FiUpload,
  FiCheck,
  FiClock,
  FiChevronDown,
  FiMapPin,
  FiMail,
  FiMessageCircle,
} from 'react-icons/fi'
import {
  fetchServiceTypes,
  createBooking,
  createGuestBooking,
  selectServiceTypes,
  selectAvailableSlots,
  selectBookingsSubmitting
} from '../store/slices/bookingSlice'
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice'
import { selectSiteConfig } from '../store/slices/siteConfigSlice'
import wsService from '../utils/websocket'
import toast from 'react-hot-toast'
import './Service.css'

function Service() {
  const dispatch = useDispatch()

  // Redux state only - no context fallback
  const serviceTypesRedux = useSelector(selectServiceTypes)
  const availableSlotsRedux = useSelector(selectAvailableSlots)
  const bookingsSubmitting = useSelector(selectBookingsSubmitting)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const siteConfig = useSelector(selectSiteConfig)

  // Fetch service types on mount
  useEffect(() => {
    dispatch(fetchServiceTypes())
  }, [dispatch])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)

  // WebSocket connection for real-time booking notifications
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      try {
        wsService.connect(user.id, 'customer')
        setWsConnected(true)

        wsService.on('connection', () => {
          setWsConnected(true)
        })

        wsService.on('error', () => {
          setWsConnected(false)
        })

        return () => {
          wsService.disconnect()
        }
      } catch (error) {
        console.warn('WebSocket connection failed:', error)
        setWsConnected(false)
      }
    }
  }, [isAuthenticated, user?.id])

  // Get content from siteConfig - NO fallbacks
  const serviceContent = siteConfig?.servicePageContent || {}

  const defaultHero = {
    badge: 'Custom Tailoring',
    title: 'Made-to-measure outfits crafted for you',
    subtitle: 'Book a fitting or drop in anytime. We stitch, style, and finish with care.',
    backgroundImage: '/images/kurtis/20.jpeg'
  }

  const defaultServiceTypes = [
    { id: 'blouse_stitching', label: 'Blouse Stitching', price: '₹500 onwards', icon: '👚' },
    { id: 'kurti_tailoring', label: 'Kurti Tailoring', price: '₹800 onwards', icon: '👗' },
    { id: 'designer_blouse', label: 'Designer Blouse', price: '₹1500 onwards', icon: '✨' },
    { id: 'alterations', label: 'Alterations', price: '₹200 onwards', icon: '🔧' },
    { id: 'custom_design', label: 'Custom Design', price: 'On Request', icon: '🎨' },
  ]

const heroContent = { ...defaultHero, ...(serviceContent?.hero || {}) }

  // Check if any content exists
  const backendServiceTypes = Array.isArray(serviceTypesRedux) ? serviceTypesRedux : []
  const configuredServiceTypes = Array.isArray(serviceContent?.serviceTypes) ? serviceContent.serviceTypes : []
  const serviceTypesSource =
    backendServiceTypes.length > 0
      ? backendServiceTypes
      : (configuredServiceTypes.length > 0 ? configuredServiceTypes : defaultServiceTypes)
  const displayedServices = serviceTypesSource.slice(0, 5)
  const enrichedServiceTypes = displayedServices.map((service, index) => {
    const match = configuredServiceTypes.find(
      (item) =>
        item.id === service.id ||
        item.value === service.value ||
        item.label === service.label,
    )
    const label = service.label || match?.label || service.value || `Service ${index + 1}`
    const price = service.price || match?.price || match?.startingPrice || ''
    const description = service.description || match?.description || match?.subtitle || ''
    const icon = service.icon || match?.icon || <FiScissors />
    const id = service.id || service.value || `${label.replace(/\s+/g, '-')}-${index}`
    return {
      id,
      label,
      price,
      description,
      icon,
    }
  })
  const hasHero = true
  const hasServiceTypes = enrichedServiceTypes.length > 0
  const hasAnyContent = true

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    measurementType: '',
    notes: '',
    referenceImage: null
  })

  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, referenceImage: file.name }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      const cleanedPhone = formData.phone.replace(/\D/g, '')
      if (cleanedPhone.length !== 10) {
        newErrors.phone = 'Enter a valid 10-digit mobile number'
      } else if (!/^[6-9]/.test(cleanedPhone)) {
        newErrors.phone = 'Mobile number should start with 6, 7, 8, or 9'
      }
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = 'Please select a future date'
      }
    }

    if (!formData.measurementType) {
      newErrors.measurementType = 'Please select a service type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare booking data matching backend DTO
      const bookingData = {
        date: formData.date,
        time: formData.time || '10:00',
        measurementType: formData.measurementType,
        notes: formData.notes || '',
        referenceImage: formData.referenceImage || null
      }

      // Try WebSocket first, fallback to HTTP
      if (wsConnected && wsService.isConnected()) {
        // Send booking via WebSocket for real-time notification
        if (isAuthenticated) {
          wsService.send('new_booking', bookingData)
        } else {
          const guestBookingData = {
            ...bookingData,
            name: formData.name,
            phone: formData.phone
          }
          wsService.send('new_booking', guestBookingData)
        }
        toast.success('Booking sent in real-time! 📅', { icon: '✨' })
      } else {
        // Fallback to HTTP request
        if (isAuthenticated) {
          // For authenticated users, use CreateUserBookingDto
          await dispatch(createBooking(bookingData)).unwrap()
        } else {
          // For guest users, add name and phone (GuestBookingDto)
          const guestBookingData = {
            ...bookingData,
            name: formData.name,
            phone: formData.phone
          }
          await dispatch(createGuestBooking(guestBookingData)).unwrap()
        }
        toast.success('Appointment request sent successfully!')
      }

      setIsSubmitting(false)
      setShowSuccess(true)

      // Reset form
      setFormData({
        name: '',
        phone: '',
        date: '',
        time: '',
        measurementType: '',
        notes: '',
        referenceImage: null
      })

      // Hide success after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      setIsSubmitting(false)
      console.error('Booking error:', error)
      toast.error(typeof error === 'string' ? error : 'Failed to book appointment. Please try again.')
    }
  }

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const scrollToContent = () => {
    const pricing = document.querySelector('.services-pricing-section')
    if (pricing) pricing.scrollIntoView({ behavior: 'smooth' })
  }

  // If no content exists, show empty state
  if (!hasAnyContent) {
    return (
      <div className="service-page">
        <div className="empty-page-state" style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <FiScissors size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h2 style={{ opacity: 0.5, marginBottom: '0.5rem' }}>Custom Tailoring Services</h2>
          <p style={{ opacity: 0.4 }}>Service information coming soon. Please check back later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="service-page">
      {/* Hero Section - Full Screen Parallax */}
      <section
        className="service-hero-parallax"
        style={{ backgroundImage: heroContent?.backgroundImage ? `url(${heroContent.backgroundImage})` : 'none' }}
      >
        <div className="hero-overlay"></div>
        <motion.div
          className="hero-content-centered"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {heroContent?.badge && (
            <span className="hero-badge-large">
              <FiScissors /> {heroContent.badge}
            </span>
          )}
          {heroContent?.title && <h1>{heroContent.title}</h1>}
          {heroContent?.subtitle && <p>{heroContent.subtitle}</p>}
          <motion.button
            className="scroll-indicator"
            onClick={scrollToContent}
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <span>Explore Our Services</span>
            <FiChevronDown />
          </motion.button>
        </motion.div>
      </section>

      {/* Services Pricing Cards - Only show if service types exist */}
      {hasServiceTypes && (
        <section className="services-pricing-section section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-title">Our Services & Pricing</h2>
              <p className="section-subtitle">
                {serviceContent?.pricingNote || 'Transparent pricing with no surprises. Choose the service that fits you best.'}
              </p>
            </motion.div>

            <div className="pricing-grid">
              {defaultServiceTypes.map((service, index) => (
                <motion.div
                  key={service.id}
                  className="pricing-card glass-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                >
                  <span className="service-icon">{service.icon}</span>
                  <h3>{service.label}</h3>
                  {service.description && <p className="service-description">{service.description}</p>}
                  <span className={`price-tag ${service.price ? '' : 'muted'}`}>
                    {service.price || 'Request quote'}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Booking Form Section - Parallax Background */}
      <section
        className="booking-parallax-section"
        style={{ backgroundImage: `url(/images/kurtis/20.jpeg)` }}
      >
        <div className="booking-overlay"></div>
        <div className="container">
          <div className="booking-wrapper">
            <motion.div
              className="booking-info"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2>Book Your Appointment</h2>
              <p>
                Schedule a consultation with our expert tailors. We'll help you
                create the perfect blouse or kurti tailored just for you.
              </p>

              {(serviceContent?.workingHours || serviceContent?.contactNumber || siteConfig?.contactPhone) && (
                <div className="info-items">
                  {serviceContent?.workingHours && (
                    <div className="info-item">
                      <FiClock />
                      <div>
                        <h4>Working Hours</h4>
                        <p>{serviceContent.workingHours}</p>
                      </div>
                    </div>
                  )}
                  {(serviceContent?.contactNumber || siteConfig?.contactPhone) && (
                    <div className="info-item">
                      <FiPhone />
                      <div>
                        <h4>Call Us</h4>
                        <p>{serviceContent?.contactNumber || siteConfig?.contactPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="process-steps">
                <h4>How It Works</h4>
                <div className="steps">
                  <div className="step">
                    <span className="step-num">1</span>
                    <p>Book an appointment</p>
                  </div>
                  <div className="step">
                    <span className="step-num">2</span>
                    <p>Visit for measurements</p>
                  </div>
                  <div className="step">
                    <span className="step-num">3</span>
                    <p>Get your perfect outfit</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="booking-form-card glass-card"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {showSuccess ? (
                <div className="success-message">
                  <div className="success-icon">
                    <FiCheck />
                  </div>
                  <h3>Appointment Request Sent!</h3>
                  <p>Our team will contact you shortly to confirm your appointment.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="booking-form">
                  <h3>Schedule Your Visit</h3>

                  {/* Two Column Grid */}
                  <div className="form-grid-2col">
                    {/* Name */}
                    <div className={`form-group ${errors.name ? 'error' : ''}`}>
                      <label>
                        <FiUser />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                      {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    {/* Phone */}
                    <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                      <label>
                        <FiPhone />
                        Phone Number
                      </label>
                      <div className="phone-input-wrapper">
                        <span className="phone-prefix">+91</span>
                      <input
                        type="tel"
                        name="phone"
                          placeholder="Enter 10-digit mobile number"
                        value={formData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setFormData(prev => ({ ...prev, phone: value }))
                            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }))
                          }}
                          className="input-field phone-input"
                          maxLength={10}
                          inputMode="numeric"
                      />
                      </div>
                      {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

                    {/* Date */}
                    <div className={`form-group ${errors.date ? 'error' : ''}`}>
                      <label>
                        <FiCalendar />
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        min={getMinDate()}
                        value={formData.date}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                      {errors.date && <span className="error-text">{errors.date}</span>}
                    </div>

                    {/* Preferred Time */}
                    <div className={`form-group ${errors.time ? 'error' : ''}`}>
                      <label>
                        <FiClock />
                        Preferred Time
                      </label>
                      <select
                        name="time"
                        value={formData.time || ''}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">Select time slot</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="03:00 PM">03:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                        <option value="05:00 PM">05:00 PM</option>
                        <option value="06:00 PM">06:00 PM</option>
                        <option value="07:00 PM">07:00 PM</option>
                      </select>
                      {errors.time && <span className="error-text">{errors.time}</span>}
                    </div>
                  </div>

                  {/* Service Type - Full Width */}
                  <div className={`form-group ${errors.measurementType ? 'error' : ''}`}>
                    <label>
                      <FiScissors />
                      Service Type
                    </label>
                    <select
                      name="measurementType"
                      value={formData.measurementType}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">Select a service</option>
                      {enrichedServiceTypes.length > 0 ? (
                        enrichedServiceTypes.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.label} - {service.price || 'On Request'}
                          </option>
                        ))
                      ) : (
                        <>
                          <optgroup label="Blouse Services">
                            <option value="blouse-aari">Blouse Aari Work - ₹800 onwards</option>
                            <option value="blouse-stitch">Blouse Stitching - ₹500 onwards</option>
                            <option value="blouse-designer">Designer Blouse - ₹1500 onwards</option>
                            <option value="blouse-maggam">Blouse Maggam Work - ₹1200 onwards</option>
                          </optgroup>
                          <optgroup label="Kurti Services">
                            <option value="kurti-stitch">Kurti Stitching - ₹800 onwards</option>
                            <option value="kurti-design">Kurti Custom Design - ₹1200 onwards</option>
                            <option value="kurti-embroidery">Kurti Embroidery Work - ₹1500 onwards</option>
                          </optgroup>
                          <optgroup label="Alterations & Others">
                            <option value="alterations">Alterations - ₹200 onwards</option>
                            <option value="custom">Custom Design - On Request</option>
                          </optgroup>
                        </>
                      )}
                    </select>
                    {errors.measurementType && <span className="error-text">{errors.measurementType}</span>}
                  </div>

                  {/* Two Column - Reference Image and Notes */}
                  <div className="form-grid-2col">
                    {/* Reference Image */}
                    <div className="form-group">
                      <label>
                        <FiUpload />
                        Reference Image (Optional)
                      </label>
                      <div className="file-upload">
                        <input
                          type="file"
                          id="reference-image"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="reference-image" className="file-label">
                          {formData.referenceImage || 'Choose a file...'}
                        </label>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                      <label>Additional Notes</label>
                      <textarea
                        name="notes"
                        placeholder="Any special requirements..."
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="input-field"
                        rows="2"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`btn btn-primary submit-btn ${isSubmitting ? 'loading' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loader"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCalendar />
                        Book Appointment
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Service
