import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useSelector } from 'react-redux'
import { FiAward, FiUsers, FiHeart, FiScissors, FiStar, FiCheck, FiChevronDown } from 'react-icons/fi'
import { selectSiteConfig } from '../store/slices/siteConfigSlice'
import { Link } from 'react-router-dom'
import './About.css'

// Icon mapping for stats
const iconMap = {
  award: FiAward,
  users: FiUsers,
  scissors: FiScissors,
  heart: FiHeart
}

function About() {
  const siteConfig = useSelector(selectSiteConfig)
  const containerRef = useRef(null)
  const heroRef = useRef(null)
  const storyRef = useRef(null)
  const missionRef = useRef(null)

  // Content with safe defaults so the page never blocks when CMS data is missing
  const aboutContent = siteConfig?.aboutPageContent || {}

  const defaultHero = {
    badge: 'Our Story',
    title: 'We craft style with heart',
    titleHighlight: 'From stitch to finish',
    subtitle: 'A homegrown boutique bringing artisan craftsmanship and contemporary design together.',
    backgroundImage: '/images/kurtis/20.jpeg',
    ctaButtons: [{ text: 'Shop Now', link: '/home', primary: true }]
  }

  const defaultStory = {
    title: 'From a small studio to your wardrobe',
    paragraphs: [
      'We started as a tiny tailoring studio with a simple promise: make every outfit feel personal.',
      'Today we blend thoughtful design, quality fabrics, and precise fits to create pieces you reach for every day.'
    ],
    highlight: 'Crafted locally, loved globally.'
  }

  const defaultStats = {
    title: 'What drives us',
    subtitle: 'A quick snapshot of our journey so far',
    items: [
      { icon: 'award', number: '10+', label: 'Years of craft' },
      { icon: 'users', number: '25k+', label: 'Happy customers' },
      { icon: 'scissors', number: '50k+', label: 'Custom fits' },
      { icon: 'heart', number: '4.9★', label: 'Customer love' },
    ]
  }

  const defaultSpecializations = {
    title: 'What we specialize in',
    items: [
      { title: 'Blouse Stitching', description: 'Kurti Designs', count: '2000+', image: '/images/blouses/5.jpeg' },
      { title: 'Kurti Designs', description: 'Aari & Maggam', count: '1500+', image: '/images/kurtis/10.jpeg' },
      { title: 'Aari & Maggam', description: 'Bridal Wear', count: '800+', image: '/images/blouses/25.jpeg' },
      { title: 'Bridal Wear', description: 'Premium designs for your special day', count: '500+', image: '/images/lehengas/1.jpeg' },
    ]
  }

  const defaultMission = {
    title: 'Our mission',
    description: 'Make premium, well-fitted outfits accessible without compromising on craft or care.',
    quote: 'Style is personal; we\'re here to tailor it to you.',
    backgroundImage: '/images/kurtis/20.jpeg'
  }

  const defaultValues = {
    title: 'What we believe in',
    items: [
      { title: 'Craftsmanship', description: 'Every stitch matters; quality is non-negotiable.', icon: '🧵' },
      { title: 'Sustainability', description: 'Thoughtful sourcing and mindful production runs.', icon: '🌱' },
      { title: 'Inclusivity', description: 'Fits and silhouettes for every shape and story.', icon: '🤝' },
    ]
  }

  const defaultTimeline = {
    title: 'Milestones',
    items: [
      { year: '2015', title: 'The Start', description: 'Opened our first tailoring studio.' },
      { year: '2018', title: 'Growth', description: 'Expanded to full boutique collections.' },
      { year: '2022', title: 'Online', description: 'Launched nationwide delivery and styling support.' },
    ]
  }

  const defaultCta = {
    title: 'Let’s create something beautiful',
    subtitle: 'Book a fitting, browse the latest collection, or chat with our stylists.',
    buttons: [
      { text: 'Shop Collection', link: '/home', primary: true },
      { text: 'Book a Fitting', link: '/service', primary: false }
    ]
  }

  const hero = { ...defaultHero, ...(aboutContent?.hero && typeof aboutContent.hero === 'object' ? aboutContent.hero : {}) }
  const story = { ...defaultStory, ...(aboutContent?.story && typeof aboutContent.story === 'object' ? aboutContent.story : {}) }
  const statsContent = { ...defaultStats, ...(aboutContent?.stats && typeof aboutContent.stats === 'object' ? aboutContent.stats : {}) }
  const specializations = { ...defaultSpecializations, ...(aboutContent?.specializations && typeof aboutContent.specializations === 'object' ? aboutContent.specializations : {}) }
  const mission = { ...defaultMission, ...(aboutContent?.mission && typeof aboutContent.mission === 'object' ? aboutContent.mission : {}) }
  const values = { ...defaultValues, ...(aboutContent?.values && typeof aboutContent.values === 'object' ? aboutContent.values : {}) }
  const timeline = { ...defaultTimeline, ...(aboutContent?.timeline && typeof aboutContent.timeline === 'object' ? aboutContent.timeline : {}) }
  const cta = { ...defaultCta, ...(aboutContent?.cta && typeof aboutContent.cta === 'object' ? aboutContent.cta : {}) }

  const statsItems = Array.isArray(statsContent.items) && statsContent.items.length > 0 ? statsContent.items : defaultStats.items
  const specializationItems = Array.isArray(specializations.items) && specializations.items.length > 0 
    ? specializations.items.filter(item => item != null) 
    : defaultSpecializations.items
  const valueItems = Array.isArray(values.items) && values.items.length > 0 ? values.items : defaultValues.items
  const timelineItems = Array.isArray(timeline.items) && timeline.items.length > 0 ? timeline.items : defaultTimeline.items

  const hasHero = true
  const hasStory = true
  const hasStats = true
  const hasSpecializations = true
  const hasMission = true
  const hasValues = true
  const hasTimeline = true
  const hasCta = true

  // Parallax scroll effects
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const heroY = useTransform(heroScroll, [0, 1], [0, 300])
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0])
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.1])

  const scrollToContent = () => {
    const storySection = document.querySelector('.about-story-parallax')
    if (storySection) {
      storySection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="about-page-parallax" ref={containerRef}>
      {/* Hero Section - Full Screen Parallax - Only show if content exists */}
      {hasHero && (
        <section className="about-hero-parallax" ref={heroRef}>
          <motion.div
            className="hero-parallax-bg"
            style={{
              y: heroY,
              scale: heroScale,
              backgroundImage: hero?.backgroundImage ? `url(${hero.backgroundImage})` : 'none'
            }}
          />
          <div className="hero-gradient-overlay" />

          <motion.div
            className="hero-content-wrapper"
            style={{ opacity: heroOpacity }}
          >
            <motion.div
              className="hero-content-centered"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {hero?.badge && (
                <motion.span
                  className="hero-label"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <FiStar /> {hero.badge}
                </motion.span>
              )}

              {(hero?.title || hero?.titleHighlight) && (
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  {hero?.title}
                  {hero?.titleHighlight && (
                    <>
                      <br />
                      <span className="gradient-text">{hero.titleHighlight}</span>
                    </>
                  )}
                </motion.h1>
              )}

              {hero?.subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  {hero.subtitle}
                </motion.p>
              )}

              {hero?.ctaButtons?.length > 0 && (
                <motion.div
                  className="hero-cta-buttons"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                >
                  {hero.ctaButtons.map((btn, index) => (
                    <Link
                      key={index}
                      to={btn.link}
                      className={`btn ${btn.primary ? 'btn-primary' : 'btn-outline-light'}`}
                    >
                      {btn.text}
                    </Link>
                  ))}
                </motion.div>
              )}
            </motion.div>

            <motion.button
              className="scroll-down-indicator"
              onClick={scrollToContent}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 10, 0] }}
              transition={{ delay: 1.5, y: { repeat: Infinity, duration: 1.5 } }}
            >
              <span>Discover Our Story</span>
              <FiChevronDown />
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* Story Section - Parallax Background - Only show if content exists */}
      {hasStory && (
        <section
          className="about-story-parallax"
          ref={storyRef}
          style={{ backgroundImage: story?.backgroundImage ? `url(${story.backgroundImage})` : 'none' }}
        >
          <div className="story-overlay" />
          <div className="container">
            <div className="story-grid">
              <motion.div
                className="story-content"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
              >
                {story?.label && <span className="section-label">{story.label}</span>}
                {story?.title && <h2>{story.title}</h2>}

                {story?.paragraphs?.length > 0 && (
                  <div className="story-text">
                    {story.paragraphs.map((para, index) => (
                      <p key={index}>{para}</p>
                    ))}
                  </div>
                )}

                {story?.features?.length > 0 && (
                  <div className="story-features">
                    {story.features.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <FiCheck className="check-icon" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                className="story-image-stack"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {story?.mainImage && (
                  <div className="image-main glass-card">
                    <img src={story.mainImage} alt="Our Craftsmanship" />
                  </div>
                )}
                {story?.secondaryImage && (
                  <div className="image-secondary glass-card">
                    <img src={story.secondaryImage} alt="Boutique Interior" />
                  </div>
                )}
                {story?.experienceBadge && (
                  <div className="experience-floating-badge">
                    <span className="badge-number">{story.experienceBadge?.number}</span>
                    <span className="badge-text">{story.experienceBadge?.text?.replace(' ', '\n')}</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section - Animated Counters - Only show if content exists */}
      {hasStats && (
        <section className="about-stats-section">
          <div className="stats-parallax-bg" style={{ backgroundImage: statsContent?.backgroundImage ? `url(${statsContent.backgroundImage})` : 'none' }} />
          <div className="stats-overlay" />
          <div className="container">
            <motion.div
              className="stats-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {statsContent?.title && <h2>{statsContent.title}</h2>}
              {statsContent?.subtitle && <p>{statsContent.subtitle}</p>}
            </motion.div>

            <div className="stats-grid-parallax">
              {statsItems.map((stat, index) => {
                const IconComponent = iconMap[stat.icon] || FiAward
                return (
                  <motion.div
                    key={index}
                    className="stat-card-parallax"
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.6 }}
                    whileHover={{ y: -10, scale: 1.05 }}
                  >
                    <div className="stat-icon-wrapper" style={{ background: `${stat.color}20`, color: stat.color }}>
                      <IconComponent />
                    </div>
                    <h3 className="stat-number-large">{stat.number}</h3>
                    <span className="stat-label-text">{stat.label}</span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Specializations - Horizontal Scroll Cards - Only show if content exists */}
      {hasSpecializations && (
        <section className="specializations-section">
          <div className="container">
            {(specializations?.label || specializations?.title || specializations?.subtitle) && (
              <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {specializations?.label && <span className="section-label">{specializations.label}</span>}
                {specializations?.title && <h2 className="section-title">{specializations.title}</h2>}
                {specializations?.subtitle && <p className="section-subtitle">{specializations.subtitle}</p>}
              </motion.div>
            )}

            <div className="specializations-grid">
              {specializationItems.map((spec, index) => (
                <motion.div
                  key={index}
                  className="spec-card"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -15 }}
                >
                  <div className="spec-image">
                    <img src={spec?.image || '/images/placeholder.jpg'} alt={spec?.title || 'Specialization'} />
                    <div className="spec-overlay">
                      <span className="spec-count">{spec?.count || '0+'}</span>
                      <span className="spec-count-label">Creations</span>
                    </div>
                  </div>
                  <h3>{spec?.title || 'Specialization'}</h3>
                  {spec?.description && <p>{spec.description}</p>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission Section - Full Parallax - Only show if content exists */}
      {hasMission && (
        <section
          className="mission-parallax-section"
          ref={missionRef}
          style={{ backgroundImage: mission?.backgroundImage ? `url(${mission.backgroundImage})` : 'none' }}
        >
          <div className="mission-overlay" />
          <div className="container">
            <motion.div
              className="mission-content"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
            >
              {mission?.label && <span className="mission-label">{mission.label}</span>}
              {mission?.title && <h2>{mission.title}</h2>}
              {mission?.description && <p>{mission.description}</p>}
              {(mission?.quote || mission?.quoteAuthor) && (
                <div className="mission-quote">
                  {mission?.quote && <blockquote>"{mission.quote}"</blockquote>}
                  {mission?.quoteAuthor && <cite>- {mission.quoteAuthor}</cite>}
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Values Section - Only show if content exists */}
      {hasValues && (
        <section className="values-parallax-section">
          <div className="container">
            {(values?.label || values?.title || values?.subtitle) && (
              <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {values?.label && <span className="section-label">{values.label}</span>}
                {values?.title && <h2 className="section-title">{values.title}</h2>}
                {values?.subtitle && <p className="section-subtitle">{values.subtitle}</p>}
              </motion.div>
            )}

            <div className="values-grid-parallax">
              {valueItems.map((value, index) => (
                <motion.div
                  key={index}
                  className="value-card-parallax glass-card"
                  initial={{ opacity: 0, y: 50, rotateX: -10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                  whileHover={{ y: -10, boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}
                >
                  <span className="value-emoji">{value.icon}</span>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Timeline Section - Only show if content exists */}
      {hasTimeline && (
        <section className="timeline-section">
          <div className="container">
            {(timeline?.label || timeline?.title || timeline?.subtitle) && (
              <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {timeline?.label && <span className="section-label">{timeline.label}</span>}
                {timeline?.title && <h2 className="section-title">{timeline.title}</h2>}
                {timeline?.subtitle && <p className="section-subtitle">{timeline.subtitle}</p>}
              </motion.div>
            )}

            <div className="timeline-wrapper">
              <div className="timeline-line" />
              {timelineItems.map((milestone, index) => (
                <motion.div
                  key={index}
                  className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  <div className="timeline-content glass-card">
                    <span className="timeline-year">{milestone.year}</span>
                    <h4>{milestone.title}</h4>
                    <p>{milestone.description}</p>
                  </div>
                  <div className="timeline-dot" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Parallax - Only show if content exists */}
      {hasCta && (
        <section
          className="cta-parallax-section"
          style={{ backgroundImage: cta?.backgroundImage ? `url(${cta.backgroundImage})` : 'none' }}
        >
          <div className="cta-overlay" />
          <div className="container">
            <motion.div
              className="cta-content-parallax"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {cta?.title && (
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  {cta.title}
                </motion.h2>
              )}
              {cta?.subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  {cta.subtitle}
                </motion.p>
              )}
              {cta?.buttons?.length > 0 && (
                <motion.div
                  className="cta-buttons"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  {cta.buttons.map((btn, index) => (
                    <Link
                      key={index}
                      to={btn.link}
                      className={`btn btn-lg ${btn.primary ? 'btn-primary' : 'btn-outline-light'}`}
                    >
                      {btn.icon === 'scissors' && <FiScissors />} {btn.text}
                    </Link>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}

export default About
