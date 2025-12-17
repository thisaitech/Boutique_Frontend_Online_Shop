import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend, FiCheck, FiChevronDown, FiStar, FiMessageCircle, FiExternalLink, FiUser, FiChevronRight } from 'react-icons/fi'
import { FaFacebookF, FaInstagram, FaTwitter, FaPinterestP, FaYoutube, FaWhatsapp } from 'react-icons/fa'
import { fetchPublicConfig, selectSiteConfig } from '../store/slices/siteConfigSlice'
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice'
import api, { handleApiError } from '../api/axiosConfig'
import wsService from '../utils/websocket'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import './Contact.css'

// Icon mapping
const iconMap = {
  location: FiMapPin,
  phone: FiPhone,
  email: FiMail,
  clock: FiClock
}

// Social media icon mapping
const socialIconMap = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  twitter: FaTwitter,
  pinterest: FaPinterestP,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp
}

function Contact() {
  const dispatch = useDispatch()
  const siteConfig = useSelector(selectSiteConfig)
  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const location = useLocation()
  const heroRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)

  // Prefer backend contact info, avoid hardcoded defaults
  const contactAddress = siteConfig?.contactAddress?.trim()
    || siteConfig?.contactInfo?.address
    || ''

  const contactPhone = siteConfig?.contactPhone?.trim()
    || siteConfig?.contactInfo?.phone
    || siteConfig?.contactInfo?.alternatePhone
    || ''

  const contactEmail = siteConfig?.contactEmail?.trim()
    || siteConfig?.contactInfo?.email
    || ''

  const hasContactData = Boolean(contactAddress || contactPhone || contactEmail)

  useEffect(() => {
    if (!hasContactData) {
      dispatch(fetchPublicConfig())
    }
  }, [dispatch, hasContactData])

  // WebSocket connection (optional - won't break if server not available)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      try {
        wsService.connect(user.id, 'customer')

        const handleConnection = (data) => {
          setWsConnected(data.status === 'connected')
        }

        const handleMessage = (message) => {
          if (message.fromAdmin) {
            toast.success('New message from admin')
          }
        }

        wsService.on('connection', handleConnection)
        wsService.on('message', handleMessage)

        return () => {
          wsService.off('connection', handleConnection)
          wsService.off('message', handleMessage)
        }
      } catch (error) {
        console.warn('WebSocket connection failed:', error)
      }
    }
  }, [isAuthenticated, user?.id])

  // Scroll to top when component mounts or route changes
  // Use useLayoutEffect to scroll before paint to prevent showing bottom of page
  useLayoutEffect(() => {
    // Always scroll to top on mount/route change (unless there's a hash)
    if (!location.hash) {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  // Handle hash navigation after render
  useEffect(() => {
    if (location.hash) {
      // Wait for page to render, then scroll to hash element
      setTimeout(() => {
        const element = document.querySelector(location.hash)
        if (element) {
          const offset = 80 // Account for fixed header if any
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
          window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [location.hash])

  // Get contact page content with safe fallbacks so the page is never hidden
  const contactContent = siteConfig?.contactPageContent || {}

  const defaultHero = {
    badge: 'Contact Us',
    title: 'We would love to hear from you',
    subtitle: 'Questions, custom requests, or feedback — drop a note and we’ll get back shortly.',
    backgroundImage: '/images/kurtis/20.jpeg'
  }

  const defaultInfoCards = [
    {
      id: 1,
      icon: 'location',
      title: 'Visit Our Boutique',
      content: contactAddress || 'Contact address coming soon',
      color: '#E91E8C',
      enabled: true
    },
    {
      id: 2,
      icon: 'phone',
      title: 'Call Us',
      content: contactPhone || 'Phone number coming soon',
      link: contactPhone ? `tel:${contactPhone.replace(/[^\d+]/g, '')}` : undefined,
      color: '#4DA8DA',
      enabled: true
    },
    {
      id: 3,
      icon: 'email',
      title: 'Email Us',
      content: contactEmail || 'Email coming soon',
      link: contactEmail ? `mailto:${contactEmail}` : undefined,
      color: '#27AE60',
      enabled: true
    },
    {
      id: 4,
      icon: 'clock',
      title: 'Business Hours',
      content: 'Mon - Sat: 10AM - 8PM | Sunday: Closed',
      color: '#F39C12',
      enabled: true
    },
  ]

  const defaultFormSection = {
    title: 'Send us a message',
    subtitle: 'Our team typically responds within one business day.',
  }

  const defaultMapSection = {
    title: 'Find us on the map',
    embedUrl: siteConfig?.contactMapEmbed || null,
  }

  const defaultFaq = {
    items: [
      { question: 'Do you offer alterations?', answer: 'Yes, we handle alterations and fittings for all outfits we sell.', enabled: true },
      { question: 'What are your store hours?', answer: 'Monday to Saturday, 10:00 AM - 7:00 PM.', enabled: true },
    ],
  }

  const defaultCta = {
    title: 'Need urgent help?',
    subtitle: 'Call or WhatsApp us for quick support.',
    primaryButton: { text: 'Call Us', link: 'tel:+919876543210' },
    secondaryButton: { text: 'WhatsApp', link: 'https://wa.me/919876543210' },
  }

  const defaultSocial = {
    items: [
      { type: 'facebook', url: '#', enabled: false },
      { type: 'instagram', url: '#', enabled: false },
      { type: 'twitter', url: '#', enabled: false },
    ],
  }

  const hero = { ...defaultHero, ...(contactContent.hero || {}) }

  const rawInfoCards = Array.isArray(contactContent.infoCards) ? contactContent.infoCards : []
  const infoCards = rawInfoCards.length > 0 ? rawInfoCards : defaultInfoCards

  const formSection = { ...defaultFormSection, ...(contactContent.formSection || {}) }

  const mapSection = { ...defaultMapSection, ...(contactContent.mapSection || {}) }

  // Validate map embed URL - accept any non-empty string from backend
  const isValidMapUrl = (url) => {
    return !!(url && typeof url === 'string' && url.trim().length > 0)
  }

  // Get validated map URL
  const buildEmbedFromQuery = (query) => {
    if (!query) return null
    const encoded = encodeURIComponent(query)
    return `https://www.google.com/maps?q=${encoded}&output=embed`
  }

  const resolvedMapUrl = mapSection?.embedUrl || siteConfig?.contactMapEmbed
  let mapEmbedUrl = resolvedMapUrl && isValidMapUrl(resolvedMapUrl)
    ? resolvedMapUrl
    : null

  if (!mapEmbedUrl) {
    const fallbackQuery = mapSection?.directionsUrl || contactAddress || contactContent?.contactAddress
    mapEmbedUrl = buildEmbedFromQuery(fallbackQuery)
  }

  // FAQ section
  const faqSection = contactContent.faqSection?.items?.length ? contactContent.faqSection : defaultFaq

  // CTA section
  const cta = { ...defaultCta, ...(contactContent.cta || {}) }

  // Social links
  const socialLinks = contactContent.socialLinks || defaultSocial

  // Check if any content exists for each section
  const hasHero = true
  const hasInfoCards = infoCards.filter(card => card.enabled !== false).length > 0
  const hasFormSection = true
  const hasMapSection = !!(mapSection?.title || mapEmbedUrl)
  const hasFaqSection = (faqSection?.items || []).filter(faq => faq.enabled !== false).length > 0
  const hasCta = true
  const hasSocialLinks = (socialLinks?.items || []).filter(s => s.enabled !== false).length > 0

  // Page always renders with defaults
  const hasAnyContent = true

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const [errors, setErrors] = useState({})

  // Parallax scroll effects
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const heroY = useTransform(heroScroll, [0, 1], [0, 300])
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0])
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.1])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
    if (!formData.message.trim()) newErrors.message = 'Message is required'
    if (formData.message.trim().length > 0 && formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
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
      const messageData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        category: 'general',
      }

      // Send via WebSocket if connected, otherwise use HTTP
      if (wsConnected && wsService.isConnected()) {
        wsService.sendMessage(messageData)
        toast.success('Message sent in real-time!')
      } else {
        await api.post('/user/contact', messageData)
        toast.success('Message sent successfully!')
      }

      setIsSubmitting(false)
      setIsSuccess(true)
      toast.success('Message sent successfully!')

      setTimeout(() => {
        setIsSuccess(false)
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      }, 3000)
    } catch (error) {
      setIsSubmitting(false)
      toast.error(handleApiError(error))
    }
  }

  const scrollToContent = () => {
    const infoSection = document.querySelector('.contact-info-parallax')
    if (infoSection) {
      infoSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const enabledInfoCards = infoCards.filter(card => card.enabled)
  const enabledFaqs = (faqSection?.items || []).filter(faq => faq.enabled)
  const enabledSocials = (socialLinks?.items || []).filter(s => s.enabled)

  // If no content exists, show empty state
  if (!hasAnyContent) {
    return (
      <div className="contact-page-parallax">
        <div className="empty-page-state" style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <FiMessageCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h2 style={{ opacity: 0.5, marginBottom: '0.5rem' }}>Contact Us</h2>
          <p style={{ opacity: 0.4 }}>Contact information coming soon. Please check back later.</p>
        </div>
      </div>
    )
  }
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 
/*****************************************************************************************************************************************************/ 


  return (
    <div className="contact-page-parallax">
      {/* Hero Section - Full Screen Parallax - Only show if content exists */}
      {hasHero && (
        <section className="contact-hero-parallax" ref={heroRef}>
          <motion.div
            className="hero-parallax-bg"
            style={{
              y: heroY,
              scale: heroScale,
              backgroundImage: hero?.backgroundImage ? `url(${hero.backgroundImage})` : 'none'
            }}
          />
          <div className="hero-gradient-overlay" />

          <motion.div
            className="hero-content-wrapper"
            style={{ opacity: heroOpacity }}
          >
            <motion.div
              className="hero-content-centered"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {hero?.badge && (
                <motion.span
                  className="hero-label"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <FiMessageCircle /> {hero.badge}
                </motion.span>
              )}

              {(hero?.title || hero?.titleHighlight) && (
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  {hero?.title}
                  {hero?.titleHighlight && (
                    <>
                      <br />
                      <span className="gradient-text">{hero.titleHighlight}</span>
                    </>
                  )}
                </motion.h1>
              )}

              {hero?.subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  {hero.subtitle}
                </motion.p>
              )}

              {contactPhone && (
                <motion.div
                  className="hero-cta-buttons"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                >
                  <a href="#contact-form" className="btn btn-primary">
                    <FiSend /> Send Message
                  </a>
                  <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} className="btn btn-outline-light">
                    <FiPhone /> Call Now
                  </a>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* Contact Info Cards - Floating - Only show if content exists */}
      {hasInfoCards && (
        <section className="contact-info-parallax">
          <div className="container">
            <div className="info-cards-grid">
              {enabledInfoCards.map((card, index) => {
                const IconComponent = iconMap[card.icon] || FiStar
                return (
                  <motion.div
                    key={card.id}
                    className="info-card-parallax glass-card"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    whileHover={{ y: -10, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}
                  >
                    <div className="info-icon-wrapper" style={{ background: `${card.color}15`, color: card.color }}>
                      <IconComponent />
                    </div>
                    <h3>{card.title}</h3>
                    {card.link ? (
                      <a href={card.link} className="info-link">{card.content}</a>
                    ) : (
                      <p>{card.content}</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact Form & Map Section - Only show if content exists */}
      {(hasFormSection || hasMapSection) && (
        <section className="contact-main-parallax" id="contact-form">
          <div className="form-parallax-bg" style={{ backgroundImage: formSection?.backgroundImage ? `url(${formSection.backgroundImage})` : 'none' }} />
          <div className="form-overlay" />
          <div className="container">
            <div className="contact-grid-parallax">
              {/* Contact Form - Always show the form for user contact */}
              <motion.div
                className="contact-form-card glass-card"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      className="success-state"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div className="success-icon-wrapper">
                        <FiCheck />
                      </div>
                      <h3>{formSection?.successTitle || 'Message Sent!'}</h3>
                      <p>{formSection?.successMessage || 'We will get back to you soon.'}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {(formSection?.title || formSection?.subtitle) && (
                        <div className="form-header">
                          {formSection?.title && <h2>{formSection.title}</h2>}
                          {formSection?.subtitle && <p>{formSection.subtitle}</p>}
                        </div>
                      )}
                      <form onSubmit={handleSubmit} className="contact-form">
                        <div className="form-row">
                          <div className={`form-group ${errors.name ? 'error' : ''}`}>
                            <label><FiUser /> Full Name *</label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="input-field"
                              placeholder="Enter your name"
                            />
                            {errors.name && <span className="error-text">{errors.name}</span>}
                          </div>
                          <div className={`form-group ${errors.email ? 'error' : ''}`}>
                            <label><FiMail /> Email Address *</label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="input-field"
                              placeholder="Enter your email"
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label><FiPhone /> Phone Number</label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="input-field"
                              placeholder="Enter your phone"
                            />
                          </div>
                          <div className="form-group">
                            <label>Subject</label>
                            <input
                              type="text"
                              name="subject"
                              value={formData.subject}
                              onChange={handleInputChange}
                              className="input-field"
                              placeholder="What's this about?"
                            />
                          </div>
                        </div>
                        <div className={`form-group ${errors.message ? 'error' : ''}`}>
                          <label><FiMessageCircle /> Your Message *</label>
                          <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            className="input-field"
                            rows="5"
                            placeholder="Type your message here..."
                          />
                          {errors.message && <span className="error-text">{errors.message}</span>}
                        </div>
                        <motion.button
                          type="submit"
                          className={`btn btn-primary submit-btn ${isSubmitting ? 'loading' : ''}`}
                          disabled={isSubmitting}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="loader"></span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <FiSend />
                              {formSection?.submitButtonText || 'Send Message'}
                            </>
                          )}
                        </motion.button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Map Section - Only show if content exists */}
              {hasMapSection && (
                <motion.div
                  className="map-section-card glass-card"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {(mapSection?.title || mapSection?.subtitle) && (
                    <div className="map-header">
                      {mapSection?.title && <h3>{mapSection.title}</h3>}
                      {mapSection?.subtitle && <p>{mapSection.subtitle}</p>}
                    </div>
                  )}

                  {mapSection?.description && (
                    <p className="map-description">{mapSection.description}</p>
                  )}

                  {mapEmbedUrl ? (
                    <div className="map-iframe-wrapper">
                      <iframe
                        key={`map-${mapEmbedUrl.substring(0, 50)}`}
                        src={mapEmbedUrl}
                        style={{
                          border: 0,
                          borderRadius: 'var(--radius-md)',
                          display: 'block',
                          background: '#f5f5f5',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          minHeight: '400px'
                        }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Store Location Map"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                        frameBorder="0"
                        scrolling="no"
                        allow="geolocation"
                        importance="high"
                      />
                    </div>
                  ) : (
                    <div className="map-placeholder">
                      <FiMapPin size={48} />
                      <p>Map location will be displayed here</p>
                      <small>
                        {mapSection?.embedUrl
                          ? `Invalid map URL detected. Please configure a valid Google Maps embed URL in Admin → Site Content → Store Location`
                          : 'Configure the map URL in Admin → Site Content → Store Location'
                        }
                      </small>
                    </div>
                  )}

                  {mapSection?.directionsUrl && (
                    <a
                      href={mapSection.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="directions-btn btn btn-primary"
                    >
                      <FiExternalLink />
                      {mapSection?.directionsButtonText || 'Get Directions'}
                    </a>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section with Parallax - Only show if content exists */}
      {hasFaqSection && (
        <section className="faq-parallax-section">
          <div className="faq-parallax-bg" style={{ backgroundImage: faqSection?.backgroundImage ? `url(${faqSection.backgroundImage})` : 'none' }} />
          <div className="faq-overlay" />
          <div className="container">
            {(faqSection?.title || faqSection?.subtitle) && (
              <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="section-label">Help Center</span>
                {faqSection?.title && <h2 className="section-title">{faqSection.title}</h2>}
                {faqSection?.subtitle && <p className="section-subtitle">{faqSection.subtitle}</p>}
              </motion.div>
            )}

            <div className="faq-accordion">
              {enabledFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  className={`faq-item-parallax ${expandedFaq === faq.id ? 'expanded' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    className="faq-question"
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  >
                    <span>{faq.question}</span>
                    <FiChevronRight className={`faq-icon ${expandedFaq === faq.id ? 'rotated' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === faq.id && (
                      <motion.div
                        className="faq-answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social Media Section */}
      {enabledSocials.length > 0 && (
        <section className="social-section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-label">Stay Connected</span>
              <h2 className="section-title">{socialLinks.title}</h2>
              <p className="section-subtitle">{socialLinks.subtitle}</p>
            </motion.div>

            <div className="social-icons-grid">
              {enabledSocials.map((social, index) => {
                const SocialIcon = socialIconMap[social.platform] || FaInstagram
                return (
                  <motion.a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`social-icon-card ${social.platform}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10, scale: 1.1 }}
                  >
                    <SocialIcon />
                    <span>{social.platform}</span>
                  </motion.a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Parallax - Only show if content exists */}
      {hasCta && (
        <section
          className="contact-cta-parallax"
          style={{ backgroundImage: cta?.backgroundImage ? `url(${cta.backgroundImage})` : 'none' }}
        >
          <div className="cta-overlay" />
          <div className="container">
            <motion.div
              className="cta-content-parallax"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {cta?.title && (
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  {cta.title}
                </motion.h2>
              )}
              {cta?.subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  {cta.subtitle}
                </motion.p>
              )}
              {(cta?.primaryButton || cta?.secondaryButton) && (
                <motion.div
                  className="cta-buttons"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  {cta?.primaryButton && (
                    <Link to={cta.primaryButton.link || '/service'} className="btn btn-primary btn-lg">
                      <FiSend />
                      {cta.primaryButton.text || 'Book Appointment'}
                    </Link>
                  )}
                  {cta?.secondaryButton && (
                    <Link to={cta.secondaryButton.link || '/women'} className="btn btn-outline-light btn-lg">
                      {cta.secondaryButton.text || 'View Collections'}
                    </Link>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}

export default Contact
