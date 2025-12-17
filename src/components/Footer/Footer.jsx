import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiFacebook, FiInstagram, FiTwitter, FiMapPin, FiPhone, FiMail, FiHeart } from 'react-icons/fi'
import { fetchPublicConfig, selectSiteConfig } from '../../store/slices/siteConfigSlice'
import './Footer.css'

function Footer() {
  const dispatch = useDispatch()
  const siteConfig = useSelector(selectSiteConfig)

  const contactAddress = siteConfig?.contactAddress?.trim()
    || siteConfig?.contactInfo?.address
    || siteConfig?.contactInfo?.city
    || 'Contact information coming soon'

  const contactPhone = siteConfig?.contactPhone?.trim()
    || siteConfig?.contactInfo?.phone
    || siteConfig?.contactInfo?.alternatePhone
    || ''

  const contactEmail = siteConfig?.contactEmail?.trim()
    || siteConfig?.contactInfo?.email
    || ''

  const hasContactData = Boolean(
    (contactAddress && contactAddress !== 'Contact information coming soon')
      || contactPhone
      || contactEmail
  )

  useEffect(() => {
    if (!hasContactData) {
      dispatch(fetchPublicConfig())
    }
  }, [dispatch, hasContactData])

  const hasSocialLinks = siteConfig?.socialLinks?.facebook || siteConfig?.socialLinks?.instagram || siteConfig?.socialLinks?.twitter

  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L48 105C96 90 192 60 288 55C384 50 480 70 576 75C672 80 768 70 864 65C960 60 1056 60 1152 65C1248 70 1344 80 1392 85L1440 90V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="currentColor"/>
        </svg>
      </div>

      <div className="footer-content">
        <div className="container">
          <div className="footer-grid">
            {/* Brand Section */}
            <div className="footer-brand">
              <Link to="/home" className="footer-logo">
                <span className="logo-text">ThisAI</span>
                <span className="logo-highlight">Boutique</span>
              </Link>
              {siteConfig?.footerDescription && (
                <p className="footer-desc">{siteConfig.footerDescription}</p>
              )}
              {hasSocialLinks && (
                <div className="social-links">
                  {siteConfig?.socialLinks?.facebook && (
                    <a href={siteConfig.socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                      <FiFacebook />
                    </a>
                  )}
                  {siteConfig?.socialLinks?.instagram && (
                    <a href={siteConfig.socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                      <FiInstagram />
                    </a>
                  )}
                  {siteConfig?.socialLinks?.twitter && (
                    <a href={siteConfig.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                      <FiTwitter />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/home">Home</Link></li>
                <li><Link to="/women">Women</Link></li>
                <li><Link to="/kids">Kids</Link></li>
                <li><Link to="/fashion">Fashion</Link></li>
                <li><Link to="/service">Custom Tailoring</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div className="footer-section">
              <h4>Categories</h4>
              <ul className="footer-links">
                <li><Link to="/women?category=sarees">Sarees</Link></li>
                <li><Link to="/women?category=kurtis">Kurtis</Link></li>
                <li><Link to="/women?category=lehengas">Lehengas</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            {/* Contact Info - always show with safe fallbacks */}
            <div className="footer-section">
              <h4>Contact Us</h4>
              <ul className="contact-info">
                <li>
                  <FiMapPin />
                  <span>{contactAddress}</span>
                </li>
                {contactPhone && (
                  <li>
                    <FiPhone />
                    <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}>
                      {contactPhone}
                    </a>
                  </li>
                )}
                {contactEmail && (
                  <li>
                    <FiMail />
                    <a href={`mailto:${contactEmail}`}>
                      {contactEmail}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container">
          <p>
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
          <p className="made-with">
            Made with <FiHeart className="heart" /> in India
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
