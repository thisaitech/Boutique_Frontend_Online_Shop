import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiHeart, FiShoppingBag, FiArrowLeft, FiTrash2 } from 'react-icons/fi'
import { useGlobal } from '../context/GlobalContext'
import {
  fetchWishlist,
  removeFromWishlist,
  removeFromWishlistLocal,
  selectWishlistItems,
  selectWishlistLoading
} from '../store/slices/wishlistSlice'
import { selectIsAuthenticated, selectUser as selectAuthUser } from '../store/slices/authSlice'
import { selectProducts } from '../store/slices/productSlice'
import ProductCard from '../components/ProductCard/ProductCard'
import toast from 'react-hot-toast'
import './Wishlist.css'

function Wishlist() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Redux state
  const wishlistItemsRedux = useSelector(selectWishlistItems)
  const wishlistLoading = useSelector(selectWishlistLoading)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const authUser = useSelector(selectAuthUser)
  const productsRedux = useSelector(selectProducts)

  // Context fallback
  const { user: contextUser, inventory: contextInventory } = useGlobal()

  // Use Redux data if available
  const user = authUser || contextUser
  const inventory = productsRedux.length > 0 ? productsRedux : contextInventory

  const [wishlistItems, setWishlistItems] = useState([])

  // Fetch wishlist on mount - always fetch from database for logged-in users
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    console.log('Wishlist - User:', user)
    console.log('Wishlist - Fetching from database...')
    
    // Always fetch from database for logged-in users
    dispatch(fetchWishlist())
  }, [user, navigate, dispatch])

  // Update local wishlist items when Redux state changes
  useEffect(() => {
    console.log('Wishlist - Redux items updated:', wishlistItemsRedux)
    setWishlistItems(wishlistItemsRedux)
  }, [wishlistItemsRedux])

  const handleRemoveFromWishlist = async (productId) => {
    if (!user) return

    // Use _id or id, whichever is available
    const idToRemove = productId
    console.log('Removing product with ID:', idToRemove)

    try {
      // Always use database for logged-in users
      await dispatch(removeFromWishlist(idToRemove)).unwrap()
      setWishlistItems(prev => prev.filter(item => (item.id || item._id) !== idToRemove))
      toast.success('Removed from wishlist')
    } catch (error) {
      toast.error('Failed to remove from wishlist')
      console.error('Remove wishlist error:', error)
    }
  }
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  if (!user) {
    return null
  }

  return (
    <motion.div
      className="wishlist-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="wishlist-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          <span>Back</span>
        </button>
        <h1>
          <FiHeart />
          My Wishlist
        </h1>
        {wishlistItems.length > 0 && (
          <span className="wishlist-count">{wishlistItems.length} items</span>
        )}
      </div>

      {/* Content */}
      <div className="wishlist-container">
        {wishlistItems.length === 0 ? (
          <motion.div
            className="wishlist-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-icon">
              <FiHeart />
            </div>
            <h2>Your wishlist is empty</h2>
            <p>Start adding items you love to your wishlist!</p>
            <button className="btn-primary" onClick={() => navigate('/women')}>
              <FiShoppingBag />
              Start Shopping
            </button>
          </motion.div>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map((product) => (
              <motion.div
                key={product.id}
                className="wishlist-item"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard
                  product={product}
                  onProductClick={() => navigate(`/product/${product.id || product._id}`)}
                />
                <button
                  className="remove-wishlist-btn"
                  onClick={() => handleRemoveFromWishlist(product.id || product._id)}
                  aria-label="Remove from wishlist"
                >
                  <FiTrash2 />
                  Remove
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Wishlist
