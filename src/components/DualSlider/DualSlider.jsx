import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './DualSlider.css'

const DualSlider = ({ products, onProductClick, autoPlay = true, autoPlaySpeed = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const autoPlayRef = useRef(null)

  // Pagination logic
  const paginate = (newDirection) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + newDirection
      if (nextIndex < 0) return products.length - 1
      if (nextIndex >= products.length) return 0
      return nextIndex
    })
  }

  // Auto-play
  useEffect(() => {
    if (!autoPlay || products.length === 0) return

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
      setDirection(1)
    }, autoPlaySpeed)

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [autoPlay, autoPlaySpeed, products.length])

  // Pause on hover
  const handleMouseEnter = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }
  }

  const handleMouseLeave = () => {
    if (!autoPlay || products.length === 0) return
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
      setDirection(1)
    }, autoPlaySpeed)
  }

  // Click thumbnail to navigate
  const handleThumbnailClick = (index) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  if (products.length === 0) {
    return (
      <div className="dual-slider-empty">
        <p>No products available</p>
      </div>
    )
  }

  const currentProduct = products[currentIndex]

  // Slide variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  }

  return (
    <section
      className="dual-slider"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Content Slider */}
      <div className="dual-slider-content-wrapper">
        <div className="dual-slider-content">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'tween', duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.3 }
              }}
              className="dual-slider-slide"
            >
              {/* Image Section */}
              <div className="dual-slider-slide-img">
                <img src={currentProduct.image} alt={currentProduct.name} />
              </div>

              {/* Text Section */}
              <div className="dual-slider-slide-txt">
                <span className="dual-slider-slide-category">{currentProduct.category}</span>
                <h2 className="dual-slider-slide-title">{currentProduct.name}</h2>
                <p className="dual-slider-slide-price">
                  Starting From <span className="price">{formatPrice(currentProduct.price)}</span>
                </p>
                <button
                  className="dual-slider-btn"
                  onClick={() => onProductClick(currentProduct.id)}
                >
                  VIEW DETAILS <FiChevronRight />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="dual-slider-nav-wrapper">
            <div className="dual-slider-nav">
              <button
                className="prev"
                onClick={() => paginate(-1)}
                aria-label="Previous slide"
              >
                <span className="icon"><FiChevronLeft /></span>
              </button>
              <button
                className="next"
                onClick={() => paginate(1)}
                aria-label="Next slide"
              >
                <span className="icon"><FiChevronRight /></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Slider */}
      <div className="dual-slider-img-slider-wrapper">
        <div className="dual-slider-img-slider">
          <div
            className="dual-slider-img-slider-track"
            style={{
              transform: `translateX(-${currentIndex * (300 + 15)}px)`,
              transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className={`dual-slider-thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(index)}
              >
                <img src={product.image} alt={product.name} />
                <div className="thumbnail-overlay">
                  <span>{product.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DualSlider
