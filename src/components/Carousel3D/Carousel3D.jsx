import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useWindowSize } from '../../hooks/useWindowSize'
import ProductCard from '../ProductCard/ProductCard'
import './Carousel3D.css'

const Carousel3D = ({ products, onProductClick, autoPlay = true, autoPlaySpeed = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const { width } = useWindowSize()
  const isMobile = width < 768

  // Pagination logic with infinite loop
  const paginate = useCallback((newDirection) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + newDirection
      // Wrap around using modulo for infinite loop
      if (nextIndex < 0) return products.length - 1
      if (nextIndex >= products.length) return 0
      return nextIndex
    })
  }, [products.length])

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || products.length === 0) return

    const interval = setInterval(() => {
      paginate(1)
    }, autoPlaySpeed)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlaySpeed, paginate, products.length])

  // Swipe detection
  const swipeConfidenceThreshold = 10000
  const swipePower = (offset, velocity) => Math.abs(offset) * velocity

  // Get visible cards with wrapping for infinite loop
  const getVisibleCards = () => {
    if (products.length === 0) return []

    const visibleCount = isMobile ? 3 : 5 // Show center + sides with peeks
    const cards = []

    for (let i = -Math.floor(visibleCount / 2); i <= Math.floor(visibleCount / 2); i++) {
      const index = (currentIndex + i + products.length) % products.length
      cards.push({ product: products[index], position: i, index })
    }

    return cards
  }

  // Helper function for card positioning with 3D transforms
  const getCardStyle = (position, isMobile) => {
    if (isMobile) {
      // Mobile: Center card at 85% width, sides barely visible (peek effect)
      if (position === 0) {
        return {
          zIndex: 10,
          scale: 1,
          opacity: 1,
          rotateY: 0,
          x: '0%',
          width: '85%'
        }
      } else if (Math.abs(position) === 1) {
        return {
          zIndex: 1,
          scale: 0.7,
          opacity: 0.3,
          rotateY: 0,
          x: position > 0 ? '95%' : '-95%', // Peek at edges
          width: '85%'
        }
      } else {
        return { opacity: 0, scale: 0, display: 'none' }
      }
    } else {
      // Desktop: 3 cards with coverflow effect
      if (position === 0) {
        // Center card - fully visible
        return {
          zIndex: 10,
          scale: 1,
          opacity: 1,
          rotateY: 0,
          x: '0%'
        }
      } else if (position === 1) {
        // Right card - scaled down, rotated, overlapping
        return {
          zIndex: 5,
          scale: 0.85,
          opacity: 0.6,
          rotateY: -15,
          x: '60%'
        }
      } else if (position === -1) {
        // Left card - scaled down, rotated, overlapping
        return {
          zIndex: 5,
          scale: 0.85,
          opacity: 0.6,
          rotateY: 15,
          x: '-60%'
        }
      } else if (Math.abs(position) === 2) {
        // Far cards - barely visible for peek effect
        return {
          zIndex: 1,
          scale: 0.7,
          opacity: 0.3,
          rotateY: position > 0 ? -20 : 20,
          x: position > 0 ? '120%' : '-120%'
        }
      } else {
        return { opacity: 0, scale: 0, display: 'none' }
      }
    }
  }

  if (products.length === 0) {
    return (
      <div className="carousel-3d-container empty">
        <p className="carousel-empty-message">No products available</p>
      </div>
    )
  }

  return (
    <div className="carousel-3d-container">
      <div className="carousel-3d-track">
        {getVisibleCards().map(({ product, position, index }) => (
          <motion.div
            key={`${product.id}-${position}`}
            className="carousel-3d-card"
            style={getCardStyle(position, isMobile)}
            animate={getCardStyle(position, isMobile)}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x)
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1)
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1)
              }
            }}
          >
            <ProductCard
              product={product}
              onProductClick={() => onProductClick(product.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Arrow buttons - Desktop only */}
      {!isMobile && (
        <>
          <motion.button
            className="carousel-arrow carousel-arrow-left"
            onClick={() => paginate(-1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Previous product"
          >
            <FiChevronLeft />
          </motion.button>
          <motion.button
            className="carousel-arrow carousel-arrow-right"
            onClick={() => paginate(1)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Next product"
          >
            <FiChevronRight />
          </motion.button>
        </>
      )}

      {/* Pagination dots */}
      <div className="carousel-pagination">
        {products.map((_, index) => (
          <button
            key={index}
            className={`pagination-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Carousel3D
