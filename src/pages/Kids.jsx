import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiX, FiChevronDown, FiGrid, FiList, FiSearch, FiTrendingUp, FiStar, FiPercent, FiChevronRight, FiChevronLeft, FiArrowLeft, FiFilter } from 'react-icons/fi'
import {
  fetchProducts,
  selectProducts,
  selectProductsLoading
} from '../store/slices/productSlice'
import ProductCard from '../components/ProductCard/ProductCard'
import PromoSection from '../components/PromoSection/PromoSection'
import './Shop.css'

// Kids categories and filter options
const kidsCategories = [
  { id: 'kids-frocks', name: 'Kids Frocks' },
  { id: 'kids-lehengas', name: 'Kids Lehengas' },
  { id: 'kids-gowns', name: 'Kids Gowns' },
  { id: 'kids-ethnic', name: 'Kids Ethnic' },
  { id: 'kids-party', name: 'Kids Party' }
]

const categoryTypes = {
  kids: ['kids-frocks', 'kids-lehengas', 'kids-gowns', 'kids-ethnic', 'kids-party']
}

const colors = ['Red', 'Blue', 'Green', 'Pink', 'Yellow', 'Purple', 'Black', 'White', 'Gold', 'Silver', 'Maroon', 'Orange']
const materials = ['Cotton', 'Silk', 'Net', 'Satin', 'Velvet']

