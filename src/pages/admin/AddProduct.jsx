import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiPlus, FiX, FiImage, FiStar, FiTrendingUp, FiDroplet,
  FiArrowLeft, FiCheck, FiUser, FiHeart, FiShoppingBag, FiEye, FiLoader
} from 'react-icons/fi'
import { createProduct, adminFetchSiteConfig, selectAdminSiteConfig } from '../../store/slices/adminSlice'
import { getImageSrc, uploadImageToS3, validateImageFile } from '../../utils/imageUtils'
import toast from 'react-hot-toast'
import './AdminPages.css'

// Category definitions (moved from products.js)
const womenCategories = [
  { id: 'sarees', name: 'Sarees' },
  { id: 'lehengas', name: 'Lehengas' },
  { id: 'kurtis', name: 'Kurtis' },
  { id: 'blouses', name: 'Blouses' }
]

const kidsCategories = [
  { id: 'kids-frocks', name: 'Frocks' },
  { id: 'kids-lehengas', name: 'Lehengas' },
  { id: 'kids-gowns', name: 'Gowns' },
  { id: 'kids-ethnic', name: 'Ethnic Wear' },
  { id: 'kids-party', name: 'Party Wear' }
]

const fashionCategories = [
  { id: 'ornaments', name: 'Ornaments' },
  { id: 'handbags', name: 'Handbags' },
  { id: 'clutches', name: 'Clutches' },
  { id: 'jewelry', name: 'Jewelry' },
  { id: 'scarves', name: 'Scarves' },
  { id: 'belts', name: 'Belts' }
]

const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Black', 'White', 'Gold', 'Silver', 'Maroon', 'Navy', 'Beige', 'Brown', 'Cream', 'Magenta', 'Teal', 'Coral', 'Peach']

const materials = ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Crepe', 'Velvet', 'Net', 'Satin', 'Linen', 'Rayon', 'Banarasi', 'Chanderi', 'Organza', 'Tussar']

// Fashion-specific materials
const fashionMaterials = ['Leather', 'Faux Leather', 'Canvas', 'Fabric', 'Metal', 'Gold Plated', 'Silver', 'Brass', 'Beads', 'Crystal', 'Pearl', 'Acrylic', 'Silk', 'Cotton']

