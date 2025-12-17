import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiStar, FiTrendingUp, FiSearch, FiCheck, FiX, FiSave, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import {
  fetchProducts,
  selectProducts,
  selectProductsLoading
} from '../../store/slices/productSlice'
import {
  updateAdminProduct,
  adminFetchOrders,
  selectAdminOrders
} from '../../store/slices/adminSlice'
import { getImageSrc } from '../../utils/imageUtils'
import toast from 'react-hot-toast'
import './AdminPages.css'

const MAX_TOP_SELLING = 10
const MAX_FEATURED = 10

function FeaturedProducts() {
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const inventory = useSelector(selectProducts)
  const orders = useSelector(selectAdminOrders)
  const isLoading = useSelector(selectProductsLoading)

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(adminFetchOrders())
  }, [dispatch])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [showTopSellingOnly, setShowTopSellingOnly] = useState(false)
  const [activeTab, setActiveTab] = useState('featured') // 'featured' or 'topselling'
  const [hasChanges, setHasChanges] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  // Local state for pending changes (before save)
  const [pendingChanges, setPendingChanges] = useState({})

  // Get current featured and top selling products from inventory
  const featuredProducts = useMemo(() => {
    return inventory.filter(p => {
      const productKey = p.id || p._id
      const pending = pendingChanges[productKey]
      if (pending !== undefined && pending.featured !== undefined) {
        return pending.featured
      }
      return p.featured === true
    })
  }, [inventory, pendingChanges])

  const topSellingProducts = useMemo(() => {
    return inventory.filter(p => {
      const productKey = p.id || p._id
      const pending = pendingChanges[productKey]
      if (pending !== undefined && pending.topSelling !== undefined) {
        return pending.topSelling
      }
      return p.topSelling === true
    })
  }, [inventory, pendingChanges])

  // Filter products for selection grid
  const filteredProducts = useMemo(() => {
    let filtered = inventory

    if (activeTab === 'featured' && showFeaturedOnly) {
      filtered = filtered.filter(p => {
        const productKey = p.id || p._id
        const pending = pendingChanges[productKey]
        if (pending !== undefined && pending.featured !== undefined) {
          return pending.featured
        }
        return p.featured === true
      })
    }

    if (activeTab === 'topselling' && showTopSellingOnly) {
      filtered = filtered.filter(p => {
        const productKey = p.id || p._id
        const pending = pendingChanges[productKey]
        if (pending !== undefined && pending.topSelling !== undefined) {
          return pending.topSelling
        }
        return p.topSelling === true
      })
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory)
    }

    return filtered
  }, [inventory, searchTerm, filterCategory, showFeaturedOnly, showTopSellingOnly, activeTab, pendingChanges])

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, startIndex, endIndex])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, showFeaturedOnly, showTopSellingOnly, activeTab])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(inventory.map(p => p.category))]
    return cats.sort()
  }, [inventory])

  // Check if product is selected (considering pending changes)
  const isProductFeatured = (productId) => {
    const pending = pendingChanges[productId]
    if (pending !== undefined && pending.featured !== undefined) {
      return pending.featured
    }
    const product = inventory.find(p => p.id === productId || p._id === productId || String(p.id) === String(productId) || String(p._id) === String(productId))
    return product?.featured === true
  }

  const isProductTopSelling = (productId) => {
    const pending = pendingChanges[productId]
    if (pending !== undefined && pending.topSelling !== undefined) {
      return pending.topSelling
    }
    const product = inventory.find(p => p.id === productId || p._id === productId || String(p.id) === String(productId) || String(p._id) === String(productId))
    return product?.topSelling === true
  }

  // Toggle featured status - Allow more than 10, but only first 10 show in carousel
  const toggleFeatured = (productId) => {
    const currentStatus = isProductFeatured(productId)
    const newStatus = !currentStatus

    setPendingChanges(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        featured: newStatus
      }
    }))
    setHasChanges(true)
  }

  // Toggle top selling status
  const toggleTopSelling = (productId) => {
    const currentStatus = isProductTopSelling(productId)
    const newStatus = !currentStatus

    // Check limit
    if (newStatus && topSellingProducts.length >= MAX_TOP_SELLING) {
      toast.error(`Maximum ${MAX_TOP_SELLING} top selling products allowed. Remove one first.`)
      return
    }

    setPendingChanges(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        topSelling: newStatus
      }
    }))
    setHasChanges(true)
  }

  // Save all changes
  const saveChanges = async () => {
    try {
      // Apply all pending changes to inventory via Redux thunks
      for (const [productId, changes] of Object.entries(pendingChanges)) {
        const product = inventory.find(p => p.id === parseInt(productId) || p._id === productId)
        if (product) {
          await dispatch(updateAdminProduct({
            productId: product._id || product.id,
            productData: { ...product, ...changes }
          })).unwrap()
        }
      }

      // Clear pending changes
      setPendingChanges({})
      setHasChanges(false)

      // Refresh products list
      dispatch(fetchProducts())
      toast.success('Changes saved successfully! Customer pages will now show updated products.')
    } catch (error) {
      toast.error(error || 'Failed to save changes')
    }
  }

  // Discard changes
  const discardChanges = () => {
    setPendingChanges({})
    setHasChanges(false)
    toast('Changes discarded')
  }

  const clearSelections = () => {
    const updatedChanges = { ...pendingChanges }

    inventory.forEach((product) => {
      const productKey = product.id || product._id
      const isFeatured = isProductFeatured(productKey)
      const isTopSelling = isProductTopSelling(productKey)

      if (isFeatured || isTopSelling) {
        updatedChanges[productKey] = {
          ...updatedChanges[productKey],
          ...(isFeatured ? { featured: false } : {}),
          ...(isTopSelling ? { topSelling: false } : {})
        }
      }
    })

    setPendingChanges(updatedChanges)
    setHasChanges(true)
    toast.success('Cleared Featured and Top Selling selections. Click save to apply.')
  }

  const canClearSelections = featuredProducts.length > 0 || topSellingProducts.length > 0

  // Auto-select top selling products based on revenue data
  const autoSelectTopSelling = () => {
    // Calculate product sales from orders
    const productSales = {}

    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productId = item.id || item._id
          if (!productSales[productId]) {
            productSales[productId] = {
              id: productId,
              revenue: 0,
              quantity: 0,
              name: item.name
            }
          }
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 1)
          productSales[productId].quantity += (item.quantity || 1)
        })
      }
    })

    // Sort by revenue (descending) and get top 10
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, MAX_TOP_SELLING)

    // Update pending changes to mark these as top selling
    const updatedChanges = { ...pendingChanges }

    // First, clear all existing top selling selections
    inventory.forEach((product) => {
      const productKey = product.id || product._id
      if (isProductTopSelling(productKey)) {
        updatedChanges[productKey] = {
          ...updatedChanges[productKey],
          topSelling: false
        }
      }
    })

    // Then, mark the top products as top selling
    topProducts.forEach((topProduct) => {
      const product = inventory.find(p => (p.id === topProduct.id || p._id === topProduct.id))
      if (product) {
        const productKey = product.id || product._id
        updatedChanges[productKey] = {
          ...updatedChanges[productKey],
          topSelling: true
        }
      }
    })

    setPendingChanges(updatedChanges)
    setHasChanges(true)
    toast.success(`Auto-selected top ${topProducts.length} selling products based on revenue data. Click save to apply.`)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="featured-products-page">
      <div className="page-header">
        <div>
          <h1>Featured & Top Selling Products</h1>
          <p>Select products to display on the customer home page</p>
        </div>

        {/* Save Button */}
        <div className="header-actions">
          {hasChanges && (
            <button className="btn btn-outline" onClick={discardChanges}>
              <FiX /> Discard
            </button>
          )}
          <button
            className={`btn btn-primary save-btn ${hasChanges ? 'has-changes' : ''}`}
            onClick={saveChanges}
            disabled={!hasChanges}
          >
            <FiSave /> Save Changes
          </button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <motion.div
          className="unsaved-warning"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiAlertCircle />
          <span>You have unsaved changes. Click "Save Changes" to apply them to customer pages.</span>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <motion.div
          className={`stat-card glass-card ${activeTab === 'featured' ? 'active' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setActiveTab('featured')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <FiStar />
          </div>
          <div className="stat-content">
            <div className="stat-value">{featuredProducts.length} / {MAX_FEATURED}</div>
            <div className="stat-label">Featured Products</div>
            {featuredProducts.length > MAX_FEATURED && (
              <div className="stat-info" style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                (Only first {MAX_FEATURED} shown in carousel)
              </div>
            )}
          </div>
          {featuredProducts.length < MAX_FEATURED && (
            <div className="stat-warning">Select {MAX_FEATURED - featuredProducts.length} more</div>
          )}
        </motion.div>

        <motion.div
          className={`stat-card glass-card ${activeTab === 'topselling' ? 'active' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setActiveTab('topselling')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 90%)' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <div className="stat-value">{topSellingProducts.length} / {MAX_TOP_SELLING}</div>
            <div className="stat-label">Top Selling Products</div>
          </div>
          {topSellingProducts.length < MAX_TOP_SELLING && (
            <div className="stat-warning">Select {MAX_TOP_SELLING - topSellingProducts.length} more</div>
          )}
        </motion.div>
      </div>

      <div className="stats-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
        {activeTab === 'topselling' && (
          <button className="btn btn-primary" onClick={autoSelectTopSelling}>
            <FiTrendingUp /> Auto-Select from Revenue Data
          </button>
        )}
        <button className="btn btn-outline" onClick={clearSelections} disabled={!canClearSelections}>
          <FiX /> Clear selections
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'featured' ? (
        <div className="section-card glass-card">
          <div className="section-header">
            <div>
              <h2>Featured Products Selection</h2>
              <p>Select products to display in the "Featured Collection" section. Only the first {MAX_FEATURED} will be shown in the carousel on the home page.</p>
            </div>
          </div>

          {/* Currently Selected Featured Products */}
          {featuredProducts.length > 0 && (
            <div className="selected-products-preview">
              <h4>Currently Selected ({featuredProducts.length}/{MAX_FEATURED}):</h4>
              <div className="selected-products-list">
                {featuredProducts.map((product, index) => {
                  const productKey = product.id || product._id
                  return (
                  <div key={productKey} className="selected-product-chip">
                    <span className="chip-number">{index + 1}</span>
                    <img src={getImageSrc(product.image)} alt={product.name} onError={(e) => e.target.style.display = 'none'} />
                    <span className="chip-name">{product.name}</span>
                    <button onClick={() => toggleFeatured(productKey)} className="chip-remove">
                      <FiX />
                    </button>
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
              />
              Selected Only
            </label>
          </div>

          {/* Products Grid */}
          <div className="products-selection-grid">
            {paginatedProducts.map((product) => {
              const productKey = product.id || product._id
              const isFeatured = isProductFeatured(productKey)
              return (
                <motion.div
                  key={productKey}
                  className={`product-selection-card ${isFeatured ? 'featured' : ''}`}
                  whileHover={{ y: -4 }}
                >
                  <div className="product-image">
                    <img src={getImageSrc(product.image)} alt={product.name} onError={(e) => e.target.style.display = 'none'} />
                    {isFeatured && (
                      <div className="featured-badge">
                        <FiStar /> Featured
                      </div>
                    )}
                  </div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="category">{product.category}</p>
                    <p className="price">{formatPrice(product.price)}</p>
                  </div>
                  <button
                    className={`feature-btn ${isFeatured ? 'active' : ''}`}
                    onClick={() => toggleFeatured(productKey)}
                  >
                    {isFeatured ? <FiCheck /> : <FiStar />}
                    {isFeatured ? 'Selected' : 'Add to Featured'}
                  </button>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {filteredProducts.length > itemsPerPage && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft /> Previous
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="pagination-ellipsis">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <FiSearch size={48} />
              <p>No products found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="section-card glass-card">
          <div className="section-header">
            <div>
              <h2>Top Selling Products Selection</h2>
              <p>Select up to {MAX_TOP_SELLING} products to display in the "Top Selling" section on home page</p>
            </div>
          </div>

          {/* Currently Selected Top Selling Products */}
          {topSellingProducts.length > 0 && (
            <div className="selected-products-preview">
              <h4>Currently Selected ({topSellingProducts.length}/{MAX_TOP_SELLING}):</h4>
              <div className="selected-products-list">
                {topSellingProducts.map((product, index) => {
                  const productKey = product.id || product._id
                  return (
                  <div key={productKey} className="selected-product-chip">
                    <span className="chip-number">{index + 1}</span>
                    <img src={getImageSrc(product.image)} alt={product.name} onError={(e) => e.target.style.display = 'none'} />
                    <span className="chip-name">{product.name}</span>
                    <button onClick={() => toggleTopSelling(productKey)} className="chip-remove">
                      <FiX />
                    </button>
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showTopSellingOnly}
                onChange={(e) => setShowTopSellingOnly(e.target.checked)}
              />
              Selected Only
            </label>
          </div>

          {/* Products Grid */}
          <div className="products-selection-grid">
            {paginatedProducts.map((product) => {
              const productKey = product.id || product._id
              const isTopSelling = isProductTopSelling(productKey)
              return (
                <motion.div
                  key={productKey}
                  className={`product-selection-card ${isTopSelling ? 'featured' : ''}`}
                  whileHover={{ y: -4 }}
                >
                  <div className="product-image">
                    <img src={getImageSrc(product.image)} alt={product.name} onError={(e) => e.target.style.display = 'none'} />
                    {isTopSelling && (
                      <div className="featured-badge" style={{ background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 90%)' }}>
                        <FiTrendingUp /> Top Selling
                      </div>
                    )}
                  </div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="category">{product.category}</p>
                    <p className="price">{formatPrice(product.price)}</p>
                  </div>
                  <button
                    className={`feature-btn ${isTopSelling ? 'active' : ''}`}
                    onClick={() => toggleTopSelling(productKey)}
                    style={isTopSelling ? { background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 90%)' } : {}}
                  >
                    {isTopSelling ? <FiCheck /> : <FiTrendingUp />}
                    {isTopSelling ? 'Selected' : 'Add to Top Selling'}
                  </button>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {filteredProducts.length > itemsPerPage && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft /> Previous
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="pagination-ellipsis">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <FiSearch size={48} />
              <p>No products found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FeaturedProducts
