import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiX, FiImage, FiStar, FiTrendingUp, FiDroplet,
  FiArrowLeft, FiPlus, FiSave, FiEye, FiEyeOff, FiLoader
} from 'react-icons/fi'
import { fetchProducts, selectProducts, selectProductsLoading } from '../../store/slices/productSlice'
import { updateAdminProduct, adminFetchSiteConfig, selectAdminSiteConfig } from '../../store/slices/adminSlice'
import { getImageSrc, uploadImageToS3, validateImageFile, deleteImageFromS3 } from '../../utils/imageUtils'
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

const categoryTypes = {
  women: ['sarees', 'lehengas', 'kurtis', 'blouses'],
  kids: ['kids-frocks', 'kids-lehengas', 'kids-gowns', 'kids-ethnic', 'kids-party'],
  fashion: ['ornaments', 'handbags', 'clutches', 'jewelry', 'scarves', 'belts']
}

// Fashion-specific materials
const fashionMaterials = ['Leather', 'Faux Leather', 'Canvas', 'Fabric', 'Metal', 'Gold Plated', 'Silver', 'Brass', 'Beads', 'Crystal', 'Pearl', 'Acrylic', 'Silk', 'Cotton']

function EditProduct() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const dispatch = useDispatch()
  const inventory = useSelector(selectProducts)
  const productsLoading = useSelector(selectProductsLoading)
  const siteConfig = useSelector(selectAdminSiteConfig)

  const [loading, setLoading] = useState(true)

  // Fetch products and site config on mount
  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(adminFetchSiteConfig())
  }, [dispatch])
  const [productType, setProductType] = useState('women')
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    discount: '',
    real_price: '',
    tax: '',
    color: '',
    material: '',
    description: '',
    image: '',
    stockCount: 10,
    inStock: true,
    featured: false,
    topSelling: false,
    showInStore: true,
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
  const [mainImageFile, setMainImageFile] = useState(null) // Store file for upload on save
  const [variantImageFiles, setVariantImageFiles] = useState({}) // Store variant files for upload on save
  const [isSaving, setIsSaving] = useState(false) // Track save/upload progress
  const [isAddingVariant, setIsAddingVariant] = useState(false) // Track variant add progress

  // Load product data
  useEffect(() => {
    if (productsLoading || inventory.length === 0) return

    const product = inventory.find(p => p.id === parseInt(productId) || p._id === productId || p.id === productId)

    if (product) {
      // Determine product type
      if (categoryTypes.women.includes(product.category)) {
        setProductType('women')
      } else if (categoryTypes.kids.includes(product.category)) {
        setProductType('kids')
      } else if (categoryTypes.fashion.includes(product.category)) {
        setProductType('fashion')
      }

      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price || '',
        discount: product.discount || '',
        real_price: product.real_price || '',
        tax: product.tax || '',
        color: product.color || '',
        material: product.material || '',
        description: product.description || '',
        image: product.image || '',
        stockCount: product.stockCount !== undefined ? product.stockCount : (product.inStock ? 10 : 0),
        inStock: product.inStock !== undefined ? product.inStock : true,
        featured: product.featured || false,
        topSelling: product.topSelling || false,
        showInStore: product.showInStore !== undefined ? product.showInStore : true,
        availableSizes: product.availableSizes || [],
        colorVariants: product.colorVariants || []
      })
      // Initialize color variant form with existing data if editing
      if (product.colorVariants && product.colorVariants.length > 0 && showColorVariantForm) {
        // This will be handled when user clicks to edit
      }
      setLoading(false)
    } else {
      toast.error('Product not found')
      navigate(-1)
    }
  }, [productId, inventory, navigate, productsLoading])

  // Get folder path based on product type/category
  const getImageFolder = () => {
    if (formData.category) return formData.category
    return productType
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
    
    // Store file for upload on save, show preview
    setMainImageFile(file)
    setFormData(prev => ({ 
      ...prev, 
      _imagePreview: previewUrl,
      _newImage: true // Flag to indicate new image selected
    }))
    toast.success('Image selected! Will upload when you click Save Changes.')
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
    
    // Store file for upload on save
    setVariantImageFiles(prev => ({ ...prev, [index]: file }))
    
    setColorVariantData(prev => {
      const images = [...prev.images]
      images[index] = { ...images[index], _preview: previewUrl, _hasNewFile: true }
      return { ...prev, images }
    })
    toast.success('Variant image selected! Will upload when you add the color variant.')
  }

  // Get categories based on product type
  const getCategories = () => {
    switch (productType) {
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

  // Get materials based on product type
  const getMaterials = () => {
    if (productType === 'fashion') {
      return fashionMaterials
    }
    return materials
  }

  // Get available sizes based on category
  const getAvailableSizes = (category) => {
    if (productType === 'kids') {
      return siteConfig?.productSizes?.[category] || ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y']
    }
    if (productType === 'fashion') {
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

    setIsSaving(true)
    
    let finalImageUrl = formData.image

    // Upload main image to S3 if a new file was selected
    if (mainImageFile && formData._newImage) {
      try {
        toast('Uploading main image to S3...', { icon: '⬆️' })
        const folder = getImageFolder()
        const result = await uploadImageToS3(mainImageFile, folder)
        finalImageUrl = result.url
        toast.success('Main image uploaded!')
      } catch (s3Error) {
        console.error('S3 upload failed:', s3Error)
        toast.error(s3Error.message || 'Failed to upload image to S3. Product not saved.')
        setIsSaving(false)
        return // Don't proceed to backend if S3 upload fails
      }
    }

    // Only proceed to backend if S3 upload succeeded (or no new image)
    try {
      const stockCount = parseInt(formData.stockCount) || 0
      const inStock = stockCount > 0

      // Find the original product to get its _id
      const originalProduct = inventory.find(p => p.id === parseInt(productId) || p._id === productId || p.id === productId)

      const productData = {
        id: parseInt(productId) || productId,
        ...formData,
        image: finalImageUrl, // Use the uploaded S3 URL or existing URL
        price: parseFloat(formData.price),
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        real_price: parseFloat(formData.real_price),
        tax: formData.tax ? parseFloat(formData.tax) : 0,
        stockCount,
        inStock, // Auto-set based on stockCount
        availableSizes: formData.availableSizes.length > 0 ? formData.availableSizes : getAvailableSizes(formData.category),
        colorVariants: formData.colorVariants
      }

      // Remove temporary fields
      delete productData._imagePreview
      delete productData._newImage

      console.log('Saving product with colorVariants:', productData.colorVariants)
      console.log('Full productData:', productData)

      await dispatch(updateAdminProduct({
        productId: originalProduct?._id || productId,
        productData
      })).unwrap()
      toast.success('Product updated successfully!')

      // Clean up main image file state
      setMainImageFile(null)

      // Navigate back
      navigate(-1)
    } catch (error) {
      toast.error(error || 'Failed to save product to database')
    } finally {
      setIsSaving(false)
    }
  }

  // Color variant handlers
  const handleAddColorVariant = async () => {
    // Check if at least one image is provided (either URL or selected file)
    const hasImage = colorVariantData.images[0]?.url || 
                     colorVariantData.images[0]?._hasNewFile ||
                     variantImageFiles[0]
    
    if (!colorVariantData.color || !hasImage) {
      toast.error('Please enter color name and at least one image')
      return
    }

    setIsAddingVariant(true)
    
    try {
      // Upload any pending variant image files to S3
      const folder = getImageFolder()
      const uploadedImages = []
      
      console.log('colorVariantData.images:', colorVariantData.images)
      console.log('variantImageFiles:', variantImageFiles)
      
      for (let i = 0; i < colorVariantData.images.length; i++) {
        const img = colorVariantData.images[i]
        const file = variantImageFiles[i]
        
        console.log(`Image ${i}:`, { img, file, hasNewFile: img._hasNewFile })
        
        if (file && img._hasNewFile) {
          // Upload file to S3
          toast(`Uploading variant image ${i + 1}...`, { icon: '⬆️' })
          const result = await uploadImageToS3(file, folder)
          console.log('S3 upload result:', result)
          uploadedImages.push(result.url)
        } else if (img.url && img.url.trim() !== '') {
          // Use existing URL
          uploadedImages.push(img.url)
        }
      }
      
      console.log('uploadedImages:', uploadedImages)
      
      if (uploadedImages.length === 0) {
        toast.error('No valid images to add')
        setIsAddingVariant(false)
        return
      }

      const newVariant = { color: colorVariantData.color, images: uploadedImages }
      console.log('Adding variant:', newVariant)
      
      setFormData(prev => {
        const updated = {
          ...prev,
          colorVariants: [...prev.colorVariants, newVariant]
        }
        console.log('Updated formData.colorVariants:', updated.colorVariants)
        return updated
      })
      
      // Reset form
      setColorVariantData({ color: '', images: [{ url: '', color: '' }] })
      setVariantImageFiles({})
      setShowColorVariantForm(false)
      toast.success('Color variant added with images uploaded to S3!')
    } catch (error) {
      console.error('S3 upload failed for variant:', error)
      toast.error(error.message || 'Failed to upload variant images to S3. Variant not added.')
    } finally {
      setIsAddingVariant(false)
    }
  }

  const [isDeletingVariant, setIsDeletingVariant] = useState(null) // Track which variant is being deleted

  const handleRemoveColorVariant = async (index) => {
    const variant = formData.colorVariants[index]
    
    // Check if variant has S3 images to delete
    const s3Images = variant?.images?.filter(img => 
      img && (img.includes('s3.') || img.includes('amazonaws.com'))
    ) || []
    
    if (s3Images.length > 0) {
      setIsDeletingVariant(index)
      toast('Deleting images from S3...', { icon: '🗑️' })
      
      try {
        // Delete all S3 images for this variant
        for (const imageUrl of s3Images) {
          await deleteImageFromS3(imageUrl)
        }
        toast.success('Images deleted from S3!')
      } catch (error) {
        console.error('Failed to delete S3 images:', error)
        // Continue with removal even if S3 delete fails
        toast.error('Warning: Could not delete some images from S3')
      } finally {
        setIsDeletingVariant(null)
      }
    }
    
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

  if (loading) {
    return (
      <div className="edit-product-page">
        <div className="loading-state">
          <p>Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="edit-product-page">
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
            <h2>Edit Product</h2>
            <p>Update product details for {formData.name}</p>
          </div>
        </div>
      </div>

      {/* Product Form */}
      <div className="add-product-form-container glass-card">
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
                <option value="">Select category</option>
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
                      id="edit-main-image-file"
                      disabled={isUploadingMain}
                    />
                    <label htmlFor="edit-main-image-file" className="file-label" style={{ opacity: isUploadingMain ? 0.6 : 1 }}>
                      {isUploadingMain ? (
                        <>
                          <FiLoader className="spin" style={{ marginRight: '8px' }} />
                          Uploading to S3...
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
                {(formData.image || formData._imagePreview) && (
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
                Color Variants
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
                          </div>
                        </div>
                        <button
                          type="button"
                          className="remove-variant-btn"
                          onClick={() => handleRemoveColorVariant(index)}
                          disabled={isDeletingVariant === index}
                        >
                          {isDeletingVariant === index ? <FiLoader className="spin" /> : <FiX />}
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
                    {colorVariantData.images.map((img, index) => {
                      return (
                        <div key={index} className="variant-image-row">
                          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flex: 1, alignItems: 'center' }}>
                            <div className="file-upload compact">
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.gif,.webp"
                                capture="environment"
                                onChange={(e) => handleVariantImageFile(index, e.target.files?.[0])}
                                id={`edit-variant-file-${index}`}
                                disabled={isAddingVariant}
                              />
                              <label htmlFor={`edit-variant-file-${index}`} className="file-label">
                                {colorVariantData.images[index]?._hasNewFile ? 'File selected ✓' : 'Select image file'}
                              </label>
                            </div>
                            {colorVariantData.images[index]?._preview && (
                              <div className="image-preview-small">
                                <img src={colorVariantData.images[index]._preview} alt={`Preview ${index + 1}`} onError={(e) => e.target.style.display = 'none'} />
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
                      )
                    })}
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
                        setVariantImageFiles({})
                      }}
                      disabled={isAddingVariant}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleAddColorVariant}
                      disabled={isAddingVariant}
                    >
                      {isAddingVariant ? (
                        <>
                          <FiLoader className="spin" style={{ marginRight: '4px' }} />
                          Uploading...
                        </>
                      ) : (
                        'Add Variant'
                      )}
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
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter product description"
                rows="4"
              />
            </div>

            {/* Stock Count */}
            <div className="form-group">
              <label>Stock Count *</label>
              <input
                type="number"
                name="stockCount"
                value={formData.stockCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  setFormData(prev => ({
                    ...prev,
                    stockCount: value,
                    inStock: value > 0 // Auto-update inStock based on stockCount
                  }))
                }}
                className="input-field"
                placeholder="Enter stock quantity"
                min="0"
                required
              />
              <small style={{ color: formData.stockCount <= 3 && formData.stockCount > 0 ? '#f39c12' : formData.stockCount === 0 ? '#e74c3c' : 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {formData.stockCount === 0 
                  ? '⚠️ Out of Stock' 
                  : formData.stockCount <= 3 
                    ? `⚠️ Low Stock (${formData.stockCount} pieces remaining)` 
                    : `${formData.stockCount} pieces available`}
              </small>
            </div>

            {/* Checkboxes */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleInputChange}
                  disabled={formData.stockCount === 0}
                />
                <span>In Stock {formData.stockCount === 0 && '(Disabled - Stock Count is 0)'}</span>
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
                <span><FiStar style={{ marginRight: '4px' }} /> Featured Product</span>
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
                <span><FiTrendingUp style={{ marginRight: '4px' }} /> Top Selling</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="showInStore"
                  checked={formData.showInStore !== false}
                  onChange={handleInputChange}
                />
                <span>
                  {formData.showInStore !== false ? (
                    <><FiEye style={{ marginRight: '4px' }} /> Show on Customer Page</>
                  ) : (
                    <><FiEyeOff style={{ marginRight: '4px' }} /> Hide from Customer Page</>
                  )}
                </span>
              </label>
            </div>

            {/* Size Selector */}
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

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <FiLoader className="spin" style={{ marginRight: '8px' }} />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave style={{ marginRight: '8px' }} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProduct
