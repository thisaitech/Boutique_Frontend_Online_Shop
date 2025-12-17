import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiShoppingBag, FiHeart, FiStar, FiExternalLink } from 'react-icons/fi'
import { useGlobal } from '../../context/GlobalContext'
import { getImageSrc } from '../../utils/imageUtils'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { addToWishlist as addToWishlistAPI, removeFromWishlist as removeFromWishlistAPI } from '../../store/slices/wishlistSlice'
import './ProductCard.css'

// Color name to hex mapping
const colorMap = {
  'Red': '#e74c3c',
  'Blue': '#3498db',
  'Green': '#27ae60',
  'Yellow': '#f1c40f',
  'Pink': '#e91e8c',
  'Purple': '#9b59b6',
  'Orange': '#e67e22',
  'Black': '#2c3e50',
  'White': '#ecf0f1',
  'Gold': '#d4af37',
  'Silver': '#bdc3c7',
  'Navy': '#2c3e50',
  'Maroon': '#800000',
  'Beige': '#f5f5dc',
  'Brown': '#8b4513',
  'Cream': '#fffdd0',
  'Teal': '#008080',
  'Coral': '#ff7f50',
  'Lavender': '#e6e6fa',
  'Mint': '#98ff98',
  'Peach': '#ffdab9',
  'Turquoise': '#40e0d0',
  'Burgundy': '#800020',
  'Olive': '#808000',
  'Rose': '#ff007f',
  'Sky Blue': '#87ceeb',
  'Magenta': '#ff00ff',
  'Cyan': '#00ffff',
  'Mustard': '#ffdb58'
}

