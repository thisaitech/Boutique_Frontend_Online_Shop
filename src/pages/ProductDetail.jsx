import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiShoppingBag,
  FiHeart,
  FiShare2,
  FiStar,
  FiCheck,
  FiTruck,
  FiRefreshCw,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiMinus,
  FiPlus,
  FiZoomIn,
  FiX,
  FiPackage,
  FiClock,
  FiMapPin
} from 'react-icons/fi'
import { useGlobal } from '../context/GlobalContext'
import {
  fetchProductById,
  selectCurrentProduct,
  selectProducts,
  selectProductsLoading
} from '../store/slices/productSlice'
import {
  addToCart as addToCartAction,
  addToCartLocal,
  clearCart as clearCartAction,
  clearCartLocal,
  selectCartItems
} from '../store/slices/cartSlice'
import {
  fetchProductReviews,
  selectProductReviews,
  selectReviewsLoading
} from '../store/slices/reviewSlice'
import { selectIsAuthenticated, selectUser as selectAuthUser } from '../store/slices/authSlice'
import { selectSiteConfig } from '../store/slices/siteConfigSlice'
import ProductCard from '../components/ProductCard/ProductCard'
import ReviewModal from '../components/ReviewModal/ReviewModal'
import { getImageSrc } from '../utils/imageUtils'
import toast from 'react-hot-toast'
import './ProductDetail.css'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Redux state
  const currentProductRedux = useSelector(selectCurrentProduct)
  const productsRedux = useSelector(selectProducts)
  const productsLoading = useSelector(selectProductsLoading)
  const cartItemsRedux = useSelector(selectCartItems)
  const productReviewsRedux = useSelector(selectProductReviews(id))
  const reviewsLoading = useSelector(selectReviewsLoading)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const authUser = useSelector(selectAuthUser)
  const siteConfigRedux = useSelector(selectSiteConfig)

  // Context fallback
  const {
    inventory: contextInventory,
    addToCart: contextAddToCart,
    cart: contextCart,
    user: contextUser,
    reviews: contextReviews,
    orders,
    addReview,
    siteConfig: contextSiteConfig
  } = useGlobal()

  // Use Redux data if available, otherwise fall back to context
  const inventory = productsRedux.length > 0 ? productsRedux : contextInventory
  const user = authUser || contextUser
  const reviews = productReviewsRedux.length > 0 ? productReviewsRedux : contextReviews
  const siteConfig = siteConfigRedux || contextSiteConfig

  // Fetch product data
  useEffect(() => {
    dispatch(fetchProductById(id))
    dispatch(fetchProductReviews(id))
  }, [dispatch, id])

  // Refetch reviews when window regains focus (after admin approval)
  useEffect(() => {
    const handleFocus = () => {
      dispatch(fetchProductById(id))
      dispatch(fetchProductReviews(id))
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [dispatch, id])

  // Add to cart handler
  const addToCart = (item) => {
    if (isAuthenticated) {
      dispatch(addToCartAction({ productId: item.id, quantity: item.quantity }))
    } else {
      dispatch(addToCartLocal(item))
    }
    contextAddToCart(item) // Also update context for backward compatibility
  }

  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [pincode, setPincode] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('description')
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Helper function to get sizes for category
  const getSizesForCategory = (category) => {
    // Normalize category name (handle variations)
    const normalizedCategory = category?.toLowerCase() || ''
    
    if (!siteConfig?.productSizes) {
      // Fallback to defaults - sarees, handbags, ornaments don't need sizes
      if (normalizedCategory.includes('saree') || normalizedCategory.includes('handbag') || 
          normalizedCategory.includes('ornament') || normalizedCategory.includes('jewellery')) {
        return ['Free Size']
      }
      if (normalizedCategory.includes('kurti')) return ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      return ['S', 'M', 'L', 'XL']
    }
    
    if (normalizedCategory.includes('saree')) return siteConfig.productSizes.sarees || ['Free Size']
    if (normalizedCategory.includes('kurti')) return siteConfig.productSizes.kurtis || ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    if (normalizedCategory.includes('lehenga')) return siteConfig.productSizes.lehengas || ['S', 'M', 'L', 'XL']
    if (normalizedCategory.includes('handbag') || normalizedCategory.includes('ornament') || 
        normalizedCategory.includes('jewellery')) return ['Free Size']
    return ['S', 'M', 'L', 'XL']
  }

  // Scroll to top when page loads or product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  // Find product by ID and auto-select size if needed
  useEffect(() => {
    // First try to use the directly fetched product, then search inventory
    let foundProduct = currentProductRedux
    if (!foundProduct || (foundProduct.id !== id && foundProduct._id !== id)) {
      foundProduct = inventory.find(p => p.id === id || p._id === id)
    }
    
    if (foundProduct) {
      setProduct(foundProduct)
      setSelectedImage(0)
      // Don't auto-select color variant - show main product image first
      // User can click on color variants to see variant images
      setSelectedColor(null)
      
      // Determine available sizes - use product sizes or fall back to category defaults
      const availableSizes = (foundProduct.availableSizes && foundProduct.availableSizes.length > 0) 
        ? foundProduct.availableSizes 
        : getSizesForCategory(foundProduct.category)
      
      // Auto-select size if only Free Size is available
      if (availableSizes.length === 1 && availableSizes[0] === 'Free Size') {
        setSelectedSize('Free Size')
      } else {
        setSelectedSize('')
      }
    } else {
      navigate('/women')
    }
  }, [id, inventory, currentProductRedux, navigate, siteConfig])

  if (!product) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading product...</p>
      </div>
    )
  }

  // Create image gallery array - main product image first, then ALL color variant images
  const getProductImages = () => {
    let images = []
    
    // Always include main product image first
    if (product.image) {
      images.push(product.image)
    }
    
    // Add ALL color variant images to the gallery
    if (product.colorVariants && product.colorVariants.length > 0) {
      product.colorVariants.forEach(variant => {
        if (variant.images && variant.images.length > 0) {
          variant.images.forEach(img => {
            // Avoid duplicates
            if (img !== product.image && !images.includes(img)) {
              images.push(img)
            }
          })
        }
      })
    }
    
    // Apply getImageSrc to all images to handle S3 URLs and other formats
    return images.map(img => getImageSrc(img))
  }

  const productImages = getProductImages()

  // Handle color variant selection - jump to that variant's first image
  const handleColorSelect = (variant) => {
    setSelectedColor(variant)
    
    // Find the index of the first image of this variant in the productImages array
    if (variant && variant.images && variant.images.length > 0) {
      const variantFirstImage = getImageSrc(variant.images[0])
      const imageIndex = productImages.findIndex(img => img === variantFirstImage)
      if (imageIndex !== -1) {
        setSelectedImage(imageIndex)
      }
    } else {
      // If no variant (clicking default), go to main image
      setSelectedImage(0)
    }
  }

  // Get current color name
  const getCurrentColorName = () => {
    if (selectedColor) return selectedColor.color
    return product.color
  }

  // Get related products
  const relatedProducts = inventory
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  // Get reviews for this product (only visible reviews from customers who actually bought the product)
  const productReviews = reviews.filter(r => {
    if (r.productId !== product.id || r.hidden) return false
    
    // Only include reviews from customers who actually bought and paid for the product
    const hasPurchase = orders.some(order => {
      const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'completed' || order.status === 'confirmed'
      const hasProduct = order.items && order.items.some(item => item.id === product.id)
      const isReviewer = order.customerId === r.userId || order.customerName === r.userName
      return isPaid && hasProduct && isReviewer
    })
    
    return hasPurchase
  })
  
  // Use backend calculated rating and review count
  const avgRating = product.rating || 0
  const purchaseCount = product.reviews || 0
  
  // Check if user can write review (has paid/confirmed order with this product)
  const canWriteReview = user && orders.some(order => {
    const hasPayment = (order.paymentStatus === 'paid' || order.paymentStatus === 'completed') || 
                       order.paymentMethod === 'cod' || 
                       order.paymentMethod === 'upi' ||
                       order.status === 'confirmed'
    const hasProduct = order.items.some(item => item.id === product.id)
    const isUserOrder = order.customerId === user.id || order.customerName === user.name
    const notReviewed = !reviews.some(r => r.productId === product.id && r.userId === user.id && r.orderId === order.id)
    return hasPayment && hasProduct && isUserOrder && notReviewed
  })

  // Get available sizes for display
  // For sarees and accessories, always use Free Size regardless of database
  const normalizedCategory = product.category?.toLowerCase() || ''
  const isFreeSizeCategory = normalizedCategory.includes('saree') || 
                             normalizedCategory.includes('handbag') || 
                             normalizedCategory.includes('ornament') || 
                             normalizedCategory.includes('jewellery')
  
  const sizes = isFreeSizeCategory 
    ? ['Free Size'] 
    : ((product.availableSizes && product.availableSizes.length > 0) 
        ? product.availableSizes 
        : getSizesForCategory(product.category))

  const formatPrice = (price) => {
    // Ensure price is a valid number
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0
    
    if (numPrice >= 10000000) { // 1 crore or more
      return `₹${(numPrice / 10000000).toFixed(1)}Cr`
    } else if (numPrice >= 100000) { // 1 lakh or more
      return `₹${(numPrice / 100000).toFixed(1)}L`
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numPrice)
  }
  
  // Log product price for debugging
  console.log('Product Detail - Name:', product?.name, 'Price:', product?.price, 'Type:', typeof product?.price)

  const handleAddToCart = () => {
    if (!product.inStock || (product.stockCount !== undefined && product.stockCount === 0)) {
      toast.error('This product is out of stock')
      return
    }
    // Check if product has actual sizes (not just Free Size) and none is selected
    const hasRealSizes = sizes.length > 0 && 
                         !(sizes.length === 1 && sizes[0] === 'Free Size')
    if (hasRealSizes && !selectedSize) {
      toast.error('Please select a size before adding to cart', {
        duration: 3000,
        position: 'top-center',
        icon: '👕'
      })
      return
    }
    const cartItem = {
      ...product,
      quantity,
      size: selectedSize || 'Free Size',
      selectedColor: getCurrentColorName(),
      image: selectedColor?.images?.[0] || product.image,
      price: product.price // Ensure raw price value is preserved
    }
    console.log('Adding to cart - Product price:', product.price, 'Cart item:', cartItem)
    addToCart(cartItem)
    toast.success(`${product.name} added to cart!`)
  }

  const handleBuyNow = () => {
    // Always clear cart before buy now (local and server)
    dispatch(clearCartLocal())
    if (isAuthenticated) {
      dispatch(clearCartAction())
    }
    if (!product.inStock || (product.stockCount !== undefined && product.stockCount === 0)) {
      toast.error('This product is out of stock')
      return
    }
    // Check if product has actual sizes (not just Free Size) and none is selected
    const hasRealSizes = sizes.length > 0 && 
                         !(sizes.length === 1 && sizes[0] === 'Free Size')
    if (hasRealSizes && !selectedSize) {
      toast.error('Please select a size before proceeding', {
        duration: 3000,
        position: 'top-center',
        icon: '👕'
      })
      return
    }
    const cartItem = {
      ...product,
      quantity: quantity, // Explicitly use current quantity state
      size: selectedSize || 'Free Size',
      selectedColor: getCurrentColorName(),
      image: selectedColor?.images?.[0] || product.image,
      price: product.price // Ensure raw price value is preserved
    }
    addToCart(cartItem)
    // Navigate to checkout page with orderType
    navigate('/checkout', { state: { orderType: 'buy-now' } })
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      })
    } catch {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const checkDelivery = () => {
    if (pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode')
      return
    }
    // Simulate delivery check
    setDeliveryInfo({
      available: true,
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }),
      cod: true,
      express: pincode.startsWith('1') || pincode.startsWith('4')
    })
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % productImages.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  }

  return (
    <motion.div 
      className="product-detail-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Breadcrumb */}
      <motion.div
        className="breadcrumb"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container">
          <Link to="/home">Home</Link>
          <span>/</span>
          <Link to="/women">Shop</Link>
          <span>/</span>
          <Link to={`/women?category=${product.category}`}>{product.category}</Link>
          <span>/</span>
          <span className="current">{product.name}</span>
        </div>
      </motion.div>

      <div className="container">
        <motion.div
          className="product-detail-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Image Gallery Section */}
          <motion.div className="product-gallery" variants={itemVariants}>
            {/* Main Image */}
            <div className="main-image-container">
              <motion.div
                className="main-image"
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  onClick={() => setShowZoom(true)}
                />
                <button className="zoom-btn" onClick={() => setShowZoom(true)}>
                  <FiZoomIn />
                </button>

                {/* Navigation Arrows */}
                <button className="nav-arrow prev" onClick={prevImage}>
                  <FiChevronLeft />
                </button>
                <button className="nav-arrow next" onClick={nextImage}>
                  <FiChevronRight />
                </button>

                {/* Badges */}
                {product.discount > 0 && (
                  <span className="product-badge discount">-{product.discount}% OFF</span>
                )}
                {product.featured && (
                  <span className="product-badge featured">Featured</span>
                )}
              </motion.div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="thumbnail-gallery">
              {productImages.map((img, index) => (
                <motion.button
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src={img} alt={`${product.name} view ${index + 1}`} />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Product Info Section */}
          <motion.div className="product-info-section" variants={itemVariants}>
            {/* Category & Name */}
            <div className="product-header">
              <span className="product-category-badge">{product.category}</span>
              <h1 className="product-title">{product.name}</h1>

              {/* Rating */}
              <div className="product-rating-section">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={i < Math.floor(avgRating) ? 'filled' : ''}
                    />
                  ))}
                </div>
                <span className="rating-value">{avgRating}</span>
                <span className="rating-count">({purchaseCount} {purchaseCount === 1 ? 'purchase' : 'purchases'})</span>
                <span className="divider">|</span>
                <span className={`stock-status ${product.inStock && (product.stockCount === undefined || product.stockCount > 0) ? 'in-stock' : 'out-stock'}`}>
                  {product.inStock && (product.stockCount === undefined || product.stockCount > 0) ? (
                    <>
                      <FiCheck /> In Stock
                      {product.stockCount !== undefined && product.stockCount <= 3 && product.stockCount > 0 && (
                        <span style={{ marginLeft: '8px', color: '#f39c12', fontSize: '0.9rem' }}>
                          (Low Stock: {product.stockCount} left)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <FiX /> Out of Stock
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Price Section */}
            <div className="price-section">
              <div className="price-row">
                <span className="current-price">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="original-price">{formatPrice(product.originalPrice)}</span>
                    <span className="discount-badge">
                      Save {formatPrice(product.originalPrice - product.price)} ({product.discount}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="tax-info">Inclusive of all taxes</p>
            </div>

            {/* Color Variants Selector */}
            {product.colorVariants && product.colorVariants.length > 0 ? (
              <div className="color-section">
                <div className="section-header">
                  <h4>Select Color: <span className="selected-color-name">{getCurrentColorName()}</span></h4>
                </div>
                <div className="color-options">
                  {/* Default/Main product option */}
                  <motion.button
                    className={`color-variant-btn ${!selectedColor ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedColor(null)
                      setSelectedImage(0)
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={product.color || 'Default'}
                  >
                    <img
                      src={getImageSrc(product.image)}
                      alt={product.color || 'Default'}
                      className="color-variant-img"
                    />
                    <span className="color-variant-label">{product.color || 'Default'}</span>
                  </motion.button>
                  
                  {/* Color variant options */}
                  {product.colorVariants.map((variant, index) => (
                    <motion.button
                      key={index}
                      className={`color-variant-btn ${selectedColor === variant ? 'selected' : ''}`}
                      onClick={() => handleColorSelect(variant)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={variant.color}
                    >
                      <img
                        src={getImageSrc(variant.images[0])}
                        alt={variant.color}
                        className="color-variant-img"
                      />
                      <span className="color-variant-label">{variant.color}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="color-section">
                <div className="section-header">
                  <h4>Color: <span className="selected-color-name">{product.color}</span></h4>
                </div>
              </div>
            )}

            {/* Size Selector - Only show if product has actual sizes (not just Free Size) */}
            {!(sizes.length === 1 && sizes[0] === 'Free Size') && (
              <div className="size-section">
                <div className="section-header">
                  <h4>Select Size</h4>
                  <button className="size-guide-btn">Size Guide</button>
                </div>
                <div className="size-options">
                  {sizes.map((size) => (
                    <motion.button
                      key={size}
                      className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector - Hidden */}
            {false && (
            <div className="quantity-section">
              <h4>Quantity</h4>
              <div className="quantity-selector">
                <motion.button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || !product.inStock || (product.stockCount !== undefined && product.stockCount === 0)}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiMinus />
                </motion.button>
                <span>{quantity}</span>
                <motion.button
                  onClick={() => {
                    const maxQuantity = product.stockCount !== undefined ? product.stockCount : 999
                    setQuantity(Math.min(maxQuantity, quantity + 1))
                  }}
                  disabled={!product.inStock || (product.stockCount !== undefined && product.stockCount === 0) || (product.stockCount !== undefined && quantity >= product.stockCount)}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiPlus />
                </motion.button>
              </div>
              {product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= 3 && (
                <p style={{ color: '#f39c12', fontSize: '0.85rem', marginTop: '8px' }}>
                  ⚠️ Only {product.stockCount} {product.stockCount === 1 ? 'piece' : 'pieces'} available
                </p>
              )}
            </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              {product.inStock && (product.stockCount === undefined || product.stockCount > 0) ? (
                <>
                  <motion.button
                    className="btn btn-primary add-to-cart-btn"
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiShoppingBag />
                    Add to Cart
                  </motion.button>
                  <motion.button
                    className="btn btn-secondary buy-now-btn"
                    onClick={handleBuyNow}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiShoppingBag />
                    Buy Now
                  </motion.button>
                </>
              ) : (
                <motion.button
                  className="btn btn-secondary add-to-cart-btn"
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed', width: '100%' }}
                >
                  <FiX />
                  Out of Stock
                </motion.button>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="secondary-actions">
              <motion.button
                className={`icon-btn ${isWishlisted ? 'active' : ''}`}
                onClick={handleWishlist}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiHeart />
                <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
              </motion.button>
              <motion.button
                className="icon-btn"
                onClick={handleShare}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiShare2 />
                <span>Share</span>
              </motion.button>
            </div>

            {/* Delivery Check */}
            <div className="delivery-section glass-card">
              <h4><FiMapPin /> Delivery Options</h4>
              <div className="pincode-input">
                <input
                  type="text"
                  placeholder="Enter Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <button onClick={checkDelivery}>Check</button>
              </div>

              <AnimatePresence>
                {deliveryInfo && (
                  <motion.div
                    className="delivery-info"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {deliveryInfo.available ? (
                      <>
                        <div className="delivery-item success">
                          <FiTruck />
                          <div>
                            <strong>Delivery by {deliveryInfo.date}</strong>
                            <span>{deliveryInfo.express ? 'Express Delivery Available' : 'Standard Delivery'}</span>
                          </div>
                        </div>
                        <div className="delivery-item">
                          <FiPackage />
                          <div>
                            <strong>Free Shipping</strong>
                            <span>On orders above ₹2,999</span>
                          </div>
                        </div>
                        {deliveryInfo.cod && (
                          <div className="delivery-item">
                            <FiCheck />
                            <div>
                              <strong>Cash on Delivery</strong>
                              <span>Available at this location</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="delivery-item error">
                        <FiX />
                        <span>Delivery not available at this location</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="badge-item">
                <FiTruck />
                <span>Free Shipping</span>
              </div>
              <div className="badge-item">
                <FiShield />
                <span>Secure Payment</span>
              </div>
              <div className="badge-item" style={{ color: '#e74c3c' }}>
                <FiX />
                <span>Return is not accepted</span>
              </div>
            </div>

            {/* Product Meta */}
            <div className="product-meta">
              <div className="meta-item">
                <span className="label">Color:</span>
                <span className="value">{getCurrentColorName()}</span>
              </div>
              <div className="meta-item">
                <span className="label">Material:</span>
                <span className="value">{product.material}</span>
              </div>
              <div className="meta-item">
                <span className="label">SKU:</span>
                <span className="value">TB-{product.id.toString().padStart(5, '0')}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Product Details Tabs */}
        <motion.div
          className="product-tabs-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="tabs-header">
            {['description', 'specifications', 'reviews'].map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="tabs-content glass-card">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="tab-panel"
                >
                  <h3>Product Description</h3>
                  <p>{product.description}</p>
                  <ul className="features-list">
                    <li>Premium quality {product.material} fabric</li>
                    <li>Elegant {product.color} color that suits all occasions</li>
                    <li>Handcrafted with attention to detail</li>
                    <li>Easy to maintain and wash</li>
                    <li>Perfect for weddings, parties, and special events</li>
                  </ul>
                </motion.div>
              )}

              {activeTab === 'specifications' && (
                <motion.div
                  key="specifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="tab-panel"
                >
                  <h3>Specifications</h3>
                  <table className="specs-table">
                    <tbody>
                      <tr>
                        <td>Material</td>
                        <td>{product.material}</td>
                      </tr>
                      <tr>
                        <td>Color</td>
                        <td>{product.color}</td>
                      </tr>
                      <tr>
                        <td>Category</td>
                        <td>{product.category}</td>
                      </tr>
                      <tr>
                        <td>Pattern</td>
                        <td>Embroidered</td>
                      </tr>
                      <tr>
                        <td>Occasion</td>
                        <td>Wedding, Party, Festive</td>
                      </tr>
                      <tr>
                        <td>Care</td>
                        <td>Dry Clean Only</td>
                      </tr>
                      <tr>
                        <td>Package Contents</td>
                        <td>
                          {product.category === 'sarees'
                            ? '1 Saree with Blouse Piece'
                            : product.category === 'lehengas'
                            ? 'Lehenga, Choli, Dupatta'
                            : '1 Kurti'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="tab-panel"
                >
                  <h3>Customer Reviews</h3>
                  <div className="reviews-summary">
                    <div className="rating-big">
                      {productReviews.length > 0 ? (
                        <>
                          <span className="rating-number">{avgRating.toFixed(1)}</span>
                          <div className="stars">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={i < Math.floor(avgRating) ? 'filled' : ''} />
                            ))}
                          </div>
                          <span className="total-reviews">{productReviews.length} {productReviews.length === 1 ? 'review' : 'reviews'}</span>
                        </>
                      ) : (
                        <span className="total-reviews" style={{color: '#999'}}>No reviews yet</span>
                      )}
                    </div>
                    {canWriteReview && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => {
                          const userOrder = orders.find(order => {
                            const hasPayment = (order.paymentStatus === 'paid' || order.paymentStatus === 'completed') || order.status === 'confirmed'
                            const hasProduct = order.items.some(item => item.id === product.id)
                            const isUserOrder = order.customerId === user.id || order.customerName === user.name
                            return hasPayment && hasProduct && isUserOrder
                          })
                          if (userOrder) {
                            navigate(`/review?productId=${product.id}&orderId=${userOrder.id}`)
                          } else {
                            navigate(`/review?productId=${product.id}`)
                          }
                        }}
                      >
                        Write a Review
                      </button>
                    )}
                    {!user && (
                      <p className="review-note">Please login and purchase this product to write a review</p>
                    )}
                  </div>

                  {/* Reviews List */}
                  <div className="reviews-list">
                    {productReviews.length > 0 ? (
                      productReviews
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((review) => {
                          const reviewDate = new Date(review.createdAt)
                          const daysAgo = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24))
                          const dateText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
                          
                          return (
                            <div key={review.id} className="review-item">
                              <div className="review-header">
                                <div className="reviewer-info">
                                  <span className="reviewer-name">{review.userName}</span>
                                  <div className="review-stars">
                                    {[...Array(5)].map((_, i) => (
                                      <FiStar key={i} className={i < review.rating ? 'filled' : ''} />
                                    ))}
                                  </div>
                                </div>
                                <span className="review-date">{dateText}</span>
                              </div>
                              <p className="review-comment">{review.review}</p>
                            </div>
                          )
                        })
                    ) : (
                      <div className="no-reviews">
                        <p>No reviews yet. Be the first to review this product!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            className="related-products-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="section-header">
              <h2>You May Also Like</h2>
              <Link to={`/shop?category=${product.category}`} className="view-all">
                View All <FiChevronRight />
              </Link>
            </div>
            <div className="related-products-grid">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <ProductCard
                    product={relatedProduct}
                    onProductClick={() => navigate(`/product/${relatedProduct.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {showZoom && (
          <motion.div
            className="zoom-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowZoom(false)}
          >
            <motion.div
              className="zoom-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-zoom" onClick={() => setShowZoom(false)}>
                <FiX />
              </button>
              <img src={productImages[selectedImage]} alt={product.name} />
              <div className="zoom-navigation">
                <button onClick={prevImage}><FiChevronLeft /></button>
                <span>{selectedImage + 1} / {productImages.length}</span>
                <button onClick={nextImage}><FiChevronRight /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        product={product}
        user={user}
        onSubmit={(reviewData) => {
          // Find the order that contains this product
          const userOrder = orders.find(order => 
            ((order.paymentStatus === 'paid' || order.paymentStatus === 'completed') || 
             order.paymentMethod === 'cod' || 
             order.paymentMethod === 'upi' ||
             order.status === 'confirmed') &&
            order.items.some(item => item.id === product.id) &&
            (order.customerId === user?.id || order.customerName === user?.name)
          )
          addReview({ ...reviewData, orderId: userOrder?.id || null })
          toast.success('Thank you for your review!')
          setShowReviewModal(false)
        }}
      />
    </motion.div>
  )
}

export default ProductDetail
