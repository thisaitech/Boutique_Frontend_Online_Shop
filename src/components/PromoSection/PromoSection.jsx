import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectSiteConfig } from '../../store/slices/siteConfigSlice'
import './PromoSection.css'

// Category colors
const categoryColors = {
  women: '#e91e8c',
  kids: '#ff6b6b',
  fashion: '#ff8c42'
}

function PromoSection({ category = 'women', className = '' }) {
  const navigate = useNavigate()
  const siteConfig = useSelector(selectSiteConfig)

  // Resolve a single promo card - ONLY from admin data, no defaults
  const card = useMemo(() => {
    const entry = siteConfig?.promoCards?.[category]

    // No promo data from admin - don't show anything
    if (!entry) {
      return null
    }

    if (Array.isArray(entry)) {
      // Only show cards that are explicitly active
      const active = entry.filter((c) => c?.active === true)
      if (active.length > 0) {
        return [...active].sort((a, b) => (a.position || 0) - (b.position || 0))[0]
      }
      return null
    }

    // Single entry - must be explicitly active to show
    if (entry.active === true) {
      return entry
    }

    return null
  }, [siteConfig?.promoCards, category])

  const accentColor = categoryColors[category] || '#e91e8c'

  const handleCardClick = (link) => {
    if (link) navigate(link)
  }

  if (!card) return null

  return (
    <section className={`promo-section ${className}`} style={{ '--accent-color': accentColor }}>
      <div className="container">
        <div className="promo-grid single">
          <motion.div
            key={card.id}
            className={`promo-card promo-featured animation-${card.animation || 'sparkle'}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            onClick={() => handleCardClick(card.link)}
          >
            <div className="promo-bg-animation" />

            {card.animation === 'sparkle' && (
              <div className="promo-sparkles">
                <span className="sparkle sparkle-1" />
                <span className="sparkle sparkle-2" />
                <span className="sparkle sparkle-3" />
                <span className="sparkle sparkle-4" />
                <span className="sparkle sparkle-5" />
              </div>
            )}

            {card.animation === 'confetti' && (
              <>
                <div className="promo-stars">
                  <span className="star star-1">★</span>
                  <span className="star star-2">★</span>
                  <span className="star star-3">★</span>
                  <span className="star star-4">★</span>
                  <span className="star star-5">★</span>
                  <span className="star star-6">★</span>
                </div>
                <div className="promo-confetti">
                  <span className="confetti c1" />
                  <span className="confetti c2" />
                  <span className="confetti c3" />
                  <span className="confetti c4" />
                  <span className="confetti c5" />
                  <span className="confetti c6" />
                </div>
              </>
            )}

            {card.animation === 'wave' && (
              <div className="promo-waves">
                <div className="wave wave-1" />
                <div className="wave wave-2" />
                <div className="wave wave-3" />
              </div>
            )}

            {card.featured && <div className="promo-ribbon">EXCLUSIVE</div>}

            {card.image && (
              <div className="promo-image">
                <img src={card.image} alt={card.title} loading="lazy" />
              </div>
            )}

            <div className="promo-content">
              {card.badge && (
                <motion.div
                  className="promo-badge mega-badge bounce"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {card.badge}
                </motion.div>
              )}

              <h3 className="promo-title gradient-text">{card.title}</h3>

              <p className="promo-subtitle">{card.subtitle}</p>

              <motion.div
                className="promo-offer big-offer wave-text"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {card.offer}
              </motion.div>

              <div className="promo-timer">
                <span className="timer-label">Limited Time Offer!</span>
              </div>

              <motion.div
                className="promo-cta shimmer-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {card.buttonText || 'Shop Now'}
              </motion.div>
            </div>

            <div className="promo-decoration">
              <div className="deco-circle circle-1" />
              <div className="deco-circle circle-2" />
              <div className="deco-circle circle-3" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default PromoSection
