import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiDollarSign, FiShoppingBag, FiUsers, FiCalendar, FiTrendingUp } from 'react-icons/fi'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'
import {
  adminFetchDashboardOverview,
  adminFetchSalesAnalytics,
  adminFetchOrders,
  adminFetchBookings,
  selectDashboardOverview,
  selectSalesAnalytics,
  selectAdminOrders,
  selectAdminBookings,
  selectDashboardLoading
} from '../../store/slices/adminSlice'
import { fetchProducts, selectProducts } from '../../store/slices/productSlice'
import './AdminPages.css'

// Category types mapping
const categoryTypes = {
  women: ['sarees', 'lehengas', 'kurtis', 'blouses'],
  kids: ['kids-frocks', 'kids-lehengas', 'kids-gowns', 'kids-ethnic', 'kids-party'],
  fashion: ['handbags', 'clutches', 'jewelry', 'ornaments', 'scarves', 'belts']
}

function Overview() {
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const dashboardOverview = useSelector(selectDashboardOverview)
  const salesAnalytics = useSelector(selectSalesAnalytics)
  const adminLoading = useSelector(selectDashboardLoading)
  const products = useSelector(selectProducts)
  const orders = useSelector(selectAdminOrders)
  const bookings = useSelector(selectAdminBookings)

  // Fetch data on mount - get ALL orders for analytics
  useEffect(() => {
    dispatch(adminFetchDashboardOverview())
    dispatch(adminFetchSalesAnalytics())
    dispatch(adminFetchOrders({ limit: 1000 })) // Fetch all orders
    dispatch(adminFetchBookings())
    dispatch(fetchProducts())
  }, [dispatch])

  // Fix order prices
  // const handleFixPrices = async () => {
  //   if (!window.confirm('This will recalculate all order totals based on item prices. Continue?')) {
  //     return
  //   }

  //   const loadingToast = toast.loading('Fixing order prices...')

  //   try {
  //     const response = await fetch('http://localhost:3000/admin/orders/diagnostics/fix-prices', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     })
      
  //     const result = await response.json()
      
  //     if (result.success) {
  //       toast.success(
  //         `Fixed ${result.data.ordersFixed} out of ${result.data.totalOrders} orders`,
  //         { id: loadingToast }
  //       )
  //       // Refresh orders
  //       dispatch(adminFetchOrders())
  //     } else {
  //       toast.error('Failed to fix prices: ' + (result.message || 'Unknown error'), { id: loadingToast })
  //     }
  //   } catch (error) {
  //     console.error('Error fixing prices:', error)
  //     toast.error('Error fixing prices: ' + error.message, { id: loadingToast })
  //   }
  // }

 

  // Calculate statistics from Redux data only
  const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalOrders = orders.length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const totalProducts = products.length

  // Use salesAnalytics from API if available, otherwise calculate from orders
  const salesData = useMemo(() => {
    if (salesAnalytics?.chartData?.length > 0) {
      return salesAnalytics.chartData
    }
    // Calculate from orders if no analytics data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((name, index) => {
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.date)
        return orderDate.getMonth() === index
      })
      return {
        name,
        sales: monthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      }
    })
  }, [salesAnalytics, orders])

  // Calculate category data from actual orders - grouped by main categories (Women, Kids, Fashion)
  const categoryData = useMemo(() => {
    const mainCategories = {
      'Women': { revenue: 0, color: '#E91E8C' },
      'Kids': { revenue: 0, color: '#FF6B6B' },
      'Fashion': { revenue: 0, color: '#FF8C42' }
    }

    // Calculate revenue by main category from orders
    orders.forEach(order => {
      order.items?.forEach(item => {
        // Get category from item, or look up from products if not present
        let subCategory = item.category || item.subcategory
        if (!subCategory && item.productId) {
          // Handle productId that might be an ObjectId object or string
          const itemProductId = typeof item.productId === 'object' 
            ? (item.productId._id || item.productId.$oid || item.productId.toString())
            : item.productId
          const product = products.find(p => 
            String(p._id || p.id) === String(itemProductId)
          )
          subCategory = product?.category
        }
        subCategory = (subCategory || '').toLowerCase()
        
        let mainCategory = null
        
        // Map sub-category to main category
        if (categoryTypes.women.includes(subCategory)) {
          mainCategory = 'Women'
        } else if (categoryTypes.kids.includes(subCategory)) {
          mainCategory = 'Kids'
        } else if (categoryTypes.fashion.includes(subCategory)) {
          mainCategory = 'Fashion'
        }
        
        if (mainCategory && mainCategories[mainCategory]) {
          mainCategories[mainCategory].revenue += item.price * (item.quantity || 1)
        }
      })
    })

    // Calculate total revenue
    const totalRevenue = Object.values(mainCategories).reduce((sum, cat) => sum + cat.revenue, 0)

    // If there's revenue, show percentages
    if (totalRevenue > 0) {
      return Object.entries(mainCategories)
        .filter(([_, data]) => data.revenue > 0)
        .map(([name, data]) => ({
          name,
          value: Math.round((data.revenue / totalRevenue) * 100),
          color: data.color
        }))
        .sort((a, b) => b.value - a.value)
    }

    // If there are orders but no categorized items, show equal distribution as placeholder
    if (orders.length > 0) {
      return [
        { name: 'Women', value: 33, color: '#E91E8C' },
        { name: 'Kids', value: 33, color: '#FF6B6B' },
        { name: 'Fashion', value: 34, color: '#FF8C42' }
      ]
    }
    
    // No orders at all
    return []
  }, [orders, products])

  const recentOrders = orders.slice(-5).reverse()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const stats = [
    {
      title: 'Total Sales',
      value: formatPrice(totalSales),
      icon: FiDollarSign,
      change: dashboardOverview?.salesGrowth ? `${dashboardOverview.salesGrowth > 0 ? '+' : ''}${dashboardOverview.salesGrowth}%` : '--',
      color: '#27ae60'
    },
    {
      title: 'Orders',
      value: totalOrders,
      icon: FiShoppingBag,
      change: dashboardOverview?.ordersGrowth ? `${dashboardOverview.ordersGrowth > 0 ? '+' : ''}${dashboardOverview.ordersGrowth}%` : '--',
      color: '#FF8C42'
    },
    {
      title: 'Products',
      value: totalProducts,
      icon: FiUsers,
      change: `${totalProducts} total`,
      color: '#3498db'
    },
    {
      title: 'Pending Bookings',
      value: pendingBookings,
      icon: FiCalendar,
      change: pendingBookings > 0 ? 'Active' : 'None',
      color: '#e74c3c'
    }
  ]

  return (
    <div className="admin-overview">
      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="stat-card glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              <stat.icon />
            </div>
            <div className="stat-content">
              <span className="stat-title">{stat.title}</span>
              <h3 className="stat-value">{stat.value}</h3>
              <span className="stat-change" style={{ color: stat.color }}>
                <FiTrendingUp />
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Sales Chart */}
        <motion.div
          className="chart-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3>Sales Overview</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8C42" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF8C42" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [formatPrice(value), 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#FF8C42"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          className="chart-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>Sales by Category</h3>
          <div className="chart-container pie-chart">
            {categoryData && categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {categoryData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-color" style={{ background: item.color }}></span>
                      <span className="legend-label">{item.name}</span>
                      <span className="legend-value">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '250px',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
              }}>
                <FiShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No sales data available</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Sales will appear here once orders are placed</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="activity-grid">
        {/* Recent Orders */}
        <motion.div
          className="activity-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3>Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="no-data">No orders yet</p>
          ) : (
            <div className="orders-list">
              {recentOrders.map((order, index) => (
                <div key={index} className="order-item">
                  <div className="order-info">
                    <span className="order-id">Order #{order.orderNumber || order.id}</span>
                    <span className="order-date">
                      {order.date ? new Date(order.date).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <span className="order-amount">{formatPrice(order.total)}</span>
                  <span className={`order-status paid`}>
                    Paid
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Bookings */}
        <motion.div
          className="activity-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3>Pending Bookings</h3>
          {bookings.filter(b => b.status === 'pending').length === 0 ? (
            <p className="no-data">No pending bookings</p>
          ) : (
            <div className="appointments-list">
              {bookings.filter(b => b.status === 'pending').slice(0, 5).map((booking, index) => (
                <div key={booking._id || booking.id || index} className="appointment-item">
                  <div className="apt-avatar">{booking.customerName?.charAt(0) || booking.name?.charAt(0) || 'U'}</div>
                  <div className="apt-info">
                    <span className="apt-name">{booking.customerName || booking.name}</span>
                    <span className="apt-service">{booking.serviceType || booking.measurementType}</span>
                  </div>
                  <span className="apt-date">{booking.date}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Overview
