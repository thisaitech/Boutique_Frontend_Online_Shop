import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiDownload,
  FiCalendar, FiPieChart, FiBarChart2, FiShoppingBag
} from 'react-icons/fi'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts'
import {
  adminFetchOrders,
  selectAdminOrders,
  selectAdminOrdersLoading
} from '../../store/slices/adminSlice'
import { fetchProducts, selectProducts } from '../../store/slices/productSlice'
import './AdminPages.css'

// Category types mapping (moved from products.js)
const categoryTypes = {
  women: ['sarees', 'lehengas', 'kurtis', 'blouses'],
  kids: ['kids-frocks', 'kids-lehengas', 'kids-gowns', 'kids-ethnic', 'kids-party'],
  fashion: ['handbags', 'clutches', 'jewelry', 'ornaments', 'scarves', 'belts']
}

function Revenue() {
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const orders = useSelector(selectAdminOrders)
  const inventory = useSelector(selectProducts)
  const isLoading = useSelector(selectAdminOrdersLoading)

  // Fetch data on mount - get ALL orders (no pagination limit)
  useEffect(() => {
    dispatch(adminFetchOrders({ limit: 1000 })) // Fetch all orders for analytics
    dispatch(fetchProducts())
  }, [dispatch])

  // Debug: Log orders data
  useEffect(() => {
    console.log('📊 Revenue - Orders loaded:', orders.length, orders)
    if (orders.length > 0) {
      console.log('📊 Sample order:', orders[0])
      console.log('📊 Order total:', orders[0].total, 'createdAt:', orders[0].createdAt)
    }
  }, [orders])

  const [timeRange, setTimeRange] = useState('month') // week, month, year, all
  const [viewMode, setViewMode] = useState('overview') // overview, category, products

  // Calculate revenue metrics
  const metrics = useMemo(() => {
    const now = new Date()
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt || order.date)

      switch(timeRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return orderDate >= weekAgo
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return orderDate >= monthAgo
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          return orderDate >= yearAgo
        default:
          return true
      }
    })

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalOrders = filteredOrders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate actual profit based on realPrice (cost price)
    let totalCost = 0
    let totalProfit = 0

    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const product = inventory.find(p => p.id === item.productId || p.id === item.id)
        const quantity = item.quantity || 1
        const sellingPrice = item.price || 0
        const realPrice = product?.realPrice || 0

        // Calculate cost and profit for this item
        const itemCost = realPrice * quantity
        const itemRevenue = sellingPrice * quantity
        const itemProfit = itemRevenue - itemCost

        totalCost += itemCost
        totalProfit += itemProfit
      })
    })

    // Calculate profit margin percentage
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0

    // Count products sold
    const productsSold = filteredOrders.reduce((count, order) => {
      return count + (order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0)
    }, 0)

    return {
      totalRevenue,
      totalProfit,
      profitMargin,
      totalOrders,
      avgOrderValue,
      productsSold,
      totalCost
    }
  }, [orders, timeRange, inventory])

  // Sales trend data for chart
  const salesTrendData = useMemo(() => {
    const data = []
    const now = new Date()
    // Reset time to end of day for accurate comparison
    now.setHours(23, 59, 59, 999)

    if (timeRange === 'week') {
      // Show all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)
        
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt || order.date)
          return orderDate >= dayStart && orderDate <= dayEnd
        })
        data.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          orders: dayOrders.length
        })
      }
    } else if (timeRange === 'month') {
      // Show all 30 days for accurate data (or group into 6 periods of 5 days each)
      const periods = 6
      const daysPerPeriod = 5
      
      for (let p = periods - 1; p >= 0; p--) {
        const periodEnd = new Date(now.getTime() - p * daysPerPeriod * 24 * 60 * 60 * 1000)
        const periodStart = new Date(periodEnd.getTime() - (daysPerPeriod - 1) * 24 * 60 * 60 * 1000)
        periodStart.setHours(0, 0, 0, 0)
        periodEnd.setHours(23, 59, 59, 999)
        
        const periodOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt || order.date)
          return orderDate >= periodStart && orderDate <= periodEnd
        })
        
        data.push({
          name: periodEnd.getDate(),
          revenue: periodOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          orders: periodOrders.length
        })
      }
    } else if (timeRange === 'year') {
      // Show all 12 months
      const currentYear = now.getFullYear()
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      months.forEach((month, index) => {
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt || order.date)
          return orderDate.getMonth() === index && orderDate.getFullYear() === currentYear
        })
        data.push({
          name: month,
          revenue: monthOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          orders: monthOrders.length
        })
      })
    } else {
      // All time - group by month across all years
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      months.forEach((month, index) => {
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt || order.date)
          return orderDate.getMonth() === index
        })
        data.push({
          name: month,
          revenue: monthOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          orders: monthOrders.length
        })
      })
    }

    return data
  }, [orders, timeRange])

  // Category breakdown - Group by main categories (Women, Kids, Fashion)
  const categoryData = useMemo(() => {
    const mainCategories = {
      'Women': { revenue: 0, count: 0 },
      'Kids': { revenue: 0, count: 0 },
      'Fashion': { revenue: 0, count: 0 },
      'Other': { revenue: 0, count: 0 }
    }

    orders.forEach(order => {
      order.items?.forEach(item => {
        // Get category from item, or look up from inventory if not present
        let subCategory = item.category
        if (!subCategory && item.productId) {
          // Handle productId that might be an ObjectId object or string
          const itemProductId = typeof item.productId === 'object' 
            ? (item.productId._id || item.productId.$oid || item.productId.toString())
            : item.productId
          const product = inventory.find(p => 
            String(p._id || p.id) === String(itemProductId)
          )
          subCategory = product?.category
        }
        subCategory = (subCategory || 'other').toLowerCase()
        
        let mainCategory = 'Other'
        
        // Map sub-category to main category
        if (categoryTypes.women.includes(subCategory)) {
          mainCategory = 'Women'
        } else if (categoryTypes.kids.includes(subCategory)) {
          mainCategory = 'Kids'
        } else if (categoryTypes.fashion.includes(subCategory)) {
          mainCategory = 'Fashion'
        }
        
        mainCategories[mainCategory].revenue += item.price * (item.quantity || 1)
        mainCategories[mainCategory].count += item.quantity || 1
      })
    })

    // Filter out categories with zero revenue and sort by revenue
    return Object.entries(mainCategories)
      .filter(([_, data]) => data.revenue > 0)
      .map(([name, data]) => ({
        name,
        value: data.revenue,
        count: data.count
      }))
      .sort((a, b) => b.value - a.value)
  }, [orders, inventory])

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales = {}

    orders.forEach(order => {
      order.items?.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            id: item.id,
            name: item.name,
            revenue: 0,
            quantity: 0,
            image: item.image
          }
        }
        productSales[item.id].revenue += item.price * (item.quantity || 1)
        productSales[item.id].quantity += item.quantity || 1
      })
    })

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [orders])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const COLORS = ['#E91E8C', '#FF6B6B', '#FFA500', '#9C27B0', '#3498db', '#27ae60']

  const exportReport = () => {
    const csvContent = [
      ['Revenue Report', timeRange.toUpperCase()],
      [''],
      ['Metric', 'Value'],
      ['Total Revenue', formatPrice(metrics.totalRevenue)],
      ['Total Profit', formatPrice(metrics.totalProfit)],
      ['Profit Margin', `${metrics.profitMargin}%`],
      ['Total Orders', metrics.totalOrders],
      ['Average Order Value', formatPrice(metrics.avgOrderValue)],
      ['Products Sold', metrics.productsSold],
      [''],
      ['Top Products'],
      ['Product', 'Quantity Sold', 'Revenue'],
      ...topProducts.map(p => [p.name, p.quantity, formatPrice(p.revenue)])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="revenue-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Revenue Analytics</h1>
          <p>Track your sales, profit, and business performance</p>
        </div>
        <div className="header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
          <button className="btn btn-primary" onClick={exportReport}>
            <FiDownload />
            Export Report
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <motion.div
          className="metric-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}>
            <FiDollarSign />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Revenue</span>
            <h2 className="metric-value">{formatPrice(metrics.totalRevenue)}</h2>
            <span className="metric-change positive">
              <FiTrendingUp /> +12% from last period
            </span>
          </div>
        </motion.div>

        <motion.div
          className="metric-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
            <FiPieChart />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Profit</span>
            <h2 className="metric-value">{formatPrice(metrics.totalProfit)}</h2>
            <span className="metric-change positive">
              Margin: {metrics.profitMargin}%
            </span>
          </div>
        </motion.div>

        <motion.div
          className="metric-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #C2185B 100%)' }}>
            <FiShoppingBag />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Orders</span>
            <h2 className="metric-value">{metrics.totalOrders}</h2>
            <span className="metric-change positive">
              <FiTrendingUp /> +8% this period
            </span>
          </div>
        </motion.div>

        <motion.div
          className="metric-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #9C27B0 0%, #8E24AA 100%)' }}>
            <FiBarChart2 />
          </div>
          <div className="metric-content">
            <span className="metric-label">Avg Order Value</span>
            <h2 className="metric-value">{formatPrice(metrics.avgOrderValue)}</h2>
            <span className="metric-change">
              {metrics.productsSold} products sold
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Sales Trend Chart */}
        <motion.div
          className="chart-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="chart-header">
            <h3>Sales Trend</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color" style={{ background: '#E91E8C' }}></span>
                Revenue
              </span>
              <span className="legend-item">
                <span className="legend-color" style={{ background: '#3498db' }}></span>
                Orders
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={salesTrendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E91E8C" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#E91E8C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
                label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666' } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#3498db"
                tick={{ fill: '#3498db', fontSize: 12 }}
                label={{ value: 'Orders', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#3498db' } }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #E91E8C',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                formatter={(value, name) => {
                  if (name === 'revenue') {
                    return [formatPrice(value), 'Revenue']
                  }
                  return [value, 'Orders']
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => value}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#E91E8C"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
              <Bar
                yAxisId="right"
                dataKey="orders"
                fill="#3498db"
                name="Orders"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          className="chart-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="chart-header">
            <h3>Revenue by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={100}
                innerRadius={30}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => {
                  const total = categoryData.reduce((sum, item) => sum + item.value, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return [
                    `${formatPrice(value)} (${percentage}%)`,
                    props.payload.name
                  ]
                }}
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #E91E8C',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry) => {
                  const total = categoryData.reduce((sum, item) => sum + item.value, 0)
                  const percentage = ((entry.payload.value / total) * 100).toFixed(1)
                  return `${value} - ${formatPrice(entry.payload.value)} (${percentage}%)`
                }}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Products Table */}
      <motion.div
        className="top-products-card glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="card-header">
          <h3>Top Selling Products</h3>
          <span className="badge">{topProducts.length} Products</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
                <th>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>
                    <div className="rank-badge">{index + 1}</div>
                  </td>
                  <td>
                    <div className="product-cell">
                      <img src={product.image} alt={product.name} className="product-thumb" />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="quantity-badge">{product.quantity}</span>
                  </td>
                  <td>
                    <strong>{formatPrice(product.revenue)}</strong>
                  </td>
                  <td>
                    {formatPrice(product.revenue / product.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default Revenue
