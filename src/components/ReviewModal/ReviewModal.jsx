import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiStar, FiX } from 'react-icons/fi'
import './ReviewModal.css'

function ReviewModal({ isOpen, onClose, product, onSubmit, user }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating')
      return
    }
    if (!reviewText.trim()) {
      alert('Please write a review')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        productId: product.id,
        productName: product.name,
        userId: user?.id,
        userName: user?.name || 'Anonymous',
        userEmail: user?.email || '',
        rating,
        review: reviewText.trim(),
        orderId: null // Will be set by the caller if needed
      })
      // Reset form
      setRating(0)
      setReviewText('')
      onClose()
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="review-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="review-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="review-modal-header">
            <div>
              <h2>Rate & Review</h2>
              <p>{product.name}</p>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="review-modal-content">
            <div className="rating-section">
              <label>Your Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    <FiStar />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="rating-text">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div className="review-text-section">
              <label>Write Your Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this product..."
                rows="6"
                maxLength={500}
              />
              <div className="char-count">{reviewText.length}/500</div>
            </div>
          </div>

          <div className="review-modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || !reviewText.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ReviewModal

