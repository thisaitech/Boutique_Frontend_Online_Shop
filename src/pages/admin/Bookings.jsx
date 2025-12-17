import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX, FiCalendar, FiPhone, FiUser, FiMessageCircle, FiClock, FiEdit2, FiSend, FiAlertCircle, FiWifi, FiWifiOff, FiRefreshCw } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import {
  adminFetchBookings,
  adminConfirmBooking,
  adminCancelBooking,
  adminDeleteBooking,
  adminRescheduleBooking,
  adminFetchSiteConfig,
  selectAdminBookings,
  selectAdminSiteConfig,
  selectAdminBookingsLoading
} from '../../store/slices/adminSlice'
import wsService from '../../utils/websocket'
import toast from 'react-hot-toast'
import './AdminPages.css'

function Bookings() {
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const appointments = useSelector(selectAdminBookings)
  const siteConfig = useSelector(selectAdminSiteConfig)
  const isLoading = useSelector(selectAdminBookingsLoading)

  // Fetch data on mount + auto-polling
  useEffect(() => {
    dispatch(adminFetchBookings())
    dispatch(adminFetchSiteConfig())
    
    // Auto-refresh every 10 seconds
    const pollInterval = setInterval(() => {
      dispatch(adminFetchBookings())
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [dispatch])

  // WebSocket for real-time booking notifications
  useEffect(() => {
    try {
      // Connect as admin
      const adminUser = JSON.parse(localStorage.getItem('thisai_adminUser') || '{}')
      if (adminUser?.id) {
        wsService.connect(adminUser.id, 'admin')
        setWsConnected(true)

        // Listen for new bookings
        wsService.on('booking', (booking) => {
          toast.success(`New booking from ${booking.customerName || booking.name || 'Customer'}`, { 
            icon: '📅',
            duration: 5000
          })
          // Refresh bookings list
          dispatch(adminFetchBookings())
        })

        wsService.on('connection', () => {
          setWsConnected(true)
        })

        wsService.on('error', () => {
          setWsConnected(false)
        })

        return () => {
          wsService.disconnect()
        }
      }
    } catch (error) {
      console.warn('WebSocket connection failed:', error)
      setWsConnected(false)
    }
  }, [dispatch])

  const [filterStatus, setFilterStatus] = useState('all')
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [customMessage, setCustomMessage] = useState('')
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' })
  const [wsConnected, setWsConnected] = useState(false)

  // Get message templates from siteConfig or use defaults
  const messageTemplates = siteConfig?.whatsappTemplates || {
    confirmed: "Dear {name}, your appointment for {service} has been confirmed for {date} at {time}. Thank you for choosing ThisAI Boutique! For any queries, call us at {phone}.",
    rescheduled: "Dear {name}, your appointment has been rescheduled to {date} at {time}. We apologize for any inconvenience. Thank you for your understanding!",
    reminder: "Dear {name}, this is a reminder for your appointment tomorrow ({date}) at {time} for {service}. We look forward to seeing you!",
    cancelled: "Dear {name}, we regret to inform you that your appointment for {date} has been cancelled. Please contact us to reschedule at your convenience."
  }

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true
    return apt.status === filterStatus
  })

  // Sort by date (newest first)
  const sortedAppointments = [...filteredAppointments].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  )

  // Debug: Log first appointment to see structure
  if (sortedAppointments.length > 0) {
    console.log('Sample appointment data:', sortedAppointments[0])
  }

  const handleConfirm = async (appointmentId) => {
    try {
      await dispatch(adminConfirmBooking(appointmentId)).unwrap()
      toast.success('Appointment confirmed!')

      // Open WhatsApp message modal
      const apt = appointments.find(a => (a.id === appointmentId || a._id === appointmentId))
      if (apt) {
        setSelectedAppointment({ ...apt, status: 'confirmed' })
        setShowMessageModal(true)
      }
    } catch (error) {
      toast.error(error || 'Failed to confirm appointment')
    }
  }

  const handleReject = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this booking permanently? This action cannot be undone.')) {
      return
    }

    try {
      await dispatch(adminDeleteBooking(appointmentId)).unwrap()
      toast.success('Booking deleted permanently')
    } catch (error) {
      toast.error(error || 'Failed to delete booking')
    }
  }

  const handleReschedule = (appointmentId) => {
    const apt = appointments.find(a => (a.id === appointmentId || a._id === appointmentId))
    if (apt) {
      setEditingAppointment(appointmentId)
      setRescheduleData({ date: apt.date || '', time: apt.timeSlot || apt.time || '' })
    }
  }

  const confirmReschedule = async (appointmentId) => {
    if (!rescheduleData.date) {
      toast.error('Please select a new date')
      return
    }

    try {
      await dispatch(adminRescheduleBooking({
        bookingId: appointmentId,
        newDate: rescheduleData.date,
        newTimeSlot: rescheduleData.time,
        reason: 'Rescheduled by admin'
      })).unwrap()

      setEditingAppointment(null)
      toast.success('Appointment rescheduled!')

      // Open WhatsApp message modal
      const apt = appointments.find(a => (a.id === appointmentId || a._id === appointmentId))
      if (apt) {
        setSelectedAppointment({
          ...apt,
          date: rescheduleData.date,
          time: rescheduleData.time,
          status: 'rescheduled'
        })
        setShowMessageModal(true)
      }
    } catch (error) {
      toast.error(error || 'Failed to reschedule appointment')
    }
  }



  const cancelReschedule = () => {
    setEditingAppointment(null)
    setRescheduleData({ date: '', time: '' })
  }

  const openWhatsAppMessage = (appointment, templateType = 'confirmed') => {
    setSelectedAppointment(appointment)
    const template = messageTemplates[templateType] || messageTemplates.confirmed
    const message = formatMessage(template, appointment)
    setCustomMessage(message)
    setShowMessageModal(true)
  }

  const formatMessage = (template, apt) => {
    const storePhone = siteConfig?.contactPhone || '+91 98765 43210'
    return template
      .replace('{name}', apt.customerName || apt.name || apt.user?.name || 'Customer')
      .replace('{service}', getMeasurementLabel(apt.serviceType || apt.measurementType))
      .replace('{date}', formatDate(apt.date))
      .replace('{time}', apt.timeSlot || apt.time || 'to be confirmed')
      .replace('{phone}', storePhone)
  }

  const sendWhatsAppMessage = () => {
    // Get phone from appointment or nested user object
    const phoneNumber = selectedAppointment?.customerPhone || selectedAppointment?.phone || selectedAppointment?.user?.phone
    
    if (!phoneNumber) {
      toast.error('Phone number not available')
      console.log('Appointment data:', selectedAppointment)
      return
    }

    // Format phone number (remove spaces, add country code if needed)
    let phone = phoneNumber.replace(/\s/g, '')
    if (!phone.startsWith('+')) {
      phone = '+91' + phone
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(customMessage)

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')

    toast.success('WhatsApp opened!')
    setShowMessageModal(false)
    setSelectedAppointment(null)
    setCustomMessage('')

    // Re-fetch to get any backend updates
    dispatch(adminFetchBookings())
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#27ae60'
      case 'cancelled': return '#e74c3c'
      case 'rescheduled': return '#9b59b6'
      case 'completed': return '#2ecc71'
      case 'pending':
      default: return '#f39c12'
    }
  }

  const getMeasurementLabel = (type) => {
    const types = {
      'blouse-aari': 'Blouse Aari Work',
      'blouse-stitch': 'Blouse Stitching',
      'blouse-designer': 'Designer Blouse',
      'blouse-maggam': 'Blouse Maggam Work',
      'kurti-stitch': 'Kurti Stitching',
      'kurti-design': 'Kurti Custom Design',
      'kurti-embroidery': 'Kurti Embroidery Work',
      'alterations': 'Alterations',
      'custom': 'Custom Design',
      // Legacy types
      'blouse': 'Blouse Stitching',
      'salwar': 'Salwar/Kurti',
      'lehenga': 'Lehenga Alteration',
      'saree-fall': 'Saree Fall/Pico'
    }
    return types[type] || type || 'Not specified'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not specified'
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    rescheduled: appointments.filter(a => a.status === 'rescheduled').length
  }

  // Check for conflicts (same date and time)
  const checkConflicts = (date, time, excludeId) => {
    return appointments.filter(apt =>
      apt.id !== excludeId &&
      apt.date === date &&
      apt.time === time &&
      apt.status !== 'cancelled'
    )
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="bookings-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h2>Appointment Management</h2>
          <p>Manage customer tailoring appointments and send WhatsApp notifications</p>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-secondary"
            onClick={() => dispatch(adminFetchBookings())}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiRefreshCw /> Refresh Now
          </button>
          <div className="connection-status" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '20px',
            background: wsConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 146, 60, 0.1)',
            border: wsConnected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(251, 146, 60, 0.3)',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {wsConnected ? <FiWifi style={{ color: '#22c55e' }} /> : <FiWifiOff style={{ color: '#fb923c' }} />}
            {wsConnected ? 'Real-time' : 'Auto-refresh (10s)'}
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="status-filters">
        {['all', 'pending', 'confirmed', 'rescheduled'].map((status) => (
          <button
            key={status}
            className={`status-filter ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
            style={filterStatus === status ? { borderColor: getStatusColor(status) } : {}}
          >
            <span className="filter-label">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            <span className="filter-count" style={{ background: getStatusColor(status) }}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="bookings-list">
        {sortedAppointments.length === 0 ? (
          <div className="no-bookings glass-card">
            <FiCalendar className="empty-icon" />
            <h3>No appointments found</h3>
            <p>Appointments from the Service page will appear here</p>
          </div>
        ) : (
          sortedAppointments.map((appointment, index) => (
            <motion.div
              key={appointment._id || appointment.id}
              className="booking-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="booking-header">
                <div className="customer-info">
                  <div className="customer-avatar">
                    {(appointment.customerName || appointment.name || appointment.user?.name)?.charAt(0) || 'U'}
                  </div>
                  <div className="customer-details">
                    <h4>{appointment.customerName || appointment.name || appointment.user?.name || 'Guest User'}</h4>
                    <span className="booking-id">ID: {appointment._id || appointment.id}</span>
                  </div>
                </div>
                <div className="booking-status-actions">
                  <span
                    className="status-badge"
                    style={{
                      background: `${getStatusColor(appointment.status)}20`,
                      color: getStatusColor(appointment.status)
                    }}
                  >
                    {appointment.status}
                  </span>
                  {appointment.notified && (
                    <span className="notified-badge" title="Customer notified via WhatsApp">
                      <FaWhatsapp /> Notified
                    </span>
                  )}
                </div>
              </div>

              <div className="booking-details-grid">
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <div>
                    <span className="detail-label">Date</span>
                    <span className="detail-value">{formatDate(appointment.date)}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <FiClock className="detail-icon" />
                  <div>
                    <span className="detail-label">Time</span>
                    <span className="detail-value">{appointment.timeSlot || appointment.time || 'Not specified'}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <FiPhone className="detail-icon" />
                  <div>
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{appointment.customerPhone || appointment.phone || appointment.user?.phone || 'Not specified'}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <FiUser className="detail-icon" />
                  <div>
                    <span className="detail-label">Service</span>
                    <span className="detail-value service-tag">
                      {getMeasurementLabel(appointment.serviceType || appointment.measurementType)}
                    </span>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="booking-notes">
                  <span className="notes-label">Notes:</span>
                  <p>{appointment.notes}</p>
                </div>
              )}

              {appointment.referenceImage && (
                <div className="reference-image">
                  <span>Reference: {appointment.referenceImage}</span>
                </div>
              )}

              {/* Reschedule Form */}
              <AnimatePresence>
                {editingAppointment === (appointment._id || appointment.id) && (
                  <motion.div
                    className="reschedule-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h4><FiEdit2 /> Reschedule Appointment</h4>

                    {/* Check for conflicts */}
                    {rescheduleData.date && rescheduleData.time &&
                      checkConflicts(rescheduleData.date, rescheduleData.time, appointment._id || appointment.id).length > 0 && (
                      <div className="conflict-warning">
                        <FiAlertCircle />
                        <span>Another appointment exists at this time!</span>
                      </div>
                    )}

                    <div className="reschedule-inputs">
                      <div className="form-group">
                        <label>New Date</label>
                        <input
                          type="date"
                          value={rescheduleData.date}
                          min={getMinDate()}
                          onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div className="form-group">
                        <label>New Time</label>
                        <select
                          value={rescheduleData.time}
                          onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                          className="input-field"
                        >
                          <option value="">Select time</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="02:00 PM">02:00 PM</option>
                          <option value="03:00 PM">03:00 PM</option>
                          <option value="04:00 PM">04:00 PM</option>
                          <option value="05:00 PM">05:00 PM</option>
                          <option value="06:00 PM">06:00 PM</option>
                          <option value="07:00 PM">07:00 PM</option>
                        </select>
                      </div>
                    </div>
                    <div className="reschedule-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => confirmReschedule(appointment._id || appointment.id)}>
                        <FiCheck /> Confirm Reschedule
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelReschedule}>
                        <FiX /> Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="booking-actions">
                {appointment.status === 'pending' && (
                  <>
                    <button
                      className="action-btn confirm"
                      onClick={() => handleConfirm(appointment._id || appointment.id)}
                    >
                      <FiCheck />
                      Confirm
                    </button>
                    <button
                      className="action-btn reschedule"
                      onClick={() => handleReschedule(appointment._id || appointment.id)}
                    >
                      <FiEdit2 />
                      Reschedule
                    </button>
                    <button
                      className="action-btn reject"
                      onClick={() => handleReject(appointment._id || appointment.id)}
                    >
                      <FiX />
                      Delete
                    </button>
                  </>
                )}

                {(appointment.status === 'confirmed' || appointment.status === 'rescheduled') && (
                  <>
                    <button
                      className="action-btn whatsapp"
                      onClick={() => openWhatsAppMessage(appointment, appointment.status)}
                    >
                      <FaWhatsapp />
                      Send WhatsApp
                    </button>
                    <button
                      className="action-btn reschedule"
                      onClick={() => handleReschedule(appointment._id || appointment.id)}
                    >
                      <FiEdit2 />
                      Reschedule
                    </button>
                  </>
                )}
              </div>

              <div className="booking-footer">
                <span className="created-at">
                  Booked: {new Date(appointment.createdAt).toLocaleString()}
                </span>
                {appointment.lastNotifiedAt && (
                  <span className="last-notified">
                    Last notified: {new Date(appointment.lastNotifiedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* WhatsApp Message Modal */}
      <AnimatePresence>
        {showMessageModal && selectedAppointment && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMessageModal(false)}
          >
            <motion.div
              className="whatsapp-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header whatsapp-header">
                <FaWhatsapp className="whatsapp-icon" />
                <h3>Send WhatsApp Message</h3>
                <button className="modal-close-btn" onClick={() => setShowMessageModal(false)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-content">
                <div className="recipient-info">
                  <div className="recipient-avatar">
                    {selectedAppointment.name?.charAt(0) || 'U'}
                  </div>
                  <div className="recipient-details">
                    <strong>{selectedAppointment.name}</strong>
                    <span>{selectedAppointment.phone}</span>
                  </div>
                </div>

                <div className="message-templates">
                  <label>Quick Templates:</label>
                  <div className="template-buttons">
                    <button
                      className="template-btn"
                      onClick={() => setCustomMessage(formatMessage(messageTemplates.confirmed, selectedAppointment))}
                    >
                      Confirmed
                    </button>
                    <button
                      className="template-btn"
                      onClick={() => setCustomMessage(formatMessage(messageTemplates.rescheduled, selectedAppointment))}
                    >
                      Rescheduled
                    </button>
                    <button
                      className="template-btn"
                      onClick={() => setCustomMessage(formatMessage(messageTemplates.reminder, selectedAppointment))}
                    >
                      Reminder
                    </button>
                  </div>
                </div>

                <div className="message-editor">
                  <label>Message:</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="input-field"
                    rows="5"
                    placeholder="Type your message here..."
                  />
                  <div className="char-count">{customMessage.length} characters</div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowMessageModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-whatsapp" onClick={sendWhatsAppMessage}>
                  <FaWhatsapp />
                  Send via WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Bookings
