import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFilter, FiX, FiChevronDown, FiGrid, FiList, FiSearch, FiTrendingUp, FiStar, FiPercent, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useGlobal } from '../context/GlobalContext'
import {
  fetchProducts,
  selectProducts,
  selectProductsLoading
} from '../store/slices/productSlice'
import ProductCard from '../components/ProductCard/ProductCard'
import './Shop.css'

// Categories, colors, and materials - fallback when API doesn't provide them
const categories = [
  { id: 'sarees', name: 'Sarees' },
  { id: 'lehengas', name: 'Lehengas' },
  { id: 'kurtis', name: 'Kurtis' },
  { id: 'blouses', name: 'Blouses' },
  { id: 'kids-frocks', name: 'Kids Frocks' },
  { id: 'kids-lehengas', name: 'Kids Lehengas' },
  { id: 'kids-gowns', name: 'Kids Gowns' },
  { id: 'kids-ethnic', name: 'Kids Ethnic' },
  { id: 'kids-party', name: 'Kids Party' },
  { id: 'handbags', name: 'Handbags' },
  { id: 'clutches', name: 'Clutches' },
  { id: 'jewelry', name: 'Jewelry' },
  { id: 'ornaments', name: 'Ornaments' },
  { id: 'scarves', name: 'Scarves' },
  { id: 'belts', name: 'Belts' }
]

const colors = ['Red', 'Blue', 'Green', 'Pink', 'Yellow', 'Purple', 'Black', 'White', 'Gold', 'Silver', 'Maroon', 'Orange']
const materials = ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Velvet', 'Net', 'Satin', 'Leather', 'Canvas', 'Metal']

function Shop() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state
  const products = useSelector(selectProducts)
  const productsLoading = useSelector(selectProductsLoading)

  // Context fallback
  const { inventory: contextInventory } = useGlobal()

  // Use Redux data if available, otherwise fall back to context
  const inventory = products.length > 0 ? products : contextInventory

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

  // Filter States
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [priceRange, setPriceRange] = useState([0, 60000])
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [viewMode, setViewMode] = useState('grid')
  const [highlightProduct, setHighlightProduct] = useState(searchParams.get('highlight'))

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12

  // Get unique price range from products
  const maxPrice = Math.max(...inventory.map(p => p.price))

  // Filter products
  const filteredProducts = inventory
    .filter(product => product.showInStore !== false)
    .filter(product => {
      // Category filter
      if (selectedCategory && product.category !== selectedCategory) return false

    // Color filter
    if (selectedColors.length > 0 && !selectedColors.includes(product.color)) return false

    // Material filter
    if (selectedMaterials.length > 0 && !selectedMaterials.includes(product.material)) return false

    // Price filter
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false

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
  const sortedProducts = [...filteredProducts].sort((a, b) => {
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

  // Pagination calculations
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage)
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, selectedColors, selectedMaterials, priceRange, searchQuery, sortBy])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }, [currentPage])

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
    setPriceRange([0, 60000])
    setSearchQuery('')
    setSearchParams({})
  }

  const activeFiltersCount = [
    selectedCategory,
    ...selectedColors,
    ...selectedMaterials,
    priceRange[0] > 0 || priceRange[1] < 60000
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

  return (
    <div className="shop-page">
      {/* Page Header */}
      <motion.div
        className="shop-header"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <div className="shop-header-bg"></div>
        <div className="container">
          <motion.span
            className="shop-label"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Explore Our
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Exclusive Collection
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Discover timeless elegance in every piece, handcrafted with love
          </motion.p>

          {/* Quick Stats */}
          <motion.div
            className="shop-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="stat-item">
              <FiTrendingUp />
              <span>{inventory.filter(p => p.topSelling).length}+ Trending</span>
            </div>
            <div className="stat-item">
              <FiStar />
              <span>{inventory.filter(p => p.featured).length}+ Featured</span>
            </div>
            <div className="stat-item">
              <FiPercent />
              <span>Up to 30% Off</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="shop-content">
        <div className="container">
          {/* Top Bar */}
          <div className="shop-topbar">
            <div className="topbar-left">
              <button
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="filter-count">{activeFiltersCount}</span>
                )}
              </button>

              {/* Search Bar */}
              <div className="search-bar">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search products..."
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
              <span className="results-count">{sortedProducts.length} products</span>

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
            {/* Sidebar Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.aside
                  className="shop-sidebar glass-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="sidebar-header">
                    <h3>Filters</h3>
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
                          onChange={() => setSelectedCategory('')}
                        />
                        <span>All Categories</span>
                      </label>
                      {categories.map(cat => (
                        <label key={cat.id} className="filter-option">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === cat.id}
                            onChange={() => setSelectedCategory(cat.id)}
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="filter-section">
                    <h4>Price Range</h4>
                    <div className="price-range">
                      <input
                        type="range"
                        min="0"
                        max="60000"
                        step="1000"
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
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className={`products-container ${showFilters ? 'with-sidebar' : ''}`}>
              {sortedProducts.length === 0 ? (
                <motion.div
                  className="no-products"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  <div className="no-products-icon">🔍</div>
                  <h3>No products found</h3>
                  <p>Try adjusting your filters or search query</p>
                  <button className="btn btn-primary" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    className={`products-grid ${viewMode}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    key={`${selectedCategory}-${sortBy}-${searchQuery}-${currentPage}`}
                  >
                    {currentProducts.map((product) => (
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
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          )
                        ))}
                      </div>

                      <button
                        className="pagination-btn pagination-arrow"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <FiChevronRight />
                      </button>

                      <span className="pagination-info">
                        Page {currentPage} of {totalPages} ({sortedProducts.length} products)
                      </span>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shop
