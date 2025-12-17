import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// ==================== PRODUCT THUNKS ====================
// adminUpdateSiteConfig
export const adminCreateProduct = createAsyncThunk(
  'admin/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/products', productData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdateProduct = createAsyncThunk(
  'admin/updateProduct',
  async ({ productId, productData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/products/${productId}`, productData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminDeleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/products/${productId}`);
      return productId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Aliases for product thunks
export const createProduct = adminCreateProduct;
export const updateAdminProduct = adminUpdateProduct;
export const deleteAdminProduct = adminDeleteProduct;

export const adminUpdateFeaturedProducts = createAsyncThunk(
  'admin/updateFeaturedProducts',
  async (productIds, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/products/filter/featured', { productIds });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== ORDER THUNKS ====================

export const adminFetchOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log('🔍 adminFetchOrders - Fetching with params:', params);
      const response = await api.get('/admin/orders', { params });
      console.log('🔍 adminFetchOrders - Raw response:', response.data);
      const orders = response.data.data || response.data;
      console.log('🔍 adminFetchOrders - Extracted orders:', orders?.length, 'items');
      if (orders?.length > 0) {
        console.log('🔍 adminFetchOrders - Sample order:', orders[0]);
      }
      return Array.isArray(orders) ? orders : [];
    } catch (error) {
      console.error('❌ adminFetchOrders - Error:', error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminFetchOrderStats = createAsyncThunk(
  'admin/fetchOrderStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/orders/statistics');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdateOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ orderId, status, ...rest }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/status`, { status, ...rest });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminConfirmOrder = createAsyncThunk(
  'admin/confirmOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/orders/${orderId}/confirm`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminCancelOrder = createAsyncThunk(
  'admin/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/orders/${orderId}/cancel`, { reason });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminDeleteOrder = createAsyncThunk(
  'admin/deleteOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/orders/${orderId}`);
      return orderId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== CUSTOMER THUNKS ====================

export const adminFetchCustomers = createAsyncThunk(
  'admin/fetchCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/customers', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminFetchCustomerStats = createAsyncThunk(
  'admin/fetchCustomerStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/customers/statistics');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdateCustomer = createAsyncThunk(
  'admin/updateCustomer',
  async ({ customerId, customerData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/customers/${customerId}`, customerData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminToggleCustomerStatus = createAsyncThunk(
  'admin/toggleCustomerStatus',
  async ({ customerId, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/customers/${customerId}/status`, { isActive });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminDeleteCustomer = createAsyncThunk(
  'admin/deleteCustomer',
  async (customerId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/customers/${customerId}`);
      return customerId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== MESSAGE THUNKS ====================

export const adminFetchMessages = createAsyncThunk(
  'admin/fetchMessages',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/messages', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminFetchUnreadMessages = createAsyncThunk(
  'admin/fetchUnreadMessages',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/messages/unread', { params: { limit } });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdateMessageStatus = createAsyncThunk(
  'admin/updateMessageStatus',
  async ({ messageId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/messages/${messageId}/status`, { status });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminReplyToMessage = createAsyncThunk(
  'admin/replyToMessage',
  async ({ messageId, content }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/messages/${messageId}/reply`, { content });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminDeleteMessage = createAsyncThunk(
  'admin/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/messages/${messageId}`);
      return messageId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== REVIEW THUNKS ====================

export const adminFetchReviews = createAsyncThunk(
  'admin/fetchReviews',
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log('Calling GET /admin/reviews with params:', params);
      const response = await api.get('/admin/reviews', { params });
      console.log('Backend response:', response.data);
      // Backend returns { success, message, data: [...reviews], pagination }
      return response.data;
    } catch (error) {
      console.error('adminFetchReviews error:', error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminFetchPendingReviews = createAsyncThunk(
  'admin/fetchPendingReviews',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/reviews/pending', { params: { limit } });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminApproveReview = createAsyncThunk(
  'admin/approveReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/approve`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminRejectReview = createAsyncThunk(
  'admin/rejectReview',
  async ({ reviewId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/reviews/${reviewId}/reject`, { reason });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminDeleteReview = createAsyncThunk(
  'admin/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      return reviewId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== BOOKING THUNKS ====================

export const adminFetchBookings = createAsyncThunk(
  'admin/fetchBookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/bookings', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminFetchBookingStats = createAsyncThunk(
  'admin/fetchBookingStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/bookings/statistics');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminConfirmBooking = createAsyncThunk(
  'admin/confirmBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/bookings/${bookingId}/confirm`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminCompleteBooking = createAsyncThunk(
  'admin/completeBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/bookings/${bookingId}/complete`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminCancelBooking = createAsyncThunk(
  'admin/cancelBooking',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/bookings/${bookingId}/cancel`, { reason });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminRescheduleBooking = createAsyncThunk(
  'admin/rescheduleBooking',
  async ({ bookingId, newDate, newTimeSlot, reason }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/reschedule`, {
        newDate,
        newTimeSlot,
        reason,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminDeleteBooking = createAsyncThunk(
  'admin/deleteBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/bookings/${bookingId}`);
      return bookingId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== SITE CONFIG THUNKS ====================

export const adminFetchSiteConfig = createAsyncThunk(
  'admin/fetchSiteConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/site-config');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdateSiteConfig = createAsyncThunk(
  'admin/updateSiteConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/site-config', configData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdateBanners = createAsyncThunk(
  'admin/updateBanners',
  async (banners, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/site-config/banners', { banners });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdatePromoCards = createAsyncThunk(
  'admin/updatePromoCards',
  async (promoCards, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/site-config/promo-cards', promoCards);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdateDeliverySettings = createAsyncThunk(
  'admin/updateDeliverySettings',
  async (deliverySettings, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/site-config/delivery', deliverySettings);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== DASHBOARD THUNKS ====================

export const adminFetchDashboardOverview = createAsyncThunk(
  'admin/fetchDashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard/overview');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminFetchSalesAnalytics = createAsyncThunk(
  'admin/fetchSalesAnalytics',
  async ({ startDate, endDate, groupBy } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard/sales', {
        params: { startDate, endDate, groupBy },
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminFetchRecentActivity = createAsyncThunk(
  'admin/fetchRecentActivity',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard/recent-activity');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Aliases for dashboard thunks (without admin prefix for convenience)
export const fetchDashboardOverview = adminFetchDashboardOverview;
export const fetchSalesAnalytics = adminFetchSalesAnalytics;
export const fetchRecentActivity = adminFetchRecentActivity;

export const adminFetchQuickStats = createAsyncThunk(
  'admin/fetchQuickStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard/quick-stats');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== ADVERTISEMENT THUNKS ====================

export const adminFetchAdvertisements = createAsyncThunk(
  'admin/fetchAdvertisements',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/advertisements', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminCreateAdvertisement = createAsyncThunk(
  'admin/createAdvertisement',
  async (adData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/advertisements', adData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminUpdateAdvertisement = createAsyncThunk(
  'admin/updateAdvertisement',
  async ({ adId, adData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/advertisements/${adId}`, adData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const adminDeleteAdvertisement = createAsyncThunk(
  'admin/deleteAdvertisement',
  async (adId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/advertisements/${adId}`);
      return adId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Products
  products: [],
  productsLoading: false,
  productsError: null,

  // Orders
  orders: [],
  orderStats: null,
  ordersLoading: false,
  ordersError: null,

  // Customers
  customers: [],
  customerStats: null,
  customersLoading: false,
  customersError: null,

  // Messages
  messages: [],
  unreadMessages: [],
  messagesLoading: false,
  messagesError: null,

  // Reviews
  reviews: [],
  pendingReviews: [],
  reviewsLoading: false,
  reviewsError: null,

  // Bookings
  bookings: [],
  bookingStats: null,
  bookingsLoading: false,
  bookingsError: null,

  // Site Config
  siteConfig: null,
  siteConfigLoading: false,
  siteConfigError: null,

  // Dashboard
  dashboardOverview: null,
  salesAnalytics: null,
  recentActivity: null,
  quickStats: null,
  dashboardLoading: false,
  dashboardError: null,

  // Advertisements
  advertisements: [],
  advertisementsLoading: false,
  advertisementsError: null,
};

// ==================== SLICE ====================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state, action) => {
      if (action.payload) {
        state[`${action.payload}Error`] = null;
      } else {
        // Clear all errors
        state.productsError = null;
        state.ordersError = null;
        state.customersError = null;
        state.messagesError = null;
        state.reviewsError = null;
        state.bookingsError = null;
        state.siteConfigError = null;
        state.dashboardError = null;
        state.advertisementsError = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== PRODUCTS ====================
      .addCase(adminCreateProduct.pending, (state) => {
        state.productsLoading = true;
        state.productsError = null;
      })
      .addCase(adminCreateProduct.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.products.unshift(action.payload);
      })
      .addCase(adminCreateProduct.rejected, (state, action) => {
        state.productsLoading = false;
        state.productsError = action.payload;
      })
      .addCase(adminUpdateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id || p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(adminDeleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload && p._id !== action.payload);
      })

      // ==================== ORDERS ====================
      .addCase(adminFetchOrders.pending, (state) => {
        state.ordersLoading = true;
        state.ordersError = null;
      })
      .addCase(adminFetchOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload;
      })
      .addCase(adminFetchOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.ordersError = action.payload;
        state.orders = [];
      })
      .addCase(adminFetchOrderStats.fulfilled, (state, action) => {
        state.orderStats = action.payload;
      })
      .addCase(adminUpdateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id || o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(adminConfirmOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id || o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(adminCancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id || o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(adminDeleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter(o => o.id !== action.payload && o._id !== action.payload);
      })

      // ==================== CUSTOMERS ====================
      .addCase(adminFetchCustomers.pending, (state) => {
        state.customersLoading = true;
        state.customersError = null;
      })
      .addCase(adminFetchCustomers.fulfilled, (state, action) => {
        state.customersLoading = false;
        state.customers = Array.isArray(action.payload) ? action.payload : action.payload.customers || [];
      })
      .addCase(adminFetchCustomers.rejected, (state, action) => {
        state.customersLoading = false;
        state.customersError = action.payload;
      })
      .addCase(adminFetchCustomerStats.fulfilled, (state, action) => {
        state.customerStats = action.payload;
      })
      .addCase(adminUpdateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id || c._id === action.payload._id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(adminToggleCustomerStatus.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id || c._id === action.payload._id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(adminDeleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c.id !== action.payload && c._id !== action.payload);
      })

      // ==================== MESSAGES ====================
      .addCase(adminFetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(adminFetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = Array.isArray(action.payload) ? action.payload : action.payload.messages || [];
      })
      .addCase(adminFetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload;
      })
      .addCase(adminFetchUnreadMessages.fulfilled, (state, action) => {
        state.unreadMessages = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(adminUpdateMessageStatus.fulfilled, (state, action) => {
        const index = state.messages.findIndex(m => m.id === action.payload.id || m._id === action.payload._id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(adminReplyToMessage.fulfilled, (state, action) => {
        const index = state.messages.findIndex(m => m.id === action.payload.id || m._id === action.payload._id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(adminDeleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(m => m.id !== action.payload && m._id !== action.payload);
      })

      // ==================== REVIEWS ====================
      .addCase(adminFetchReviews.pending, (state) => {
        state.reviewsLoading = true;
        state.reviewsError = null;
      })
      .addCase(adminFetchReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        console.log('adminFetchReviews fulfilled, payload:', action.payload);
        // Backend returns { data: [...reviews], pagination: {...} }
        if (action.payload && action.payload.data) {
          state.reviews = Array.isArray(action.payload.data) ? action.payload.data : [];
        } else if (Array.isArray(action.payload)) {
          state.reviews = action.payload;
        } else {
          state.reviews = [];
        }
        console.log('Reviews stored in state:', state.reviews.length);
      })
      .addCase(adminFetchReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.reviewsError = action.payload;
        console.error('adminFetchReviews rejected:', action.payload);
      })
      .addCase(adminFetchPendingReviews.fulfilled, (state, action) => {
        state.pendingReviews = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(adminApproveReview.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(r => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
        state.pendingReviews = state.pendingReviews.filter(r => r.id !== action.payload.id && r._id !== action.payload._id);
      })
      .addCase(adminRejectReview.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(r => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
        state.pendingReviews = state.pendingReviews.filter(r => r.id !== action.payload.id && r._id !== action.payload._id);
      })
      .addCase(adminDeleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter(r => r.id !== action.payload && r._id !== action.payload);
        state.pendingReviews = state.pendingReviews.filter(r => r.id !== action.payload && r._id !== action.payload);
      })

      // ==================== BOOKINGS ====================
      .addCase(adminFetchBookings.pending, (state) => {
        state.bookingsLoading = true;
        state.bookingsError = null;
      })
      .addCase(adminFetchBookings.fulfilled, (state, action) => {
        state.bookingsLoading = false;
        state.bookings = Array.isArray(action.payload) ? action.payload : action.payload.bookings || [];
      })
      .addCase(adminFetchBookings.rejected, (state, action) => {
        state.bookingsLoading = false;
        state.bookingsError = action.payload;
      })
      .addCase(adminFetchBookingStats.fulfilled, (state, action) => {
        state.bookingStats = action.payload;
      })
      .addCase(adminConfirmBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b.id === action.payload.id || b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      .addCase(adminCompleteBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b.id === action.payload.id || b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      .addCase(adminCancelBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b.id === action.payload.id || b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      .addCase(adminRescheduleBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b.id === action.payload.id || b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      .addCase(adminDeleteBooking.fulfilled, (state, action) => {
        state.bookings = state.bookings.filter(b => b.id !== action.payload && b._id !== action.payload);
      })

      // ==================== SITE CONFIG ====================
      .addCase(adminFetchSiteConfig.pending, (state) => {
        state.siteConfigLoading = true;
        state.siteConfigError = null;
      })
      .addCase(adminFetchSiteConfig.fulfilled, (state, action) => {
        state.siteConfigLoading = false;
        state.siteConfig = action.payload;
      })
      .addCase(adminFetchSiteConfig.rejected, (state, action) => {
        state.siteConfigLoading = false;
        state.siteConfigError = action.payload;
      })
      .addCase(adminUpdateSiteConfig.fulfilled, (state, action) => {
        state.siteConfig = action.payload;
      })
      .addCase(adminUpdateBanners.fulfilled, (state, action) => {
        if (state.siteConfig) {
          state.siteConfig.banners = action.payload;
        }
      })
      .addCase(adminUpdatePromoCards.fulfilled, (state, action) => {
        if (state.siteConfig) {
          state.siteConfig.promoCards = action.payload;
        }
      })
      .addCase(adminUpdateDeliverySettings.fulfilled, (state, action) => {
        if (state.siteConfig) {
          state.siteConfig.deliverySettings = action.payload;
        }
      })

      // ==================== DASHBOARD ====================
      .addCase(adminFetchDashboardOverview.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(adminFetchDashboardOverview.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardOverview = action.payload;
      })
      .addCase(adminFetchDashboardOverview.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload;
      })
      .addCase(adminFetchSalesAnalytics.fulfilled, (state, action) => {
        state.salesAnalytics = action.payload;
      })
      .addCase(adminFetchRecentActivity.fulfilled, (state, action) => {
        state.recentActivity = action.payload;
      })
      .addCase(adminFetchQuickStats.fulfilled, (state, action) => {
        state.quickStats = action.payload;
      })

      // ==================== ADVERTISEMENTS ====================
      .addCase(adminFetchAdvertisements.pending, (state) => {
        state.advertisementsLoading = true;
        state.advertisementsError = null;
      })
      .addCase(adminFetchAdvertisements.fulfilled, (state, action) => {
        state.advertisementsLoading = false;
        state.advertisements = Array.isArray(action.payload) ? action.payload : action.payload.advertisements || [];
      })
      .addCase(adminFetchAdvertisements.rejected, (state, action) => {
        state.advertisementsLoading = false;
        state.advertisementsError = action.payload;
      })
      .addCase(adminCreateAdvertisement.fulfilled, (state, action) => {
        state.advertisements.unshift(action.payload);
      })
      .addCase(adminUpdateAdvertisement.fulfilled, (state, action) => {
        const index = state.advertisements.findIndex(a => a.id === action.payload.id || a._id === action.payload._id);
        if (index !== -1) {
          state.advertisements[index] = action.payload;
        }
      })
      .addCase(adminDeleteAdvertisement.fulfilled, (state, action) => {
        state.advertisements = state.advertisements.filter(a => a.id !== action.payload && a._id !== action.payload);
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;

// Selectors
export const selectAdminProducts = (state) => state.admin.products;
export const selectAdminOrders = (state) => state.admin.orders;
export const selectAdminOrderStats = (state) => state.admin.orderStats;
export const selectAdminCustomers = (state) => state.admin.customers;
export const selectAdminCustomerStats = (state) => state.admin.customerStats;
export const selectAdminMessages = (state) => state.admin.messages;
export const selectAdminUnreadMessages = (state) => state.admin.unreadMessages;
export const selectAdminReviews = (state) => state.admin.reviews;
export const selectAdminPendingReviews = (state) => state.admin.pendingReviews;
export const selectAdminBookings = (state) => state.admin.bookings;
export const selectAdminBookingStats = (state) => state.admin.bookingStats;
export const selectAdminSiteConfig = (state) => state.admin.siteConfig;
export const selectDashboardOverview = (state) => state.admin.dashboardOverview;
export const selectSalesAnalytics = (state) => state.admin.salesAnalytics;
export const selectRecentActivity = (state) => state.admin.recentActivity;
export const selectQuickStats = (state) => state.admin.quickStats;
export const selectAdminAdvertisements = (state) => state.admin.advertisements;

// Alias for commonly used selectors
export const selectDashboard = (state) => state.admin.dashboardOverview || {};
export const selectAdminLoading = (state) => state.admin.dashboardLoading || state.admin.productsLoading;

// Loading selectors
export const selectAdminProductsLoading = (state) => state.admin.productsLoading;
export const selectAdminOrdersLoading = (state) => state.admin.ordersLoading;
export const selectAdminCustomersLoading = (state) => state.admin.customersLoading;
export const selectAdminMessagesLoading = (state) => state.admin.messagesLoading;
export const selectAdminReviewsLoading = (state) => state.admin.reviewsLoading;
export const selectAdminBookingsLoading = (state) => state.admin.bookingsLoading;
export const selectAdminSiteConfigLoading = (state) => state.admin.siteConfigLoading;
export const selectDashboardLoading = (state) => state.admin.dashboardLoading;
export const selectAdminAdvertisementsLoading = (state) => state.admin.advertisementsLoading;
