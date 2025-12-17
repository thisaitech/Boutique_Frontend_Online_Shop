import { createContext, useContext, useReducer, useEffect } from 'react'
import { initialProducts } from '../data/products'

const GlobalContext = createContext()

// Empty siteConfig - all data should come from backend/Redux
const emptySiteConfig = {
  flashSaleText: '',
  showFlashSale: false,
  sectionTitles: {},
  carouselSettings: {},
  productSizes: {},
  deliverySettings: {},
  trustBadges: [],
  bannerImages: [],
  promoCards: {},
  parallaxCategories: [],
  contactPhone: '',
  contactEmail: '',
  contactAddress: '',
  socialLinks: {},
  aboutPageContent: {},
  contactPageContent: {},
  servicePageContent: {},
}

// Get siteConfig - use empty config, data comes from Redux/backend
const getInitialSiteConfig = () => {
  // Clear old localStorage data to prevent showing mock data
  localStorage.removeItem('thisai_siteConfig')
  return emptySiteConfig
}

// Initialize soldCount for products based on rating and reviews
// IMPORTANT: This only adds soldCount if missing, preserves all other properties
const addInventoryDefaults = (product, isFromLocalStorage = false) => {
  const hasSoldCount = product.soldCount !== undefined
  const baseCount = Math.floor((product.reviews || 0) * 0.8)
  const ratingBonus = Math.floor((product.rating || 4) * 10)
  const randomVariance = isFromLocalStorage ? 0 : Math.floor(Math.random() * 30)
  const topSellingBonus = product.topSelling ? 50 : 0
  const calculatedSoldCount = baseCount + ratingBonus + randomVariance + topSellingBonus
  const stockFallback = Math.max(3, Math.ceil((product.reviews || 10) / 5))
  const stockCount = product.stockCount !== undefined ? product.stockCount : stockFallback

  return {
    ...product,
    soldCount: hasSoldCount ? product.soldCount : calculatedSoldCount,
    stockCount,
    inStock: product.inStock !== undefined ? product.inStock : stockCount > 0,
    showInStore: product.showInStore !== false
  }
}

// Get initial inventory from localStorage or use defaults
// CRITICAL: localStorage data takes priority - all admin changes are stored there
const getInitialInventory = () => {
  try {
    const storedInventory = JSON.parse(localStorage.getItem('thisai_inventory'))
    if (storedInventory && storedInventory.length > 0) {
      // Return stored inventory directly - it already has all admin changes
      // Only add defaults if missing (for backwards compatibility)
      return storedInventory.map(item => addInventoryDefaults(item, true))
    }
  } catch (e) {
    console.error('Error loading inventory from localStorage:', e)
  }
  // No localStorage data - use initial products
  return initialProducts.map(item => addInventoryDefaults(item, false))
}

// Get initial customer accounts from localStorage
const getInitialCustomers = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('thisai_customers'))
    if (stored && Array.isArray(stored)) {
      return stored
    }
  } catch (e) {
    console.error('Error loading customers from localStorage:', e)
  }
  // Return default demo customers
  return [
    { id: 1, email: 'user@example.com', mobile: '+919876543210', password: 'user', name: 'Priya Sharma', role: 'customer', createdAt: new Date().toISOString() },
    { id: 2, email: 'customer@example.com', mobile: '+919876543211', password: 'customer', name: 'Customer User', role: 'customer', createdAt: new Date().toISOString() }
  ]
}

// Get initial offline bills from localStorage
const getInitialBills = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('thisai_offlineBills'))
    if (stored && Array.isArray(stored)) {
      return stored
    }
  } catch (e) {
    console.error('Error loading offline bills from localStorage:', e)
  }
  return []
}

// Get initial replacements from localStorage
const getInitialReplacements = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('thisai_replacements'))
    if (stored && Array.isArray(stored)) {
      return stored
    }
  } catch (e) {
    console.error('Error loading replacements from localStorage:', e)
  }
  return []
}

// Initial State
const initialState = {
  user: JSON.parse(localStorage.getItem('thisai_user')) || null,
  cart: JSON.parse(localStorage.getItem('thisai_cart')) || [],
  inventory: getInitialInventory(),
  appointments: JSON.parse(localStorage.getItem('thisai_appointments')) || [],
  siteConfig: getInitialSiteConfig(),
  darkMode: JSON.parse(localStorage.getItem('thisai_darkMode')) || false,
  orders: JSON.parse(localStorage.getItem('thisai_orders')) || [],
  customers: getInitialCustomers(),
  messages: JSON.parse(localStorage.getItem('thisai_messages')) || [],
  reviews: JSON.parse(localStorage.getItem('thisai_reviews')) || [],
  offlineBills: getInitialBills(),
  replacements: getInitialReplacements(),
  isLoading: false
}

