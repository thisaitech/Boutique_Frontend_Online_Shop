import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiCreditCard, FiMapPin, FiEdit3, FiCheck, FiChevronRight, FiTruck, FiPackage } from 'react-icons/fi'
import { useGlobal } from '../../context/GlobalContext'
import { clearCart as clearCartAction } from '../../store/slices/cartSlice'
import { selectIsAuthenticated } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'
import './CartDrawer.css'

function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const { cart, cartTotal, removeFromCart, updateCartQuantity, clearCart: clearCartContext, addOrder, siteConfig, user } = useGlobal()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [step, setStep] = useState('cart') // 'cart', 'address', 'payment'
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(0)
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: 'Home',
      fullName: 'John Doe',
      phone: '+91 98765 43210',
      address: '123, MG Road, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      isDefault: true
    }
  ])
  const [paymentMethod] = useState('razorpay_upi') // Default to Razorpay UPI
  const [newAddress, setNewAddress] = useState({
    name: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  const handleQuantityChange = (productId, currentQty, change) => {
    const newQty = currentQty + change
    if (newQty < 1) {
      removeFromCart(productId)
      toast.success('Item removed from cart')
    } else {
      updateCartQuantity(productId, newQty)
    }
  }

  // Shipping cost logic
  const shippingCost = 100
  
  // Calculate tax from each product (tax field from product)
  const totalTax = cart.reduce((acc, item) => {
    const itemTax = item.tax || 0 // tax per item
    return acc + (itemTax * item.quantity)
  }, 0)
  
  // Total = subtotal + shipping + tax
  const totalWithShipping = cartTotal + shippingCost + totalTax

  const handleRemoveItem = (productId) => {
    removeFromCart(productId)
    toast.success('Item removed from cart')
  }

  const handleProceedToAddress = () => {
    if (cart.length === 0) {
      return
    }
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please login to proceed to checkout')
      onClose()
      navigate('/login')
      return
    }
    // Go to address step within drawer
    setStep('address')
  }

  const handleProceedToPayment = () => {
    if (addresses.length === 0) {
      toast.error('Please add a delivery address')
      return
    }
    setStep('payment')
  }

  const handleAddAddress = () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.address || !newAddress.city || !newAddress.pincode) {
      toast.error('Please fill all required fields')
      return
    }
    const address = {
      ...newAddress,
      id: Date.now(),
      isDefault: addresses.length === 0
    }
    setAddresses([...addresses, address])
    setNewAddress({ name: '', fullName: '', phone: '', address: '', city: '', state: '', pincode: '' })
    setShowAddressForm(false)
    toast.success('Address added successfully!')
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
  const processRazorpayPayment = async (orderData) => {
    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      toast.error('Failed to load payment gateway')
      setIsProcessing(false)
      return 'failed'
    }

    return new Promise((resolve) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || siteConfig?.razorpayKeyId || 'rzp_test_RrVPw4temWVxGs', // Use from env or site config
        amount: totalWithShipping * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: siteConfig?.shopName || 'Boutique Shop',
        description: `Order for ${cart.length} item(s)`,
        image: siteConfig?.logo || '/logo.png',
        handler: function (response) {
          // Payment successful
          orderData.razorpayPaymentId = response.razorpay_payment_id
          orderData.razorpayOrderId = response.razorpay_order_id
          orderData.razorpaySignature = response.razorpay_signature
          orderData.paymentStatus = 'paid'
          resolve(true)
        },
        prefill: {
          name: addresses[selectedAddress]?.fullName || '',
          email: user?.email || 'customer@example.com',
          contact: addresses[selectedAddress]?.phone || ''
        },
        notes: {
          address: addresses[selectedAddress]?.address || ''
        },
        theme: {
          color: '#e91e8c'
        },
        modal: {
          ondismiss: function () {
            // User cancelled - don't store order
            setIsProcessing(false)
            resolve(false)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`)
        setIsProcessing(false)
        resolve('failed') // Return 'failed' to store as failed order
      })
      razorpay.open()
    })
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return
    }

    setIsProcessing(true)

    const selectedAddrData = addresses[selectedAddress]

    // Create order with full detail for admin + invoices
    const order = {
      items: [...cart],
      subtotal: cartTotal,
      shipping: shippingCost,
      tax: totalTax,
      discount: 0,
      total: totalWithShipping,
      status: 'pending', // Order starts as pending, admin must confirm
      paymentMethod,
      paymentStatus: 'pending',
      deliveryAddress: selectedAddrData,
      shippingAddress: selectedAddrData
        ? {
            fullName: selectedAddrData.fullName,
            street: selectedAddrData.address,
            city: selectedAddrData.city,
            state: selectedAddrData.state,
            pincode: selectedAddrData.pincode,
            phone: selectedAddrData.phone
          }
        : {},
      customerName: selectedAddrData?.fullName || 'Guest Customer',
      customerEmail: user?.email || 'customer@thisaiboutique.com'
    }

    // Process Razorpay payment
    const paymentResult = await processRazorpayPayment(order)
    
    if (paymentResult === false) {
      // Payment was cancelled by user - don't store anything
      setIsProcessing(false)
      return
    }
    
    if (paymentResult === 'failed') {
      // Payment failed - store as failed order
      order.status = 'failed'
      order.paymentStatus = 'failed'
      addOrder(order)
      setIsProcessing(false)
      toast.error('Payment failed! Order not placed.')
      onClose()
      return
    }

    // Payment successful - store order
    addOrder(order)

    // Clear cart - both backend and local state
    if (isAuthenticated) {
      dispatch(clearCartAction())
    }
    clearCartContext()

    setIsProcessing(false)
    setPaymentSuccess(true)

    // Reset and close after showing success
    setTimeout(() => {
      setPaymentSuccess(false)
      setStep('cart')
      onClose()
      toast.success('Order placed successfully!')
    }, 2000)
  }

  const handleBack = () => {
    if (step === 'address') setStep('cart')
    else if (step === 'payment') setStep('address')
  }

  // Update payment method if COD availability changes
  useEffect(() => {
    const codAvailable = siteConfig?.deliverySettings?.codAvailable ?? true
    if (!codAvailable && paymentMethod === 'cod') {
      setPaymentMethod('razorpay_upi')
    }
  }, [siteConfig?.deliverySettings?.codAvailable, paymentMethod])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="cart-drawer glass-card"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="cart-header">
              {step !== 'cart' && (
                <button className="back-btn" onClick={handleBack}>
                  <FiChevronRight style={{ transform: 'rotate(180deg)' }} />
                </button>
              )}
              <h3>
                {step === 'cart' && <><FiShoppingBag /> Shopping Bag {cart.length > 0 && <span className="cart-count">({cart.length})</span>}</>}
                {step === 'address' && <><FiMapPin /> Delivery Address</>}
                {step === 'payment' && <><FiCreditCard /> Payment</>}
              </h3>
              <button className="close-btn" onClick={onClose}>
                <FiX />
              </button>
            </div>

            {/* Progress Steps */}
            {cart.length > 0 && (
              <div className="checkout-steps">
                <div className={`step ${step === 'cart' ? 'active' : ''} ${step !== 'cart' ? 'completed' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Cart</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${step === 'address' ? 'active' : ''} ${step === 'payment' ? 'completed' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Address</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${step === 'payment' ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">Payment</span>
                </div>
              </div>
            )}

            {/* Payment Processing Overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  className="payment-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="payment-content">
                    <div className="payment-loader">
                      <FiCreditCard />
                    </div>
                    <p>Processing Payment...</p>
                    <span className="payment-amount">{formatPrice(totalWithShipping)}</span>
                  </div>
                </motion.div>
              )}

              {paymentSuccess && (
                <motion.div
                  className="payment-overlay success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="payment-content">
                    <div className="success-icon">✓</div>
                    <p>Order Placed Successfully!</p>
                    <span>Thank you for your order</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {/* Cart Step */}
              {step === 'cart' && (
                <motion.div
                  key="cart"
                  className="cart-items"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {cart.length === 0 ? (
                    <div className="empty-cart">
                      <FiShoppingBag className="empty-icon" />
                      <h4>Your bag is empty</h4>
                      <p>Add some beautiful pieces to get started</p>
                      <button className="btn btn-primary" onClick={onClose}>
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <motion.div
                        key={item.id}
                        className="cart-item"
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                      >
                        <div className="item-image">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="item-details">
                          <h4 className="item-name">{item.name}</h4>
                          <p className="item-category">{item.category}</p>
                          <div className="item-price">
                            <span className="current-price">{formatPrice(item.price)}</span>
                            {item.originalPrice && (
                              <span className="original-price">{formatPrice(item.originalPrice)}</span>
                            )}
                          </div>
                        </div>
                        <div className="item-actions">
                          <div className="quantity-control">
                            <button
                              className="qty-btn"
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                            >
                              <FiMinus />
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button
                              className="qty-btn"
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                            >
                              <FiPlus />
                            </button>
                          </div>
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

              {/* Address Step */}
              {step === 'address' && (
                <motion.div
                  key="address"
                  className="address-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="address-list">
                    {addresses.map((addr, index) => (
                      <div
                        key={addr.id}
                        className={`address-card ${selectedAddress === index ? 'selected' : ''}`}
                        onClick={() => setSelectedAddress(index)}
                      >
                        <div className="address-radio">
                          {selectedAddress === index ? <FiCheck /> : <span className="radio-empty"></span>}
                        </div>
                        <div className="address-content">
                          <div className="address-header">
                            <span className="address-label">{addr.name || 'Address'}</span>
                            {addr.isDefault && <span className="default-badge">Default</span>}
                          </div>
                          <p className="address-name">{addr.fullName}</p>
                          <p className="address-text">{addr.address}</p>
                          <p className="address-text">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="address-phone">{addr.phone}</p>
                        </div>
                      </div>
                    ))}

                    {!showAddressForm ? (
                      <button className="add-address-btn" onClick={() => setShowAddressForm(true)}>
                        <FiPlus />
                        Add New Address
                      </button>
                    ) : (
                      <motion.div
                        className="address-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <h4>Add New Address</h4>
                        <div className="form-row">
                          <input
                            type="text"
                            placeholder="Address Label (Home, Office, etc.)"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <input
                            type="text"
                            placeholder="Full Name *"
                            value={newAddress.fullName}
                            onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <input
                            type="tel"
                            placeholder="Phone Number *"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <textarea
                            placeholder="Full Address *"
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                          />
                        </div>
                        <div className="form-row double">
                          <input
                            type="text"
                            placeholder="City *"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <input
                            type="text"
                            placeholder="Pincode *"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            maxLength={6}
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn btn-secondary" onClick={() => setShowAddressForm(false)}>Cancel</button>
                          <button className="btn btn-primary" onClick={handleAddAddress}>Save Address</button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Delivery Info */}
                  <div className="delivery-info-box">
                    <div className="delivery-row">
                      <FiTruck />
                      <div>
                        <strong>Free Delivery</strong>
                        <span>Estimated delivery in 5-7 business days</span>
                      </div>
                    </div>
                    <div className="delivery-row">
                      <FiPackage />
                      <div>
                        <strong>Easy Returns</strong>
                        <span>7 days return policy</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Payment Step */}
              {step === 'payment' && (
                <motion.div
                  key="payment"
                  className="payment-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="order-summary">
                    <h4>Order Summary</h4>
                    <div className="summary-items">
                      {cart.map((item) => (
                        <div key={item.id} className="summary-item">
                          <img src={item.image} alt={item.name} />
                          <div className="summary-item-details">
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">Qty: {item.quantity}</span>
                          </div>
                          <span className="item-total">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="delivery-address-preview">
                    <h4>Delivering To</h4>
                    {addresses[selectedAddress] && (
                      <div className="address-preview">
                        <p><strong>{addresses[selectedAddress].fullName}</strong></p>
                        <p>{addresses[selectedAddress].address}</p>
                        <p>{addresses[selectedAddress].city}, {addresses[selectedAddress].state} - {addresses[selectedAddress].pincode}</p>
                        <p>{addresses[selectedAddress].phone}</p>
                      </div>
                    )}
                  </div>

                  <div className="payment-methods">
                    <h4>Payment Method</h4>
                    <div className="payment-info">
                      <FiCreditCard />
                      <span>Pay securely with Razorpay (UPI, Cards, NetBanking)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal ({cart.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  {totalTax > 0 && (
                    <div className="summary-row">
                      <span>Tax</span>
                      <span>{formatPrice(totalTax)}</span>
                    </div>
                  )}
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>{formatPrice(totalWithShipping)}</span>
                  </div>
                </div>

                {step === 'cart' && (
                  <>
                    <button
                      className="checkout-btn btn-primary"
                      onClick={handleProceedToAddress}
                    >
                      Proceed to Checkout
                      <FiChevronRight />
                    </button>
                    <button className="clear-cart-btn" onClick={async () => {
                      // Clear cart - both backend and local state
                      if (isAuthenticated) {
                        try {
                          await dispatch(clearCartAction()).unwrap()
                          toast.success('Cart cleared')
                        } catch (error) {
                          toast.error('Failed to clear cart')
                          console.error('Clear cart error:', error)
                        }
                      }
                      clearCartContext()
                      if (!isAuthenticated) {
                        toast.success('Cart cleared')
                      }
                    }}>
                      Clear Cart
                    </button>
                  </>
                )}

                {step === 'address' && (
                  <button
                    className="checkout-btn btn-primary"
                    onClick={handleProceedToPayment}
                    disabled={addresses.length === 0}
                  >
                    Continue to Payment
                    <FiChevronRight />
                  </button>
                )}

                {step === 'payment' && (
                  <button
                    className="checkout-btn btn-primary"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    <FiCreditCard />
                    Pay {formatPrice(totalWithShipping)}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartDrawer
