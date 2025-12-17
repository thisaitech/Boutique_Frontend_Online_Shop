import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiStar, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import { useGlobal } from '../context/GlobalContext'
import { fetchProductById, selectCurrentProduct } from '../store/slices/productSlice'
import { selectIsAuthenticated, selectUser as selectAuthUser } from '../store/slices/authSlice'
import { submitReview } from '../store/slices/reviewSlice'
import toast from 'react-hot-toast'
import './Review.css'

// Predefined review statements with their associated star ratings
const predefinedStatements = [
  { text: 'Excellent', rating: 5, emoji: '🌟' },
  { text: 'Very Good', rating: 4, emoji: '👍' },
  { text: 'Good', rating: 3, emoji: '😊' },
  { text: 'Not Bad', rating: 2, emoji: '😐' },
  { text: 'Poor', rating: 1, emoji: '👎' }
]

function Review() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  
  // Redux state
  const currentProductRedux = useSelector(selectCurrentProduct)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const authUser = useSelector(selectAuthUser)
  
  // Context fallback
  const { user: contextUser, inventory, addReview, orders, reviews } = useGlobal()
  
  const user = authUser || contextUser
  const productId = searchParams.get('productId')
  const orderId = searchParams.get('orderId')
  
  const [product, setProduct] = useState(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selectedStatement, setSelectedStatement] = useState(null)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Fetch product from backend
  useEffect(() => {
    if (productId) {
      console.log('Fetching product with ID:', productId)
      dispatch(fetchProductById(productId))
    }
  }, [productId, dispatch])

  // Set product when data is available
  useEffect(() => {
    if (productId) {
      // Try Redux first
      if (currentProductRedux && String(currentProductRedux._id || currentProductRedux.id) === String(productId)) {
        console.log('Product found in Redux:', currentProductRedux)
        setProduct(currentProductRedux)
      } else {
        // Fallback to context inventory
        const foundProduct = inventory.find(p => String(p._id || p.id) === String(productId))
        if (foundProduct) {
          console.log('Product found in context:', foundProduct)
          setProduct(foundProduct)
        } else {
          console.log('Product not found in context, waiting for Redux...')
        }
      }
    }
  }, [productId, currentProductRedux, inventory])

  // Check for existing review
  useEffect(() => {
    if (orderId && productId && user) {
      const existingReview = reviews.find(
        r => String(r.productId) === String(productId) && String(r.orderId) === String(orderId) && String(r.userId) === String(user.id || user._id)
      )
      if (existingReview) {
        toast.error('You have already reviewed this product')
        navigate('/orders')
      }
    }
  }, [orderId, productId, user, reviews, navigate])

  const handleStatementClick = (statement) => {
    setSelectedStatement(statement)
    setRating(statement.rating)
    setReviewText(prev => prev ? prev : `${statement.text}! `)
  }

  const handleStarClick = (starRating) => {
    setRating(starRating)
    // Auto-select statement based on rating
    const matchingStatement = predefinedStatements.find(s => s.rating === starRating)
    if (matchingStatement) {
      setSelectedStatement(matchingStatement)
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    if (!reviewText.trim()) {
      toast.error('Please write a review')
      return
    }

    if (!user) {
      toast.error('Please login to submit a review')
      navigate('/login')
      return
    }

    setIsSubmitting(true)
    try {
      const reviewData = {
        productId: String(product._id || product.id),
        rating: Number(rating),
        comment: reviewText.trim(),
        title: selectedStatement?.text || '',
      }

      console.log('=== Submitting Review ===')
      console.log('Product ID:', reviewData.productId)
      console.log('User ID:', user._id || user.id)
      console.log('Order ID:', orderId)
      console.log('Rating:', reviewData.rating)
      console.log('Comment length:', reviewData.comment.length)
      console.log('Is Authenticated:', isAuthenticated)
      
      // Submit to backend API (requires admin approval)
      if (isAuthenticated) {
        console.log('Calling backend API...')
        const result = await dispatch(submitReview(reviewData)).unwrap()
        console.log('Backend response:', result)
        toast.success('Review submitted! It will appear after admin approval.', { duration: 4000 })
      } else {
        // Fallback to localStorage for non-authenticated users
        addReview({
          ...reviewData,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          review: reviewData.comment,
          productName: product.name,
          hidden: false,
          createdAt: new Date().toISOString()
        })
        toast.success('Review submitted successfully!')
      }
      
      setIsSubmitted(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/orders')
      }, 2000)
    } catch (error) {
      console.error('Error submitting review:', error)
      
      // Handle specific error cases with user-friendly messages
      const errorMessage = error?.message || 'Failed to submit review'
      
      if (errorMessage.includes('already reviewed')) {
        toast.error('You have already reviewed this product!', {
          duration: 4000,
          icon: '⚠️',
          position: 'top-center',
          style: {
            marginTop: '50vh',
            transform: 'translateY(-50%)'
          }
        })
      } else if (errorMessage.includes('not found')) {
        toast.error('Product not found. Please try again.', {
          position: 'top-center',
          style: {
            marginTop: '50vh',
            transform: 'translateY(-50%)'
          }
        })
      } else if (errorMessage.includes('10 characters')) {
        toast.error('Review must be at least 10 characters long.', {
          position: 'top-center',
          style: {
            marginTop: '50vh',
            transform: 'translateY(-50%)'
          }
        })
      } else {
        toast.error(errorMessage, {
          position: 'top-center',
          style: {
            marginTop: '50vh',
            transform: 'translateY(-50%)'
          }
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) {
    return (
      <div className="review-page">
        <div className="container">
          <div className="loading-state">Loading...</div>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="review-page">
        <div className="container">
          <motion.div
            className="success-message glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <FiCheckCircle className="success-icon" />
            <h2>Thank You!</h2>
            <p>Your review has been submitted successfully.</p>
            <p className="redirect-text">Redirecting to orders...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="review-page">
      <div className="container">
        {/* Header */}
        <div className="review-header">
          <button className="back-btn" onClick={() => navigate('/orders')}>
            <FiArrowLeft /> Back to Orders
          </button>
          <h1>Rate & Review</h1>
        </div>

        {/* Product Info */}
        <motion.div
          className="product-info-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="product-image-section">
            <img src={product.images?.[0] || product.image || '/images/placeholder.jpg'} alt={product.name} />
          </div>
          <div className="product-details-section">
            <h2>{product.name}</h2>
            <p className="product-category">{product.category}</p>
            {product.price && (
              <p className="product-price">₹{product.price.toLocaleString('en-IN')}</p>
            )}
          </div>
        </motion.div>

        {/* Rating Section */}
        <motion.div
          className="rating-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>Rate this Product</h3>
          <div className="star-rating-large">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn-large ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <FiStar />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="rating-label">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Not Bad'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </motion.div>

        {/* Predefined Statements */}
        <motion.div
          className="statements-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Quick Feedback</h3>
          <p className="section-subtitle">Tap to select and auto-fill rating</p>
          <div className="statements-grid">
            {predefinedStatements.map((statement, index) => (
              <motion.button
                key={index}
                className={`statement-btn ${selectedStatement?.text === statement.text ? 'selected' : ''}`}
                onClick={() => handleStatementClick(statement)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="statement-emoji">{statement.emoji}</span>
                <span className="statement-text">{statement.text}</span>
                <span className="statement-stars">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={i < statement.rating ? 'filled' : ''} />
                  ))}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Write Review Section */}
        <motion.div
          className="write-review-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Write Your Review</h3>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your detailed experience with this product..."
            rows="8"
            maxLength={1000}
            className="review-textarea"
          />
          <div className="char-count">
            <span>{reviewText.length}/1000</span>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          className="submit-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            className="btn btn-primary submit-review-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || !reviewText.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default Review