function AddProduct() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch()
  const siteConfig = useSelector(selectAdminSiteConfig)

  // Fetch site config on mount
  useEffect(() => {
    dispatch(adminFetchSiteConfig())
  }, [dispatch])

  // Get initial category type from URL params (women, kids, fashion)
  const initialCategoryType = searchParams.get('type') || 'women'

  const [activeTab, setActiveTab] = useState(initialCategoryType)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    discount: '',
    real_price: '',
    tax: '',
    stockCount: 10,
    color: '',
    material: '',
    description: '',
    image: '',
    inStock: true,
    showInStore: true,
    featured: false,
    topSelling: false,
    availableSizes: [],
    colorVariants: []
  })

  // Color variant form state
  const [showColorVariantForm, setShowColorVariantForm] = useState(false)
  const [colorVariantData, setColorVariantData] = useState({
    color: '',
    images: [{ url: '', color: '' }]
  })

  // Image upload state
  const [isUploadingMain, setIsUploadingMain] = useState(false)
  const [isUploadingVariant, setIsUploadingVariant] = useState({})
  const [mainImageFile, setMainImageFile] = useState(null) // Store file for upload on submit
  const [variantImageFiles, setVariantImageFiles] = useState({}) // Store variant files for upload on submit
  const [isSaving, setIsSaving] = useState(false) // Track save progress

  // Get folder path based on active tab/category
  const getImageFolder = () => {
    if (formData.category) return formData.category
    return activeTab
  }

  const handleMainImageFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      e.target.value = '' // Clear the input
      return
    }

    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file)
    
    // Store file for upload on submit, show preview
    setMainImageFile(file)
    setFormData(prev => ({ 
      ...prev, 
      _imagePreview: previewUrl,
      image: '' // Clear any previous S3 URL
    }))
    toast.success('Image selected! Will upload when you click Add Product.')
  }

  const handleVariantImageFile = (index, file) => {
    if (!file) return

    // Validate file type and size
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file)
    
    // Store file for upload on submit
    setVariantImageFiles(prev => ({ ...prev, [index]: file }))
    
    setColorVariantData(prev => {
      const images = [...prev.images]
      images[index] = { ...images[index], _preview: previewUrl, _hasNewFile: true }
      return { ...prev, images }
    })
    toast.success('Variant image selected! Will upload when you click Add Product.')
  }

  // Update URL when tab changes
  useEffect(() => {
    navigate(`/admin/add-product?type=${activeTab}`, { replace: true })
    // Reset category when tab changes
    setFormData(prev => ({ ...prev, category: '' }))
  }, [activeTab, navigate])

  // Get categories based on active tab
  const getCategories = () => {
    switch (activeTab) {
      case 'women':
        return womenCategories
      case 'kids':
        return kidsCategories
      case 'fashion':
        return fashionCategories
      default:
        return womenCategories
    }
  }

  // Get materials based on active tab
  const getMaterials = () => {
    if (activeTab === 'fashion') {
      return fashionMaterials
    }
    return materials
  }

  // Get available sizes based on category
  const getAvailableSizes = (category) => {
    if (activeTab === 'kids') {
      return siteConfig?.productSizes?.[category] || ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y']
    }
    if (activeTab === 'fashion') {
      if (category === 'handbags' || category === 'clutches') {
        return ['Small', 'Medium', 'Large']
      }
      if (category === 'jewelry' || category === 'ornaments') {
        return ['Adjustable', 'Fixed Size']
      }
      if (category === 'scarves') {
        return ['Standard', 'Long', 'Square']
      }
      if (category === 'belts') {
        return ['S', 'M', 'L', 'XL', 'Free Size']
      }
      return ['One Size']
    }
    return siteConfig?.productSizes?.[category] || ['S', 'M', 'L', 'XL', 'XXL']
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.category || !formData.real_price) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check if image is selected
    if (!mainImageFile && !formData.image) {
      toast.error('Please select a product image')
      return
    }

    // Auto-add pending color variant if form is open with data
    let colorVariantsToSave = [...formData.colorVariants]
    if (showColorVariantForm) {
      // Check if any image file is selected
      const hasFile = Object.keys(variantImageFiles).length > 0
      const hasPreview = colorVariantData.images.some(img => img._hasNewFile || img._preview)
      const hasImage = hasFile || hasPreview
      const hasColor = colorVariantData.color && colorVariantData.color.trim() !== ''
      
      console.log('Checking variant form:', { hasFile, hasPreview, hasImage, hasColor, variantImageFiles, colorVariantData })
      
      if (hasColor && hasImage) {
        // Automatically add the pending variant
        const variantImages = colorVariantData.images
          .map((img, idx) => ({
            url: img.url || '',
            _preview: img._preview,
            _hasNewFile: img._hasNewFile || !!variantImageFiles[idx],
            _file: variantImageFiles[idx] || null
          }))
          .filter(img => img.url || img._hasNewFile || img._file)
        
        if (variantImages.length > 0) {
          colorVariantsToSave.push({
            color: colorVariantData.color,
            images: variantImages,
            _pendingUpload: true
          })
          toast('Auto-adding your pending color variant...', { icon: 'ℹ️' })
        }
      } else if (hasImage && !hasColor) {
        toast.error('Please select a color for your variant image, or cancel the variant form.')
        return
      }
      // If no image and no color, just ignore the open form
    }

    setIsSaving(true)
    const folder = getImageFolder()
    let imageUrl = formData.image

    // Upload main image to S3 first (if file selected)
    if (mainImageFile) {
      try {
        toast('Uploading main image to S3...', { icon: '⬆️' })
        const result = await uploadImageToS3(mainImageFile, folder)
        imageUrl = result.url
        console.log('Main image uploaded to S3:', imageUrl)
        toast.success('Main image uploaded!')
      } catch (error) {
        console.error('S3 upload failed for main image:', error)
        toast.error('Failed to upload main image to S3. Product not saved.')
        setIsSaving(false)
        return // Don't proceed if S3 upload fails
      }
    }

    // Upload all variant images to S3
    let finalColorVariants = []
    if (colorVariantsToSave.length > 0) {
      toast('Uploading variant images to S3...', { icon: '⬆️' })
      
      for (const variant of colorVariantsToSave) {
        const uploadedImages = []
        
        for (const img of variant.images) {
          if (img._file && img._hasNewFile) {
            // Upload file to S3
            try {
              const result = await uploadImageToS3(img._file, folder)
              uploadedImages.push(result.url)
              console.log('Variant image uploaded:', result.url)
            } catch (error) {
              console.error('S3 upload failed for variant image:', error)
              toast.error(`Failed to upload variant image. Product not saved.`)
              setIsSaving(false)
              return // Don't proceed if any S3 upload fails
            }
          } else if (img.url && img.url.trim() !== '') {
            // Use existing URL
            uploadedImages.push(img.url)
          }
        }
        
        if (uploadedImages.length > 0) {
          finalColorVariants.push({
            color: variant.color,
            images: uploadedImages
          })
        }
      }
      toast.success('All variant images uploaded!')
    }

    const productData = {
      ...formData,
      image: imageUrl,
      price: parseFloat(formData.price),
      discount: formData.discount ? parseFloat(formData.discount) : 0,
      real_price: parseFloat(formData.real_price),
      tax: formData.tax ? parseFloat(formData.tax) : 0,
      stockCount: parseInt(formData.stockCount || 0, 10),
      reviews: 0,
      availableSizes: formData.availableSizes.length > 0 ? formData.availableSizes : getAvailableSizes(formData.category),
      colorVariants: finalColorVariants
    }

    // Remove temporary fields before sending to backend
    delete productData._imagePreview

    console.log('Saving product with S3 image URL:', productData.image)
    console.log('Color variants being saved:', JSON.stringify(productData.colorVariants, null, 2))

    try {
      await dispatch(createProduct(productData)).unwrap()
      toast.success('Product added successfully!')

      // Navigate back to respective inventory
      switch (activeTab) {
        case 'women':
          navigate('/admin/women')
          break
        case 'kids':
          navigate('/admin/kids')
          break
        case 'fashion':
          navigate('/admin/fashion')
          break
        default:
          navigate('/admin/inventory')
      }
    } catch (error) {
      toast.error(error || 'Failed to add product')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      originalPrice: '',
      realPrice: '',
      tax: '',
      stockCount: 10,
      color: '',
      material: '',
      description: '',
      image: '',
      inStock: true,
      showInStore: true,
      featured: false,
      topSelling: false,
      availableSizes: [],
      colorVariants: []
    })
    setMainImageFile(null) // Clear selected file
    setShowColorVariantForm(false)
    setColorVariantData({ color: '', images: [{ url: '', color: '' }] })
  }

  // Color variant handlers
  const handleAddColorVariant = () => {
    console.log('Adding color variant, colorVariantData:', colorVariantData)
    console.log('variantImageFiles:', variantImageFiles)
    
    // Check if at least one image is provided (either URL or selected file)
    const hasImage = colorVariantData.images[0]?.url || 
                     colorVariantData.images[0]?._hasNewFile ||
                     variantImageFiles[0]
    
    if (!colorVariantData.color || !hasImage) {
      toast.error('Please enter color name and select at least one image')
      return
    }
    
    // Store variant with file references (will upload on submit)
    const variantImages = colorVariantData.images
      .map((img, idx) => ({
        url: img.url || '',
        _preview: img._preview,
        _hasNewFile: img._hasNewFile,
        _fileIndex: variantImageFiles[idx] ? idx : null,
        _file: variantImageFiles[idx] || null
      }))
      .filter(img => img.url || img._hasNewFile)
    
    console.log('Variant images to add:', variantImages)
    
    setFormData(prev => {
      const newVariants = [...prev.colorVariants, { 
        color: colorVariantData.color, 
        images: variantImages,
        _pendingUpload: true // Flag to indicate images need S3 upload
      }]
      console.log('Updated colorVariants in formData:', newVariants)
      return {
        ...prev,
        colorVariants: newVariants
      }
    })
    
    // Reset variant form
    setColorVariantData({ color: '', images: [{ url: '', color: '' }] })
    setVariantImageFiles({})
    setShowColorVariantForm(false)
    toast.success('Color variant added! Images will upload when you click Add Product.')
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
      newImages[index] = { ...newImages[index], url: value }
      return { ...prev, images: newImages }
    })
  }

  const handleColorVariantImageColorChange = (index, color) => {
    setColorVariantData(prev => {
      const newImages = [...prev.images]
      newImages[index] = { ...newImages[index], color: color }
      return { ...prev, images: newImages }
    })
  }

  const addColorVariantImageField = () => {
    setColorVariantData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', color: '' }]
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

  const tabs = [
    { id: 'women', label: 'Women', icon: FiUser, color: '#E91E8C' },
    { id: 'kids', label: 'Kids', icon: FiHeart, color: '#FF6B6B' },
    { id: 'fashion', label: 'Fashion', icon: FiShoppingBag, color: '#9C27B0' }
  ]

  return (
    <div className="add-product-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
            title="Go Back"
          >
            <FiArrowLeft />
          </button>
          <div>
            <h2>Add New Product</h2>
            <p>Add products to {activeTab === 'women' ? "Women's Collection" : activeTab === 'kids' ? "Kids Collection" : "Fashion & Accessories"}</p>
          </div>
        </div>
      </div>

      {/* Category Type Tabs */}
      <div className="category-tabs glass-card">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            className={`category-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              '--tab-color': tab.color
            }}
          >
            <tab.icon className="tab-icon" />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                className="tab-mercury"
                layoutId="tabMercury"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Product Form */}
      <motion.div
        className="add-product-form-container glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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
                placeholder="Enter product name"
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
                <option value="">Select {activeTab} category</option>
                {getCategories().map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Real Price / Cost Price (₹) *</label>
              <input
                type="number"
                name="real_price"
                value={formData.real_price}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter cost price"
                required
                step="0.01"
              />
              <small className="discount-preview">Your actual cost for this product (for records only)</small>
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
                step="0.01"
              />
              <small className="discount-preview">Price shown to customers</small>
              {formData.realPrice && formData.price && (
                <small className="discount-preview" style={{ color: parseFloat(formData.price) > parseFloat(formData.realPrice) ? '#10b981' : '#ef4444', marginTop: '5px', display: 'block' }}>
                  Profit: ₹{(parseFloat(formData.price) - parseFloat(formData.realPrice)).toFixed(2)}
                  ({((parseFloat(formData.price) - parseFloat(formData.realPrice)) / parseFloat(formData.realPrice) * 100).toFixed(1)}%)
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Tax Amount (₹)</label>
              <input
                type="number"
                name="tax"
                value={formData.tax}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter tax amount"
                step="0.01"
              />
              <small className="discount-preview">Tax amount for this product</small>
            </div>

            <div className="form-group">
              <label>Original Price (₹) - Optional</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter original price (for strikethrough)"
                step="0.01"
              />
              {formData.discount && formData.price && parseFloat(formData.discount) > parseFloat(formData.price) && (
                <small className="discount-preview" style={{ color: '#10b981' }}>
                  Discount: {Math.round(((parseFloat(formData.discount) - parseFloat(formData.price)) / parseFloat(formData.discount)) * 100)}% off
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Stock Count</label>
              <input
                type="number"
                name="stockCount"
                min="0"
                value={formData.stockCount}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter available quantity"
              />
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
                {getMaterials().map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>
                <FiImage style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Main Image URL
              </label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="input-field"
                placeholder="C:/Project/boutique/public/images/sarees/1.jpeg or http://..."
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                Full system path or URL - stored exactly as entered
              </small>
              <div className="variant-form-grid" style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                <div className="variant-form-row" style={{ flex: 1 }}>
                  <div className="file-upload">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      capture="environment"
                      onChange={handleMainImageFile}
                      id="add-main-image-file"
                      disabled={isUploadingMain}
                    />
                    <label htmlFor="add-main-image-file" className="file-label" style={{ opacity: isUploadingMain ? 0.6 : 1 }}>
                      {isUploadingMain ? (
                        <>
                          <FiLoader className="spin" style={{ marginRight: '8px' }} />
                          Uploading to S3...
                        </>
                      ) : mainImageFile ? (
                        <>
                          <FiCheck style={{ marginRight: '8px', color: 'green' }} />
                          Image selected: {mainImageFile.name.substring(0, 20)}...
                        </>
                      ) : (
                        'Select image (JPG, PNG, GIF, WebP)'
                      )}
                    </label>
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
                    Allowed: JPG, PNG, GIF, WebP (Max 10MB)
                  </small>
                </div>
                {(mainImageFile || formData._imagePreview) && (
                  <div className="image-preview-small" style={{ position: 'relative' }}>
                    <img 
                      src={formData._imagePreview || getImageSrc(formData.image)} 
                      alt="Preview"
                      style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', borderRadius: '8px', opacity: isUploadingMain ? 0.5 : 1 }}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = '/images/product-img-1.jpg'
                      }}
                    />
                    {isUploadingMain && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <FiLoader className="spin" size={24} />
                      </div>
                    )}
                  </div>
                )}
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
                    // Get the first image - could be a string URL or an object with _preview
                    const firstImg = variant.images[0]
                    const imgSrc = typeof firstImg === 'string' 
                      ? firstImg 
                      : (firstImg?._preview || firstImg?.url || '')
                    
                    return (
                      <div key={index} className="color-variant-item">
                        <div className="variant-preview">
                          {imgSrc ? (
                            <img src={getImageSrc(imgSrc)} alt={variant.color} />
                          ) : (
                            <div className="no-image-placeholder">No Image</div>
                          )}
                          <div className="variant-info">
                            <span className="variant-color">{variant.color}</span>
                            <span className="variant-images-count">{variant.images.length} image(s)</span>
                            {variant._pendingUpload && (
                              <span className="variant-pending">(will upload on save)</span>
                            )}
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
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flex: 1, alignItems: 'center' }}>
                          <div className="file-upload compact">
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.gif,.webp"
                              capture="environment"
                              onChange={(e) => handleVariantImageFile(index, e.target.files?.[0])}
                              id={`add-variant-file-${index}`}
                            />
                            <label htmlFor={`add-variant-file-${index}`} className="file-label">
                              {colorVariantData.images[index]?._hasNewFile ? 'File selected ✓' : 'Select image file'}
                            </label>
                          </div>
                          {img._preview && (
                            <div className="image-preview-small">
                              <img src={img._preview} alt={`Preview ${index + 1}`} onError={(e) => e.target.style.display = 'none'} />
                            </div>
                          )}
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
                        setColorVariantData({ color: '', images: [{ url: '', color: '' }] })
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
              <small className="size-hint">Add different color options with their images.</small>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
                rows="4"
                placeholder="Enter product description..."
              />
            </div>

            {/* Checkboxes */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleInputChange}
                />
                <span><FiCheck /> In Stock</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="showInStore"
                  checked={formData.showInStore}
                  onChange={handleInputChange}
                />
                <span><FiEye /> Show in customer app</span>
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
                <span><FiStar /> Featured Product</span>
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
                <span><FiTrendingUp /> Top Selling</span>
              </label>
            </div>

            {/* Size Selection */}
            {formData.category && (
              <div className="form-group full-width">
                <label>Available Sizes {activeTab === 'kids' ? '(Age Groups)' : ''}</label>
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

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={isSaving}>
              <FiX /> Clear Form
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <FiLoader className="spin" /> Saving...
                </>
              ) : (
                <>
                  <FiPlus /> Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default AddProduct
