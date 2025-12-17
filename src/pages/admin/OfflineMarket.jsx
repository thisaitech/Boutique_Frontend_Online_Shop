import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiShoppingBag, FiDollarSign, FiCreditCard, FiCheck,
  FiX, FiFileText, FiDownload, FiPackage, FiTag
} from 'react-icons/fi'
import { fetchProducts, selectProducts } from '../../store/slices/productSlice'
import { updateAdminProduct } from '../../store/slices/adminSlice'
import toast from 'react-hot-toast'
import './AdminPages.css'

function OfflineMarket() {
  const dispatch = useDispatch()
  const inventory = useSelector(selectProducts)

  // Local state for offline bills (backend not implemented yet)
  const [offlineBills, setOfflineBills] = useState([])

  // Fetch products on mount
  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  // Placeholder functions for offline billing (backend not implemented)
  const addOfflineBill = (bill) => {
    setOfflineBills(prev => [...prev, bill])
  }

  const updateOfflineBill = (updatedBill) => {
    setOfflineBills(prev => prev.map(bill => bill.id === updatedBill.id ? updatedBill : bill))
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash') // 'cash' or 'upi'
  const [showBillModal, setShowBillModal] = useState(false)
  const [currentBill, setCurrentBill] = useState(null)
  const [showPriceConfirm, setShowPriceConfirm] = useState(false)

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return inventory.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  }, [searchQuery, inventory])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price || 0)
  }

  const calculatePrice = () => {
    if (!selectedProduct) return 0
    const basePrice = selectedProduct.price || 0
    const discount = selectedProduct.discount || 0
    const discountedPrice = basePrice * (1 - discount / 100)
    return discountedPrice * quantity
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setSelectedColor('')
    setSelectedSize('')
    setQuantity(1)
    setSearchQuery('')
  }

  // Get available sizes for selected product
  const availableSizes = useMemo(() => {
    if (!selectedProduct) return []
    if (selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0) {
      return selectedProduct.availableSizes
    }
    // Fallback based on category
    const category = selectedProduct.category?.toLowerCase() || ''
    if (category.includes('saree')) return ['Free Size']
    if (category.includes('kurti')) return ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    return ['S', 'M', 'L', 'XL']
  }, [selectedProduct])

  const handleBuy = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log('=== Buy Now clicked ===')
    console.log('selectedProduct:', selectedProduct?.name || 'null')
    console.log('selectedColor:', selectedColor)
    console.log('selectedSize:', selectedSize)
    console.log('availableSizes:', availableSizes)
    console.log('availableColors:', availableColors)
    
    if (!selectedProduct) {
      toast.error('Please select a product')
      return
    }
    
    // Check color only if product has color variants
    if (selectedProduct.colorVariants && selectedProduct.colorVariants.length > 0 && !selectedColor) {
      toast.error('Please select a color')
      return
    }
    
    // Check size only if product has sizes
    if (availableSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size')
      return
    }
    
    console.log('Opening price confirmation modal...')
    setShowPriceConfirm(true)
    console.log('Modal state set to true')
  }

  const handlePriceConfirm = () => {
    setShowPriceConfirm(false)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async () => {
    if (!selectedProduct) return

    const finalPrice = calculatePrice()
    const billNumber = `BILL-${Date.now()}`
    
    const bill = {
      id: Date.now(),
      billNumber,
      date: new Date().toISOString(),
      type: 'offline',
      items: [{
        id: selectedProduct.id,
        name: selectedProduct.name,
        image: selectedProduct.image,
        price: selectedProduct.price,
        discount: selectedProduct.discount || 0,
        quantity,
        color: selectedColor || selectedProduct.color,
        size: selectedSize || availableSizes[0] || 'Free Size'
      }],
      subtotal: selectedProduct.price * quantity,
      discount: (selectedProduct.price * quantity * (selectedProduct.discount || 0)) / 100,
      total: finalPrice,
      paymentMethod,
      status: paymentMethod === 'upi' ? 'paid' : 'pending',
      profit: finalPrice * 0.4, // 40% profit margin
      revenue: finalPrice
    }

    // Add to bills
    addOfflineBill(bill)

    // Update inventory stock via Redux
    const updatedProduct = {
      ...selectedProduct,
      stockCount: (selectedProduct.stockCount || 0) - quantity,
      soldCount: (selectedProduct.soldCount || 0) + quantity,
      inStock: (selectedProduct.stockCount || 0) - quantity > 0
    }

    try {
      await dispatch(updateAdminProduct({
        productId: selectedProduct._id || selectedProduct.id,
        productData: updatedProduct
      })).unwrap()
    } catch (error) {
      console.error('Failed to update product stock:', error)
    }

    if (paymentMethod === 'upi') {
      toast.success(`Bill ${billNumber} created! Payment received via UPI. Revenue and profit updated.`)
    } else {
      toast.success(`Bill ${billNumber} created! Please confirm cash payment.`)
    }
    
    setShowPaymentModal(false)
    setCurrentBill(bill)
    setShowBillModal(true)
    setSelectedProduct(null)
    setSelectedColor('')
    setSelectedSize('')
    setQuantity(1)
  }

  const handleCashConfirm = () => {
    if (!currentBill) return
    
    // Update bill status to paid
    const updatedBill = {
      ...currentBill,
      status: 'paid'
    }
    updateOfflineBill(updatedBill)
    toast.success('Cash payment confirmed! Revenue and profit updated.')
    setShowBillModal(false)
    setCurrentBill(null)
  }

  const handleGenerateBill = () => {
    if (!currentBill) return
    
    // Generate PDF bill (simplified - in production use jsPDF or similar)
    const billContent = `
BILL RECEIPT
${currentBill.billNumber}
Date: ${new Date(currentBill.date).toLocaleString()}

Items:
${currentBill.items.map(item => `
  ${item.name} - ${item.color || ''}
  Qty: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}
`).join('')}

Subtotal: ${formatPrice(currentBill.subtotal)}
Discount: ${formatPrice(currentBill.discount)}
Total: ${formatPrice(currentBill.total)}

Payment Method: ${currentBill.paymentMethod.toUpperCase()}
Status: ${currentBill.status === 'paid' ? 'PAID' : 'PENDING'}
    `
    
    // Create downloadable text file (in production, generate PDF)
    const blob = new Blob([billContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentBill.billNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Bill downloaded!')
  }

  // Get available colors for selected product
  const availableColors = useMemo(() => {
    if (!selectedProduct || !selectedProduct.colorVariants) return []
    return selectedProduct.colorVariants.map(v => v.color)
  }, [selectedProduct])

  // Debug modal state
  useEffect(() => {
    console.log('showPriceConfirm changed:', showPriceConfirm)
  }, [showPriceConfirm])

  useEffect(() => {
    console.log('showPaymentModal changed:', showPaymentModal)
  }, [showPaymentModal])

  useEffect(() => {
    console.log('showBillModal changed:', showBillModal)
  }, [showBillModal])

  return (
    <div className="offline-market-page">
      <div className="page-header">
        <div>
          <h1>Offline Market</h1>
          <p>Process offline sales and generate bills for walk-in customers</p>
        </div>
      </div>

      <div className="offline-market-container">
        {/* Search Section */}
        <div className="section-card glass-card">
          <div className="section-header">
            <h2>Search Product</h2>
          </div>
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Enter product name to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>

          {filteredProducts.length > 0 && (
            <div className="product-search-results">
              {filteredProducts.map(product => (
                <motion.div
                  key={product.id}
                  className="product-search-item"
                  onClick={() => handleProductSelect(product)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img src={product.image} alt={product.name} />
                  <div className="product-search-info">
                    <h4>{product.name}</h4>
                    <p>{formatPrice(product.price)} {product.discount > 0 && `(${product.discount}% OFF)`}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Product Details */}
        {selectedProduct && (
          <motion.div
            className="section-card glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="section-header">
              <h2>Product Details</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedProduct(null)}>
                <FiX /> Clear
              </button>
            </div>

            <div className="selected-product-details">
              <img src={selectedProduct.image} alt={selectedProduct.name} />
              <div className="product-details-info">
                <h3>{selectedProduct.name}</h3>
                <p className="product-category">{selectedProduct.category}</p>
                
                <div className="price-section">
                  <span className="original-price">{formatPrice(selectedProduct.price)}</span>
                  {selectedProduct.discount > 0 && (
                    <>
                      <span className="discount-badge">-{selectedProduct.discount}%</span>
                      <span className="final-price">
                        {formatPrice(selectedProduct.price * (1 - selectedProduct.discount / 100))}
                      </span>
                    </>
                  )}
                </div>

                {availableColors.length > 0 && (
                  <div className="form-group">
                    <label>Select Color</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Color</option>
                      {availableColors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div className="form-group">
                    <label>Select Size</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Size</option>
                      {availableSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Quantity</label>
                  <div className="quantity-controls">
                    <button
                      className="btn btn-sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="input-field"
                      min="1"
                    />
                    <button
                      className="btn btn-sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="total-section">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedProduct.price * quantity)}</span>
                  </div>
                  {selectedProduct.discount > 0 && (
                    <div className="total-row">
                      <span>Discount ({selectedProduct.discount}%):</span>
                      <span>-{formatPrice((selectedProduct.price * quantity * selectedProduct.discount) / 100)}</span>
                    </div>
                  )}
                  <div className="total-row total-final">
                    <span>Total:</span>
                    <span>{formatPrice(calculatePrice())}</span>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleBuy(e)
                  }}
                  type="button"
                >
                  <FiShoppingBag /> Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Price Confirmation Modal */}
      <AnimatePresence>
        {showPriceConfirm && (
          <motion.div
            key="price-confirm-modal"
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowPriceConfirm(false)}
            style={{ zIndex: 10001 }}
          >
            <motion.div
              className="modal-content glass-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Price Confirmation</h2>
                <button className="modal-close" onClick={() => setShowPriceConfirm(false)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="payment-summary">
                  <h3>Total Amount: {formatPrice(calculatePrice())}</h3>
                  <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--text-muted)' }}>
                    Please confirm the total amount before proceeding to payment.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPriceConfirm(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handlePriceConfirm}>
                  <FiCheck /> Confirm Price
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            key="payment-modal"
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowPaymentModal(false)}
            style={{ zIndex: 10002 }}
          >
            <motion.div
              className="modal-content glass-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Payment Confirmation</h2>
                <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="payment-summary">
                  <h3>Total Amount: {formatPrice(calculatePrice())}</h3>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <div className="payment-methods">
                    <button
                      className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <FiDollarSign /> Cash
                    </button>
                    <button
                      className={`payment-method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      <FiCreditCard /> UPI
                    </button>
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="alert-info">
                    <FiCheck /> Cash payment will be marked as pending. Confirm after receiving payment.
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="alert-success">
                    <FiCheck /> UPI payment will be automatically added to revenue and profit.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handlePaymentConfirm}>
                  <FiCheck /> Confirm Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bill Modal */}
      <AnimatePresence>
        {showBillModal && currentBill && (
          <motion.div
            key="bill-modal"
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setShowBillModal(false)
              setCurrentBill(null)
            }}
            style={{ zIndex: 10003 }}
          >
            <motion.div
              className="modal-content glass-card bill-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Bill Generated - {currentBill.billNumber}</h2>
                <button className="modal-close" onClick={() => {
                  setShowBillModal(false)
                  setCurrentBill(null)
                }}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="bill-preview">
                  <div className="bill-header">
                    <h3>BILL RECEIPT</h3>
                    <p>Bill No: {currentBill.billNumber}</p>
                    <p>Date: {new Date(currentBill.date).toLocaleString()}</p>
                  </div>

                  <div className="bill-items">
                    {currentBill.items.map((item, idx) => (
                      <div key={idx} className="bill-item">
                        <div>
                          <strong>{item.name}</strong>
                          {item.color && <span> - {item.color}</span>}
                        </div>
                        <div className="bill-item-details">
                          <span>Qty: {item.quantity} × {formatPrice(item.price)}</span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bill-totals">
                    <div className="bill-total-row">
                      <span>Subtotal:</span>
                      <span>{formatPrice(currentBill.subtotal)}</span>
                    </div>
                    {currentBill.discount > 0 && (
                      <div className="bill-total-row">
                        <span>Discount:</span>
                        <span>-{formatPrice(currentBill.discount)}</span>
                      </div>
                    )}
                    <div className="bill-total-row bill-total-final">
                      <span>Total:</span>
                      <span>{formatPrice(currentBill.total)}</span>
                    </div>
                    <div className="bill-payment-info">
                      <span>Payment: {currentBill.paymentMethod.toUpperCase()}</span>
                      <span className={`status-badge ${currentBill.status}`}>
                        {currentBill.status === 'paid' ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                {currentBill.status === 'pending' && currentBill.paymentMethod === 'cash' && (
                  <button className="btn btn-success" onClick={handleCashConfirm}>
                    <FiCheck /> Confirm Cash Payment
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => {
                  setShowBillModal(false)
                  setCurrentBill(null)
                }}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={handleGenerateBill}>
                  <FiDownload /> Generate Bill PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OfflineMarket

