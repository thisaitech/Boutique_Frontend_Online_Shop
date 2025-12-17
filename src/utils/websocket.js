// WebSocket service for real-time messaging
class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.listeners = {
      message: [],
      messageRead: [],
      connection: [],
      error: []
    }
  }

  connect(userId, userType = 'customer') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    // Check if WebSocket is available
    if (typeof WebSocket === 'undefined') {
      console.warn('WebSocket not available in this environment')
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'
    const url = `${wsUrl}?userId=${userId}&userType=${userType}`

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.notifyListeners('connection', { status: 'connected' })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)
          
          switch (data.type) {
            case 'new_message':
              this.notifyListeners('message', data.payload)
              break
            case 'message_read':
              this.notifyListeners('messageRead', data.payload)
              break
            case 'message_updated':
              this.notifyListeners('message', data.payload)
              break
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.notifyListeners('error', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.notifyListeners('connection', { status: 'disconnected' })
        this.attemptReconnect(userId, userType)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.notifyListeners('error', error)
    }
  }

  attemptReconnect(userId, userType) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => {
        this.connect(userId, userType)
      }, this.reconnectDelay)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type, payload }))
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
      }
    } else {
      console.warn('WebSocket is not connected, message not sent')
    }
  }

  sendMessage(messageData) {
    this.send('send_message', messageData)
  }

  markAsRead(messageId) {
    this.send('mark_read', { messageId })
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// Create singleton instance
const wsService = new WebSocketService()

export default wsService
