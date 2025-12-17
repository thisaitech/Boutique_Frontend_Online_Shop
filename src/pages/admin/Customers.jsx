import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiUser, FiPhone, FiMapPin, FiSearch, FiEye,
  FiCalendar, FiShoppingBag, FiDollarSign, FiFilter
} from 'react-icons/fi'
import {
  adminFetchCustomers,
  adminFetchOrders,
  selectAdminCustomers,
  selectAdminOrders,
  selectAdminCustomersLoading
} from '../../store/slices/adminSlice'
import './Customers.css'

function Customers() {
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const customers = useSelector(selectAdminCustomers)
  const orders = useSelector(selectAdminOrders)
  const isLoading = useSelector(selectAdminCustomersLoading)

  // Fetch data on mount
  useEffect(() => {
    dispatch(adminFetchCustomers())
    dispatch(adminFetchOrders())
  }, [dispatch])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'with-orders', 'no-orders'

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query) ||
        customer.mobile?.includes(query)
      )
    }

    // Apply type filter
    if (filterType === 'with-orders') {
      filtered = filtered.filter(customer => {
        const customerId = customer._id || customer.id
        const customerOrders = orders.filter(order => {
          const orderCustomerId = order.customerId?._id || order.customerId
          return String(orderCustomerId) === String(customerId)
        })
        return customerOrders.length > 0
      })
    } else if (filterType === 'no-orders') {
      filtered = filtered.filter(customer => {
        const customerId = customer._id || customer.id
        const customerOrders = orders.filter(order => {
          const orderCustomerId = order.customerId?._id || order.customerId
          return String(orderCustomerId) === String(customerId)
        })
        return customerOrders.length === 0
      })
    }

    return filtered
  }, [customers, orders, searchQuery, filterType])

  // Get customer stats
  const getCustomerStats = (customer) => {
    // First try to use backend-stored totals if available
    if (customer.totalOrders !== undefined && customer.totalSpent !== undefined) {
      // Match orders by customerId for order details
      const customerId = customer._id || customer.id
      const customerOrders = orders.filter(order => {
        const orderCustomerId = order.customerId?._id || order.customerId
        return String(orderCustomerId) === String(customerId)
      })
      
      const lastOrderDate = customerOrders.length > 0
        ? new Date(customerOrders.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))[0].createdAt || customerOrders[0].date)
        : null

      return {
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0,
        lastOrderDate,
        orders: customerOrders
      }
    }

    // Fallback: Calculate from orders
    const customerId = customer._id || customer.id
    const customerOrders = orders.filter(order => {
      const orderCustomerId = order.customerId?._id || order.customerId
      return String(orderCustomerId) === String(customerId)
    })

    const totalSpent = customerOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    const totalOrders = customerOrders.length
    const lastOrderDate = customerOrders.length > 0
      ? new Date(customerOrders.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))[0].createdAt || customerOrders[0].date)
      : null

    return {
      totalOrders,
      totalSpent,
      lastOrderDate,
      orders: customerOrders
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price) => {
    if (price >= 10000000) { // 1 crore or more
      return `₹${(price / 10000000).toFixed(1)}Cr`
    } else if (price >= 100000) { // 1 lakh or more
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return `₹${price.toLocaleString('en-IN')}`
  }

  return (
    <motion.div
      className="customers-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="customers-header">
        <div className="header-content">
          <h1>
            <FiUser /> Customers
          </h1>
          <p>Manage and view all customer accounts</p>
        </div>
        <div className="customers-stats">
          <div className="stat-card">
            <div className="stat-value">{customers.length}</div>
            <div className="stat-label">Total Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {customers.filter(c => {
                const customerOrders = orders.filter(order =>
                  order.shippingAddress?.email === c.email ||
                  order.shippingAddress?.phone === c.mobile
                )
                return customerOrders.length > 0
              }).length}
            </div>
            <div className="stat-label">Active Customers</div>
          </div>
        </div>
      </div>

      <div className="customers-content">
        {/* Filters and Search */}
        <div className="customers-filters glass-card">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              <FiFilter /> All
            </button>
            <button
              className={`filter-btn ${filterType === 'with-orders' ? 'active' : ''}`}
              onClick={() => setFilterType('with-orders')}
            >
              <FiShoppingBag /> With Orders
            </button>
            <button
              className={`filter-btn ${filterType === 'no-orders' ? 'active' : ''}`}
              onClick={() => setFilterType('no-orders')}
            >
              <FiUser /> No Orders
            </button>
          </div>
        </div>

        {/* Customers List */}
        <div className="customers-list">
          {filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <FiUser />
              <p>No customers found</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const stats = getCustomerStats(customer)
              return (
                <motion.div
                  key={customer.id}
                  className="customer-card glass-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
                >
                  <div className="customer-avatar">
                    {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="customer-info">
                    <div className="customer-name-row">
                      <h3>{customer.name || 'Unknown'}</h3>
                      {customer.loginMethod === 'google' && (
                        <span className="login-badge">Google</span>
                      )}
                    </div>
                    <div className="customer-details">
                      <p><FiPhone /> {customer.phone || customer.mobile || 'N/A'}</p>
                      {(() => {
                        const stats = getCustomerStats(customer)
                        const latestOrder = stats.orders.length > 0 
                          ? stats.orders.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
                          : null
                        if (latestOrder?.shippingAddress) {
                          const addr = latestOrder.shippingAddress
                          const addressParts = [
                            addr.city,
                            addr.state,
                            addr.pincode ? `- ${addr.pincode}` : ''
                          ].filter(Boolean)
                          if (addressParts.length > 0) {
                          return (
                              <p><FiMapPin /> {addressParts.join(' ')}</p>
                          )
                          }
                        }
                        return null
                      })()}
                      <p><FiCalendar /> Joined: {formatDate(customer.createdAt)}</p>
                    </div>
                    <div className="customer-stats-row">
                      <div className="mini-stat">
                        <FiShoppingBag />
                        <span>{stats.totalOrders} Orders</span>
                      </div>
                      <div className="mini-stat">
                        <FiDollarSign />
                        <span>{formatPrice(stats.totalSpent)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)
                    }}
                    title="View Details"
                  >
                    <FiEye />
                  </button>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <motion.div
            className="customer-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              className="customer-modal glass-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Customer Details</h2>
                <button onClick={() => setSelectedCustomer(null)}>×</button>
              </div>

              <div className="modal-content">
                <div className="customer-profile-header">
                  <div className="profile-avatar-large">
                    {selectedCustomer.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3>{selectedCustomer.name || 'Unknown'}</h3>
                    <p className="customer-id">ID: {selectedCustomer.id}</p>
                  </div>
                </div>

                <div className="details-section">
                  <h4><FiUser /> Personal Information</h4>
                  <div className="details-grid">
                    <div className="detail-item">

                    </div>
                    <div className="detail-item">
                      <label><FiPhone /> Mobile</label>
                      <p>{selectedCustomer.mobile || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label><FiCalendar /> Joined</label>
                      <p>{formatDate(selectedCustomer.createdAt)}</p>
                    </div>
                    <div className="detail-item">
                      <label>Login Method</label>
                      <p>{selectedCustomer.loginMethod === 'google' ? 'Google OAuth' : 'Email/Mobile'}</p>
                    </div>
                  </div>
                </div>

                {(() => {
                  const stats = getCustomerStats(selectedCustomer)
                  const latestOrder = stats.orders.length > 0 
                    ? stats.orders.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
                    : null
                  
                  if (latestOrder?.shippingAddress) {
                    const address = latestOrder.shippingAddress
                    return (
                      <div className="details-section">
                        <h4><FiMapPin /> Address Information</h4>
                        <div className="details-grid">
                          <div className="detail-item full-width">
                            <label>Street Address</label>
                            <p>{address.address || address.street || 'N/A'}</p>
                          </div>
                          <div className="detail-item">
                            <label>City</label>
                            <p>{address.city || 'N/A'}</p>
                          </div>
                          <div className="detail-item">
                            <label>State</label>
                            <p>{address.state || 'N/A'}</p>
                          </div>
                          <div className="detail-item">
                            <label>Pincode</label>
                            <p>{address.pincode || address.zipCode || 'N/A'}</p>
                          </div>
                          <div className="detail-item">
                            <label>Phone</label>
                            <p>{address.phone || address.mobile || selectedCustomer.mobile || 'N/A'}</p>
                          </div>
                          <div className="detail-item">
                            <label>Email</label>
                            <p>{address.email || selectedCustomer.email || 'N/A'}</p>
                          </div>
                        </div>
                        <p className="address-note">* Address from most recent order</p>
                      </div>
                    )
                  }
                  return (
                    <div className="details-section">
                      <h4><FiMapPin /> Address Information</h4>
                      <p className="no-data">No address information available yet</p>
                    </div>
                  )
                })()}

                <div className="details-section">
                  <h4><FiShoppingBag /> Order Statistics</h4>
                  {(() => {
                    const stats = getCustomerStats(selectedCustomer)
                    return (
                      <div className="details-grid">
                        <div className="detail-item">
                          <label>Total Orders</label>
                          <p className="stat-value-large">{stats.totalOrders}</p>
                        </div>
                        <div className="detail-item">
                          <label>Total Spent</label>
                          <p className="stat-value-large">{formatPrice(stats.totalSpent)}</p>
                        </div>
                        <div className="detail-item">
                          <label>Last Order</label>
                          <p>{stats.lastOrderDate ? formatDate(stats.lastOrderDate) : 'No orders yet'}</p>
                        </div>
                        <div className="detail-item">
                          <label>Average Order</label>
                          <p className="stat-value-large">
                            {stats.totalOrders > 0 ? formatPrice(stats.totalSpent / stats.totalOrders) : '₹0'}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {(() => {
                  const stats = getCustomerStats(selectedCustomer)
                  if (stats.orders.length > 0) {
                    return (
                      <div className="details-section">
                        <h4><FiShoppingBag /> Recent Orders</h4>
                        <div className="orders-list">
                          {stats.orders.slice(0, 5).map((order) => (
                            <div key={order.id} className="order-item">
                              <div>
                                <p className="order-number">{order.orderNumber || `#${order.id}`}</p>
                                <p className="order-date">{formatDate(order.date)}</p>
                              </div>
                              <div className="order-amount">
                                {formatPrice(order.total || 0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Customers

