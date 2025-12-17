import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiUser, FiPhone, FiMessageSquare, FiClock, FiTrash2, FiCheck, FiX, FiSearch, FiFilter, FiWifi, FiWifiOff } from 'react-icons/fi'
import {
  adminFetchMessages,
  adminUpdateMessageStatus,
  adminDeleteMessage,
  selectAdminMessages,
  selectAdminMessagesLoading
} from '../../store/slices/adminSlice'
import { selectUser } from '../../store/slices/authSlice'
import wsService from '../../utils/websocket'
import toast from 'react-hot-toast'
import './AdminPages.css'

function Messages() {
  const dispatch = useDispatch()
  const adminUser = useSelector(selectUser)

  // Redux state - no context fallback
  const messages = useSelector(selectAdminMessages)
  const isLoading = useSelector(selectAdminMessagesLoading)
  const getMessageId = (msg) => msg?._id || msg?.id

  // Fetch messages on mount and set up polling
  useEffect(() => {
    dispatch(adminFetchMessages())
    
    // Poll for new messages every 10 seconds
    const pollInterval = setInterval(() => {
      dispatch(adminFetchMessages())
    }, 10000)
    
    return () => clearInterval(pollInterval)
  }, [dispatch])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'unread', 'read'
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)

  // WebSocket connection for admin (optional - won't break if server not available)
  useEffect(() => {
    try {
      const adminId = localStorage.getItem('thisai_adminUser')
      if (adminId) {
        const adminData = JSON.parse(adminId)
        wsService.connect(adminData.id || 'admin', 'admin')

        const handleConnection = (data) => {
          setWsConnected(data.status === 'connected')
          if (data.status === 'connected') {
            toast.success('Real-time messaging connected', { duration: 2000 })
          }
        }

        const handleMessage = (message) => {
          toast.success(`New message from ${message.name}`, {
            duration: 4000,
            icon: '📧'
          })
          dispatch(adminFetchMessages())
        }

        const handleMessageRead = () => {
          dispatch(adminFetchMessages())
        }

        wsService.on('connection', handleConnection)
        wsService.on('message', handleMessage)
        wsService.on('messageRead', handleMessageRead)

        return () => {
          wsService.off('connection', handleConnection)
          wsService.off('message', handleMessage)
          wsService.off('messageRead', handleMessageRead)
        }
      }
    } catch (error) {
      console.warn('WebSocket connection failed:', error)
    }
  }, [dispatch])

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) return []
    return messages
      .filter(msg => {
        // Status filter
        if (statusFilter === 'unread' && msg.status !== 'unread') return false
        if (statusFilter === 'read' && msg.status !== 'read') return false

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const matchesName = msg.name?.toLowerCase().includes(query)
          const matchesEmail = msg.email?.toLowerCase().includes(query)
          const matchesSubject = msg.subject?.toLowerCase().includes(query)
          const matchesMessage = msg.message?.toLowerCase().includes(query)
          return matchesName || matchesEmail || matchesSubject || matchesMessage
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [messages, statusFilter, searchQuery])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSafeField = (message, legacyField, modernField) => {
    return message?.[legacyField] || message?.[modernField] || ''
  }

  const handleMarkAsRead = async (messageId) => {
    if (!messageId) return
    try {
      await dispatch(adminUpdateMessageStatus({ messageId, status: 'read' })).unwrap()
      toast.success('Message marked as read')
    } catch (error) {
      toast.error(error || 'Failed to update message')
    }
  }

  const handleMarkAsUnread = async (messageId) => {
    if (!messageId) return
    try {
      await dispatch(adminUpdateMessageStatus({ messageId, status: 'unread' })).unwrap()
      toast.success('Message marked as unread')
    } catch (error) {
      toast.error(error || 'Failed to update message')
    }
  }

  const handleDelete = async (messageId) => {
    if (!messageId) return
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await dispatch(adminDeleteMessage(messageId)).unwrap()
        if (getMessageId(selectedMessage) === messageId) {
          setSelectedMessage(null)
        }
        toast.success('Message deleted')
      } catch (error) {
        toast.error(error || 'Failed to delete message')
      }
    }
  }

  const unreadCount = messages && Array.isArray(messages) ? messages.filter(m => m.status === 'unread').length : 0

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <FiMessageSquare />
            Messages
          </h1>
          {unreadCount > 0 && (
            <span className="badge badge-primary">{unreadCount} unread</span>
          )}
          <span 
            className="badge" 
            style={{ 
              background: wsConnected ? 'rgba(39, 174, 96, 0.1)' : 'rgba(52, 152, 219, 0.1)',
              color: wsConnected ? '#27ae60' : '#3498db',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {wsConnected ? <FiWifi /> : <FiWifiOff />}
            {wsConnected ? 'Real-time' : 'Auto-refresh (10s)'}
          </span>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => dispatch(adminFetchMessages())}
            style={{ marginLeft: '8px' }}
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <motion.div
          className="stat-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="stat-icon">
            <FiMessageSquare />
          </div>
          <div className="stat-info">
            <div className="stat-number">{messages && Array.isArray(messages) ? messages.length : 0}</div>
            <div className="stat-text">Total Messages</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon" style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
            <FiMail />
          </div>
          <div className="stat-info">
            <div className="stat-number">{unreadCount}</div>
            <div className="stat-text">Unread</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-icon" style={{ background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60' }}>
            <FiCheck />
          </div>
          <div className="stat-info">
            <div className="stat-number">{(messages && Array.isArray(messages) ? messages.length : 0) - unreadCount}</div>
            <div className="stat-text">Read</div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="filters-bar glass-card">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, subject, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${statusFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-tab ${statusFilter === 'read' ? 'active' : ''}`}
            onClick={() => setStatusFilter('read')}
          >
            Read
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="messages-container">
        {filteredMessages.length === 0 ? (
          <motion.div
            className="empty-state glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-icon">
              <FiMessageSquare />
            </div>
            <h2>No messages found</h2>
            <p>
              {(!messages || !Array.isArray(messages) || messages.length === 0)
                ? "No messages have been received yet."
                : "No messages match your search criteria."
              }
            </p>
          </motion.div>
        ) : (
          <div className="messages-list">
            {filteredMessages.map((message, index) => {
              const messageId = getMessageId(message)
              const isSelected = getMessageId(selectedMessage) === messageId
              return (
              <motion.div
                key={messageId || index}
                className={`message-card glass-card ${message.status === 'unread' ? 'unread' : ''} ${isSelected ? 'selected' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedMessage(message)
                  if (message.status === 'unread') {
                    handleMarkAsRead(messageId)
                  }
                }}
              >
                <div className="message-header">
                  <div className="message-sender">
                    <div className="sender-avatar">
                      {getSafeField(message, 'name', 'senderName')?.charAt(0) || 'U'}
                    </div>
                    <div className="sender-info">
                      <h4>{getSafeField(message, 'name', 'senderName') || 'Anonymous'}</h4>
                      <p className="sender-email">{getSafeField(message, 'email', 'senderEmail')}</p>
                    </div>
                  </div>
                  <div className="message-meta">
                    {message.status === 'unread' && (
                      <span className="unread-badge">New</span>
                    )}
                    <span className="message-date">
                      <FiClock /> {formatDate(message.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="message-content">
                  <div className="message-subject">
                    <strong>Subject:</strong> {getSafeField(message, 'subject', 'subject') || 'No Subject'}
                  </div>
                  {getSafeField(message, 'phone', 'senderPhone') && (
                    <div className="message-phone">
                      <FiPhone /> {getSafeField(message, 'phone', 'senderPhone')}
                    </div>
                  )}
                  <p className="message-preview">
                    {getSafeField(message, 'message', 'body')?.substring(0, 150)}
                    {getSafeField(message, 'message', 'body')?.length > 150 && '...'}
                  </p>
                </div>

                <div className="message-actions">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (message.status === 'read') {
                        handleMarkAsUnread(messageId)
                      } else {
                        handleMarkAsRead(messageId)
                      }
                    }}
                  >
                    {message.status === 'read' ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(messageId)
                    }}
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </motion.div>
            )})}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMessage(null)}
          >
            <motion.div
              className="message-detail-modal glass-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Message Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedMessage(null)}
                >
                  <FiX />
                </button>
              </div>

              <div className="message-detail-content">
                <div className="detail-section">
                  <div className="detail-row">
                    <span className="detail-label">From:</span>
                    <span className="detail-value">{getSafeField(selectedMessage, 'name', 'senderName') || 'Anonymous'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{getSafeField(selectedMessage, 'email', 'senderEmail')}</span>
                  </div>
                  {getSafeField(selectedMessage, 'phone', 'senderPhone') && (
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{getSafeField(selectedMessage, 'phone', 'senderPhone')}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Subject:</span>
                    <span className="detail-value">{getSafeField(selectedMessage, 'subject', 'subject') || 'No Subject'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(selectedMessage.createdAt)}</span>
                  </div>
                </div>

                <div className="message-body">
                  <h3>Message:</h3>
                  <p>{selectedMessage.message}</p>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const messageId = getMessageId(selectedMessage)
                      if (selectedMessage.status === 'read') {
                        handleMarkAsUnread(messageId)
                      } else {
                        handleMarkAsRead(messageId)
                      }
                    }}
                  >
                    {selectedMessage.status === 'read' ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      const messageId = getMessageId(selectedMessage)
                      handleDelete(messageId)
                      setSelectedMessage(null)
                    }}
                  >
                    <FiTrash2 /> Delete Message
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Messages
