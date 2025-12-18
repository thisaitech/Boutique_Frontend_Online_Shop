import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiBell,
  FiArrowLeft, FiEdit2, FiCheck, FiX, FiHeart,
  FiPackage, FiSettings, FiShield,
  FiPlus, FiTrash2, FiNavigation
} from 'react-icons/fi'
import { useGlobal } from '../context/GlobalContext'
import toast from 'react-hot-toast'
import api from '../api/axiosConfig'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const { user, darkMode, toggleDarkMode, customers, updateCustomer } = useGlobal()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || user?.mobile || '',
    address: '123, MG Road, Koramangala, Bangalore'
  })
  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: true,
    updates: false,
    newsletter: true
  })

  const handleSaveProfile = async () => {
    try {
      const response = await api.put('/user/profile', {
        name: profileData.name,
        phone: profileData.phone.replace(/\D/g, '').slice(-10) // Extract 10 digits
      })
      
      if (response.data.success) {
        setIsEditing(false)
        toast.success('Profile updated successfully!')
        
        // Update user in localStorage if needed
        const currentUser = JSON.parse(localStorage.getItem('thisai_user') || '{}')
        currentUser.name = profileData.name
        currentUser.phone = profileData.phone
        currentUser.mobile = profileData.phone
        localStorage.setItem('thisai_user', JSON.stringify(currentUser))
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    }
  }

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    toast.success('Notification preference updated')
  }


  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'location', label: 'Location', icon: FiMapPin },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'preferences', label: 'Preferences', icon: FiSettings }
  ]

  // Address management state
  const [addresses, setAddresses] = useState([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)

  // Fetch addresses from backend
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        console.log('No user logged in, skipping address fetch')
        setIsLoadingAddresses(false)
        return
      }
      try {
        console.log('Fetching addresses for user:', user)
        const response = await api.get('/user/addresses')
        console.log('Address response:', response.data)
        const fetchedAddresses = response.data.data || []
        console.log('Fetched addresses count:', fetchedAddresses.length)
        setAddresses(fetchedAddresses.map(addr => ({
          id: addr._id || addr.id,
          type: addr.type || 'home',
          name: addr.name || addr.fullName || 'Home',
          address: addr.addressLine1 || addr.address || '',
          addressLine2: addr.addressLine2 || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || addr.zipCode || '',
          phone: addr.phone || '',
          isDefault: addr.isDefault || false
        })))
      } catch (error) {
        console.error('Failed to fetch addresses:', error.response?.data || error.message)
        toast.error('Failed to load addresses. Please try again.')
      } finally {
        setIsLoadingAddresses(false)
      }
    }
    fetchAddresses()
  }, [user])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    type: 'home',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: user?.phone || user?.mobile || '',
    isDefault: false
  })

  useEffect(() => {
    if (!user || isEditing) return
    setProfileData((prev) => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || user?.mobile || '',
    }))
    setAddressForm((prev) => ({
      ...prev,
      phone: user?.phone || user?.mobile || '',
    }))
  }, [user, isEditing])
  const [addressErrors, setAddressErrors] = useState({})

  const handleAddAddress = () => {
    setShowAddAddress(true)
    setEditingAddress(null)
    setAddressForm({
      type: 'home',
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: user?.phone || user?.mobile || '',
      isDefault: false
    })
    setAddressErrors({})
  }

  const handleEditAddress = (address) => {
    setEditingAddress(address.id)
    setAddressForm({ ...address })
    setShowAddAddress(true)
    setAddressErrors({})
  }

  const handleDeleteAddress = async (id) => {
    if (addresses.length === 1) {
      toast.error('You must have at least one address')
      return
    }
    try {
      await api.delete(`/user/addresses/${id}`)
      const updatedAddresses = addresses.filter(addr => addr.id !== id)
      setAddresses(updatedAddresses)
      toast.success('Address deleted successfully')
    } catch (error) {
      console.error('Failed to delete address:', error)
      toast.error(error.response?.data?.message || 'Failed to delete address')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/user/addresses/${id}/default`)
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }))
      setAddresses(updatedAddresses)
      toast.success('Default address updated')
    } catch (error) {
      console.error('Failed to set default address:', error)
      toast.error(error.response?.data?.message || 'Failed to set default address')
    }
  }

  const validateAddressForm = () => {
    const newErrors = {}
    if (!addressForm.name.trim()) newErrors.name = 'Address name is required'
    if (!addressForm.address.trim()) newErrors.address = 'Street address is required'
    if (!addressForm.city.trim()) newErrors.city = 'City is required'
    if (!addressForm.state.trim()) newErrors.state = 'State is required'
    if (!addressForm.pincode.trim()) newErrors.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(addressForm.pincode)) newErrors.pincode = 'Invalid pincode (6 digits)'
    if (!addressForm.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^\+?[1-9]\d{1,14}$/.test(addressForm.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number'
    }
    setAddressErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) return

    try {
      const addressData = {
        fullName: addressForm.name,
        addressLine1: addressForm.address,
        addressLine2: addressForm.addressLine2 || '',
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
        phone: addressForm.phone.replace(/\D/g, '').slice(-10),
        isDefault: addressForm.isDefault,
        label: addressForm.type
      }

      if (editingAddress) {
        const response = await api.put(`/user/addresses/${editingAddress}`, addressData)
        const updatedAddresses = response.data.data || []
        setAddresses(updatedAddresses.map(addr => ({
          id: addr._id || addr.id,
          type: addr.type,
          name: addr.name,
          address: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          phone: addr.phone,
          isDefault: addr.isDefault
        })))
        toast.success('Address updated successfully')
      } else {
        const response = await api.post('/user/addresses', addressData)
        const allAddresses = response.data.data || []
        setAddresses(allAddresses.map(addr => ({
          id: addr._id || addr.id,
          type: addr.type,
          name: addr.name,
          address: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          phone: addr.phone,
          isDefault: addr.isDefault
        })))
        toast.success('Address added successfully')
      }

      setShowAddAddress(false)
      setEditingAddress(null)
      setAddressForm({
        type: 'home',
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: user?.mobile || '',
        isDefault: false
      })
    } catch (error) {
      console.error('Failed to save address:', error)
      toast.error(error.response?.data?.message || 'Failed to save address')
    }
  }

  return (
    <motion.div
      className="settings-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="settings-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          <span>Back</span>
        </button>
        <h1><FiSettings /> Settings</h1>
      </div>

      <div className="settings-container">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar glass-card">
          <div className="user-card">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <h3>{user?.name || 'User'}</h3>
              <p>{user?.email || 'user@email.com'}</p>
            </div>
          </div>

          <nav className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-links">
            <button className="sidebar-link" onClick={() => navigate('/orders')}>
              <FiPackage />
              <span>My Orders</span>
            </button>
            <button className="sidebar-link" onClick={() => navigate('/wishlist')}>
              <FiHeart />
              <span>Wishlist</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              className="settings-section glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="section-header">
                <h2><FiUser /> Personal Information</h2>
                {!isEditing ? (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    <FiEdit2 /> Edit
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSaveProfile}>
                      <FiCheck /> Save
                    </button>
                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                      <FiX /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="profile-form">
                <div className="form-group">
                  <label><FiUser /> Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                    className={isEditing ? 'editable' : ''}
                  />
                </div>

                <div className="form-group">
                  <label><FiMail /> Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled={true}
                    className=""
                    title="Email cannot be changed"
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label><FiPhone /> Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    className={isEditing ? 'editable' : ''}
                  />
                </div>

                <div className="form-group full-width">
                  <label><FiMapPin /> Address</label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    disabled={!isEditing}
                    className={isEditing ? 'editable' : ''}
                    rows={3}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <motion.div
              className="settings-section glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="section-header">
                <h2><FiMapPin /> Saved Addresses</h2>
                <button className="edit-btn" onClick={handleAddAddress}>
                  <FiPlus /> Add Address
                </button>
              </div>

              {showAddAddress && (
                <motion.div
                  className="address-form-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                  <div className="address-form-grid">
                    <div className={`form-group ${addressErrors.name ? 'error' : ''}`}>
                      <label><FiMapPin /> Address Name</label>
                      <select
                        value={addressForm.type}
                        onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value, name: e.target.value === 'home' ? 'Home' : e.target.value === 'work' ? 'Work' : 'Other' })}
                        className="form-input"
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                      {addressErrors.name && <span className="error-text">{addressErrors.name}</span>}
                    </div>

                    <div className={`form-group full-width ${addressErrors.address ? 'error' : ''}`}>
                      <label><FiMapPin /> Street Address</label>
                      <textarea
                        value={addressForm.address}
                        onChange={(e) => {
                          setAddressForm({ ...addressForm, address: e.target.value })
                          if (addressErrors.address) setAddressErrors({ ...addressErrors, address: '' })
                        }}
                        placeholder="House/Flat No., Building, Street"
                        className="form-input"
                        rows={2}
                      />
                      {addressErrors.address && <span className="error-text">{addressErrors.address}</span>}
                    </div>

                    <div className={`form-group ${addressErrors.city ? 'error' : ''}`}>
                      <label><FiMapPin /> City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => {
                          setAddressForm({ ...addressForm, city: e.target.value })
                          if (addressErrors.city) setAddressErrors({ ...addressErrors, city: '' })
                        }}
                        placeholder="City"
                        className="form-input"
                      />
                      {addressErrors.city && <span className="error-text">{addressErrors.city}</span>}
                    </div>

                    <div className={`form-group ${addressErrors.state ? 'error' : ''}`}>
                      <label><FiMapPin /> State</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => {
                          setAddressForm({ ...addressForm, state: e.target.value })
                          if (addressErrors.state) setAddressErrors({ ...addressErrors, state: '' })
                        }}
                        placeholder="State"
                        className="form-input"
                      />
                      {addressErrors.state && <span className="error-text">{addressErrors.state}</span>}
                    </div>

                    <div className={`form-group ${addressErrors.pincode ? 'error' : ''}`}>
                      <label><FiMapPin /> Pincode</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={addressForm.pincode}
                          onChange={async (e) => {
                            const pincode = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setAddressForm({ ...addressForm, pincode })
                            if (addressErrors.pincode) setAddressErrors({ ...addressErrors, pincode: '' })
                            
                            // Auto-fetch location when pincode is 6 digits
                            if (pincode.length === 6) {
                              try {
                                const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
                                const data = await response.json()
                                if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
                                  const postOffice = data[0].PostOffice[0]
                                  setAddressForm(prev => ({
                                    ...prev,
                                    city: postOffice.District || prev.city,
                                    state: postOffice.State || prev.state,
                                    address: prev.address || postOffice.Name || prev.address
                                  }))
                                }
                              } catch (error) {
                                console.error('Error fetching pincode data:', error)
                              }
                            }
                          }}
                          placeholder="6-digit pincode"
                          className="form-input"
                          maxLength={6}
                        />
                        {addressForm.pincode.length === 6 && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await fetch(`https://api.postalpincode.in/pincode/${addressForm.pincode}`)
                                const data = await response.json()
                                if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
                                  const postOffice = data[0].PostOffice[0]
                                  setAddressForm(prev => ({
                                    ...prev,
                                    city: postOffice.District || prev.city,
                                    state: postOffice.State || prev.state,
                                    address: prev.address || postOffice.Name || prev.address
                                  }))
                                  toast.success('Location fetched from pincode!')
                                } else {
                                  toast.error('Invalid pincode')
                                }
                              } catch (error) {
                                toast.error('Error fetching location')
                              }
                            }}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'var(--primary-blue)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            <FiNavigation /> Get Location
                          </button>
                        )}
                      </div>
                      {addressErrors.pincode && <span className="error-text">{addressErrors.pincode}</span>}
                    </div>

                    <div className={`form-group ${addressErrors.phone ? 'error' : ''}`}>
                      <label><FiPhone /> Phone Number</label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => {
                          setAddressForm({ ...addressForm, phone: e.target.value })
                          if (addressErrors.phone) setAddressErrors({ ...addressErrors, phone: '' })
                        }}
                        placeholder="Phone number"
                        className="form-input"
                      />
                      {addressErrors.phone && <span className="error-text">{addressErrors.phone}</span>}
                    </div>

                    <div className="form-group full-width">
                      <label>
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        />
                        Set as default address
                      </label>
                    </div>
                  </div>

                  <div className="address-form-actions">
                    <button className="save-btn" onClick={handleSaveAddress}>
                      <FiCheck /> {editingAddress ? 'Update Address' : 'Save Address'}
                    </button>
                    <button className="cancel-btn" onClick={() => { setShowAddAddress(false); setEditingAddress(null); setAddressErrors({}) }}>
                      <FiX /> Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="addresses-list">
                {isLoadingAddresses ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No saved addresses yet. Click "Add Address" to create one.</p>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <motion.div
                      key={address.id}
                      className={`address-card ${address.isDefault ? 'default' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                    <div className="address-header">
                      <div className="address-type">
                        <FiMapPin />
                        <span>{address.name}</span>
                        {address.isDefault && <span className="default-badge">Default</span>}
                      </div>
                      <div className="address-actions">
                        <div className="address-actions-row">
                          <button
                            className="action-btn-small"
                            onClick={() => handleEditAddress(address)}
                            title="Edit address"
                          >
                            <FiEdit2 />
                          </button>
                          {addresses.length > 1 && (
                            <button
                              className="action-btn-small delete"
                              onClick={() => handleDeleteAddress(address.id)}
                              title="Delete address"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                        {!address.isDefault && (
                          <button
                            className="action-btn-small"
                            onClick={() => handleSetDefault(address.id)}
                            title="Set as default"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="address-details">
                      <p>{address.address}</p>
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                      <p><FiPhone /> {address.phone}</p>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              className="settings-section glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="section-header">
                <h2><FiBell /> Notification Preferences</h2>
              </div>

              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Order Updates</h4>
                    <p>Get notified about your order status and delivery updates</p>
                  </div>
                  <button
                    className={`toggle-btn ${notifications.orders ? 'active' : ''}`}
                    onClick={() => handleNotificationChange('orders')}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Promotions & Offers</h4>
                    <p>Receive exclusive deals and promotional offers</p>
                  </div>
                  <button
                    className={`toggle-btn ${notifications.promotions ? 'active' : ''}`}
                    onClick={() => handleNotificationChange('promotions')}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>App Updates</h4>
                    <p>Stay informed about new features and improvements</p>
                  </div>
                  <button
                    className={`toggle-btn ${notifications.updates ? 'active' : ''}`}
                    onClick={() => handleNotificationChange('updates')}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              className="settings-section glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="section-header">
                <h2><FiShield /> Security Settings</h2>
              </div>

              <div className="security-options">
                <div className="security-item">
                  <div className="security-info">
                    <FiShield />
                    <div>
                      <h4>Account Security</h4>
                      <p>Your account is secured with OTP authentication via mobile number</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <motion.div
              className="settings-section glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="section-header">
                <h2><FiSettings /> App Preferences</h2>
              </div>

              <div className="preferences-list">
                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Dark Mode</h4>
                    <p>Switch between light and dark themes</p>
                  </div>
                  <button
                    className={`toggle-btn ${darkMode ? 'active' : ''}`}
                    onClick={toggleDarkMode}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>


                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Currency</h4>
                    <p>Choose your preferred currency</p>
                  </div>
                  <select className="preference-select">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Settings
