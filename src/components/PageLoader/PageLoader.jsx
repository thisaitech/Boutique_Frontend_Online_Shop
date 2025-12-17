import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import './PageLoader.css'

function PageLoader() {
  const [hasError, setHasError] = useState(false)
  const [LottieComponent, setLottieComponent] = useState(null)

  // Dynamically import Lottie to avoid runtime failures; fall back to dots if it fails
  useEffect(() => {
    let mounted = true
    import('@lottiefiles/dotlottie-react')
      .then(mod => {
        if (mounted) {
          setLottieComponent(() => mod.DotLottieReact)
        }
      })
      .catch(() => {
        if (mounted) {
          setHasError(true)
        }
      })
    return () => { mounted = false }
  }, [])

  return (
    <motion.div
      className="page-loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="loader-shell glass-card" aria-busy="true" aria-live="polite">
        <div className="lottie-wrap">
          {!hasError && LottieComponent ? (
            <LottieComponent
              src="https://lottie.host/469ffa89-f627-4551-818a-1d05b662b32c/TaLTWId4og.lottie"
              loop
              autoplay
              style={{ width: 180, height: 180 }}
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="loader-fallback">
              <div className="loader-dot" />
              <div className="loader-dot" />
              <div className="loader-dot" />
            </div>
          )}
        </div>
        <h3 className="loader-brand">ThisAI Boutique</h3>
        <p className="loader-text">Loading your experience...</p>
      </div>
    </motion.div>
  )
}

export default PageLoader
