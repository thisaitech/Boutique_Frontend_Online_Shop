import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMapPin, FiEdit2, FiPlus, FiX, FiCheck, FiCreditCard, FiPackage,
  FiTruck, FiShoppingBag, FiArrowLeft, FiChevronRight, FiLock, FiStar
} from 'react-icons/fi'
import { useGlobal } from '../context/GlobalContext'
import {
  selectCartItems,
  selectCartTotal,
  clearCart as clearCartAction,
  clearCartLocal,
  fetchCart,
  resolveCartItemPrice,
  resolveCartItemQuantity,
  removeFromCart,
  removeFromCartLocal,
} from '../store/slices/cartSlice'
import {
  placeOrder,
  selectOrdersLoading
} from '../store/slices/orderSlice'
import {
  fetchAddresses,
  addAddress,
  deleteAddress as deleteAddressAction,
  setDefaultAddress as setDefaultAddressAction,
  selectAddresses,
  selectUserLoading
} from '../store/slices/userSlice'
import { selectIsAuthenticated, selectUser as selectAuthUser } from '../store/slices/authSlice'
import { selectSiteConfig } from '../store/slices/siteConfigSlice'
import { fetchProducts, selectProducts } from '../store/slices/productSlice'
import toast from 'react-hot-toast'
import { getImageSrc } from '../utils/imageUtils'
import './Checkout.css'