function ProductCard({ product, onProductClick, highlight = false }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { addToCart, user, orders, reviews } = useGlobal()
  const [isHovered, setIsHovered] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedColorIndex, setSelectedColorIndex] = useState(null)

  // Calculate actual purchase count (customers who bought and paid for this product)
  const purchaseCount = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return 0
    const purchasedOrders = orders.filter(order => {
      const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'completed' || order.status === 'confirmed'
      const hasProduct = order.items && order.items.some(item => item.id === product.id)
      return isPaid && hasProduct
    })
    // Count unique customers who purchased
    const uniqueCustomers = new Set(purchasedOrders.map(order => order.customerId || order.customerName))
    return uniqueCustomers.size
  }, [orders, product.id])

  // Calculate actual average rating from reviews of customers who bought the product
  const actualRating = useMemo(() => {
    if (!reviews || !Array.isArray(reviews)) return product.rating || 0

    // Get reviews for this product from customers who actually bought it
    const productReviews = reviews.filter(review => {
      if (review.productId !== product.id) return false
      if (review.hidden) return false

      // Check if the reviewer actually bought the product
      const hasPurchase = orders.some(order => {
        const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'completed' || order.status === 'confirmed'
        const hasProduct = order.items && order.items.some(item => item.id === product.id)
        const isReviewer = order.customerId === review.userId || order.customerName === review.userName
        return isPaid && hasProduct && isReviewer
      })

      return hasPurchase
    })

    if (productReviews.length === 0) return product.rating || 0

    // Calculate average rating
    const totalRating = productReviews.reduce((sum, review) => sum + (review.rating || 0), 0)
    const averageRating = totalRating / productReviews.length
    return Math.round(averageRating * 10) / 10 // Round to 1 decimal place
  }, [reviews, orders, product.id, product.rating])

  // Get current display image based on selected color variant
  const currentImage = useMemo(() => {
    if (selectedColorIndex !== null && product.colorVariants?.[selectedColorIndex]?.images?.[0]) {
      const variantImage = product.colorVariants[selectedColorIndex].images[0]
      // Handle both string and object formats
      const imagePath = typeof variantImage === 'string' ? variantImage : (variantImage?.url || '')
      return getImageSrc(imagePath)
    }
    return getImageSrc(product.image)
  }, [selectedColorIndex, product.colorVariants, product.image])

  const handleAddToCart = (e) => {
    e?.stopPropagation()

    // Check stock status
    if (!product.inStock || (product.stockCount !== undefined && product.stockCount === 0)) {
      toast.error('This product is out of stock')
      return
    }

    // Check if user is logged in
    if (!user) {
      toast.error('Please login to add items to cart')
      navigate('/login')
      return
    }

    addToCart({ ...product, quantity: 1 })
    toast.success(`${product.name} added to cart!`)
  }

  const handleWishlist = async (e) => {
    e.stopPropagation()

    if (!user) {
      toast.error('Please login to add items to wishlist')
      navigate('/login')
      return
    }

    const newWishlistState = !isWishlisted
    setIsWishlisted(newWishlistState)

    try {
      if (newWishlistState) {
        // Add to wishlist - call backend API
        await dispatch(addToWishlistAPI(product.id)).unwrap()
        toast.success('Added to wishlist')
      } else {
        // Remove from wishlist - call backend API
        await dispatch(removeFromWishlistAPI(product.id)).unwrap()
        toast.success('Removed from wishlist')
      }
    } catch (error) {
      // Revert state on error
      setIsWishlisted(!newWishlistState)
      toast.error(error || 'Failed to update wishlist')
      console.error('Wishlist error:', error)
    }
  }

  // Check if product is in wishlist on mount
  useEffect(() => {
    if (user) {
      const wishlistKey = `thisai_wishlist_${user.id}`
      const storedWishlist = JSON.parse(localStorage.getItem(wishlistKey)) || []
      setIsWishlisted(storedWishlist.includes(product.id))
    } else {
      setIsWishlisted(false)
    }
  }, [user, product.id])

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick()
    } else {
      navigate(`/product/${product.id}`)
    }
  }

  const handleViewDetails = (e) => {
    e.stopPropagation()
    navigate(`/product/${product.id}`)
  }

  const formatPrice = (price) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
    
    // If formatted price is longer than 7 characters (e.g., ₹10,00,000), abbreviate it
    if (formatted.length > 7) {
      if (price >= 10000000) { // 1 crore or more
        return `₹${(price / 10000000).toFixed(1)}Cr`
      } else if (price >= 100000) { // 1 lakh or more
        return `₹${(price / 100000).toFixed(1)}L`
      }
    }
    
    return formatted
  }

  return (
    <motion.div
      className={`product-card ${highlight ? 'highlight' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Wishlist Button */}
      <button
        className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
        onClick={handleWishlist}
        aria-label="Add to wishlist"
      >
        <FiHeart />
      </button>

      {/* Product Image - Badges inside for proper clipping */}
      <div className="product-image">
        {/* Left badges - discount/offer */}
        <div className="product-badges">
          {/* New Offer Badge with Time Limit */}
          {product.offer && product.offer.active && new Date(product.offer.validUntil) > new Date() && (
            <span className="badge offer">-{product.offer.percentage}% OFF</span>
          )}
          {/* Discount Badge - calculated from original price (discount field) and selling price */}
          {!product.offer && product.discount > 0 && product.discount > product.price && (
            <span className="badge discount">-{Math.round(((product.discount - product.price) / product.discount) * 100)}%</span>
          )}
          {/* Featured badge - below discount */}
          {product.featured && (
            <span className="badge featured">Featured</span>
          )}
        </div>
        <img
          src={currentImage}
          alt={product.name}
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>

        {/* Rating with Color Swatches */}
        <div className="product-rating-wrapper">
          <div className="product-rating">
            {(product.reviews > 0 || product.rating > 0) ? (
              <>
                <FiStar className="star filled" />
                <span className="rating-value">{product.rating?.toFixed(1) || '0.0'}</span>
                <span className="rating-count">({product.reviews || 0} {product.reviews === 1 ? 'review' : 'reviews'})</span>
              </>
            ) : (
              <span className="rating-count" style={{color: '#999'}}>No reviews yet</span>
            )}
          </div>
          {/* Color Variants Swatches - Positioned to the right of rating */}
          {product.colorVariants && product.colorVariants.length > 0 && (
            <div className="product-color-swatches-container">
              <div className="product-color-swatches">
                {product.colorVariants.slice(0, 5).map((variant, index) => {
                  const bgColor = colorMap[variant.color] || variant.color
                  return (
                    <button
                      key={index}
                      className={`color-swatch ${selectedColorIndex === index ? 'active' : ''}`}
                      style={{
                        backgroundColor: bgColor,
                        background: bgColor,
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedColorIndex(selectedColorIndex === index ? null : index)
                      }}
                      title={variant.color}
                      aria-label={`Select ${variant.color} color`}
                    />
                  )
                })}
                {product.colorVariants.length > 5 && (
                  <span className="more-colors">+{product.colorVariants.length - 5}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="product-price">
          <span className="current-price">{formatPrice(product.price)}</span>
          {product.discount > 0 && product.discount > product.price && (
            <span className="original-price">{formatPrice(product.discount)}</span>
          )}
          {product.discount > 0 && product.discount > product.price && (
            <span className="mobile-discount-badge">-{Math.round(((product.discount - product.price) / product.discount) * 100)}%</span>
          )}
        </div>

        {/* Action Buttons - Below Product Info */}
        <div className="product-actions">
          <motion.button
            className="action-btn cart-btn"
            onClick={handleAddToCart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiShoppingBag />
            Add to Cart
          </motion.button>
          <motion.button
            className="action-btn details-btn"
            onClick={handleViewDetails}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiExternalLink />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductCard
