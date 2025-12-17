import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import {
  fetchProducts,
  fetchFeaturedProducts,
  fetchTopSellingProducts,
  selectProducts,
  selectFeatured,
  selectTopSelling,
  selectProductsLoading
} from '../store/slices/productSlice'
import {
  fetchPublicConfig,
  selectSiteConfig,
  selectConfigLoading
} from '../store/slices/siteConfigSlice'
import ProductCard from '../components/ProductCard/ProductCard'
import './Home.css'

// Category types - fallback for when API doesn't provide them
const categoryTypes = {
  women: ['sarees', 'lehengas', 'kurtis', 'blouses'],
  kids: ['kids-frocks', 'kids-lehengas', 'kids-gowns', 'kids-ethnic', 'kids-party'],
  fashion: ['handbags', 'clutches', 'jewelry', 'ornaments', 'scarves', 'belts']
}

function Home() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Redux state
  const products = useSelector(selectProducts)
  const featuredFromApi = useSelector(selectFeatured)
  const topSellingFromApi = useSelector(selectTopSelling)
  const productsLoading = useSelector(selectProductsLoading)
  const siteConfigRedux = useSelector(selectSiteConfig)
  const configLoading = useSelector(selectConfigLoading)

  // Only use Redux data - no fallback to mock data
  const siteConfig = siteConfigRedux
  const inventory = products

  const visibleInventory = useMemo(
    () => inventory.filter(p => p.showInStore !== false),
    [inventory]
  )

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchFeaturedProducts())
    dispatch(fetchTopSellingProducts())
    dispatch(fetchPublicConfig())
  }, [dispatch])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const sliderRef = useRef(null)

  // Top Selling carousel state (for both mobile and desktop)
  const [topSellingIndex, setTopSellingIndex] = useState(0)
  const topSellingRef = useRef(null)

  // Featured carousel state
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const featuredRef = useRef(null)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const chunkIntoPairs = (arr) => {
    const chunks = []
    for (let i = 0; i < arr.length; i += 2) {
      chunks.push(arr.slice(i, i + 2))
    }
    return chunks
  }

  const formatLabel = (value = '') =>
    value
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase())

  const getProductImage = (product) =>
    product?.image || product?.images?.[0] || product?.coverImage || product?.mainImage

  // Normalize image path - remove absolute Windows paths
  const normalizeImagePath = (imagePath) => {
    if (!imagePath) return imagePath
    // Remove absolute Windows path prefix (e.g., "C:/Project/boutique/public" or "C:\Project\boutique\public")
    const normalized = imagePath
      .replace(/^[A-Za-z]:[/\\].*?[/\\]public[/\\]/i, '/')
      .replace(/^[A-Za-z]:[/\\].*?[/\\]public\//i, '/')
      .replace(/\\/g, '/') // Convert backslashes to forward slashes
    return normalized
  }

  // Build a panel from product categories (max 3 cards)
  const buildPanelFromInventory = (
    id,
    name,
    color,
    categoryIds = [],
    usedIds = new Set(),
    maxCards = 3,
    priority = []
  ) => {
    const orderedCats = [
      ...priority.filter(Boolean),
      ...categoryIds.filter(cat => !priority.includes(cat))
    ]
    const cards = []
    for (const catId of orderedCats) {
      if (usedIds.has(catId)) continue
      const product = visibleInventory.find(p => p.category === catId && getProductImage(p))
      if (!product) continue
      usedIds.add(catId)
      cards.push({
        id: catId,
        label: formatLabel(catId),
        image: getProductImage(product),
        link: `/${id}?category=${catId}`
      })
      if (cards.length >= maxCards) break
    }
    if (!cards.length) return null
    return {
      id,
      name,
      subtitle: 'Curated picks',
      color,
      cards
    }
  }

  // Category hero panels (admin-controlled with inventory fallback)
  const heroPanels = useMemo(() => {
    // First try admin panels
    const adminPanels = (siteConfig?.heroCategoryPanels || [])
      .map(panel => {
        const cards = (panel.cards || [])
          .filter(card => card.enabled !== false && card.image)
          .map(card => ({
            ...card,
            image: normalizeImagePath(card.image) // Normalize image paths
          }))
        return { ...panel, cards }
      })
      .filter(panel => panel.enabled !== false && (panel.cards || []).length > 0)

    if (adminPanels.length > 0) {
      return adminPanels.slice(0, 4)
    }

    // Fallback to building from inventory
    const used = new Set()
    const panels = [
      buildPanelFromInventory(
        'women',
        'Women Collection',
        '#e91e8c',
        categoryTypes.women || [],
        used,
        3,
        ['lehengas', 'kurtis', 'sarees']
      ),
      buildPanelFromInventory(
        'kids',
        'Kids Collection',
        '#ff6b6b',
        categoryTypes.kids || [],
        used,
        3,
        ['kids-frocks', 'kids-lehengas']
      ),
      buildPanelFromInventory(
        'fashion',
        'Fashion Accessories',
        '#9c27b0',
        categoryTypes.fashion || [],
        used,
        3,
        ['handbags', 'ornaments']
      )
    ].filter(Boolean)

    return panels.slice(0, 4)
  }, [visibleInventory, siteConfig?.heroCategoryPanels, categoryTypes])

  // Get top selling products - use API data if available, otherwise filter from inventory
  // MEMOIZED to prevent timer reset on every render
  const topSellingProducts = useMemo(() => {
    // Use API top selling products if available
    if (topSellingFromApi && topSellingFromApi.length > 0) {
      return topSellingFromApi.slice(0, 8)
    }

    // Fallback to filtering from inventory
    const allTopSelling = visibleInventory.filter(p => p.topSelling)
    // Group by category type
    const categorized = {
      women: allTopSelling.filter(p => categoryTypes.women.includes(p.category)),
      kids: allTopSelling.filter(p => categoryTypes.kids.includes(p.category)),
      fashion: allTopSelling.filter(p => categoryTypes.fashion.includes(p.category))
    }
    // Pick from each category for variety (round-robin)
    const mixed = []
    const categories = Object.values(categorized).filter(arr => arr.length > 0)
    let index = 0
    while (mixed.length < 8 && categories.some(cat => cat[index])) {
      for (const cat of categories) {
        if (cat[index] && mixed.length < 8) {
          mixed.push(cat[index])
        }
      }
      index++
    }
    return mixed.length > 0 ? mixed : allTopSelling.slice(0, 8)
  }, [topSellingFromApi, visibleInventory, categoryTypes])

  // Get featured products - use API data if available, otherwise filter from inventory
  // MEMOIZED to prevent timer reset on every render
  const fallbackFeatured = useMemo(() => [
    { id: 'feat-fallback-1', name: 'Silk Saree', category: 'sarees', price: 12999, originalPrice: 18999, image: '/images/sarees/1.jpeg', rating: 4.9, reviews: 0, featured: true, discount: 32, showInStore: true },
    { id: 'feat-fallback-2', name: 'Designer Lehenga', category: 'lehengas', price: 7499, originalPrice: 9999, image: '/images/lehengas/1.jpeg', rating: 4.8, reviews: 0, featured: true, discount: 25, showInStore: true },
    { id: 'feat-fallback-3', name: 'Velvet Blouse', category: 'blouses', price: 2999, originalPrice: 4299, image: '/images/blouses/5.png', rating: 4.7, reviews: 0, featured: true, discount: 30, showInStore: true },
    { id: 'feat-fallback-4', name: 'Gold Plated Necklace', category: 'ornaments', price: 1999, originalPrice: 2899, image: '/images/ornaments/1.jpeg', rating: 4.7, reviews: 0, featured: true, discount: 31, showInStore: true },
  ], [])

  const featuredProducts = useMemo(() => {
    // Use API featured products if available
    if (featuredFromApi && featuredFromApi.length > 0) {
      return featuredFromApi.slice(0, 10)
    }

    // Fallback to filtering from inventory
    const allFeatured = visibleInventory.filter(p => p.featured)
    if (allFeatured.length === 0) {
      return fallbackFeatured
    }
    
    // Group by category type
    const categorized = {
      women: allFeatured.filter(p => categoryTypes.women.includes(p.category)),
      kids: allFeatured.filter(p => categoryTypes.kids.includes(p.category)),
      fashion: allFeatured.filter(p => categoryTypes.fashion.includes(p.category))
    }
    // Pick from each category for variety (round-robin)
    const mixed = []
    const categories = Object.values(categorized).filter(arr => arr.length > 0)
    let index = 0
    const maxFeatured = 10
    while (mixed.length < maxFeatured && categories.some(cat => cat[index])) {
      for (const cat of categories) {
        if (cat[index] && mixed.length < maxFeatured) {
          mixed.push(cat[index])
        }
      }
      index++
    }
    return mixed.length > 0 ? mixed : allFeatured.slice(0, maxFeatured)
  }, [featuredFromApi, visibleInventory, categoryTypes, fallbackFeatured])

  // Use bannerImages directly from siteConfig (matching backend frontend implementation)
  const totalSlides = siteConfig?.bannerImages?.length || 0
  const hasBanners = totalSlides > 0

  // Navigate to next slide
  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentSlide((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1))
  }, [totalSlides])

  // Navigate to previous slide
  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1))
  }, [totalSlides])

  // Go to specific slide
  const goToSlide = (index) => {
    setDirection(index > currentSlide ? 1 : -1)
    setCurrentSlide(index)
  }

  // Get carousel settings from siteConfig with defaults - FORCE auto-play enabled
  const carouselSettings = siteConfig?.carouselSettings || {}
  const heroBannerAutoPlay = carouselSettings.heroBannerAutoPlay !== false // default true
  const heroBannerSpeed = carouselSettings.heroBannerSpeed || 5000
  const topSellingAutoPlay = true // Always auto-play
  const topSellingSpeed = carouselSettings.topSellingSpeed || 3000
  const featuredAutoPlay = true // Always auto-play
  const featuredSpeed = carouselSettings.featuredSpeed || 3500

  // Auto-slide hero banner - using settings from admin
  useEffect(() => {
    if (!isAutoPlaying || !heroBannerAutoPlay || totalSlides <= 1) return

    const autoSlide = () => {
      setDirection(1)
      setCurrentSlide((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1))
    }

    const timer = setInterval(autoSlide, heroBannerSpeed)
    return () => clearInterval(timer)
  }, [isAutoPlaying, heroBannerAutoPlay, heroBannerSpeed, totalSlides])

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(true)

  // Ensure video plays when slide changes
  useEffect(() => {
    const videoElement = document.querySelector(`.banner-video[data-slide="${currentSlide}"]`)
    if (videoElement) {
      videoElement.load()
      const playPromise = videoElement.play()
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log('Video autoplay prevented:', err)
        })
      }
    }
  }, [currentSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide()
      if (e.key === 'ArrowRight') nextSlide()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide])

  // Auto-rotate Top Selling carousel - ALWAYS runs (even with 0 or 1 product)
  useEffect(() => {
    const len = topSellingProducts.length || 1

    const timer = setInterval(() => {
      const isMobileView = window.innerWidth <= 768
      const step = isMobileView ? 2 : 1
      setTopSellingIndex((prev) => (prev + step) % len)
    }, topSellingSpeed)

    return () => clearInterval(timer)
  }, [topSellingProducts.length, topSellingSpeed])

  // Auto-rotate Featured carousel - ALWAYS runs (even with 0 or 1 product)
  useEffect(() => {
    const len = featuredProducts.length || 1

    const timer = setInterval(() => {
      const isMobileView = window.innerWidth <= 768
      const step = isMobileView ? 2 : 1
      setFeaturedIndex((prev) => (prev + step) % len)
    }, featuredSpeed)

    return () => clearInterval(timer)
  }, [featuredProducts.length, featuredSpeed])


  // Video slide animation variants - smooth fade transition
  const slideVariants = {
    enter: {
      opacity: 0,
      zIndex: 1
    },
    center: {
      opacity: 1,
      zIndex: 2,
      transition: {
        opacity: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }
      }
    },
    exit: {
      opacity: 0,
      zIndex: 0,
      transition: {
        opacity: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }
      }
    }
  }

  // Content stagger animation
  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  }


  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`)
  }

  // Swipe/drag gesture state for Top Selling carousel
  const [topSellingDragStart, setTopSellingDragStart] = useState(null)
  const [topSellingIsDragging, setTopSellingIsDragging] = useState(false)

  // Swipe/drag gesture state for Featured carousel
  const [featuredDragStart, setFeaturedDragStart] = useState(null)
  const [featuredIsDragging, setFeaturedIsDragging] = useState(false)

  // Top Selling carousel drag handlers
  const handleTopSellingDragStart = (e) => {
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
    setTopSellingDragStart(clientX)
    setTopSellingIsDragging(true)
  }

  const handleTopSellingDragMove = (e) => {
    if (!topSellingIsDragging || topSellingDragStart === null) return
    e.preventDefault()
  }

  const handleTopSellingDragEnd = (e) => {
    if (!topSellingIsDragging || topSellingDragStart === null) return

    const clientX = e.type === 'touchend'
      ? e.changedTouches[0].clientX
      : e.clientX
    const diff = topSellingDragStart - clientX
    const threshold = 50 // minimum distance for swipe

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left - go to next
        setTopSellingIndex((prev) => (prev + 1) % topSellingProducts.length)
      } else {
        // Swiped right - go to previous
        setTopSellingIndex((prev) => (prev - 1 + topSellingProducts.length) % topSellingProducts.length)
      }
    }

    setTopSellingDragStart(null)
    setTopSellingIsDragging(false)
  }

  // Featured carousel drag handlers
  const handleFeaturedDragStart = (e) => {
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
    setFeaturedDragStart(clientX)
    setFeaturedIsDragging(true)
  }

  const handleFeaturedDragMove = (e) => {
    if (!featuredIsDragging || featuredDragStart === null) return
    e.preventDefault()
  }

  const handleFeaturedDragEnd = (e) => {
    if (!featuredIsDragging || featuredDragStart === null) return

    const clientX = e.type === 'touchend'
      ? e.changedTouches[0].clientX
      : e.clientX
    const diff = featuredDragStart - clientX
    const threshold = 50 // minimum distance for swipe

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left - go to next
        setFeaturedIndex((prev) => (prev + 1) % featuredProducts.length)
      } else {
        // Swiped right - go to previous
        setFeaturedIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length)
      }
    }

    setFeaturedDragStart(null)
    setFeaturedIsDragging(false)
  }

  return (
    <div className="home-page">
      {/* Hero Banner Videos - Only show if banners exist in DB */}
      {hasBanners && (
        <section
          className="hero-section"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="banner-slider" ref={sliderRef}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentSlide}
                className="banner-slide active"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {siteConfig?.bannerImages?.[currentSlide]?.video ? (
                  <video
                    className="banner-video"
                    data-slide={currentSlide}
                    autoPlay
                    loop
                    muted
                    playsInline
                    key={`video-${currentSlide}-${siteConfig?.bannerImages?.[currentSlide]?.video}`}
                    onError={(e) => {
                      console.error('Video failed to load:', siteConfig?.bannerImages?.[currentSlide]?.video)
                      console.error('Error details:', e.target.error)
                      e.target.style.display = 'none'
                    }}
                    onLoadedData={(e) => {
                      console.log('Video loaded successfully:', siteConfig?.bannerImages?.[currentSlide]?.video)
                      e.target.play().catch(err => console.log('Play error:', err))
                    }}
                  >
                    <source src={siteConfig?.bannerImages?.[currentSlide]?.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="banner-bg" style={{ 
                    backgroundImage: `url(${siteConfig?.bannerImages?.[currentSlide]?.image || '/images/banner-slide-1.png'})` 
                  }} />
                )}
                <div className="banner-overlay" />
                <motion.div
                  className="banner-content"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.span className="banner-label" variants={itemVariants}>
                    {siteConfig?.bannerImages?.[currentSlide]?.label || 'New Collection'}
                  </motion.span>
                  <motion.h1 variants={itemVariants}>
                    {siteConfig?.bannerImages?.[currentSlide]?.title}
                  </motion.h1>
                  <motion.p variants={itemVariants}>
                    {siteConfig?.bannerImages?.[currentSlide]?.subtitle}
                  </motion.p>
                  <motion.div variants={itemVariants}>
                    <Link to={siteConfig?.bannerImages?.[currentSlide]?.link || '/shop'} className="btn btn-primary">
                      {siteConfig?.bannerImages?.[currentSlide]?.buttonText || 'Shop Now'}
                      <FiArrowRight />
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Quick Category Shortcuts */}
      <section className="quick-category-nav">
        <div className="container">
          <div className="quick-category-buttons">
            <Link to="/women" className="btn btn-outline">
              Women
            </Link>
            <Link to="/kids" className="btn btn-outline">
              Kids
            </Link>
            <Link to="/fashion" className="btn btn-outline">
              Fashion
            </Link>
          </div>
        </div>
      </section>

      {/* Category Panels - 3D Parallax Cards */}
      {heroPanels.length > 0 && (
        <section className="category-panels">
          <div className="category-panels-inner">
            {heroPanels.map((panel, panelIndex) => (
              <motion.div
                key={panel.id || panelIndex}
                className="category-panel"
                style={{ '--accent-color': panel.color || '#e91e8c' }}
                initial={{ opacity: 0, x: panelIndex % 2 === 0 ? -60 : 60, y: 30 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: panelIndex * 0.05 }}
              >
                <div className="category-panel-header">
                  <span className="panel-tag">{panel.subtitle || 'Featured'}</span>
                  <h2>{panel.name || formatLabel(panel.id)}</h2>
                  {panel.description && <p>{panel.description}</p>}
                </div>
                <div className="category-panel-cards">
                  {panel.cards && panel.cards.length > 0 ? panel.cards.slice(0, 3).map((card, idx) => (
                    <motion.div
                      key={card.id || idx}
                      whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                      initial={{ opacity: 0, y: 24, rotateY: idx % 2 === 0 ? -5 : 5 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 * idx }}
                      viewport={{ once: true }}
                    >
                      <Link
                        to={card.link || `/${panel.id}?category=${card.id}`}
                        className="category-panel-card"
                      >
                        <div
                          className="card-image"
                          style={{ backgroundImage: `url(${card.image})` }}
                        />
                        <div className="card-label">
                          <span>{card.label || formatLabel(card.id)}</span>
                          <FiArrowRight />
                        </div>
                      </Link>
                    </motion.div>
                  )) : (
                    <div className="no-cards-message">No categories available</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Top Selling Section - Only show if products exist */}
      {topSellingProducts.length > 0 && (
        <section className="top-selling-section section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-title">{siteConfig?.sectionTitles?.topSelling?.title || 'Top Selling'}</h2>
              {siteConfig?.sectionTitles?.topSelling?.subtitle && (
                <p className="section-subtitle">{siteConfig.sectionTitles.topSelling.subtitle}</p>
              )}
            </motion.div>

          {/* Horizontal Carousel with Center Focus */}
          <div className="top-selling-carousel">
            {isMobile ? (
              <div className="mobile-duo-slider">
                {chunkIntoPairs(topSellingProducts).map((pair, idx) => (
                  <div
                    key={idx}
                    className={`duo-slide ${idx === Math.floor(topSellingIndex / 2) ? 'active' : ''}`}
                    style={{ transform: `translateX(-${Math.floor(topSellingIndex / 2) * 100}%)` }}
                  >
                    {pair.map((product) => (
                      <div className="duo-card" key={product.id}>
                        <ProductCard product={product} onProductClick={() => handleProductClick(product.id)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div
                  className="carousel-track"
                  ref={topSellingRef}
                  onMouseDown={handleTopSellingDragStart}
                  onMouseMove={handleTopSellingDragMove}
                  onMouseUp={handleTopSellingDragEnd}
                  onMouseLeave={handleTopSellingDragEnd}
                  onTouchStart={handleTopSellingDragStart}
                  onTouchMove={handleTopSellingDragMove}
                  onTouchEnd={handleTopSellingDragEnd}
                  style={{ cursor: topSellingIsDragging ? 'grabbing' : 'grab' }}
                >
                  {topSellingProducts.map((product, index) => {
                    const totalItems = topSellingProducts.length
                    let relativePos = index - topSellingIndex
                    if (relativePos > Math.floor(totalItems / 2)) {
                      relativePos = relativePos - totalItems
                    } else if (relativePos < -Math.floor(totalItems / 2)) {
                      relativePos = relativePos + totalItems
                    }
                    let positionClass = ''
                    if (relativePos === 0) positionClass = 'pos-center'
                    else if (relativePos === -1) positionClass = 'pos-left-1'
                    else if (relativePos === 1) positionClass = 'pos-right-1'
                    else if (relativePos === -2) positionClass = 'pos-left-2'
                    else if (relativePos === 2) positionClass = 'pos-right-2'
                    else positionClass = 'pos-hidden'
                    return (
                      <div key={product.id} className={`carousel-item ${positionClass}`}>
                        <ProductCard product={product} onProductClick={() => handleProductClick(product.id)} />
                      </div>
                    )
                  })}
                </div>
                <div className="carousel-nav-arrows">
                  <button
                    className="carousel-nav-btn"
                    onClick={() => setTopSellingIndex((prev) => (prev - 1 + topSellingProducts.length) % topSellingProducts.length)}
                    aria-label="Previous product"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    className="carousel-nav-btn"
                    onClick={() => setTopSellingIndex((prev) => (prev + 1) % topSellingProducts.length)}
                    aria-label="Next product"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="view-all-wrapper">
            <Link to="/shop" className="btn btn-secondary">
              View All Products
              <FiArrowRight />
            </Link>
          </div>
          </div>
        </section>
      )}

      {/* Advertisement Banner - Always visible with fallback content */}
      <section className="ad-banner-section">
        <div
          className="ad-banner-bg"
          style={{ backgroundImage: `url(${siteConfig?.limitedTimeOffer?.image || '/images/ad-banner-bg.jpg'})` }}
        />
        <div className="ad-banner-overlay" />
        <div className="ad-banner-content">
          <motion.span
            className="ad-label"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {siteConfig?.limitedTimeOffer?.title || 'Limited Time Offer'}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {siteConfig?.limitedTimeOffer?.subtitle || 'Exclusive Designer Collection'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {siteConfig?.limitedTimeOffer?.description || 'Get flat 30% off on our premium designer lehengas. Limited stock available!'}
          </motion.p>
          {siteConfig?.limitedTimeOffer?.offerText && (
            <motion.p
              className="ad-offer-text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
            >
              {siteConfig.limitedTimeOffer.offerText}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link to={siteConfig?.limitedTimeOffer?.link || '/shop?category=lehengas'} className="btn btn-gold">
              Shop Now
              <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-title">{siteConfig?.sectionTitles?.featured?.title || 'Featured Collection'}</h2>
              {siteConfig?.sectionTitles?.featured?.subtitle && (
                <p className="section-subtitle">{siteConfig.sectionTitles.featured.subtitle}</p>
              )}
            </motion.div>

          {/* Horizontal Carousel with Center Focus */}
          <div className="featured-carousel">
            {isMobile ? (
              <div className="mobile-duo-slider">
                {chunkIntoPairs(featuredProducts).map((pair, idx) => (
                  <div
                    key={idx}
                    className={`duo-slide ${idx === Math.floor(featuredIndex / 2) ? 'active' : ''}`}
                    style={{ transform: `translateX(-${Math.floor(featuredIndex / 2) * 100}%)` }}
                  >
                    {pair.map((product) => (
                      <div className="duo-card" key={product.id}>
                        <ProductCard product={product} onProductClick={() => handleProductClick(product.id)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div
                  className="carousel-track"
                  ref={featuredRef}
                  onMouseDown={handleFeaturedDragStart}
                  onMouseMove={handleFeaturedDragMove}
                  onMouseUp={handleFeaturedDragEnd}
                  onMouseLeave={handleFeaturedDragEnd}
                  onTouchStart={handleFeaturedDragStart}
                  onTouchMove={handleFeaturedDragMove}
                  onTouchEnd={handleFeaturedDragEnd}
                  style={{ cursor: featuredIsDragging ? 'grabbing' : 'grab' }}
                >
                  {featuredProducts.map((product, index) => {
                    const totalItems = featuredProducts.length
                    let relativePos = index - featuredIndex
                    if (relativePos > Math.floor(totalItems / 2)) {
                      relativePos = relativePos - totalItems
                    } else if (relativePos < -Math.floor(totalItems / 2)) {
                      relativePos = relativePos + totalItems
                    }
                    let positionClass = ''
                    if (relativePos === 0) positionClass = 'pos-center'
                    else if (relativePos === -1) positionClass = 'pos-left-1'
                    else if (relativePos === 1) positionClass = 'pos-right-1'
                    else if (relativePos === -2) positionClass = 'pos-left-2'
                    else if (relativePos === 2) positionClass = 'pos-right-2'
                    else positionClass = 'pos-hidden'
                    return (
                      <div key={product.id} className={`carousel-item ${positionClass}`}>
                        <ProductCard product={product} onProductClick={() => handleProductClick(product.id)} />
                      </div>
                    )
                  })}
                </div>
                <div className="carousel-nav-arrows">
                  <button
                    className="carousel-nav-btn"
                    onClick={() => setFeaturedIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length)}
                    aria-label="Previous featured product"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    className="carousel-nav-btn"
                    onClick={() => setFeaturedIndex((prev) => (prev + 1) % featuredProducts.length)}
                    aria-label="Next featured product"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </section>
   
      {/* Why Choose Us */}
      <section className="features-section section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">{siteConfig?.sectionTitles?.whyChooseUs?.title || 'Why Choose Us'}</h2>
            {siteConfig?.sectionTitles?.whyChooseUs?.subtitle && (
              <p className="section-subtitle">{siteConfig.sectionTitles.whyChooseUs.subtitle}</p>
            )}
          </motion.div>

          <div className="features-grid">
            {(siteConfig?.trustBadges?.filter(b => b.enabled !== false)?.length
              ? siteConfig?.trustBadges?.filter(b => b.enabled !== false)
              : [
                  { id: 'badge-1', icon: '🚚', title: 'Free Shipping', description: 'On orders above ₹2999' },
                  { id: 'badge-2', icon: '↩️', title: 'Easy Returns', description: '7-day return policy' },
                  { id: 'badge-3', icon: '🔒', title: 'Secure Payment', description: '100% secure checkout' },
                  { id: 'badge-4', icon: '💎', title: 'Premium Quality', description: 'Handpicked fabrics' },
                ]).map((feature, index) => (
              <motion.div
                key={feature.id || index}
                className="feature-card glass-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="feature-icon">{feature.icon}</span>
                <h4>{feature.title}</h4>
                <p>{feature.description || feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home
