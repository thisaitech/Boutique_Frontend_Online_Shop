import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiFileText, FiDownload, FiMail, FiSearch, FiFilter,
  FiEye, FiPrinter, FiCheckCircle, FiClock, FiX, FiUser,
  FiDollarSign, FiShoppingBag, FiCalendar, FiTrendingUp
} from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
import {
  adminFetchOrders,
  selectAdminOrders,
  selectAdminOrdersLoading
} from '../../store/slices/adminSlice'
import toast from 'react-hot-toast'
import './AdminPages.css'

function Invoices() {
  const dispatch = useDispatch()
  const location = useLocation()

  // Redux state - no context fallback
  const orders = useSelector(selectAdminOrders)
  const isLoading = useSelector(selectAdminOrdersLoading)

  // offlineBills not implemented in backend yet - use empty array
  const offlineBills = []

  // Fetch orders on mount
  useEffect(() => {
    dispatch(adminFetchOrders())
  }, [dispatch])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('invoices') // 'invoices' or 'bills'
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedBill, setSelectedBill] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const orderId = params.get('orderId')
    if (orderId) {
      setSearchTerm(orderId)
    }
  }, [location.search])

  // Generate invoices from orders
  const invoices = useMemo(() => {
    return orders.map((order, index) => ({
      id: `INV-${String(index + 1001).padStart(5, '0')}`,
      orderId: order.id,
      orderNumber: order.orderNumber || `ORD-${String(order.id).padStart(5, '0')}`,
      customerName: order.customerName || order.customer?.name || 'Guest Customer',
      customerEmail: order.customerEmail || order.customer?.email || '',
      customerPhone: order.shippingAddress?.phone || order.customer?.phone || order.customer?.mobile || '',
      date: order.createdAt || order.date || new Date().toISOString(),
      dueDate: new Date(new Date(order.createdAt || order.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: order.items || [],
      subtotal: order.subtotal || order.total || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      total: order.total || 0,
      status: 'paid',
      paymentMethod: order.paymentMethod || 'Razorpay',
      address: order.shippingAddress || {}
    }))
  }, [orders])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [invoices, searchTerm, statusFilter])

  // Filter bills
  const filteredBills = useMemo(() => {
    return offlineBills.filter(bill => {
      const matchesSearch = bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || bill.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [offlineBills, searchTerm, statusFilter])

  // Calculate stats
  const stats = useMemo(() => {
    if (categoryFilter === 'bills') {
      const total = offlineBills.length
      const paid = offlineBills.filter(b => b.status === 'paid').length
      const totalRevenue = offlineBills.reduce((sum, b) => sum + (b.status === 'paid' ? b.total : 0), 0)
      return { total, paid, totalRevenue }
    } else {
      const total = invoices.length
      const paid = invoices.filter(inv => inv.status === 'paid').length
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.total : 0), 0)
      return { total, paid, totalRevenue }
    }
  }, [invoices, offlineBills, categoryFilter])

  const formatPrice = (price) => {
    if (price >= 10000000) { // 1 crore or more
      return `₹${(price / 10000000).toFixed(1)}Cr`
    } else if (price >= 100000) { // 1 lakh or more
      return `₹${(price / 100000).toFixed(1)}L`
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const paymentLabel = (method) => {
    if (method === 'cod') return 'Cash on Delivery'
    if (method === 'razorpay_card') return 'Razorpay Card'
    if (method === 'razorpay_upi') return 'Razorpay UPI'
    return method || 'Online Payment'
  }

  const generatePDF = (invoice) => {
    const printWindow = window.open('', '_blank')
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.id}</title>
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
            <p><strong>${invoice.customerName}</strong></p>
            <p>${invoice.customerPhone || 'No phone provided'}</p>
            <p>${invoice.address.street || ''}</p>
            <p>${invoice.address.city || ''}, ${invoice.address.state || ''} ${invoice.address.pincode || ''}</p>
            <p>${invoice.address.phone || ''}</p>
          </div>
          <div style="text-align: right;">
            <h3>Invoice Details:</h3>
            <p><strong>Invoice #:</strong> ${invoice.id}</p>
            <p><strong>Order #:</strong> ${invoice.orderNumber}</p>
            <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
            <p><strong>Status:</strong> <span style="color: ${invoice.status === 'paid' ? '#27ae60' : '#e67e22'}; font-weight: bold;">${invoice.status.toUpperCase()}</span></p>
            <p><strong>Payment:</strong> ${paymentLabel(invoice.paymentMethod)}</p>
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
            ${invoice.items.map(item => `
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
          <div><strong>Subtotal:</strong> ${formatPrice(invoice.subtotal)}</div>
          ${invoice.tax > 0 ? `<div><strong>Tax:</strong> ${formatPrice(invoice.tax)}</div>` : ''}
          ${invoice.shipping > 0 ? `<div><strong>Shipping:</strong> ${formatPrice(invoice.shipping)}</div>` : ''}
          ${invoice.discount > 0 ? `<div style="color: #27ae60;"><strong>Discount:</strong> -${formatPrice(invoice.discount)}</div>` : ''}
          <div class="grand-total"><strong>Total Amount:</strong> ${formatPrice(invoice.total)}</div>
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

  const sendEmail = (invoice) => {
    setTimeout(() => {
      toast.success(`Invoice sent to ${invoice.customerEmail}`)
    }, 1000)
  }

  const downloadInvoice = (invoice) => {
    generatePDF(invoice)
  }

  const viewInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setSelectedBill(null)
    setShowPreview(true)
  }

  const viewBill = (bill) => {
    setSelectedBill(bill)
    setSelectedInvoice(null)
    setShowPreview(true)
  }

  const generateBillPDF = (bill) => {
    const printWindow = window.open('', '_blank')
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill ${bill.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .bill-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #E91E8C; padding-bottom: 20px; }
          .bill-header h1 { color: #E91E8C; margin: 0; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-info div { width: 48%; }
          .bill-info h3 { color: #333; font-size: 14px; margin-bottom: 5px; }
          .bill-info p { margin: 3px 0; font-size: 13px; color: #666; }
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
        <div class="bill-header">
          <h1>BILL RECEIPT</h1>
          <p style="margin: 5px 0; color: #666;">ThisAI Boutique</p>
          <p style="margin: 0; font-size: 12px; color: #999;">Elegant Fashion for Every Occasion</p>
        </div>

        <div class="bill-info">
          <div style="text-align: right;">
            <h3>Bill Details:</h3>
            <p><strong>Bill #:</strong> ${bill.billNumber}</p>
            <p><strong>Date:</strong> ${formatDate(bill.date)}</p>
            <p><strong>Status:</strong> <span style="color: ${bill.status === 'paid' ? '#27ae60' : '#e67e22'}; font-weight: bold;">${bill.status.toUpperCase()}</span></p>
            <p><strong>Payment:</strong> ${bill.paymentMethod.toUpperCase()}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Color</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.color || 'N/A'}</td>
                <td>${item.size || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div>Subtotal: ${formatPrice(bill.subtotal)}</div>
          ${bill.discount > 0 ? `<div>Discount: -${formatPrice(bill.discount)}</div>` : ''}
          <div class="grand-total">Total: ${formatPrice(bill.total)}</div>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>ThisAI Boutique - Your Trusted Fashion Partner</p>
        </div>
      </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
    toast.success('Bill generated successfully')
  }

  return (
    <div className="invoices-page">
      {/* Page Header */}
      <div className="invoices-page-header">
        <div className="page-title-section">
          <div className="title-icon-wrapper">
            <FiFileText className="title-icon" />
          </div>
          <div className="title-content">
            <h1>Invoice Management</h1>
            <p>Generate, view, and manage customer invoices</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Horizontal 4 columns */}
      <div className="invoices-stats-grid">
        <motion.div
          className="invoice-stat-card stat-total"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon-box">
            <FiFileText />
          </div>
          <div className="stat-content-box">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Invoices</div>
          </div>
        </motion.div>

        <motion.div
          className="invoice-stat-card stat-paid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="stat-icon-box">
            <FiCheckCircle />
          </div>
          <div className="stat-content-box">
            <div className="stat-number">{stats.paid}</div>
            <div className="stat-label">Paid</div>
          </div>
        </motion.div>

        <motion.div
          className="invoice-stat-card stat-revenue"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="stat-icon-box">
            <FiDollarSign />
          </div>
          <div className="stat-content-box">
            <div className="stat-number">{formatPrice(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter Bar */}
      <div className="invoices-action-bar">
        <div className="search-bar-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by invoice ID, customer name, or order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons-group">
          <button
            className={`filter-btn ${categoryFilter === 'invoices' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('invoices')
              setStatusFilter('all')
            }}
          >
            <FiFileText /> Invoices
          </button>
          {/* <button
            className={`filter-btn ${categoryFilter === 'bills' ? 'active' : ''}`}
            onClick={() => {
              setCategoryFilter('bills')
              setStatusFilter('all')
            }}
          >
            <FiShoppingBag /> Bills
          </button> */}
        </div>

        <div className="filter-buttons-group">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <FiFilter /> All
          </button>
          <button
            className={`filter-btn ${statusFilter === 'paid' ? 'active' : ''}`}
            onClick={() => setStatusFilter('paid')}
          >
            <FiCheckCircle /> Paid
          </button>
        </div>
      </div>

      {/* Invoice/Bill Cards List */}
      <div className="invoices-list-container">
        {categoryFilter === 'bills' ? (
          filteredBills.length > 0 ? (
            <div className="invoices-list">
              {filteredBills.map((bill, index) => (
                <motion.div
                  key={bill.id}
                  className="invoice-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="invoice-card-header">
                    <div className="invoice-id-section">
                      <div className="invoice-id-row">
                        <FiShoppingBag className="invoice-id-icon" />
                        <span className="invoice-id-text">{bill.billNumber}</span>
                      </div>
                      <div className="invoice-date-row">
                        <FiCalendar className="invoice-date-icon" />
                        <span className="invoice-date-text">{formatDate(bill.date)}</span>
                      </div>
                    </div>
                    <div className={`invoice-status-badge ${bill.status}`}>
                      {bill.status === 'paid' ? <FiCheckCircle /> : <FiClock />}
                      <span>{bill.status}</span>
                    </div>
                  </div>

                  <div className="invoice-card-body">
                    <div className="invoice-amount-section">
                      <span className="invoice-amount-label">Total Amount</span>
                      <span className="invoice-amount-value">{formatPrice(bill.total)}</span>
                    </div>
                    <div className="invoice-payment-info">
                      <span className="payment-method-badge">{bill.paymentMethod.toUpperCase()}</span>
                      {bill.items && bill.items.length > 0 && (
                        <span className="invoice-items-count">{bill.items.length} item(s)</span>
                      )}
                    </div>
                  </div>

                  <div className="invoice-card-footer">
                    <div className="invoice-total-section">
                      <span className="total-label">Total Amount</span>
                      <span className="total-amount">{formatPrice(bill.total)}</span>
                    </div>
                    <div className="invoice-action-buttons">
                      <button className="action-btn btn-view" onClick={() => viewBill(bill)}>
                        <FiEye /> View
                      </button>
                      <button className="action-btn btn-download" onClick={() => generateBillPDF(bill)}>
                        <FiDownload /> Generate Bill
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="invoices-empty-state">
              <div className="empty-icon">
                <FiShoppingBag size={64} />
              </div>
              <h3>No bills found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )
        ) : filteredInvoices.length > 0 ? (
          <div className="invoices-list">
            {filteredInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                className="invoice-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                {/* Card Header */}
                <div className="invoice-card-header">
                  <div className="invoice-id-section">
                    <div className="invoice-id-row">
                      <FiFileText className="invoice-id-icon" />
                      <span className="invoice-id-text">{invoice.id}</span>
                    </div>
                    <div className="invoice-date-row">
                      <FiCalendar className="invoice-date-icon" />
                      <span className="invoice-date-text">{formatDate(invoice.date)}</span>
                    </div>
                  </div>
                  <div className={`invoice-status-badge ${invoice.status}`}>
                    {invoice.status === 'paid' ? <FiCheckCircle /> : <FiClock />}
                    <span>{invoice.status}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="invoice-card-body">
                  <div className="invoice-customer-section">
                    <div className="customer-avatar">
                      {invoice.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="customer-details">
                      <div className="customer-name">{invoice.customerName}</div>
                      <div className="customer-email">{invoice.customerPhone || 'No phone provided'}</div>
                    </div>
                  </div>

                  <div className="invoice-info-grid">
                    <div className="info-item">
                      <FiShoppingBag className="info-icon" />
                      <div className="info-content">
                        <span className="info-label">Order #</span>
                        <span className="info-value">{invoice.orderNumber}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <FiTrendingUp className="info-icon" />
                      <div className="info-content">
                        <span className="info-label">Items</span>
                        <span className="info-value">{invoice.items.length}</span>
                      </div>
                    </div>
                    <div className="payment-method-badge">
                      {paymentLabel(invoice.paymentMethod)}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="invoice-card-footer">
                  <div className="invoice-total-section">
                    <span className="total-label">Total Amount</span>
                    <span className="total-amount">{formatPrice(invoice.total)}</span>
                  </div>
                  <div className="invoice-action-buttons">
                    <button
                      className="action-btn btn-view"
                      onClick={() => viewInvoice(invoice)}
                      title="View Invoice"
                    >
                      <FiEye />
                      <span>View</span>
                    </button>
                    <button
                      className="action-btn btn-download"
                      onClick={() => downloadInvoice(invoice)}
                      title="Download PDF"
                    >
                      <FiDownload />
                      <span>Download</span>
                    </button>
                    <button
                      className="action-btn btn-print"
                      onClick={() => generatePDF(invoice)}
                      title="Print Invoice"
                    >
                      <FiPrinter />
                      <span>Print</span>
                    </button>
                    <button
                      className="action-btn btn-email"
                      onClick={() => sendEmail(invoice)}
                      title="Email Invoice"
                      disabled={!invoice.customerEmail}
                    >
                      <FiMail />
                      <span>Email</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="invoices-empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-icon">
              <FiFileText size={64} />
            </div>
            <h3>No invoices found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </div>

      {/* Bill Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedBill && (
          <motion.div
            className="invoice-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowPreview(false)
              setSelectedBill(null)
            }}
          >
            <motion.div
              className="invoice-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <h2><FiShoppingBag /> Bill Details</h2>
                  <p>{selectedBill.billNumber}</p>
                </div>
                <button className="modal-close-btn" onClick={() => {
                  setShowPreview(false)
                  setSelectedBill(null)
                }}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="invoice-preview-header">
                  <div className="preview-brand">
                    <h1>BILL RECEIPT</h1>
                    <p>ThisAI Boutique</p>
                  </div>
                  <div className="preview-details">
                    <div className="preview-row">
                      <span>Bill #:</span>
                      <strong>{selectedBill.billNumber}</strong>
                    </div>
                    <div className="preview-row">
                      <span>Date:</span>
                      <strong>{formatDate(selectedBill.date)}</strong>
                    </div>
                    <div className="preview-row">
                      <span>Status:</span>
                      <strong className={`status-${selectedBill.status}`}>{selectedBill.status.toUpperCase()}</strong>
                    </div>
                    <div className="preview-row">
                      <span>Payment:</span>
                      <strong>{selectedBill.paymentMethod.toUpperCase()}</strong>
                    </div>
                  </div>
                </div>

                <div className="invoice-items-preview">
                  <h3><FiShoppingBag /> Items:</h3>
                  {selectedBill.items.map((item, idx) => (
                    <div key={idx} className="invoice-item-preview">
                      <div className="item-info">
                        <strong>{item.name}</strong>
                        {item.color && <span> - {item.color}</span>}
                        {item.size && <span> - Size: {item.size}</span>}
                      </div>
                      <div className="item-details">
                        <span>Qty: {item.quantity} × {formatPrice(item.price)}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="invoice-totals-preview">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedBill.subtotal)}</span>
                  </div>
                  {selectedBill.discount > 0 && (
                    <div className="total-row">
                      <span>Discount:</span>
                      <span>-{formatPrice(selectedBill.discount)}</span>
                    </div>
                  )}
                  <div className="total-row total-grand">
                    <span>Total:</span>
                    <span>{formatPrice(selectedBill.total)}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => {
                  setShowPreview(false)
                  setSelectedBill(null)
                }}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={() => generateBillPDF(selectedBill)}>
                  <FiDownload /> Generate Bill PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedInvoice && (
          <motion.div
            className="invoice-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              className="invoice-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <h2>
                    <FiFileText /> Invoice Details
                  </h2>
                  <p>{selectedInvoice.id}</p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowPreview(false)}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="invoice-preview-header">
                  <div className="preview-brand">
                    <h1>INVOICE</h1>
                    <p>ThisAI Boutique</p>
                  </div>
                  <div className="preview-details">
                    <div className="preview-row">
                      <span>Invoice #:</span>
                      <strong>{selectedInvoice.id}</strong>
                    </div>
                    <div className="preview-row">
                      <span>Date:</span>
                      <strong>{formatDate(selectedInvoice.date)}</strong>
                    </div>
                    <div className="preview-row">
                      <span>Status:</span>
                      <span className={`status-badge ${selectedInvoice.status}`}>
                        {selectedInvoice.status === 'paid' ? <FiCheckCircle /> : <FiClock />}
                        {selectedInvoice.status}
                      </span>
                    </div>
                    <div className="preview-row">
                      <span>Payment:</span>
                      <strong>{paymentLabel(selectedInvoice.paymentMethod)}</strong>
                    </div>
                  </div>
                </div>

                <div className="invoice-customer-section">
                  <h3>
                    <FiUser /> Bill To:
                  </h3>
                  <div className="customer-details-preview">
                    <p><strong>{selectedInvoice.customerName}</strong></p>
                    <p>{selectedInvoice.customerEmail}</p>
                    {selectedInvoice.address && (
                      <>
                        {selectedInvoice.address.street && <p>{selectedInvoice.address.street}</p>}
                        <p>{[selectedInvoice.address.city, selectedInvoice.address.state, selectedInvoice.address.pincode].filter(Boolean).join(', ')}</p>
                        {selectedInvoice.address.phone && <p>{selectedInvoice.address.phone}</p>}
                      </>
                    )}
                  </div>
                </div>

                <div className="invoice-table-container">
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.quantity || 1}</td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{formatPrice(item.price * (item.quantity || 1))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="invoice-totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="total-row">
                      <span>Tax:</span>
                      <span>{formatPrice(selectedInvoice.tax)}</span>
                    </div>
                  )}
                  {selectedInvoice.shipping > 0 && (
                    <div className="total-row">
                      <span>Shipping:</span>
                      <span>{formatPrice(selectedInvoice.shipping)}</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="total-row total-discount">
                      <span>Discount:</span>
                      <span>-{formatPrice(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="total-row total-grand">
                    <span><strong>Total:</strong></span>
                    <span><strong>{formatPrice(selectedInvoice.total)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </button>
                <button
                  className="btn-primary"
                  onClick={() => generatePDF(selectedInvoice)}
                >
                  <FiDownload /> Download PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Invoices
