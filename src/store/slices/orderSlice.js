import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

const resolveProductIdFromItem = (item) => {
  if (!item) return null;
  const candidate = item.productId ?? item._id ?? item.id;
  if (!candidate) return null;
  if (typeof candidate === 'object') {
    if (candidate._id) return String(candidate._id);
    if (candidate.id) return String(candidate.id);
    if (typeof candidate.toString === 'function') {
      return candidate.toString();
    }
    return null;
  }
  return String(candidate);
};

// Async Thunks

// Place order (checkout)
export const placeOrder = createAsyncThunk(
  'orders/place',
  async (orderData, { rejectWithValue }) => {
    try {
      // Transform frontend data to match backend DTO
      const address = orderData.address || orderData.shippingAddress;
      const backendItems = orderData.items.map((item) => {
        const productId = resolveProductIdFromItem(item);
        if (!productId) {
          throw new Error('Missing product identifier for one or more cart items');
        }
        return {
          productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color || item.selectedColor,
        };
      });

      const backendData = {
        items: backendItems,
        shippingAddress: {
          fullName: address.fullName,
          street: address.street || address.addressLine1,
          city: address.city,
          state: address.state,
          pincode: address.pincode || address.zipCode,
          phone: address.phone,
          landmark: address.landmark || address.addressLine2,
        },
        paymentMethod: orderData.paymentMethod,
        transactionId: orderData.transactionId,
        couponCode: orderData.couponCode,
        orderNotes: orderData.orderNotes,
      };

      const response = await api.post('/user/orders', backendData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch my orders
export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/orders');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch single order by ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/user/orders/${orderId}`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/user/orders/${orderId}`, {
        data: { reason },
      });
      return { orderId, data: response.data.data || response.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Place order
      .addCase(placeOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
        state.currentOrder = action.payload;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch my orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch single order
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(o => o.id === action.payload.orderId);
        if (index !== -1) {
          state.orders[index] = { ...state.orders[index], status: 'cancelled' };
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;

// Selectors
export const selectOrders = (state) => state.orders.orders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrdersLoading = (state) => state.orders.isLoading;
export const selectOrdersError = (state) => state.orders.error;
