import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiUpload, FiEdit2, FiImage, FiCheck, FiX, FiStar,
  FiZap, FiLayers, FiEye, FiSave, FiTrash2, FiLink,
  FiType, FiTag, FiShoppingBag, FiPlay, FiPause, FiLoader
} from 'react-icons/fi'
import {
  adminUpdatePromoCards,
  selectAdminSiteConfig
} from '../../store/slices/adminSlice'
import { fetchPublicConfig, selectSiteConfig } from '../../store/slices/siteConfigSlice'
import { uploadImageToS3, deleteImageFromS3 } from '../../utils/imageUtils'
import toast from 'react-hot-toast'
import './Advertisements.css'

const categoryOptions = [
  { value: 'women', label: "Women's Section", icon: '👗', color: '#e91e8c', gradient: 'linear-gradient(135deg, #e91e8c 0%, #c2185b 100%)' },
  { value: 'kids', label: "Kids' Section", icon: '👶', color: '#ff6b6b', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' },
  { value: 'fashion', label: 'Fashion Accessories', icon: '💎', color: '#ff8c42', gradient: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)' }
]

const animationOptions = [
  { value: 'sparkle', label: 'Sparkle', icon: <FiStar />, description: 'Elegant sparkle effect' },
  { value: 'confetti', label: 'Confetti', icon: <FiZap />, description: 'Celebratory confetti' },
  { value: 'wave', label: 'Wave', icon: <FiLayers />, description: 'Smooth wave animation' }
]

// Empty default - no hardcoded mock data
const emptyCard = {
  id: null,
  title: '',
  subtitle: '',
  offer: '',
  badge: '',
  image: '',
  animation: 'sparkle',
  buttonText: 'Shop Now',
  link: '',
  active: false,
  featured: false,
  position: 1
}

function Advertisements() {
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const siteConfig = useSelector(selectSiteConfig)

  // Fetch config on mount
  useEffect(() => {
    dispatch(fetchPublicConfig())
  }, [dispatch])

  const normalizeCards = () => {
    const source = siteConfig?.promoCards || {}
    const normalized = {}
    categoryOptions.forEach((cat) => {
      const entry = source[cat.value]
      if (Array.isArray(entry)) {
        const active = entry.filter((c) => c?.active === true)
        normalized[cat.value] = active[0] || entry[0] || { ...emptyCard, category: cat.value }
      } else if (entry) {
        normalized[cat.value] = entry
      } else {
        // No data from database - use empty card, not default mock data
        normalized[cat.value] = { ...emptyCard, category: cat.value }
      }
    })
    return normalized
  }

  const [promoCards, setPromoCards] = useState(normalizeCards())
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState(null)
  const [previewMode, setPreviewMode] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Sync promoCards when siteConfig changes (from other sources)
  useEffect(() => {
    const normalized = normalizeCards()
    setPromoCards(normalized)
  }, [siteConfig?.promoCards])

  const openEditor = (category) => {
    const current = promoCards[category] || { ...emptyCard, category }
    setEditingCategory(category)
    setFormData({ ...current, category })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image should be under 5MB')
      return
    }

    setIsUploading(true)
    try {
      // Upload to S3
      const { url } = await uploadImageToS3(file, 'promo-panels')
      setFormData((prev) => ({ ...prev, image: url }))
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const saveCard = async () => {
    if (!formData?.title || !formData?.offer) {
      toast.error('Title and offer are required')
      return
    }
    if (!formData?.image) {
      toast.error('Please upload an image first')
      return
    }
    // Ensure image is an S3 URL (not base64)
    if (formData.image.startsWith('data:')) {
      toast.error('Image upload failed. Please try uploading again.')
      return
    }
    // Delete previous image from S3 if a new image is uploaded and old image exists
    const prevImage = promoCards[editingCategory]?.image
    if (prevImage && prevImage !== formData.image) {
      try {
        await deleteImageFromS3(prevImage)
        console.log('Previous S3 image deleted:', prevImage)
      } catch (err) {
        console.warn('Failed to delete previous S3 image:', err)
      }
    }
    const updated = {
      ...promoCards,
      [editingCategory]: {
        ...formData,
        id: promoCards[editingCategory]?.id || Date.now(),
        active: formData.active ?? true
      }
    }
    setPromoCards(updated)
    try {
      await dispatch(adminUpdatePromoCards(updated)).unwrap()
      // Refresh config to get updated data
      dispatch(fetchPublicConfig())
      toast.success('Promo panel saved successfully!')
    } catch (error) {
      toast.error(error || 'Failed to save promo panel')
    }
    setEditingCategory(null)
    setFormData(null)
  }

  const toggleActive = async (category) => {
    const card = promoCards[category] || { ...emptyCard, category }
    const newActive = !(card?.active === true)
    const updated = {
      ...promoCards,
      [category]: { ...card, active: newActive }
    }
    setPromoCards(updated)
    try {
      await dispatch(adminUpdatePromoCards(updated)).unwrap()
      dispatch(fetchPublicConfig())
      toast.success(newActive ? 'Promo panel activated' : 'Promo panel deactivated')
    } catch (error) {
      toast.error(error || 'Failed to update promo panel')
    }
  }

  const toggleFeatured = async (category) => {
    const card = promoCards[category] || { ...emptyCard, category }
    const updated = {
      ...promoCards,
      [category]: { ...card, featured: !card?.featured }
    }
    setPromoCards(updated)
    try {
      await dispatch(adminUpdatePromoCards(updated)).unwrap()
      dispatch(fetchPublicConfig())
      toast.success(card?.featured ? 'Removed from featured' : 'Marked as featured')
    } catch (error) {
      toast.error(error || 'Failed to update promo panel')
    }
  }

  return (
    <div className="advertisements-page">
      {/* Header */}
      <div className="advertisements-header">
        <div className="header-content">
          <h1>
            <FiShoppingBag /> Promo Panel Manager
          </h1>
          <p>Manage promotional banners for Women, Kids, and Fashion sections</p>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="promo-categories-grid">
        {categoryOptions.map((cat) => {
          const card = promoCards[cat.value] || { ...emptyCard, category: cat.value }
          const isActive = card?.active === true
          
          return (
            <motion.div
              key={cat.value}
              className={`promo-category-card glass-card ${!isActive ? 'inactive' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryOptions.indexOf(cat) * 0.1 }}
            >
              {/* Category Header */}
              <div className="category-card-header" style={{ '--cat-color': cat.color, '--cat-gradient': cat.gradient }}>
                <div className="category-icon-badge">
                  <span className="category-icon">{cat.icon}</span>
                </div>
                <div className="category-info">
                  <h3>{cat.label}</h3>
                  <div className="status-badge">
                    <span className={`status-dot ${isActive ? 'active' : 'inactive'}`}></span>
                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="card-preview-section">
                {card?.image ? (
                  <div className="preview-image-container">
                    <img src={card.image} alt={card.title || 'Promo'} />
                    {card?.featured && (
                      <div className="featured-overlay">
                        <FiStar /> Featured
                      </div>
                    )}
                    {!isActive && (
                      <div className="inactive-overlay">
                        <FiPause /> Inactive
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-image-placeholder">
                    <FiImage size={48} />
                    <span>No image uploaded</span>
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div className="card-details-section">
                <div className="detail-row">
                  <span className="detail-label">Title</span>
                  <span className="detail-value">{card?.title || 'Untitled'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Offer</span>
                  <span className="detail-value highlight">{card?.offer || 'No offer'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Badge</span>
                  <span className="badge-preview" style={{ background: cat.color }}>
                    {card?.badge || 'None'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Animation</span>
                  <span className="animation-badge">
                    {animationOptions.find(a => a.value === card?.animation)?.icon}
                    {animationOptions.find(a => a.value === card?.animation)?.label || 'None'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Link</span>
                  <span className="detail-value link-preview">
                    <FiLink size={14} />
                    {card?.link || 'No link'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="card-actions">
                <button
                  className={`action-btn ${isActive ? 'active' : ''}`}
                  onClick={() => toggleActive(cat.value)}
                  title={isActive ? 'Deactivate' : 'Activate'}
                >
                  {isActive ? <FiPause /> : <FiPlay />}
                  <span>{isActive ? 'Active' : 'Inactive'}</span>
                </button>
                <button
                  className={`action-btn ${card?.featured ? 'featured' : ''}`}
                  onClick={() => toggleFeatured(cat.value)}
                  title="Toggle Featured"
                >
                  <FiStar />
                  <span>Featured</span>
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => openEditor(cat.value)}
                >
                  <FiEdit2 />
                  <span>Edit</span>
                </button>
                <button
                  className="action-btn preview"
                  onClick={() => setPreviewMode(cat.value)}
                >
                  <FiEye />
                  <span>Preview</span>
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCategory && formData && (
          <motion.div
            className="promo-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setEditingCategory(null); setFormData(null) }}
          >
            <motion.div
              className="promo-modal glass-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-header-content">
                  <h2>
                    {categoryOptions.find(c => c.value === editingCategory)?.icon}
                    Edit {categoryOptions.find(c => c.value === editingCategory)?.label}
                  </h2>
                  <p>Configure promotional banner settings</p>
                </div>
                <button 
                  className="close-modal-btn"
                  onClick={() => { setEditingCategory(null); setFormData(null) }}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-layout">
                  {/* Left Column - Form Fields */}
                  <div className="form-column-left">
                    <div className="form-section">
                      <h3><FiType /> Content</h3>
                      <div className="form-group">
                        <label>Title *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.title || ''}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g. Lehenga Collection"
                        />
                      </div>
                      <div className="form-group">
                        <label>Subtitle</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.subtitle || ''}
                          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          placeholder="e.g. Be the Showstopper"
                        />
                      </div>
                      <div className="form-group">
                        <label>Offer Text *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.offer || ''}
                          onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
                          placeholder="e.g. FLAT 50% OFF"
                        />
                      </div>
                      <div className="form-group">
                        <label><FiTag /> Badge</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.badge || ''}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                          placeholder="e.g. EXCLUSIVE, NEW, HOT"
                        />
                      </div>
                    </div>

                    <div className="form-section">
                      <h3><FiLink /> Link & Button</h3>
                      <div className="form-group">
                        <label>Button Text</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.buttonText || ''}
                          onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                          placeholder="e.g. Shop Now, Explore Now"
                        />
                      </div>
                      <div className="form-group">
                        <label>Link URL</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.link || ''}
                          onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                          placeholder="/women?category=lehengas"
                        />
                      </div>
                    </div>

                    <div className="form-section">
                      <h3><FiZap /> Animation</h3>
                      <div className="animation-selector">
                        {animationOptions.map((opt) => (
                          <button
                            key={opt.value}
                            className={`animation-option ${formData.animation === opt.value ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, animation: opt.value })}
                          >
                            <div className="animation-icon">{opt.icon}</div>
                            <div className="animation-info">
                              <span className="animation-name">{opt.label}</span>
                              <span className="animation-desc">{opt.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Settings</h3>
                      <div className="toggle-group">
                        <label className="toggle-item">
                          <input
                            type="checkbox"
                            checked={formData.active !== false}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          />
                          <span>Active</span>
                        </label>
                        <label className="toggle-item">
                          <input
                            type="checkbox"
                            checked={!!formData.featured}
                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                          />
                          <span>Featured</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Image Upload & Preview */}
                  <div className="form-column-right">
                    <div className="form-section">
                      <h3><FiImage /> Banner Image</h3>
                      <div className="image-upload-area">
                        {isUploading ? (
                          <div className="upload-placeholder uploading">
                            <FiLoader size={32} className="spin" />
                            <span>Uploading to S3...</span>
                          </div>
                        ) : formData.image ? (
                          <div>
                            <button
                              className="change-image-btn"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <FiUpload /> Change Image
                            </button>
                          </div>
                        ) : (
                          <div
                            className="upload-placeholder"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FiUpload size={32} />
                            <span>Click to upload image</span>
                            <span className="upload-hint">Max 5MB, Recommended: 1200x600px</span>
                            <span className="upload-hint">Images will be uploaded to S3</span>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                          disabled={isUploading}
                        />
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="form-section">
                      <h3>Live Preview</h3>
                      <div className="live-preview">
                        <div 
                          className="preview-card"
                          style={{ '--accent-color': categoryOptions.find(c => c.value === editingCategory)?.color }}
                        >
                          {formData.image && (
                            <div className="preview-image">
                              <img src={formData.image} alt="Preview" />
                            </div>
                          )}
                          <div className="preview-content">
                            {formData.badge && (
                              <span className="preview-badge">{formData.badge}</span>
                            )}
                            <h4 className="preview-title">{formData.title || 'Title'}</h4>
                            <p className="preview-subtitle">{formData.subtitle || 'Subtitle'}</p>
                            <div className="preview-offer">{formData.offer || 'Offer'}</div>
                            <button className="preview-button">
                              {formData.buttonText || 'Shop Now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => { setEditingCategory(null); setFormData(null) }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={saveCard}
                >
                  <FiSave /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewMode && (
          <motion.div
            className="preview-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewMode(null)}
          >
            <motion.div
              className="preview-modal glass-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="preview-header">
                <h3>Customer View Preview</h3>
                <button onClick={() => setPreviewMode(null)}>
                  <FiX />
                </button>
              </div>
              <div className="preview-content">
                {/* This would show the actual PromoSection component */}
                <p>Preview of how the banner appears on {categoryOptions.find(c => c.value === previewMode)?.label}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Advertisements