// Action Types
const ACTIONS = {
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_CART_QUANTITY: 'UPDATE_CART_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  UPDATE_INVENTORY: 'UPDATE_INVENTORY',
  ADD_PRODUCT: 'ADD_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  ADD_APPOINTMENT: 'ADD_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  UPDATE_SITE_CONFIG: 'UPDATE_SITE_CONFIG',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  ADD_ORDER: 'ADD_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  CLEAR_ALL_ORDERS: 'CLEAR_ALL_ORDERS',
  SET_LOADING: 'SET_LOADING',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  ADD_REVIEW: 'ADD_REVIEW',
  UPDATE_REVIEW: 'UPDATE_REVIEW',
  DELETE_REVIEW: 'DELETE_REVIEW',
  ADD_OFFLINE_BILL: 'ADD_OFFLINE_BILL',
  UPDATE_OFFLINE_BILL: 'UPDATE_OFFLINE_BILL',
  ADD_REPLACEMENT: 'ADD_REPLACEMENT',
  UPDATE_REPLACEMENT: 'UPDATE_REPLACEMENT'
}

// Reducer
function globalReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload }

    case ACTIONS.LOGOUT:
      return { ...state, user: null }

    case ACTIONS.ADD_TO_CART: {
      const existingItem = state.cart.find(item => item.id === action.payload.id)
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      }
      return { ...state, cart: [...state.cart, { ...action.payload, quantity: 1 }] }
    }

    case ACTIONS.REMOVE_FROM_CART:
      return { ...state, cart: state.cart.filter(item => item.id !== action.payload) }

    case ACTIONS.UPDATE_CART_QUANTITY:
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      }

    case ACTIONS.CLEAR_CART:
      return { ...state, cart: [] }

    case ACTIONS.UPDATE_INVENTORY:
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        )
      }

    case ACTIONS.ADD_PRODUCT:
      return { ...state, inventory: [...state.inventory, action.payload] }

    case ACTIONS.DELETE_PRODUCT:
      return { ...state, inventory: state.inventory.filter(item => item.id !== action.payload) }

    case ACTIONS.ADD_APPOINTMENT:
      return { ...state, appointments: [...state.appointments, action.payload] }

    case ACTIONS.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map(apt =>
          apt.id === action.payload.id ? { ...apt, ...action.payload } : apt
        )
      }

    case ACTIONS.UPDATE_SITE_CONFIG:
      return { ...state, siteConfig: { ...state.siteConfig, ...action.payload } }

    case ACTIONS.TOGGLE_DARK_MODE:
      return { ...state, darkMode: !state.darkMode }

    case ACTIONS.ADD_ORDER:
      return { ...state, orders: [...state.orders, action.payload] }

    case ACTIONS.UPDATE_ORDER:
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? { ...order, ...action.payload } : order
        )
      }

    case ACTIONS.CLEAR_ALL_ORDERS:
      return {
        ...state,
        orders: []
      }

    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case ACTIONS.ADD_CUSTOMER:
      return { ...state, customers: [...state.customers, action.payload] }

    case ACTIONS.UPDATE_CUSTOMER:
      const updatedCustomers = state.customers.map(customer =>
        customer.id === action.payload.id ? { ...customer, ...action.payload } : customer
      )
      // Also update user object if it's the logged-in user
      const updatedUser = state.user && state.user.id === action.payload.id
        ? { ...state.user, ...action.payload }
        : state.user
      return {
        ...state,
        customers: updatedCustomers,
        user: updatedUser
      }

    case ACTIONS.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] }

    case ACTIONS.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
        )
      }

    case ACTIONS.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      }

    case ACTIONS.ADD_REVIEW:
      return {
        ...state,
        reviews: [...state.reviews, { ...action.payload, id: Date.now() }]
      }

    case ACTIONS.UPDATE_REVIEW:
      return {
        ...state,
        reviews: state.reviews.map(review =>
          review.id === action.payload.id ? { ...review, ...action.payload } : review
        )
      }

    case ACTIONS.DELETE_REVIEW:
      return {
        ...state,
        reviews: state.reviews.filter(review => review.id !== action.payload)
      }

    case ACTIONS.ADD_RETURN:
      // Add return to the order's returns array
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? {
                ...order,
                returns: [...(order.returns || []), { ...action.payload, id: Date.now() }]
              }
            : order
        )
      }

    case ACTIONS.ADD_OFFLINE_BILL:
      return {
        ...state,
        offlineBills: [...state.offlineBills, { ...action.payload, id: Date.now() }]
      }

    case ACTIONS.UPDATE_OFFLINE_BILL:
      return {
        ...state,
        offlineBills: state.offlineBills.map(bill =>
          bill.id === action.payload.id ? { ...bill, ...action.payload } : bill
        )
      }

    case ACTIONS.ADD_REPLACEMENT:
      return {
        ...state,
        replacements: [...state.replacements, { ...action.payload, id: Date.now() }]
      }

    case ACTIONS.UPDATE_REPLACEMENT:
      return {
        ...state,
        replacements: state.replacements.map(replacement =>
          replacement.id === action.payload.id ? { ...replacement, ...action.payload } : replacement
        )
      }

    default:
      return state
  }
}