function Checkout() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Redux state
  const cartItemsRedux = useSelector(selectCartItems)
  const cartTotalRedux = useSelector(selectCartTotal)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const authUser = useSelector(selectAuthUser)
  const addressesRedux = useSelector(selectAddresses)
  const ordersLoading = useSelector(selectOrdersLoading)
  const siteConfigRedux = useSelector(selectSiteConfig)
  const productsRedux = useSelector(selectProducts)

  // Context fallback
  const {
    cart: contextCart,
    cartTotal: contextCartTotal,
    addOrder: contextAddOrder,
    clearCart: contextClearCart,
    user: contextUser,
    updateCustomer,
    customers,
    siteConfig: contextSiteConfig,
    inventory
  } = useGlobal()

  // Use Redux data if available, otherwise fall back to context
  const cart = isAuthenticated ? cartItemsRedux : (cartItemsRedux.length > 0 ? cartItemsRedux : contextCart)
  const cartTotal = cartTotalRedux > 0 ? cartTotalRedux : contextCartTotal
  const user = authUser || contextUser
  const siteConfig = siteConfigRedux || contextSiteConfig
  
  // Use products from Redux (fetched from DB) or fallback to context inventory
  const products = productsRedux.length > 0 ? productsRedux : inventory

  // Fetch addresses on mount
  useEffect(() => {
    if (isAuthenticated && authUser) {
      dispatch(fetchAddresses()).catch(error => {
        console.error('Failed to fetch addresses:', error)
        // If 401, token might be expired - could redirect to login
      })
    }
  }, [dispatch, isAuthenticated, authUser])

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart()).catch(error => {
        console.error('Failed to load cart:', error)
      })
    }
  }, [dispatch, isAuthenticated])

  // Fetch products to get current tax values from database
  useEffect(() => {
    dispatch(fetchProducts()).catch(error => {
      console.error('Failed to fetch products:', error)
    })
  }, [dispatch])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !contextUser) {
      toast.error('Please log in to continue with checkout')
      navigate('/login', { state: { from: '/checkout' } })
    }
  }, [isAuthenticated, contextUser, navigate])

  // Place order handler
  const addOrder = async (orderData) => {
    if (isAuthenticated) {
      try {
        const result = await dispatch(placeOrder(orderData)).unwrap()
        dispatch(clearCartAction())
        return result // Return backend response with orderId
      } catch (error) {
        console.error('Failed to place order via API:', error)
        // Re-throw error to handle in processOrder
        throw new Error(error?.message || 'Failed to place order')
      }
    } else {
      contextAddOrder(orderData)
      return null
    }
  }

  // Clear cart handler
  const clearCart = () => {
    if (isAuthenticated) {
      dispatch(clearCartAction())
    } else {
      dispatch(clearCartLocal())
    }
    contextClearCart()
  }
  const [step, setStep] = useState('address') // 'address', 'payment'
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('razorpay_upi')
  const [showReviewPrompt, setShowReviewPrompt] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  
  // Track which items are selected for purchase
  const [selectedItems, setSelectedItems] = useState(new Set())
  
  // Initialize all items as selected when cart changes
  useEffect(() => {
    const allItemIds = cart.map((item, index) => getCartItemKey(item, index))
    setSelectedItems(new Set(allItemIds))
  }, [cart.length])



  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numPrice)
  }
  const parseAmount = (value) => {
    if (value == null) return 0
    if (typeof value === 'number') return value
    const cleaned = value.toString().replace(/[^\d.]/g, '')
    if (!cleaned) return 0
    const parsed = parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)

  // Use Redux addresses
  const addresses = Array.isArray(addressesRedux) ? addressesRedux : []

  // Resolve the product identifier stored in a cart item
  const resolveCartProductId = (item) => {
    if (!item) return null
    const candidate = item.productId ?? item._id ?? item.id
    if (!candidate) return null
    if (typeof candidate === 'object') {
      if (candidate._id) return candidate._id
      if (candidate.id) return candidate.id
      if (typeof candidate.toString === 'function') {
        return candidate.toString()
      }
      return null
    }
    return candidate
  }

  const getCartItemKey = (item, fallbackIndex) => {
    const candidate = item?.id ?? item?._id ?? resolveCartProductId(item)
    return candidate ? String(candidate) : `cart-item-${fallbackIndex}`
  }

  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: ''
  })

  useEffect(() => {
    if (addresses.length === 0) return
    if (selectedAddress === null) {
      const defaultIndex = addresses.findIndex(addr => addr.isDefault)
      setSelectedAddress(defaultIndex >= 0 ? defaultIndex : 0)
    }
  }, [addresses, selectedAddress])

  // Redirect if cart is empty - only on initial load
  const handleAddAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      toast.error('Please fill all required fields')
      return
    }

    if (newAddress.zipCode.length !== 6) {
      toast.error('Pincode must be exactly 6 digits')
      return
    }

    if (!isAuthenticated) {
      toast.error('Please log in to add addresses')
      navigate('/login', { state: { from: '/checkout' } })
      return
    }

    setIsSavingAddress(true)

    try {
      // Prepare address data for backend
      const addressData = {
        fullName: newAddress.fullName,
        phone: newAddress.phone,
        street: newAddress.addressLine1, // Backend expects 'street' field
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.zipCode, // Backend expects 'pincode'
        landmark: newAddress.addressLine2 || '',
        label: newAddress.type || 'Home',
        isDefault: false
      }

      console.log('Sending address to API:', addressData)

      // Dispatch Redux action to add address
      const result = await dispatch(addAddress(addressData)).unwrap()
      console.log('Address added successfully! Result:', result)

      // Get the number of addresses from the result
      const newAddressCount = Array.isArray(result) ? result.length : 1

      // Reset form
      setNewAddress({
        type: 'Home',
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: ''
      })
      setShowAddressForm(false)

      toast.success('Address added successfully!')

      // Select the newly added address (last in the array)
      setSelectedAddress(newAddressCount - 1)

      // If this was the first address, auto-proceed to payment
      if (newAddressCount === 1) {
        toast('Proceeding to payment...')
        setTimeout(() => {
          setStep('payment')
        }, 500)
      }
    } catch (error) {
      console.error('Failed to add address:', error)
      toast.error(typeof error === 'string' ? error : 'Failed to add address. Please try again.')
    } finally {
      setIsSavingAddress(false)
    }
  }

  const handleSetDefault = async (index) => {
    try {
      const addressToSet = addresses[index]
      if (!addressToSet) {
        toast.error('Address not found')
        return
      }

      // Get the address ID (could be _id or id)
      const addressId = addressToSet._id || addressToSet.id
      if (!addressId) {
        toast.error('Invalid address')
        return
      }

      // Dispatch Redux action
      await dispatch(setDefaultAddressAction(addressId)).unwrap()

      setSelectedAddress(index)
      toast.success('Default address updated')
    } catch (error) {
      toast.error(error || 'Failed to update default address')
    }
  }

  const handleDeleteAddress = async (index) => {
    if (addresses.length === 1) {
      toast.error('You must have at least one address')
      return
    }

    try {
      const addressToDelete = addresses[index]
      if (!addressToDelete) {
        toast.error('Address not found')
        return
      }

      // Get the address ID (could be _id or id)
      const addressId = addressToDelete._id || addressToDelete.id
      if (!addressId) {
        toast.error('Invalid address')
        return
      }

      // Dispatch Redux action
      await dispatch(deleteAddressAction(addressId)).unwrap()

      // If the deleted address was selected, or if selected index is now invalid, reset to null
      if (selectedAddress === index || selectedAddress >= addresses.length - 1) {
        setSelectedAddress(null)
      } else if (selectedAddress > index) {
        // Adjust selected index if an address before it was deleted
        setSelectedAddress(selectedAddress - 1)
      }

      toast.success('Address deleted')
    } catch (error) {
      toast.error(error || 'Failed to delete address')
    }
  }

  const handleProceedToPayment = () => {
    if (addresses.length === 0) {
      toast.error('Please add a delivery address')
      return
    }
    if (selectedAddress === null) {
      toast.error('Please select a delivery address')
      return
    }
    setStep('payment')
  }

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Process Razorpay payment
  const processRazorpayPayment = async () => {
    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      toast.error('Failed to load payment gateway')
      setIsProcessing(false)
      return false
    }

    const selectedAddrData = addresses[selectedAddress]

    return new Promise((resolve) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || siteConfig?.razorpayKeyId || 'rzp_test_RrVPw4temWVxGs',
        amount: Math.round(displayedTotal * 100), // Razorpay expects amount in paise
        currency: 'INR',
        name: siteConfig?.shopName || 'Boutique Shop',
        description: `Order for ${cart.length} item(s)`,
        image: siteConfig?.logo || '/logo.png',
        handler: function (response) {
          // Payment successful - store payment details
          window.razorpayResponse = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }
          resolve(true)
        },
        prefill: {
          name: selectedAddrData?.fullName || user?.name || '',
          email: user?.email || 'customer@example.com',
          contact: selectedAddrData?.phone || ''
        },
        notes: {
          address: selectedAddrData?.street || selectedAddrData?.addressLine1 || ''
        },
        theme: {
          color: '#e91e8c'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false)
            resolve(false)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`)
        setIsProcessing(false)
        resolve(false)
      })
      razorpay.open()
    })
  }

  const handlePlaceOrder = async () => {
    if (addresses.length === 0) {
      toast.error('Please add a delivery address')
      return
    }
    if (selectedAddress === null) {
      toast.error('Please select a delivery address')
      return
    }

    // Only order selected items
    const selectedCartItems = cart.filter((item, index) => 
      selectedItems.has(getCartItemKey(item, index))
    )
    
    if (selectedCartItems.length === 0) {
      toast.error('Please select at least one item to purchase')
      return
    }

    // Start processing
    setIsProcessing(true)

    // If Razorpay payment method selected, process payment first
    if (paymentMethod === 'razorpay_upi' || paymentMethod === 'razorpay_card') {
      const paymentSuccess = await processRazorpayPayment()
      if (!paymentSuccess) {
        return // Payment was cancelled or failed
      }
    }

    // Process order after successful payment
    try {
      await processOrder()
    } catch (error) {
      console.error('handlePlaceOrder error:', error)
      setIsProcessing(false)
    }
  }

  const processOrder = async () => {
    // Brief delay for COD orders
    if (paymentMethod === 'cod') {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    const selectedAddrData = addresses[selectedAddress]

    // Handle both backend field names (street, pincode) and frontend field names (addressLine1, zipCode)
    const addressLine = selectedAddrData.street || selectedAddrData.addressLine1 || ''
    const landmark = selectedAddrData.landmark || selectedAddrData.addressLine2 || ''
    const postalCode = selectedAddrData.pincode || selectedAddrData.zipCode || ''
    const addressLabel = selectedAddrData.label || selectedAddrData.type || 'Home'

    // Get selected items
    const selectedCartItems = cart.filter((item, index) => 
      selectedItems.has(getCartItemKey(item, index))
    )
    
    const orderItems = selectedCartItems.map((item) => {
      const resolvedProductId = resolveCartProductId(item)
      const productIdForOrder = resolvedProductId ? String(resolvedProductId) : undefined
      const orderItemId = item.id ?? productIdForOrder ?? item._id
      const quantity = resolveCartItemQuantity(item)
      const price = resolveCartItemPrice(item)

      return {
        id: orderItemId,
        productId: productIdForOrder,
        name: getCartItemLabel(item),
        image: getCartItemImage(item),
        price,
        quantity,
        size: item.size || 'Free Size',
        color: item.selectedColor || item.color,
      }
    })

    const orderPayload = {
      items: orderItems,
      shippingAddress: {
        fullName: selectedAddrData.fullName,
        phone: selectedAddrData.phone,
        street: addressLine,
        city: selectedAddrData.city,
        state: selectedAddrData.state,
        pincode: postalCode,
        landmark: landmark,
      },
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      orderType: location.state?.orderType || 'cart',
      orderNotes: '',
      tax: taxAmount,
      total: displayedTotal,
    }

    // Add Razorpay payment details if available
    if (window.razorpayResponse) {
      orderPayload.razorpayPaymentId = window.razorpayResponse.razorpay_payment_id
      orderPayload.razorpayOrderId = window.razorpayResponse.razorpay_order_id
      orderPayload.razorpaySignature = window.razorpayResponse.razorpay_signature
      // Clear the response after using
      delete window.razorpayResponse
    }

    try {
      console.log('Placing order with data:', orderPayload)
      const result = await addOrder(orderPayload)
      console.log('Backend response:', result)
      console.log('Order placed successfully!')
      
      // Remove only the ordered (selected) items from cart
      const unselectedCount = cart.length - selectedCartItems.length
      
      if (unselectedCount > 0) {
        // Remove only selected items, keep others
        for (const item of selectedCartItems) {
          const itemId = item._id || item.id
          if (itemId) {
            if (isAuthenticated) {
              await dispatch(removeFromCart(itemId))
            } else {
              dispatch(removeFromCartLocal(itemId))
            }
          }
        }
        toast.success(`Order placed! ${unselectedCount} item(s) saved in cart for later.`, { duration: 4000 })
      } else {
        // All items were ordered, clear entire cart
        toast.success('Order placed successfully!', { duration: 3000 })
      }
      
      // Clear cart after order placement
      if (unselectedCount === 0) {
        clearCart()
      }
      
      // Navigate to orders page after 1 second
      setTimeout(() => {
        navigate('/orders')
      }, 1000)
    } catch (error) {
      console.error('Order processing failed:', error)
      console.error('Error details:', error)
      toast.error(`Failed to place order: ${error.message || 'Please try again'}`)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const getItemPriceValue = (item) => resolveCartItemPrice(item)

  const getCartItemImage = (item) => {
    if (!item) return '/images/placeholder.jpg'
    const imagePath = (
      item.image ||
      item.product?.image ||
      item.productId?.image ||
      item.product?.images?.[0] ||
      item.productId?.images?.[0] ||
      item.coverImage ||
      '/images/placeholder.jpg'
    )
    return getImageSrc(imagePath)
  }

  const getCartItemLabel = (item) => (
    item?.name || item?.product?.name || item?.productId?.name || 'Product'
  )

  // Recalculate summary values when cart or selectedItems change
  const [summary, setSummary] = useState({
    subtotal: 0,
    taxAmount: 0,
    total: 0
  })

  useEffect(() => {
    const subtotal = cart.reduce((sum, item, index) => {
      if (!selectedItems.has(getCartItemKey(item, index))) return sum
      const price = getItemPriceValue(item)
      const quantity = resolveCartItemQuantity(item)
      return sum + price * quantity
    }, 0)
    const taxAmount = cart.reduce((sum, item, index) => {
      if (!selectedItems.has(getCartItemKey(item, index))) return sum
      const productId = item?.productId?._id || item?.productId || item?.product?._id || item?.product?.id || item?.id || item?._id
      const currentProduct = products.find(p => 
        String(p._id) === String(productId) || 
        String(p.id) === String(productId)
      )
      const tax = parseFloat(currentProduct?.tax || item?.tax || item?.product?.tax || item?.productId?.tax || 0)
      const quantity = resolveCartItemQuantity(item)
      return sum + tax * quantity
    }, 0)
    const shipping = 100
    const total = subtotal + taxAmount + shipping
    setSummary({ subtotal, taxAmount, total })
  }, [cart, selectedItems, products])

  const displayedSubtotal = summary.subtotal
  const taxAmount = summary.taxAmount
  const shipping = 100
  const displayedTotal = summary.total

  // Don't hide if review prompt is showing (after order placement)
  if (cart.length === 0 && !showReviewPrompt) {
    return null
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Header */}
        <div className="checkout-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft />
            Back
          </button>
          <h1>Checkout</h1>
          <div className="checkout-steps">
            <div className={`step ${step === 'cart' ? 'active' : (step === 'address' || step === 'payment') ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Cart</span>
            </div>
            <div className={`step ${step === 'address' ? 'active' : step === 'payment' ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Address</span>
            </div>
            <div className={`step ${step === 'payment' ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Payment</span>
            </div>
          </div>
        </div>

        <div className="checkout-content">
          <div className="checkout-main">
            {/* Address Step */}
            {step === 'address' && (
              <motion.div
                className="checkout-section glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="section-header">
                  <h2><FiMapPin /> Delivery Address</h2>
                  <button className="add-address-btn" onClick={() => setShowAddressForm(true)}>
                    <FiPlus /> Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="empty-state">
                    <FiMapPin size={40} />
                    <p>No addresses saved. Add your first address!</p>
                  </div>
                ) : (
                  <div className="address-list">
                    {addresses.map((addr, index) => {
                      // Handle both backend field names (street, pincode) and frontend field names (addressLine1, zipCode)
                      const addressLine = addr.street || addr.addressLine1 || ''
                      const landmark = addr.landmark || addr.addressLine2 || ''
                      const postalCode = addr.pincode || addr.zipCode || ''
                      const addressLabel = addr.label || addr.type || 'Home'

                      return (
                        <div
                          key={addr._id || addr.id || index}
                          className={`address-card ${selectedAddress === index ? 'selected' : ''} ${addr.isDefault ? 'default' : ''}`}
                          onClick={() => setSelectedAddress(index)}
                        >
                          <div className="address-header">
                            <div>
                              <h3>{addressLabel} Address {addr.isDefault && <span className="default-badge">Default</span>}</h3>
                            </div>
                            <div className="address-actions">
                              {!addr.isDefault && (
                                <button
                                  className="action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSetDefault(index)
                                  }}
                                  title="Set as Default"
                                >
                                  <FiCheck />
                                </button>
                              )}
                              <button
                                className="action-btn delete"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAddress(index)
                                }}
                                title="Delete"
                              >
                                <FiX />
                              </button>
                            </div>
                          </div>
                          <p><strong>{addr.fullName}</strong></p>
                          <p>{addressLine}{landmark && `, ${landmark}`}</p>
                          <p>{addr.city}, {addr.state} - {postalCode}</p>
                          <p>Phone: {addr.phone}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add Address Form */}
                <AnimatePresence>
                  {showAddressForm && (
                    <motion.div
                      className="address-form-modal"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="form-header">
                        <h3>Add New Address</h3>
                        <button onClick={() => setShowAddressForm(false)}>
                          <FiX />
                        </button>
                      </div>
                      <div className="form-body">
                        <div className="form-group">
                          <label>Address Type</label>
                          <select
                            value={newAddress.type}
                            onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                          >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Full Name *</label>
                          <input
                            type="text"
                            value={newAddress.fullName}
                            onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone Number *</label>
                          <input
                            type="tel"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            placeholder="+91 9876543210"
                          />
                        </div>
                        <div className="form-group">
                          <label>Address Line 1 *</label>
                          <input
                            type="text"
                            value={newAddress.addressLine1}
                            onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                            placeholder="House No., Building Name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Address Line 2</label>
                          <input
                            type="text"
                            value={newAddress.addressLine2}
                            onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                            placeholder="Street, Area, Colony"
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>City *</label>
                            <input
                              type="text"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              placeholder="Bangalore"
                            />
                          </div>
                          <div className="form-group">
                            <label>State *</label>
                            <input
                              type="text"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              placeholder="Karnataka"
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Zip Code *</label>
                          <input
                            type="text"
                            value={newAddress.zipCode}
                            onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            placeholder="560001"
                            maxLength={6}
                          />
                        </div>
                        <div className="form-actions">
                          <button type="button" className="btn btn-secondary" onClick={() => setShowAddressForm(false)} disabled={isSavingAddress}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-primary" onClick={handleAddAddress} disabled={isSavingAddress}>
                            {isSavingAddress ? 'Saving...' : 'Save Address'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {addresses.length > 0 && (
                  <div className="section-footer">
                    <button className="btn btn-primary" onClick={handleProceedToPayment}>
                      Continue to Payment
                      <FiChevronRight />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Payment Step */}
            {step === 'payment' && (
              <motion.div
                className="checkout-section glass-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="section-header">
                  <h2><FiCreditCard /> Payment Method</h2>
                  <button className="back-to-address" onClick={() => setStep('address')}>
                    <FiArrowLeft /> Change Address
                  </button>
                </div>

                <div className="payment-methods">
                  <div className="payment-info">
                    <p>Secure online payment via UPI</p>
                  </div>
                  {[
                    { id: 'razorpay_upi', label: 'UPI Payment', icon: <FiCreditCard />, description: 'Pay via UPI apps (GPay, PhonePe, Paytm)' }
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      className={`payment-option ${paymentMethod === option.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(option.id)}
                    >
                      <div className="payment-icon">{option.icon}</div>
                      <div className="payment-details">
                        <span className="payment-label">{option.label}</span>
                        <span className="payment-description">{option.description}</span>
                      </div>
                      {paymentMethod === option.id && <FiCheck className="check-icon" />}
                    </button>
                  ))}
                </div>

                {/* Delivery Address Preview */}
                {addresses[selectedAddress] && (() => {
                  const addr = addresses[selectedAddress]
                  const addressLine = addr.street || addr.addressLine1 || ''
                  const landmark = addr.landmark || addr.addressLine2 || ''
                  const postalCode = addr.pincode || addr.zipCode || ''
                  return (
                    <div className="delivery-preview">
                      <h3>Delivering To</h3>
                      <div className="address-preview">
                        <p><strong>{addr.fullName}</strong></p>
                        <p>{addressLine}{landmark && `, ${landmark}`}</p>
                        <p>{addr.city}, {addr.state} - {postalCode}</p>
                        <p>{addr.phone}</p>
                      </div>
                    </div>
                  )
                })()}

                <div className="section-footer">
                  <button
                    className="btn btn-primary place-order-btn"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <FiLock />
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout-sidebar">
            <div className="order-summary glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Order Summary</h3>
                <button
                  onClick={() => {
                    const allItemIds = cart.map((item, index) => getCartItemKey(item, index))
                    const allSelected = allItemIds.every(id => selectedItems.has(id))
                    if (allSelected) {
                      setSelectedItems(new Set())
                    } else {
                      setSelectedItems(new Set(allItemIds))
                    }
                  }}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.8rem',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {cart.every((item, index) => selectedItems.has(getCartItemKey(item, index))) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="summary-items">
                {cart.map((item, index) => {
                  const itemPrice = getItemPriceValue(item)
                  const itemQuantity = resolveCartItemQuantity(item)
                  const itemLabel = getCartItemLabel(item)
                  const itemKey = getCartItemKey(item, index)
                  const isSelected = selectedItems.has(itemKey)
                  // Debug log for quantity
                  console.log('OrderSummary item', { label: itemLabel, quantity: itemQuantity, raw: item.quantity, type: typeof item.quantity, item })
                  return (
                    <div key={itemKey} className={`summary-item ${!isSelected ? 'unselected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems)
                          if (e.target.checked) {
                            newSelected.add(itemKey)
                          } else {
                            newSelected.delete(itemKey)
                          }
                          setSelectedItems(newSelected)
                        }}
                        style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                      <img
                        src={getCartItemImage(item)}
                        alt={itemLabel}
                        style={{ opacity: isSelected ? 1 : 0.5 }}
                      />
                      <div className="summary-item-details">
                        <span className="item-name" style={{ opacity: isSelected ? 1 : 0.6 }}>{itemLabel}</span>
                        <span className="item-meta">
                          {item.size && `Size: ${item.size}`} {item.selectedColor && `• ${item.selectedColor}`}
                        </span>
                        <span className="item-qty">Qty: {itemQuantity}</span>
                      </div>
                      <span className="item-price" style={{ opacity: isSelected ? 1 : 0.6 }}>{formatPrice(itemPrice * itemQuantity)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="summary-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(displayedSubtotal)}</span>
                  </div>
                  <div className="total-row">
                    <span>Tax</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                <div className="total-row">
                  <span>Shipping</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                  <div className="total-row total">
                    <span>Total</span>
                    <span>{formatPrice(displayedTotal)}</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Prompt Modal */}
      {console.log('showReviewPrompt state:', showReviewPrompt)}
      {showReviewPrompt && <div style={{position: 'fixed', top: 0, left: 0, background: 'red', padding: '20px', zIndex: 99999}}>MODAL SHOULD BE VISIBLE</div>}
      <AnimatePresence>
        {showReviewPrompt && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowReviewPrompt(false)
              navigate('/orders', { replace: true })
            }}
          >
            <motion.div
              className="review-prompt-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>🎉 Thank You for Your Order!</h3>
                <p>How would you rate your shopping experience?</p>
              </div>
              
              <div className="star-rating-section">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`star ${star <= (hoveredStar || reviewRating) ? 'filled' : ''}`}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setReviewRating(star)}
                    />
                  ))}
                </div>
                {reviewRating > 0 && (
                  <motion.p
                    className="rating-text"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {reviewRating === 5 && "⭐ Excellent!"}
                    {reviewRating === 4 && "👍 Very Good!"}
                    {reviewRating === 3 && "😊 Good!"}
                    {reviewRating === 2 && "😐 Not Bad"}
                    {reviewRating === 1 && "👎 Needs Improvement"}
                  </motion.p>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowReviewPrompt(false)
                    navigate('/orders', { replace: true })
                  }}
                >
                  Skip for Now
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowReviewPrompt(false)
                    navigate('/review', { replace: true, state: { rating: reviewRating } })
                  }}
                  disabled={reviewRating === 0}
                >
                  {reviewRating > 0 ? 'Continue to Review' : 'Select a Rating'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Checkout
