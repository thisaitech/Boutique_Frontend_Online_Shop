import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useAnimation } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './FlatCarousel.css'

const FlatCarousel = ({ products, onProductClick, autoPlay = true, autoPlaySpeed = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const autoPlayRef = useRef(null)
  const x = useMotionValue(0)
  const controls = useAnimation()

  // Get visible items count based on screen size
  const [visibleCount, setVisibleCount] = useState(5)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setVisibleCount(1) // Mobile - focus one card for real carousel feel
      } else if (width < 1024) {
        setVisibleCount(3) // Tablet
      } else {
        setVisibleCount(5) // Desktop
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Pagination
  const paginate = (newDirection) => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + newDirection
      if (nextIndex < 0) return products.length - 1
      if (nextIndex >= products.length) return 0
      return nextIndex
    })
  }

  // Auto-play - pauses on hover or touch
  useEffect(() => {
    if (!autoPlay || products.length === 0 || isHovering || isDragging) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
      return
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
    }, autoPlaySpeed)

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [autoPlay, autoPlaySpeed, products.length, isHovering, isDragging])

  // Drag handling with inertia
  const handleDragEnd = (event, info) => {
    setIsDragging(false)

    const swipeThreshold = 50
    const swipeVelocityThreshold = 500

    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > swipeVelocityThreshold) {
      if (info.offset.x > 0) {
        paginate(-1)
      } else {
        paginate(1)
      }
    }
  }

  // Calculate card position and style
  const getCardStyle = (index) => {
    const totalItems = products.length
    let position = index - currentIndex

    // Handle wrapping for infinite loop
    if (position > totalItems / 2) {
      position -= totalItems
    } else if (position < -totalItems / 2) {
      position += totalItems
    }

    const isCentered = position === 0
    const absPosition = Math.abs(position)

    // Hide cards that are too far from center
    if (absPosition > Math.ceil(visibleCount / 2)) {
      return {
        position,
        scale: 0,
        opacity: 0,
        zIndex: 0,
        display: 'none'
      }
    }

    return {
      position,
      scale: isCentered ? 1.0 : 0.85,
      opacity: isCentered ? 1.0 : 0.6,
      zIndex: 10 - absPosition
    }
  }

  // Get visible cards for rendering
  const getVisibleCards = () => {
    const cards = []
    const halfVisible = Math.ceil(visibleCount / 2)

    for (let i = -halfVisible; i <= halfVisible; i++) {
      const index = (currentIndex + i + products.length) % products.length
      cards.push({ product: products[index], originalIndex: index, offset: i })
    }

    return cards
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  if (!products || products.length === 0) {
    return (
      <div className="flat-carousel flat-carousel-empty">
        <p>No products available</p>
      </div>
    )
  }

  return (
    <div
      className="flat-carousel"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={() => setIsHovering(true)}
      onTouchEnd={() => setIsHovering(false)}
    >
      <div className="flat-carousel-track-container">
        <motion.div
          className="flat-carousel-track"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{ x }}
        >
          {getVisibleCards().map(({ product, originalIndex, offset }) => {
            const style = getCardStyle(originalIndex)

            // Calculate pixel-based positioning with gap
            const cardWidth = visibleCount === 1 ? 260 : visibleCount === 2 ? 220 : visibleCount === 3 ? 300 : 280
            const gap = visibleCount === 1 ? 18 : visibleCount === 2 ? 15 : visibleCount === 3 ? 30 : 20
            const translateX = offset * (cardWidth + gap)

            if (style.display === 'none') return null

            return (
              <motion.div
                key={`${product.id}-${originalIndex}`}
                className={`flat-carousel-card ${style.position === 0 ? 'active' : ''}`}
                animate={{
                  scale: style.scale,
                  opacity: style.opacity,
                  x: translateX
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 35,
                  mass: 0.5
                }}
                style={{
                  zIndex: style.zIndex
                }}
                onClick={() => !isDragging && style.position === 0 && onProductClick(product.id)}
              >
                {/* Product Badges Container - Stacked vertically like ProductCard */}
                <div className="product-badge-container">
                  {/* Discount/Offer Badge - TOP position */}
                  {product.offer && product.offer.active && new Date(product.offer.validUntil) > new Date() ? (
                    <span className="offer-badge">
                      -{product.offer.percentage}%
                    </span>
                  ) : product.discount > 0 ? (
                    <span className="discount-badge">
                      -{product.discount}%
                    </span>
                  ) : null}

                  {/* Featured Badge - BOTTOM position (below discount) */}
                  {product.featured && (
                    <span className="featured-badge">
                      Featured
                    </span>
                  )}
                </div>

                {/* Product Image */}
                <div className="flat-carousel-card-image">
                  <img src={product.image} alt={product.name} />
                </div>

                {/* Product Info */}
                <div className="flat-carousel-card-info">
                  <span className="flat-carousel-card-category">{product.category}</span>
                  <h3 className="flat-carousel-card-title">{product.name}</h3>
                  <p className="flat-carousel-card-price">
                    {formatPrice(product.price)}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="flat-carousel-card-original-price">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Navigation Arrows - Desktop only */}
      {products.length > 1 && (
        <>
          <button
            className="flat-carousel-arrow flat-carousel-arrow-left"
            onClick={() => paginate(-1)}
            aria-label="Previous"
          >
            <FiChevronLeft />
          </button>
          <button
            className="flat-carousel-arrow flat-carousel-arrow-right"
            onClick={() => paginate(1)}
            aria-label="Next"
          >
            <FiChevronRight />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      <div className="flat-carousel-pagination">
        {products.map((_, index) => (
          <button
            key={index}
            className={`flat-carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default FlatCarousel
