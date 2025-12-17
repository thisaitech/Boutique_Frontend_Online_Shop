import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiImage, FiStar, FiTrendingUp, FiDroplet, FiEye, FiEyeOff, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import {
  fetchProducts,
  selectProducts,
  selectProductsLoading
} from '../../store/slices/productSlice'
import {
  createProduct,
  updateAdminProduct,
  deleteAdminProduct
} from '../../store/slices/adminSlice'
import { selectSiteConfig } from '../../store/slices/siteConfigSlice'
import { getImageSrc } from '../../utils/imageUtils'
import toast from 'react-hot-toast'
import './AdminPages.css'

// Category options for Women's products
const womenCategories = [
  { id: 'sarees', name: 'Sarees' },
  { id: 'lehengas', name: 'Lehengas' },
  { id: 'kurtis', name: 'Kurtis' },
  { id: 'blouses', name: 'Blouses' }
]

// Color and material options
const colors = ['Red', 'Blue', 'Green', 'Pink', 'Yellow', 'Purple', 'Black', 'White', 'Gold', 'Silver', 'Maroon', 'Orange', 'Brown']
const materials = ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Velvet', 'Net', 'Satin', 'Crepe', 'Organza']

// Category types for filtering
const categoryTypes = {
  women: ['sarees', 'lehengas', 'kurtis', 'blouses']
}

