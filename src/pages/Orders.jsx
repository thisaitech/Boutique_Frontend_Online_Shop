import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiPackage, FiCheckCircle, FiChevronRight,
  FiMapPin, FiCalendar, FiCreditCard, FiArrowLeft, FiSearch,
  FiFilter, FiX, FiShoppingBag, FiRefreshCw, FiStar,
  FiPhone, FiDownload, FiClock
} from 'react-icons/fi'
import { useGlobal } from '../context/GlobalContext'
import {
  fetchMyOrders,
  selectOrders,
  selectOrdersLoading
} from '../store/slices/orderSlice'
import { selectIsAuthenticated, selectUser as selectAuthUser } from '../store/slices/authSlice'
import ReviewModal from '../components/ReviewModal/ReviewModal'
import { getImageSrc } from '../utils/imageUtils'
import toast from 'react-hot-toast'
import './Orders.css'

function Orders() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Redux state
  const ordersRedux = useSelector(selectOrders)
  const ordersLoading = useSelector(selectOrdersLoading)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const authUser = useSelector(selectAuthUser)

  // Context fallback
  const { orders: contextOrders, user: contextUser, addReview, reviews } = useGlobal()

  // Use Redux data if available
  const orders = ordersRedux.length > 0 ? ordersRedux : contextOrders
  const user = authUser || contextUser

  // Fetch orders on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyOrders())
    }
  }, [dispatch, isAuthenticated])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [reviewModal, setReviewModal] = useState({ isOpen: false, product: null, orderId: null })
  const ensureOrderItems = (order) => (Array.isArray(order?.items) ? order.items : [])

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Status filter
        if (filterStatus !== 'all' && order.status !== filterStatus) return false

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const matchesId = order.id?.toString().includes(query)
          const matchesItem = order.items?.some(item =>
            item.name?.toLowerCase().includes(query)
          )
          return matchesId || matchesItem
        }
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [orders, filterStatus, searchQuery])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusInfo = (status, paymentStatus) => {
    // Check if order failed
    if (status === 'failed' || paymentStatus === 'failed') {
      return { label: 'Payment Failed', color: '#e74c3c', icon: FiX, message: 'Payment was not successful' }
    }
    
    // Check if order is cancelled
    const isCancelled = status === 'cancelled' || status === 'rejected'
    
    if (isCancelled) {
      return { label: 'Order Cancelled', color: '#e74c3c', icon: FiX, message: 'Order not taken - Stock problem or other issue' }
    }
    
    // All non-cancelled orders are treated as confirmed
    switch (status) {
      case 'confirmed':
        return { label: 'Order Confirmed', color: '#3498db', icon: FiCheckCircle }
      case 'processing':
        return { label: 'Processing', color: '#f39c12', icon: FiCheckCircle }
      case 'shipped':
        return { label: 'Shipped', color: '#9b59b6', icon: FiCheckCircle }
      case 'out_for_delivery':
        return { label: 'Out for Delivery', color: '#e67e22', icon: FiCheckCircle }
      case 'delivered':
        return { label: 'Delivered', color: '#27ae60', icon: FiCheckCircle }
      default:
        return { label: 'Order Confirmed', color: '#3498db', icon: FiCheckCircle }
    }
  }

  const getEstimatedDelivery = (orderDate) => {
    const date = new Date(orderDate)
    date.setDate(date.getDate() + 7)
    return formatDate(date)
  }

  const generateInvoicePDF = (order) => {
    if (!order || (order.status !== 'confirmed' && order.paymentStatus !== 'paid' && order.status !== 'paid')) {
      toast.error('Invoice is only available for confirmed orders')
      return
    }

    const invoiceId = `INV-${String(order.id).padStart(5, '0')}`
    const orderNumber = order.orderNumber || `ORD-${order.id}`
    const customerName = order.customerName || order.deliveryAddress?.fullName || 'Guest Customer'
    const customerEmail = order.customerEmail || ''
    const address = order.shippingAddress || order.deliveryAddress || {}
    
    const printWindow = window.open('', '_blank')
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .invoice-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #E91E8C; padding-bottom: 20px; }
          .invoice-header h1 { color: #E91E8C; margin: 0; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .invoice-info div { width: 48%; }
          .invoice-info h3 { color: #333; font-size: 14px; margin-bottom: 5px; }
          .invoice-info p { margin: 3px 0; font-size: 13px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8f9fa; font-weight: 600; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-section div { margin: 8px 0; }
          .total-section .grand-total { font-size: 18px; font-weight: bold; color: #E91E8C; margin-top: 15px; padding-top: 15px; border-top: 2px solid #E91E8C; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>INVOICE</h1>
          <p style="margin: 5px 0; color: #666;">ThisAI Boutique</p>
          <p style="margin: 0; font-size: 12px; color: #999;">Elegant Fashion for Every Occasion</p>
        </div>

        <div class="invoice-info">
          <div>
            <h3>Bill To:</h3>
            <p><strong>${customerName}</strong></p>
            <p>${customerEmail || 'N/A'}</p>
            <p>${address.street || address.address || ''}</p>
            <p>${address.city || ''}, ${address.state || ''} ${address.pincode || ''}</p>
            <p>${address.phone || ''}</p>
          </div>
          <div style="text-align: right;">
            <h3>Invoice Details:</h3>
            <p><strong>Invoice #:</strong> ${invoiceId}</p>
            <p><strong>Order #:</strong> ${orderNumber}</p>
            <p><strong>Date:</strong> ${formatDate(order.date || order.createdAt)}</p>
            <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">CONFIRMED</span></p>
            <p><strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Item</th>
              <th style="width: 15%;">Quantity</th>
              <th style="width: 17.5%;">Unit Price</th>
              <th style="width: 17.5%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity || 1}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${formatPrice(item.price * (item.quantity || 1))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div><strong>Subtotal:</strong> ${formatPrice(order.subtotal || order.total || 0)}</div>
          ${(order.tax || 0) > 0 ? `<div><strong>Tax:</strong> ${formatPrice(order.tax)}</div>` : ''}
          ${(order.shipping || 0) > 0 ? `<div><strong>Shipping:</strong> ${formatPrice(order.shipping)}</div>` : ''}
          ${(order.discount || 0) > 0 ? `<div style="color: #27ae60;"><strong>Discount:</strong> -${formatPrice(order.discount)}</div>` : ''}
          <div class="grand-total"><strong>Total Amount:</strong> ${formatPrice(order.total || 0)}</div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>For any queries, contact us at support@thisaiboutique.com | +91 98765 43210</p>
          <p style="margin-top: 10px; font-style: italic;">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }

    toast.success('Invoice generated successfully')
  }

  // Order Detail View
  if (selectedOrder) {
    const detailItems = ensureOrderItems(selectedOrder)
    const statusInfo = getStatusInfo(selectedOrder.status, selectedOrder.paymentStatus)

    return (
      <motion.div
        className="orders-page order-detail-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="order-detail-header">
          <button className="back-button" onClick={() => setSelectedOrder(null)}>
            <FiArrowLeft />
            <span>Back to Orders</span>
          </button>
          <div className="order-id-badge">
            <FiPackage />
            Order #{selectedOrder.id}
          </div>
        </div>

        <div className="order-detail-content">
          {/* Status Banner */}
          <motion.div
            className="order-status-banner"
            style={{ background: `linear-gradient(135deg, ${statusInfo.color}20 0%, ${statusInfo.color}10 100%)` }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="status-icon" style={{ background: statusInfo.color }}>
              <statusInfo.icon />
            </div>
            <div className="status-info">
              <h2>{statusInfo.label}</h2>
              <p>
                {selectedOrder.status === 'delivered'
                  ? `Delivered on ${formatDate(selectedOrder.date)}`
                  : selectedOrder.paymentStatus === 'paid' || selectedOrder.status === 'confirmed'
                  ? 'Your order has been confirmed. Delivery will be completed within 7 to 10 business days.'
                  : 'Delivery will be completed within 7 to 10 business days'
                }
              </p>
            </div>
          </motion.div>

          {/* Order Status Message - Only show for cancelled orders */}
          {statusInfo.message ? (
            <motion.div
              className="order-status-message glass-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                background: statusInfo.color === '#e74c3c' 
                  ? 'rgba(231, 76, 60, 0.1)' 
                  : 'rgba(243, 156, 18, 0.1)',
                border: `2px solid ${statusInfo.color}40`
              }}
            >
              <div className="status-content">
                <div className="status-icon" style={{ color: statusInfo.color }}>
                  <statusInfo.icon />
                </div>
                <div className="status-text">
                  <h3 style={{ color: statusInfo.color }}>{statusInfo.label}</h3>
                  <p>{statusInfo.message}</p>
                  {statusInfo.color === '#e74c3c' && (
                    <p className="status-note">
                      Please contact support if you have any questions about this cancellation.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Order Confirmation Section */}
          {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'rejected' ? (
            <motion.div
              className="order-confirmation-section glass-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="confirmation-content">
                <div className="confirmation-icon">
                  <FiCheckCircle />
                </div>
                <div className="confirmation-text">
                  <h3>Order Confirmed</h3>
                  <p>Your order has been confirmed successfully. Delivery will be completed within 7 to 10 business days.</p>
                  <p className="confirmation-note">
                    We'll notify you once your order is ready for delivery. Thank you for shopping with us!
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Order Items */}
          <motion.div
            className="order-items-section glass-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
              <h3><FiShoppingBag /> Order Items ({detailItems.length})</h3>
            <div className="order-items-list">
              {detailItems.map((item, index) => (
                <div key={index} className="order-item-card">
                  <div className="item-image">
                    <img src={getImageSrc(item.image)} alt={item.name} />
                  </div>
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p className="item-category">{item.category}</p>
                    <div className="item-meta">
                      <span className="item-qty">Qty: {item.quantity}</span>
                      <span className="item-price">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="action-btn-sm" onClick={() => navigate(`/product/${item.productId || item.id}`)}>
                      <FiRefreshCw /> Buy Again
                    </button>
                    <button
                      className="action-btn-sm outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Extract the actual product ID (handle both object and string cases)
                        let productId = item.productId
                        if (typeof productId === 'object' && productId !== null) {
                          productId = productId._id || productId.id
                        }
                        productId = productId || item.id || item._id
                        
                        const orderId = selectedOrder._id || selectedOrder.id
                        
                        console.log('Rate button clicked - Product ID:', productId, 'Order ID:', orderId)
                        
                        // Check if user already reviewed this product in this order
                        const existingReview = reviews.find(
                          r => String(r.productId) === String(productId) && String(r.orderId) === String(orderId) && String(r.userId) === String(user?.id || user?._id)
                        )
                        if (existingReview) {
                          toast.error('You have already reviewed this product')
                          return
                        }
                        
                        navigate(`/review?productId=${productId}&orderId=${orderId}`)
                      }}
                    >
                      <FiStar /> Rate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Order Info Grid */}
          <div className="order-info-grid">
            {/* Delivery Address */}
            <motion.div
              className="info-card glass-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3><FiMapPin /> Delivery Address</h3>
              {selectedOrder.deliveryAddress ? (
                <div className="address-content">
                  <p className="address-name">{selectedOrder.deliveryAddress.fullName}</p>
                  <p>{selectedOrder.deliveryAddress.address}</p>
                  <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}</p>
                  <p>PIN: {selectedOrder.deliveryAddress.pincode}</p>
                  <p className="address-phone">
                    <FiPhone /> {selectedOrder.deliveryAddress.phone}
                  </p>
                </div>
              ) : (
                <p className="no-address">Address not available</p>
              )}
            </motion.div>

            {/* Payment Info */}
            <motion.div
              className="info-card glass-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3><FiCreditCard /> Payment Summary</h3>
              <div className="payment-details">
                <div className="payment-row">
                  <span>Items Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
                <div className="payment-row">
                  <span>Delivery</span>
                  <span className="free">FREE</span>
                </div>
                <div className="payment-row total">
                  <span>Order Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
                <div className="payment-method">
                  <FiCreditCard />
                  <span>Paid via {selectedOrder.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            className="quick-actions"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {(selectedOrder.status === 'confirmed' || selectedOrder.paymentStatus === 'paid') && (
              <button 
                className="quick-action-btn"
                onClick={() => {
                  // Generate and download invoice
                  generateInvoicePDF(selectedOrder)
                }}
              >
                <FiDownload />
                <span>Download Invoice</span>
              </button>
            )}
            <button 
              className="quick-action-btn"
              onClick={() => navigate('/contact')}
            >
              <FiPhone />
              <span>Contact Support</span>
            </button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Orders List View
  return (
    <motion.div
      className="orders-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="orders-header">
        <div className="header-content">
          <button className="back-button mobile-only" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <h1><FiPackage /> My Orders</h1>
          <p className="orders-count">{orders.length} orders placed</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by order ID or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <FiX />
              </button>
            )}
          </div>
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            <span>Filter</span>
          </button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="filter-options"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="filter-chips">
                {[
                  { value: 'all', label: 'All Orders' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'shipped', label: 'Shipped' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    className={`filter-chip ${filterStatus === filter.value ? 'active' : ''}`}
                    onClick={() => setFilterStatus(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Orders List */}
      <div className="orders-content">
        {filteredOrders.length === 0 ? (
          <motion.div
            className="empty-orders glass-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="empty-icon">
              <FiPackage />
            </div>
            <h2>No orders found</h2>
            <p>
              {orders.length === 0
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : "No orders match your search criteria."
              }
            </p>
            <Link to="/women" className="btn btn-primary">
              <FiShoppingBag /> Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order, index) => {
              const previewItems = ensureOrderItems(order)
              const statusInfo = getStatusInfo(order.status, order.paymentStatus)
              const orderKey = order._id || order.id || `order-${index}`
              return (
                <motion.div
                  key={orderKey}
                  className="order-card glass-card"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-header">
                    <div className="order-meta">
                      <span className="order-id">Order #{order.id}</span>
                      <span className="order-date">
                        <FiCalendar /> {formatDateTime(order.date)}
                      </span>
                    </div>
                    <div className="order-header-right">
                      <button
                        className="view-details-btn-header"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedOrder(order)
                        }}
                      >
                        View Details <FiChevronRight />
                      </button>
                      <div
                        className="order-status"
                        style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}
                      >
                        <statusInfo.icon />
                        {statusInfo.label}
                      </div>
                    </div>
                  </div>

                  {statusInfo.message && (
                    <div className="order-message" style={{ 
                      padding: '12px',
                      marginBottom: '12px',
                      background: statusInfo.color === '#e74c3c' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(243, 156, 18, 0.1)',
                      border: `1px solid ${statusInfo.color}40`,
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      color: statusInfo.color
                    }}>
                      {statusInfo.message}
                    </div>
                  )}

                  <div className="order-items-preview">
                    <div className="items-images">
                      {previewItems.slice(0, 3).map((item, i) => (
                        <div key={i} className="item-thumb" style={{ zIndex: 3 - i }}>
                          <img src={getImageSrc(item.image)} alt={item.name} />
                        </div>
                      ))}
                      {previewItems.length > 3 && (
                        <div className="more-items">+{previewItems.length - 3}</div>
                      )}
                    </div>
                    <div className="items-summary">
                      <p className="items-names">
                        {previewItems.map(item => item.name).join(', ')}
                      </p>
                      <p className="items-count">
                        {previewItems.reduce((acc, item) => acc + item.quantity, 0)} items
                      </p>
                      {/* Show Review button for paid/delivered orders */}
                      {((order.paymentStatus === 'paid' || order.paymentStatus === 'completed') || 
                        order.status === 'delivered' || order.status === 'confirmed') && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            // Navigate to review with first item
                            const firstItem = previewItems[0]
                            if (firstItem) {
                              // Extract productId from object if needed
                              let productId = firstItem.productId
                              if (typeof productId === 'object' && productId !== null) {
                                productId = productId._id || productId.id
                              }
                              productId = productId || firstItem.id || firstItem._id
                              navigate(`/review?productId=${productId}&orderId=${order._id || order.id}`)
                            }
                          }}
                        >
                          <FiStar /> Rate Product
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <span>Total</span>
                      <span className="total-amount">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, product: null, orderId: null })}
        product={reviewModal.product}
        user={user}
        onSubmit={(reviewData) => {
          addReview({ ...reviewData, orderId: reviewModal.orderId })
          toast.success('Thank you for your review!')
          setReviewModal({ isOpen: false, product: null, orderId: null })
        }}
      />
    </motion.div>
  )
}

export default Orders