function Kids() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state - only use data from database
  const products = useSelector(selectProducts)
  const productsLoading = useSelector(selectProductsLoading)

  // Only use Redux data - no fallback to mock data
  // Ensure inventory is always an array
  const inventory = Array.isArray(products) ? products : []

  // Fetch products on mount
  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  // Refetch products when window regains focus (after admin approval)
  useEffect(() => {
    const handleFocus = () => {
      dispatch(fetchProducts())
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [dispatch])

  const [searchParams, setSearchParams] = useSearchParams()
  const highlightRef = useRef(null)

  // Filter only kids products
  const kidsProducts = inventory.filter(product => categoryTypes.kids.includes(product.category))

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [priceRange, setPriceRange] = useState([0, 30000])
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [viewMode, setViewMode] = useState('grid')
  const [highlightProduct, setHighlightProduct] = useState(searchParams.get('highlight'))
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [showOffersOnly, setShowOffersOnly] = useState(false)

  // Pagination state for category view
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 16 // 4 rows x 4 products

  // Products per row (assuming 4 products per row, 2 rows = 8 products per category in overview)
  const productsPerCategory = 8

  // Get unique price range from products
  const maxPrice = Math.max(...kidsProducts.map(p => p.price), 30000)

  // Update price range when products change
  useEffect(() => {
    if (kidsProducts.length > 0) {
      const max = Math.max(...kidsProducts.map(p => p.price), 30000)
      setPriceRange([0, max])
    }
  }, [kidsProducts.length])

  // Filter products
  const filteredProducts = kidsProducts
    .filter(product => product.showInStore !== false)
    .filter(product => {
    // Category filter (only when a specific category is selected)
    if (selectedCategory && product.category !== selectedCategory) return false

    // Color filter
    if (selectedColors.length > 0 && !selectedColors.includes(product.color)) return false

    // Material filter
    if (selectedMaterials.length > 0 && !selectedMaterials.includes(product.material)) return false

    // Price filter
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false

    // Featured filter
    if (showFeaturedOnly && !product.featured) return false

    // Offers filter (products with discount or active offer)
    if (showOffersOnly) {
      const hasDiscount = product.discount > 0
      const hasActiveOffer = product.offer && product.offer.active && new Date(product.offer.validUntil) > new Date()
      if (!hasDiscount && !hasActiveOffer) return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Sort products
  const sortProducts = (products) => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'newest':
          return b.id - a.id
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      }
    })
  }

  // Group products by category
  const getProductsByCategory = () => {
    const grouped = {}
    kidsCategories.forEach(cat => {
      const categoryProducts = filteredProducts.filter(p => p.category === cat.id)
      if (categoryProducts.length > 0) {
        grouped[cat.id] = {
          category: cat,
          products: sortProducts(categoryProducts)
        }
      }
    })
    return grouped
  }

  const productsByCategory = getProductsByCategory()
  const hasAnyProducts = Object.keys(productsByCategory).length > 0

  // Get selected category data for pagination
  const selectedCategoryData = selectedCategory ? productsByCategory[selectedCategory] : null
  const totalProducts = selectedCategoryData ? selectedCategoryData.products.length : 0
  const totalPages = Math.ceil(totalProducts / productsPerPage)

  // Get paginated products for selected category
  const getPaginatedProducts = () => {
    if (!selectedCategoryData) return []
    const startIndex = (currentPage - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    return selectedCategoryData.products.slice(startIndex, endIndex)
  }

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory])

  // Scroll to highlighted product
  useEffect(() => {
    if (highlightProduct && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightProduct(null)
        searchParams.delete('highlight')
        setSearchParams(searchParams)
      }, 3000)
    }
  }, [highlightProduct])

  const handleColorToggle = (color) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }

  const handleMaterialToggle = (material) => {
    setSelectedMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    )
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedColors([])
    setSelectedMaterials([])
    setPriceRange([0, 30000])
    setSearchQuery('')
    setSearchParams({})
    setCurrentPage(1)
  }

  const activeFiltersCount = [
    selectedCategory,
    ...selectedColors,
    ...selectedMaterials,
    priceRange[0] > 0 || priceRange[1] < 30000
  ].filter(Boolean).length

  const formatPrice = (price) => {
    if (price >= 10000000) { // 1 crore or more
      return `₹${(price / 10000000).toFixed(1)}Cr`
    } else if (price >= 100000) { // 1 lakh or more
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`)
  }

  const handleViewAllCategory = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handleBackToAllCategories = () => {
    setSelectedCategory('')
    setCurrentPage(1)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  }

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20
      }
    }
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20
      }
    }
  }

  // Get the selected category info
  const selectedCategoryInfo = kidsCategories.find(cat => cat.id === selectedCategory)

  return (
    <div className="shop-page kids-page-theme">
      {/* Dynamic Promo Section - Admin Controlled */}
      <PromoSection category="kids" />

      {/* Mobile quick nav */}
      <div className="mobile-quick-nav">
        <div className="mobile-quick-nav-inner">
          <Link to="/home" className="btn btn-outline">Home</Link>
          <Link to="/women" className="btn btn-outline">Women</Link>
          <Link to="/fashion" className="btn btn-outline">Fashion</Link>
        </div>
      </div>

      <div className="shop-content">
        <div className="container">
          {/* Top Bar */}
          <div className="shop-topbar">
            <div className="topbar-left">
              {/* Search Bar */}
              <div className="search-bar">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search kids wear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            <div className="topbar-right">
              {/* Mobile Filter Toggle */}
              <button
                className={`mobile-filter-toggle ${showMobileFilters ? 'active' : ''}`}
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <FiFilter />
                <span>Filters</span>
                {activeFiltersCount > 0 && <span className="filter-count">{activeFiltersCount}</span>}
              </button>

              <span className="results-count">
                {selectedCategory ? totalProducts : filteredProducts.length} products
              </span>

              {/* Sort */}
              <div className="sort-select">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <FiChevronDown />
              </div>

              {/* View Mode */}
              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <FiGrid />
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <FiList />
                </button>
              </div>
            </div>
          </div>

          <div className="shop-layout">
            {/* Mobile Filter Overlay */}
            {showMobileFilters && (
              <div className="mobile-filter-overlay" onClick={() => setShowMobileFilters(false)}></div>
            )}

            {/* Sidebar Filters */}
            <aside className={`shop-sidebar glass-card ${showMobileFilters ? 'mobile-visible' : ''}`}>
              <div className="sidebar-header">
                <h3>Filters</h3>
                <button className="mobile-close-btn" onClick={() => setShowMobileFilters(false)}>
                  <FiX />
                </button>
                <button className="clear-btn" onClick={clearFilters}>
                  Clear All
                </button>
              </div>

                  {/* Category Filter */}
                  <div className="filter-section">
                    <h4>Category</h4>
                    <div className="filter-options">
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === ''}
                          onChange={() => { setSelectedCategory(''); setCurrentPage(1); }}
                        />
                        <span>All Categories</span>
                      </label>
                      {kidsCategories.map(cat => (
                        <label key={cat.id} className="filter-option">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === cat.id}
                            onChange={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Special Filters - Featured & Offers */}
                  <div className="filter-section special-filters">
                    <h4>Special Filters</h4>
                    <div className="filter-options">
                      <label className="filter-option featured-filter">
                        <input
                          type="checkbox"
                          checked={showFeaturedOnly}
                          onChange={() => { setShowFeaturedOnly(!showFeaturedOnly); setCurrentPage(1); }}
                        />
                        <span><FiStar className="filter-icon" /> Featured Products</span>
                      </label>
                      <label className="filter-option offers-filter">
                        <input
                          type="checkbox"
                          checked={showOffersOnly}
                          onChange={() => { setShowOffersOnly(!showOffersOnly); setCurrentPage(1); }}
                        />
                        <span><FiPercent className="filter-icon" /> On Offer / Discount</span>
                      </label>
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="filter-section">
                    <h4>Price Range</h4>
                    <div className="price-range">
                      <input
                        type="range"
                        min="0"
                        max="30000"
                        step="500"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="price-slider"
                      />
                      <div className="price-labels">
                        <span>{formatPrice(priceRange[0])}</span>
                        <span>{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Color Filter */}
                  <div className="filter-section">
                    <h4>Color</h4>
                    <div className="color-options">
                      {colors.map(color => (
                        <label key={color} className="color-option">
                          <input
                            type="checkbox"
                            checked={selectedColors.includes(color)}
                            onChange={() => handleColorToggle(color)}
                          />
                          <span className="color-checkbox">{color}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Material Filter */}
                  <div className="filter-section">
                    <h4>Material</h4>
                    <div className="filter-options">
                      {materials.map(material => (
                        <label key={material} className="filter-option">
                          <input
                            type="checkbox"
                            checked={selectedMaterials.includes(material)}
                            onChange={() => handleMaterialToggle(material)}
                          />
                          <span>{material}</span>
                        </label>
                      ))}
                    </div>
                  </div>
            </aside>

            {/* Products by Category */}
            <div className="products-container with-sidebar">
              {!hasAnyProducts ? (
                <motion.div
                  className="no-products"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  <div className="no-products-icon">👧</div>
                  <h3>No products found</h3>
                  <p>Kids collection coming soon! Stay tuned for adorable outfits.</p>
                  <button className="btn btn-primary" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </motion.div>
              ) : selectedCategory ? (
                // Single Category View with Pagination
                <div className="category-sections">
                  <motion.section
                    className="category-section"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Category Header with Back Button */}
                    <div className="category-section-header">
                      <button
                        className="back-to-categories-btn"
                        onClick={handleBackToAllCategories}
                      >
                        <FiArrowLeft /> Back to All Categories
                      </button>
                      <div className="category-title-wrapper">
                        <h2 className="category-section-title">{selectedCategoryInfo?.name}</h2>
                        <span className="category-count">({totalProducts} items)</span>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <motion.div
                      className={`products-grid ${viewMode}`}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      key={`${selectedCategory}-${sortBy}-${searchQuery}-${currentPage}`}
                    >
                      {getPaginatedProducts().map((product) => (
                        <motion.div
                          key={product.id}
                          ref={highlightProduct == product.id ? highlightRef : null}
                          variants={itemVariants}
                          layout
                        >
                          <ProductCard
                            product={product}
                            highlight={highlightProduct == product.id}
                            onProductClick={() => handleProductClick(product.id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <motion.div
                        className="pagination"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <button
                          className="pagination-btn pagination-arrow"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <FiChevronLeft />
                        </button>

                        <div className="pagination-numbers">
                          {getPageNumbers().map((page, index) => (
                            page === '...' ? (
                              <span key={`dots-${index}`} className="pagination-dots">...</span>
                            ) : (
                              <button
                                key={page}
                                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            )
                          ))}
                        </div>

                        <button
                          className="pagination-btn pagination-arrow"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <FiChevronRight />
                        </button>

                        <span className="pagination-info">
                          Page {currentPage} of {totalPages}
                        </span>
                      </motion.div>
                    )}
                  </motion.section>
                </div>
              ) : (
                // All Categories Overview
                <div className="category-sections">
                  {kidsCategories.map((category) => {
                    const categoryData = productsByCategory[category.id]
                    if (!categoryData) return null

                    const { products } = categoryData
                    const displayProducts = products.slice(0, productsPerCategory)
                    const hasMore = products.length > productsPerCategory

                    return (
                      <motion.section
                        key={category.id}
                        className="category-section"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {/* Category Header */}
                        <div className="category-section-header">
                          <div className="category-title-wrapper">
                            <h2 className="category-section-title">{category.name}</h2>
                            <span className="category-count">({products.length} items)</span>
                          </div>
                          {hasMore && (
                            <button
                              className="view-all-btn"
                              onClick={() => handleViewAllCategory(category.id)}
                            >
                              View All <FiChevronRight />
                            </button>
                          )}
                        </div>

                        {/* Products Grid */}
                        <motion.div
                          className={`products-grid ${viewMode}`}
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          key={`${category.id}-${sortBy}-${searchQuery}`}
                        >
                          {displayProducts.map((product) => (
                            <motion.div
                              key={product.id}
                              ref={highlightProduct == product.id ? highlightRef : null}
                              variants={itemVariants}
                              layout
                            >
                              <ProductCard
                                product={product}
                                highlight={highlightProduct == product.id}
                                onProductClick={() => handleProductClick(product.id)}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      </motion.section>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Kids
