import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiShoppingCart,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiX,
  FiTrash2
} from 'react-icons/fi'
import {
  adminFetchOrders,
  adminConfirmOrder,
  adminCancelOrder,
  adminDeleteOrder,
  selectAdminOrders,
  selectAdminOrdersLoading
} from '../../store/slices/adminSlice'
import toast from 'react-hot-toast'
import './AdminPages.css'

function Orders() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state - no context fallback
  const orders = useSelector(selectAdminOrders)
  const isLoading = useSelector(selectAdminOrdersLoading)

  // Price edit modal state
  const [editingOrder, setEditingOrder] = useState(null)
  const [newPrice, setNewPrice] = useState('')

  // Fetch orders on mount
  useEffect(() => {
    dispatch(adminFetchOrders())
  }, [dispatch])

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
  }, [orders])

  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (order.total || 0)
    }, 0)
    const paidOrders = orders.filter(order => order.status !== 'cancelled' && order.status !== 'rejected').length
    const cancelledOrders = orders.filter(order => order.status === 'cancelled' || order.status === 'rejected').length

    return { totalRevenue, paidOrders, cancelledOrders }
  }, [orders])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Today'
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
  }

  const paymentLabel = (method) => {
    if (method === 'cod') return 'Cash on Delivery'
    if (method === 'razorpay_card') return 'Razorpay Card'
    if (method === 'razorpay_upi') return 'Razorpay UPI'
    return method || 'Online Payment'
  }

  const viewInvoice = (order) => {
    const orderId = order.orderNumber || order.id
    navigate(`/admin/invoices?orderId=${encodeURIComponent(orderId)}`)
  }

  const confirmOrder = async (order) => {
    if (window.confirm('Are you sure you want to confirm this order? Invoice will be generated.')) {
      try {
        await dispatch(adminConfirmOrder(order._id || order.id)).unwrap()
        toast.success('Order confirmed! Invoice is now available.')
      } catch (error) {
        toast.error(error || 'Failed to confirm order')
      }
    }
  }

  const cancelOrder = async (order) => {
    const reason = window.prompt('Please enter cancellation reason (e.g., Stock problem, Payment issue, etc.):')
    if (reason && reason.trim()) {
      try {
        await dispatch(adminCancelOrder({ orderId: order._id || order.id, reason: reason.trim() })).unwrap()
        toast.success('Order cancelled. Customer will see the cancellation message.')
      } catch (error) {
        toast.error(error || 'Failed to cancel order')
      }
    }
  }

  const getStatusClass = (order) => {
    const status = order.paymentStatus || order.status || 'paid'
    const isCancelled = status === 'cancelled' || status === 'rejected'
    return isCancelled ? 'pending' : 'confirmed'
  }

  const getDisplayStatus = (order) => {
    const status = order.paymentStatus || order.status
    if (status === 'cancelled' || status === 'rejected') return 'CANCELLED'
    return 'PAID'
  }

  const addressLine = (address = {}) => {
    if (address.fullName || address.street || address.address) {
      const street = address.street || address.address || ''
      const locality = [address.city, address.state].filter(Boolean).join(', ')
      const pin = address.pincode ? ` - ${address.pincode}` : ''
      return `${street} ${locality}${pin}`.trim()
    }
    return 'No shipping address'
  }

  const openPriceEdit = (order) => {
    setEditingOrder(order)
    setNewPrice(order.total.toString())
  }

  const closePriceEdit = () => {
    setEditingOrder(null)
    setNewPrice('')
  }

  const updateOrderPrice = async () => {
    if (!editingOrder || !newPrice) return

    const price = parseFloat(newPrice)
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price')
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/admin/orders/${editingOrder._id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax: 0,
          total: price,
          reason: 'Admin price override'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update price')
      }

      await dispatch(adminFetchOrders())
      toast.success(`Order price updated to ₹${price}`)
      closePriceEdit()
    } catch (error) {
      toast.error(error.message || 'Failed to update order price')
    }
  }

  const handleClearAllOrders = async () => {
    if (window.confirm('Are you sure you want to clear all orders? This action cannot be undone and will delete all order records permanently.')) {
      try {
        // Delete orders one by one via API
        for (const order of orders) {
          await dispatch(adminDeleteOrder(order._id || order.id)).unwrap()
        }
        // Refetch orders from backend to ensure sync
        await dispatch(adminFetchOrders())
        toast.success('All orders have been cleared successfully')
      } catch (error) {
        toast.error(error || 'Failed to clear some orders')
        // Refetch orders to get latest state
        dispatch(adminFetchOrders())
      }
    }
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Track confirmed orders, payments, and invoices for online customers.</p>
        </div>
      </div>

      <div className="stats-grid">
        <motion.div className="stat-card glass-card" whileHover={{ y: -4 }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <FiShoppingCart />
          </div>
          <div className="stat-content">
            <span className="stat-title">Total Orders</span>
            <div className="stat-value">{orders.length}</div>
          </div>
        </motion.div>

        <motion.div className="stat-card glass-card" whileHover={{ y: -4 }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #42e695 0%, #3bb2b8 100%)' }}>
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-title">Paid Orders</span>
            <div className="stat-value">{metrics.paidOrders}</div>
          </div>
        </motion.div>

        <motion.div className="stat-card glass-card" whileHover={{ y: -4 }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #e91e63 0%, #f85f94 100%)' }}>
            <FiFileText />
          </div>
          <div className="stat-content">
            <span className="stat-title">Net Revenue</span>
            <div className="stat-value">{formatPrice(metrics.totalRevenue)}</div>
          </div>
        </motion.div>
      </div>

      <div className="section-card glass-card">
        <div className="section-header">
          <div>
            <h2>Order List</h2>
            <p>Full details of placed orders with payment and shipping info</p>
          </div>
          {orders.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleClearAllOrders}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(231, 76, 60, 0.1)',
                borderColor: '#e74c3c',
                color: '#e74c3c'
              }}
            >
              <FiTrash2 /> Clear All Orders
            </button>
          )}
        </div>

        {sortedOrders.length > 0 ? (
          <div className="orders-list">
            {sortedOrders.map((order) => {
              return (
                <div key={order.id} className="order-item glass-card">
                  <div className="order-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span className="order-id">{order.orderNumber || `ORD-${order.id}`}</span>
                      <span className={`order-status ${getStatusClass(order)}`}>
                        {getDisplayStatus(order)}
                      </span>
                      <span className="order-date">{formatDate(order.date || order.createdAt)}</span>
                    </div>

                    <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span className="order-amount">{formatPrice(order.total)}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <FiCreditCard /> {paymentLabel(order.paymentMethod)} (paid)
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <FiTruck /> {order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0)} items
                      </span>
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <FiMapPin />
                      <span>{addressLine(order.shippingAddress || order.deliveryAddress)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {order.status !== 'cancelled' && (order.paymentStatus || order.status) !== 'cancelled' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => cancelOrder(order)}
                        style={{
                          background: 'rgba(231, 76, 60, 0.1)',
                          borderColor: '#e74c3c',
                          color: '#e74c3c'
                        }}
                      >
                        <FiX /> Cancel Order
                      </button>
                    )}
                    {((order.paymentStatus || order.status) === 'confirmed' || (order.paymentStatus || order.status) === 'paid') && (
                      <button className="btn btn-outline" onClick={() => viewInvoice(order)}>
                        View Invoice
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <FiShoppingCart size={48} />
            <p>No orders yet. Complete a checkout to see orders here.</p>
          </div>
        )}
      </div>

      {/* Price Edit Modal */}
      {editingOrder && (
        <div className="modal-overlay" onClick={closePriceEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Edit Order Price</h2>
              <button className="close-btn" onClick={closePriceEdit}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
                Order: {editingOrder.orderNumber}
              </p>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Current Tax:</span>
                  <strong>{formatPrice(editingOrder.tax || 0)}</strong>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span>Current Total:</span>
                  <strong style={{ color: '#3498db' }}>{formatPrice(editingOrder.total)}</strong>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="newPrice">New Final Price (₹)</label>
                <input
                  id="newPrice"
                  type="number"
                  className="form-control"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Enter new price"
                  min="0"
                  step="0.01"
                />
                <small style={{ color: 'var(--text-muted)', marginTop: '5px', display: 'block' }}>
                  This will set the total to exactly this amount (no tax or shipping)
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closePriceEdit}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={updateOrderPrice}
                disabled={!newPrice || parseFloat(newPrice) < 0}
              >
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
