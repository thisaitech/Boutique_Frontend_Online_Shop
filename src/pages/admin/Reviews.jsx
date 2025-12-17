import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiStar, FiTrash2, FiSearch, FiFilter, FiPackage, FiUser, FiCalendar, FiEye, FiEyeOff } from 'react-icons/fi'
import {
  adminFetchReviews,
  adminApproveReview,
  adminRejectReview,
  adminDeleteReview,
  selectAdminReviews,
  selectAdminReviewsLoading
} from '../../store/slices/adminSlice'
import { fetchProducts, selectProducts } from '../../store/slices/productSlice'
import toast from 'react-hot-toast'
import './AdminPages.css'

function Reviews() {
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const reviews = useSelector(selectAdminReviews)
  const inventory = useSelector(selectProducts)
  const isLoading = useSelector(selectAdminReviewsLoading)

  console.log('Current reviews state:', reviews)
  console.log('Reviews count:', reviews?.length)
  console.log('Is loading:', isLoading)

  // Fetch data on mount
  useEffect(() => {
    console.log('Fetching admin reviews...')
    dispatch(adminFetchReviews())
      .then((result) => {
        console.log('Admin reviews fetch result:', result)
        if (result.payload) {
          console.log('Reviews payload:', result.payload)
          console.log('Reviews payload type:', typeof result.payload)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch reviews:', error)
      })
    dispatch(fetchProducts())
  }, [dispatch])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProduct, setFilterProduct] = useState('all')
  const [filterRating, setFilterRating] = useState('all')

  // Get unique products from reviews
  const products = useMemo(() => {
    const productIds = [...new Set(reviews.map(r => {
      const pid = r.productId
      if (!pid) return null
      return typeof pid === 'object' ? (pid._id || pid.id) : pid
    }).filter(Boolean))]
    return productIds.map(id => inventory.find(p => String(p._id || p.id) === String(id))).filter(Boolean)
  }, [reviews, inventory])

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      // Search filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase()
        const matchesProduct = review.productName?.toLowerCase().includes(query)
        const matchesUser = review.userName?.toLowerCase().includes(query)
        const matchesReview = review.review?.toLowerCase().includes(query)
        if (!matchesProduct && !matchesUser && !matchesReview) return false
      }

      // Product filter
      if (filterProduct !== 'all') {
        const reviewProdId = typeof review.productId === 'object' ? (review.productId._id || review.productId.id) : review.productId
        if (String(reviewProdId) !== String(filterProduct)) return false
      }

      // Rating filter
      if (filterRating !== 'all' && review.rating !== parseInt(filterRating)) return false

      return true
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [reviews, searchTerm, filterProduct, filterRating])

  // Calculate stats
  const stats = useMemo(() => {
    const total = reviews.length
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0'
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    }))
    return { total, avgRating, ratingDistribution }
  }, [reviews])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteReview = async (review) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      try {
        const reviewId = review._id || review.id
        await dispatch(adminDeleteReview(reviewId)).unwrap()
        toast.success('Review deleted successfully')
        // Refetch reviews after deletion
        dispatch(adminFetchReviews())
      } catch (error) {
        toast.error(error || 'Failed to delete review')
      }
    }
  }

  const handleToggleHide = async (review) => {
    try {
      const reviewId = review._id || review.id
      const isApproved = review.status === 'approved'
      if (isApproved) {
        // Hide/reject the review
        await dispatch(adminRejectReview({ reviewId, reason: 'Hidden by admin' })).unwrap()
        toast.success('Review hidden successfully')
      } else {
        // Approve the review
        await dispatch(adminApproveReview(reviewId)).unwrap()
        toast.success('Review approved and shown successfully')
      }
      // Refetch reviews and products after approval/rejection to show updated status and ratings
      dispatch(adminFetchReviews())
      dispatch(fetchProducts())
    } catch (error) {
      toast.error(error || 'Failed to update review')
    }
  }

  const getProductName = (productId) => {
    const pid = typeof productId === 'object' ? (productId._id || productId.id) : productId
    const product = inventory.find(p => String(p._id || p.id) === String(pid))
    return product?.name || 'Unknown Product'
  }

  return (
    <div className="admin-page reviews-admin-page">
      <div className="page-header">
        <div>
          <h1><FiStar /> Product Reviews</h1>
          <p>Manage customer reviews and ratings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <motion.div
          className="stat-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="stat-icon" style={{ background: 'rgba(77, 168, 218, 0.1)', color: 'var(--primary-blue)' }}>
            <FiStar />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
            <FiStar />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ gridColumn: '1 / -1' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60' }}>
            <FiPackage />
          </div>
          <div className="stat-content">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Products Reviewed</div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="filters-section glass-card">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search reviews by product, customer, or review text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <label><FiFilter /> Product</label>
            <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
              <option value="all">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label><FiStar /> Rating</label>
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list-admin">
        {isLoading ? (
          <div className="loading-state">Loading reviews...</div>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review, index) => {
            const isApproved = review.status === 'approved'
            const isPending = review.status === 'pending'
            const isRejected = review.status === 'rejected'
            return (
            <motion.div
              key={review._id || review.id}
              className="review-card-admin glass-card"
              data-status={review.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                opacity: isRejected ? 0.5 : isPending ? 0.8 : 1,
                border: isPending ? '2px solid #fbbf24' : isRejected ? '1px dashed var(--glass-border)' : undefined,
                background: isPending ? 'rgba(251, 191, 36, 0.05)' : undefined
              }}
            >
              <div className="review-header-admin">
                <div className="review-product-info">
                  <FiPackage />
                  <div>
                    <h4>{review.productName || getProductName(review.productId)}</h4>
                    <div className="review-meta">
                      <span><FiUser /> {review.authorName || review.userName || 'Anonymous'}</span>
                      <span><FiCalendar /> {formatDate(review.createdAt)}</span>
                      {review.orderId && <span>Order #{String(review.orderId).slice(-8)}</span>}
                      {isPending && <span style={{color: '#fbbf24', fontWeight: 'bold'}}>⏳ Pending Approval</span>}
                      {isRejected && <span style={{color: '#ef4444'}}>❌ Rejected</span>}
                      {isApproved && <span style={{color: '#10b981'}}>✓ Approved</span>}
                    </div>
                  </div>
                </div>
                <div className="review-rating-display">
                  <div className="stars-inline">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className={i < review.rating ? 'filled' : ''} />
                    ))}
                  </div>
                  <span className="rating-number">{review.rating}/5</span>
                </div>
              </div>

              <div className="review-content-admin">
                {review.title && <h5 style={{marginBottom: '8px', color: 'var(--text-primary)'}}>{review.title}</h5>}
                <p>{review.comment || review.review || 'No comment provided'}</p>
              </div>

              <div className="review-actions-admin">
                <button
                  className={`btn-toggle ${isApproved ? 'visible' : 'hidden'}`}
                  onClick={() => handleToggleHide(review)}
                  title={isApproved ? 'Hide Review' : 'Approve Review'}
                >
                  {isApproved ? <FiEyeOff /> : <FiEye />}
                  {isApproved ? 'Hide' : 'Approve'}
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteReview(review)}
                  title="Delete Review"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </motion.div>
          )})
        ) : (
          <div className="empty-state">
            <FiStar />
            <h3>No reviews found</h3>
            <p>No reviews match your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reviews