function WomenInventory() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const inventory = useSelector(selectProducts)
  const siteConfig = useSelector(selectSiteConfig)
  const isLoading = useSelector(selectProductsLoading)

  // Fetch products on mount
  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectMode, setSelectMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    realPrice: '',
    color: '',
    material: '',
    description: '',
    image: '',
    inStock: true,
    featured: false,
    topSelling: false,
    availableSizes: [],
    colorVariants: []
  })

  // Color variant form state
  const [showColorVariantForm, setShowColorVariantForm] = useState(false)
  const [colorVariantData, setColorVariantData] = useState({
    color: '',
    images: ['']
  })

  // Filter only women's products
  const womenProducts = inventory.filter(product => categoryTypes.women.includes(product.category))

  // Get available sizes based on category
  const getAvailableSizes = (category) => {
    return siteConfig?.productSizes?.[category] || ['S', 'M', 'L', 'XL']
  }

  // Filter and sort products (newest first)
  const filteredProducts = womenProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !filterCategory || product.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      // Sort by ID descending (newer products have higher IDs)
      return (b.id || 0) - (a.id || 0)
    })

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, startIndex, endIndex])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, filterCategory])

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleMainImageFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setFormData(prev => ({ ...prev, image: dataUrl }))
  }

  const handleVariantImageFile = async (index, file) => {
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setColorVariantData(prev => {
      const images = [...prev.images]
      images[index] = dataUrl
      return { ...prev, images }
    })
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || '',
      realPrice: product.realPrice || '',
      color: product.color,
      material: product.material,
      description: product.description,
      image: product.image,
      inStock: product.inStock,
      featured: product.featured,
      topSelling: product.topSelling || false,
      availableSizes: product.availableSizes || getAvailableSizes(product.category),
      colorVariants: product.colorVariants || []
    })
    setShowModal(true)
  }

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteAdminProduct(productId)).unwrap()
        toast.success('Product deleted successfully')
        // Refresh the product list to update UI
        dispatch(fetchProducts())
      } catch (error) {
        toast.error(error || 'Failed to delete product')
      }
    }
  }

  const toggleProductVisibility = async (product) => {
    try {
      await dispatch(updateAdminProduct({
        productId: product._id || product.id,
        productData: { ...product, showInStore: !product.showInStore }
      })).unwrap()
      dispatch(fetchProducts())
      toast.success(`Product ${product.showInStore ? 'hidden from' : 'shown on'} customer page`)
    } catch (error) {
      toast.error(error || 'Failed to update product')
    }
  }

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products to delete')
      return
    }
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      try {
        for (const id of selectedProducts) {
          await dispatch(deleteAdminProduct(id)).unwrap()
        }
        setSelectedProducts([])
        setSelectMode(false)
        toast.success(`${selectedProducts.length} product(s) deleted successfully`)
      } catch (error) {
        toast.error(error || 'Failed to delete some products')
      }
    }
  }

  const handleBulkToggleVisibility = async (show) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products')
      return
    }
    try {
      for (const id of selectedProducts) {
        const product = filteredProducts.find(p => p.id === id || p._id === id)
        if (product) {
          await dispatch(updateAdminProduct({
            productId: product._id || product.id,
            productData: { ...product, showInStore: show }
          })).unwrap()
        }
      }
      dispatch(fetchProducts())
      toast.success(`${selectedProducts.length} product(s) ${show ? 'shown on' : 'hidden from'} customer page`)
      setSelectedProducts([])
      setSelectMode(false)
    } catch (error) {
      toast.error(error || 'Failed to update some products')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      realPrice: formData.realPrice ? parseFloat(formData.realPrice) : null,
      discount: formData.originalPrice
        ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
        : 0,
      rating: editingProduct?.rating || 4.5,
      reviews: editingProduct?.reviews || 0,
      availableSizes: formData.availableSizes.length > 0 ? formData.availableSizes : getAvailableSizes(formData.category),
      colorVariants: formData.colorVariants
    }

    try {
      if (editingProduct) {
        await dispatch(updateAdminProduct({
          productId: editingProduct._id || editingProduct.id,
          productData
        })).unwrap()
        toast.success('Product updated successfully')
      } else {
        await dispatch(createProduct(productData)).unwrap()
        toast.success('Product added successfully')
      }

      dispatch(fetchProducts())
      setShowModal(false)
      setEditingProduct(null)
      resetForm()
    } catch (error) {
      toast.error(error || 'Failed to save product')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      originalPrice: '',
      realPrice: '',
      color: '',
      material: '',
      description: '',
      image: '',
      inStock: true,
      featured: false,
      topSelling: false,
      availableSizes: [],
      colorVariants: []
    })
    setShowColorVariantForm(false)
    setColorVariantData({ color: '', images: [''] })
  }

  // Color variant handlers
  const handleAddColorVariant = () => {
    if (!colorVariantData.color || !colorVariantData.images[0]) {
      toast.error('Please enter color name and at least one image URL')
      return
    }
    const filteredImages = colorVariantData.images.filter(img => img.trim() !== '')
    setFormData(prev => ({
      ...prev,
      colorVariants: [...prev.colorVariants, { color: colorVariantData.color, images: filteredImages }]
    }))
    setColorVariantData({ color: '', images: [''] })
    setShowColorVariantForm(false)
    toast.success('Color variant added')
  }

  const handleRemoveColorVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      colorVariants: prev.colorVariants.filter((_, i) => i !== index)
    }))
    toast.success('Color variant removed')
  }

  const handleColorVariantImageChange = (index, value) => {
    setColorVariantData(prev => {
      const newImages = [...prev.images]
      newImages[index] = value
      return { ...prev, images: newImages }
    })
  }

  const addColorVariantImageField = () => {
    setColorVariantData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }))
  }

  const removeColorVariantImageField = (index) => {
    setColorVariantData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSizeToggle = (size) => {
    setFormData(prev => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter(s => s !== size)
        : [...prev.availableSizes, size]
    }))
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="inventory-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h2>Women's Collection</h2>
          <p>{womenProducts.length} products total</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/add-product?type=women')}>
          <FiPlus />
          Add Women's Product
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar glass-card">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search women's products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">All Women's Categories</option>
          {womenCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <div className="bulk-actions">
          {!selectMode ? (
            <button className="btn btn-outline" onClick={() => setSelectMode(true)}>
              Select Products
            </button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={toggleSelectAll}>
                {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedProducts.length > 0 && (
                <>
                  <button className="btn btn-outline" onClick={() => handleBulkToggleVisibility(true)}>
                    <FiEye /> Show Selected
                  </button>
                  <button className="btn btn-outline" onClick={() => handleBulkToggleVisibility(false)}>
                    <FiEyeOff /> Hide Selected
                  </button>
                  <button className="btn btn-danger" onClick={handleBulkDelete}>
                    <FiTrash2 /> Delete Selected ({selectedProducts.length})
                  </button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => {
                setSelectMode(false)
                setSelectedProducts([])
              }}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              {selectMode && <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>}
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product.id}>
                {selectMode && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                  </td>
                )}
                <td>
                  <div className="product-cell">
                    <img src={getImageSrc(product.image)} alt={product.name} onError={(e) => e.target.style.display = 'none'} />
                    <div>
                      <span className="product-name">{product.name}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="category-badge">{product.category}</span>
                </td>
                <td>
                  <div className="price-cell">
                    <span className="current">{formatPrice(product.price)}</span>
                    {product.discount > 0 && (
                      <span className="original">{formatPrice(product.price + product.discount)}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`stock-badge ${product.inStock ? 'in-stock' : 'out-stock'}`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div className="status-badges">
                    {product.featured && (
                      <span className="status-badge featured">
                        <FiStar /> Featured
                      </span>
                    )}
                    {product.topSelling && (
                      <span className="status-badge top-selling">
                        <FiTrendingUp /> Top Selling
                      </span>
                    )}
                    {!product.featured && !product.topSelling && (
                      <span className="status-badge regular">Regular</span>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className={`visibility-toggle ${product.showInStore !== false ? 'visible' : 'hidden'}`}
                    onClick={() => toggleProductVisibility(product)}
                    title={product.showInStore !== false ? 'Hide from customer page' : 'Show on customer page'}
                  >
                    {product.showInStore !== false ? <FiEye /> : <FiEyeOff />}
                  </button>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      type="button"
                      className="action-btn edit"
                      onClick={() => navigate(`/admin/edit-product/${product.id || product._id}`)}
                      title="Edit product"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      className="action-btn delete"
                      onClick={() => handleDelete(product.id || product._id)}
                      title="Delete product"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="no-results">
            <p>No women's products found</p>
          </div>
        )}

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
      </div>

      {/* Product Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Women\'s Product' : 'Add New Women\'s Product'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="">Select category</option>
                      {womenCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Real Price / Cost Price (₹) *</label>
                    <input
                      type="number"
                      name="realPrice"
                      value={formData.realPrice}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter cost price"
                      required
                    />
                    <small className="discount-preview">This is your actual cost for this product</small>
                  </div>

                  <div className="form-group">
                    <label>Selling Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter selling price"
                      required
                    />
                    {formData.realPrice && formData.price && (
                      <small className="discount-preview" style={{ color: parseFloat(formData.price) > parseFloat(formData.realPrice) ? '#10b981' : '#ef4444' }}>
                        Profit: ₹{(parseFloat(formData.price) - parseFloat(formData.realPrice)).toFixed(2)}
                        ({((parseFloat(formData.price) - parseFloat(formData.realPrice)) / parseFloat(formData.realPrice) * 100).toFixed(1)}%)
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Offer Price (₹) - for discount display</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter offer price (optional)"
                    />
                    {formData.originalPrice && formData.price && (
                      <small className="discount-preview">
                        Discount: {Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)}% off
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Color</label>
                    <select
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">Select color</option>
                      {colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Material</label>
                    <select
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">Select material</option>
                      {materials.map(material => (
                        <option key={material} value={material}>{material}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Main Image URL</label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="/images/product-img-1.jpg"
                    />
                    <div className="file-upload">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleMainImageFile}
                        id="women-main-image-file"
                      />
                      <label htmlFor="women-main-image-file" className="file-label">
                        Upload from camera / device
                      </label>
                    </div>
                  </div>

                  {/* Color Variants Section */}
                  <div className="form-group full-width">
                    <label>
                      <FiDroplet style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Color Variants (for product detail page)
                    </label>

                    {/* Existing color variants */}
                    {formData.colorVariants.length > 0 && (
                      <div className="color-variants-list">
                        {formData.colorVariants.map((variant, index) => {
                          // Handle both string and object formats for variant.images
                          const firstImage = typeof variant.images[0] === 'string'
                            ? variant.images[0]
                            : (variant.images[0]?.url || '')
                          return (
                          <div key={index} className="color-variant-item">
                            <div className="variant-preview">
                              <img src={getImageSrc(firstImage)} alt={variant.color} onError={(e) => e.target.style.display = 'none'} />
                              <div className="variant-info">
                                <span className="variant-color">{variant.color}</span>
                                <span className="variant-images-count">{variant.images.length} image(s)</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="remove-variant-btn"
                              onClick={() => handleRemoveColorVariant(index)}
                            >
                              <FiX />
                            </button>
                          </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add new color variant form */}
                    {showColorVariantForm ? (
                      <div className="add-variant-form">
                        <div className="variant-form-row">
                          <select
                            value={colorVariantData.color}
                            onChange={(e) => setColorVariantData(prev => ({ ...prev, color: e.target.value }))}
                            className="input-field"
                          >
                            <option value="">Select color</option>
                            {colors.map(color => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                        </div>

                        <div className="variant-images-inputs">
                          {colorVariantData.images.map((img, index) => (
                            <div key={index} className="variant-image-row">
                              <input
                                type="text"
                                value={img}
                                onChange={(e) => handleColorVariantImageChange(index, e.target.value)}
                                className="input-field"
                                placeholder={`Image URL ${index + 1}`}
                              />
                              <div className="file-upload compact">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) => handleVariantImageFile(index, e.target.files?.[0])}
                                  id={`variant-file-${index}`}
                                />
                                <label htmlFor={`variant-file-${index}`} className="file-label">
                                  Camera / device
                                </label>
                              </div>
                              {colorVariantData.images.length > 1 && (
                                <button
                                  type="button"
                                  className="remove-image-btn"
                                  onClick={() => removeColorVariantImageField(index)}
                                >
                                  <FiX />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            className="add-image-btn"
                            onClick={addColorVariantImageField}
                          >
                            <FiPlus /> Add Another Image
                          </button>
                        </div>

                        <div className="variant-form-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setShowColorVariantForm(false)
                              setColorVariantData({ color: '', images: [''] })
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleAddColorVariant}
                          >
                            Add Variant
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="add-variant-btn"
                        onClick={() => setShowColorVariantForm(true)}
                      >
                        <FiPlus /> Add Color Variant
                      </button>
                    )}
                    <small className="size-hint">Add different color options with their images. These will appear as color swatches in the product detail page.</small>
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="input-field"
                      rows="3"
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="inStock"
                        checked={formData.inStock}
                        onChange={handleInputChange}
                      />
                      <span>In Stock</span>
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                      />
                      <span>Featured Product</span>
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="topSelling"
                        checked={formData.topSelling}
                        onChange={handleInputChange}
                      />
                      <span>Top Selling</span>
                    </label>
                  </div>

                  {formData.category && (
                    <div className="form-group full-width">
                      <label>Available Sizes</label>
                      <div className="size-selector">
                        {getAvailableSizes(formData.category).map(size => (
                          <button
                            key={size}
                            type="button"
                            className={`size-btn ${formData.availableSizes.includes(size) ? 'selected' : ''}`}
                            onClick={() => handleSizeToggle(size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      <small className="size-hint">Click to toggle sizes available for this product</small>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WomenInventory