// Provider Component
export function GlobalProvider({ children }) {
  const [state, dispatch] = useReducer(globalReducer, initialState)

  // Persist to localStorage
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('thisai_user', JSON.stringify(state.user))
    } else {
      localStorage.removeItem('thisai_user')
    }
  }, [state.user])

  useEffect(() => {
    localStorage.setItem('thisai_cart', JSON.stringify(state.cart))
  }, [state.cart])

  useEffect(() => {
    localStorage.setItem('thisai_appointments', JSON.stringify(state.appointments))
  }, [state.appointments])

  // siteConfig is now managed by Redux - don't save to localStorage

  useEffect(() => {
    localStorage.setItem('thisai_darkMode', JSON.stringify(state.darkMode))
  }, [state.darkMode])

  useEffect(() => {
    localStorage.setItem('thisai_orders', JSON.stringify(state.orders))
  }, [state.orders])

  // Persist inventory to localStorage
  useEffect(() => {
    localStorage.setItem('thisai_inventory', JSON.stringify(state.inventory))
  }, [state.inventory])

  // Persist customers to localStorage
  useEffect(() => {
    localStorage.setItem('thisai_customers', JSON.stringify(state.customers))
  }, [state.customers])

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem('thisai_messages', JSON.stringify(state.messages))
  }, [state.messages])

  // Persist reviews to localStorage
  useEffect(() => {
    localStorage.setItem('thisai_reviews', JSON.stringify(state.reviews))
  }, [state.reviews])

  // Apply dark mode class to body
  useEffect(() => {
    if (state.darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [state.darkMode])

  // Actions
  const login = (userData) => {
    dispatch({ type: ACTIONS.SET_USER, payload: userData })
  }

  const logout = async () => {
    try {
      // Call backend logout API to invalidate refresh token
      const api = (await import('../api/axiosConfig')).default
      await api.post('/auth/logout').catch(() => {
        // Ignore errors, still logout locally
      })
    } catch (error) {
      console.error('Backend logout failed:', error)
    }
    
    // Remove all tokens and user data from localStorage
    localStorage.removeItem('thisai_user')
    localStorage.removeItem('thisai_cart')
    localStorage.removeItem('thisai_accessToken')
    localStorage.removeItem('thisai_refreshToken')
    
    // Clear Redux state
    dispatch({ type: ACTIONS.LOGOUT })
    dispatch({ type: ACTIONS.CLEAR_CART })
  }

  const addToCart = (product) => {
    dispatch({ type: ACTIONS.ADD_TO_CART, payload: product })
  }

  const removeFromCart = (productId) => {
    dispatch({ type: ACTIONS.REMOVE_FROM_CART, payload: productId })
  }

  const updateCartQuantity = (productId, quantity) => {
    dispatch({ type: ACTIONS.UPDATE_CART_QUANTITY, payload: { id: productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: ACTIONS.CLEAR_CART })
  }

  const updateProduct = (product) => {
    const normalized = addInventoryDefaults(product, true)
    dispatch({ type: ACTIONS.UPDATE_INVENTORY, payload: normalized })
  }

  const addProduct = (product) => {
    const normalized = addInventoryDefaults(product, true)
    dispatch({ type: ACTIONS.ADD_PRODUCT, payload: { ...normalized, id: Date.now() } })
  }

  const deleteProduct = (productId) => {
    dispatch({ type: ACTIONS.DELETE_PRODUCT, payload: productId })
  }

  const addAppointment = (appointment) => {
    dispatch({ type: ACTIONS.ADD_APPOINTMENT, payload: { ...appointment, id: Date.now(), status: 'pending' } })
  }

  const updateAppointment = (appointment) => {
    dispatch({ type: ACTIONS.UPDATE_APPOINTMENT, payload: appointment })
  }

  const updateSiteConfig = (config) => {
    dispatch({ type: ACTIONS.UPDATE_SITE_CONFIG, payload: config })
  }

  const toggleDarkMode = () => {
    dispatch({ type: ACTIONS.TOGGLE_DARK_MODE })
  }

  const adjustInventoryForItems = (items = [], isRestock = false) => {
    items.forEach(item => {
      const product = state.inventory.find(p => p.id === item.id)
      if (!product) return
      const qty = item.quantity || 1
      const delta = isRestock ? qty : -qty
      const nextStock = Math.max((product.stockCount || 0) + delta, 0)
      updateProduct({
        ...product,
        stockCount: nextStock,
        inStock: nextStock > 0
      })
    })
  }

  const addOrder = (order) => {
    const now = new Date().toISOString()
    const orderNumber = order.orderNumber || `ORD-${Date.now()}`
    const shippingAddress = order.shippingAddress || order.deliveryAddress || {}
    const tax = order.tax || 0
    const total = order.total || 0
    const items = order.items || []

    adjustInventoryForItems(items, false)

    dispatch({
      type: ACTIONS.ADD_ORDER,
      payload: {
        ...order,
        id: Date.now(),
        date: now,
        createdAt: now,
        orderNumber,
        shippingAddress,
        tax,
        total,
        paymentStatus: order.paymentStatus || (order.paymentMethod === 'cod' ? 'pending' : 'paid'),
        status: order.status || 'delivered',
        items
      }
    })
  }

  const updateOrder = (order) => {
    dispatch({ type: ACTIONS.UPDATE_ORDER, payload: order })
  }

  const clearAllOrders = () => {
    dispatch({ type: ACTIONS.CLEAR_ALL_ORDERS })
  }

  const returnOrder = ({ orderId, reason, isBroken }) => {
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return
    if (!isBroken) {
      adjustInventoryForItems(order.items || [], true)
    }
    dispatch({
      type: ACTIONS.UPDATE_ORDER,
      payload: {
        ...order,
        status: 'returned',
        returnReason: reason,
        isBrokenReturn: !!isBroken,
        returnDate: new Date().toISOString(),
        returnLoss: isBroken ? order.total : 0
      }
    })
  }

  const addReturn = (returnData) => {
    dispatch({ type: ACTIONS.ADD_RETURN, payload: returnData })
  }

  const addOfflineBill = (billData) => {
    dispatch({ type: ACTIONS.ADD_OFFLINE_BILL, payload: billData })
  }

  const updateOfflineBill = (billData) => {
    dispatch({ type: ACTIONS.UPDATE_OFFLINE_BILL, payload: billData })
  }

  const addReplacement = (replacementData) => {
    dispatch({ type: ACTIONS.ADD_REPLACEMENT, payload: replacementData })
  }

  const updateReplacement = (replacementData) => {
    dispatch({ type: ACTIONS.UPDATE_REPLACEMENT, payload: replacementData })
  }

  const setLoading = (loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading })
  }

  const addCustomer = (customerData) => {
    const newCustomer = {
      ...customerData,
      id: Date.now(),
      role: 'customer',
      createdAt: new Date().toISOString()
    }
    dispatch({ type: ACTIONS.ADD_CUSTOMER, payload: newCustomer })
    return newCustomer
  }

  const updateCustomer = (customerData) => {
    dispatch({ type: ACTIONS.UPDATE_CUSTOMER, payload: customerData })
  }

  const addMessage = (messageData) => {
    const newMessage = {
      ...messageData,
      id: Date.now(),
      status: 'unread',
      createdAt: new Date().toISOString()
    }
    dispatch({ type: ACTIONS.ADD_MESSAGE, payload: newMessage })
    return newMessage
  }

  const updateMessage = (messageData) => {
    dispatch({ type: ACTIONS.UPDATE_MESSAGE, payload: messageData })
  }

  const deleteMessage = (messageId) => {
    dispatch({ type: ACTIONS.DELETE_MESSAGE, payload: messageId })
  }

  const addReview = (reviewData) => {
    const newReview = {
      ...reviewData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    }
    dispatch({ type: ACTIONS.ADD_REVIEW, payload: newReview })
    return newReview
  }

  const updateReview = (reviewData) => {
    dispatch({ type: ACTIONS.UPDATE_REVIEW, payload: reviewData })
  }

  const deleteReview = (reviewId) => {
    dispatch({ type: ACTIONS.DELETE_REVIEW, payload: reviewId })
  }

  const cartTotal = state.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  const cartCount = state.cart.reduce((count, item) => count + item.quantity, 0)

  const value = {
    ...state,
    cartTotal,
    cartCount,
    login,
    logout,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    updateProduct,
    addProduct,
    deleteProduct,
    addAppointment,
    updateAppointment,
    updateSiteConfig,
    toggleDarkMode,
    addOrder,
    updateOrder,
    clearAllOrders,
    returnOrder,
    addReturn,
    addOfflineBill,
    updateOfflineBill,
    addReplacement,
    updateReplacement,
    setLoading,
    addCustomer,
    updateCustomer,
    addMessage,
    updateMessage,
    deleteMessage,
    addReview,
    updateReview,
    deleteReview,
    offlineBills: state.offlineBills,
    replacements: state.replacements
  }

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  )
}

export function useGlobal() {
  const context = useContext(GlobalContext)
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider')
  }
  return context
}

export default GlobalContext
