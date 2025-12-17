import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// Async Thunks

// Fetch cart
export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/cart');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Add item to cart
export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity = 1, size, color }, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/cart', {
        productId,
        quantity,
        size,
        color,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update cart item quantity
export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.patch('/user/cart', { productId, quantity });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/user/cart/${productId}`);
      return { productId, data: response.data.data || response.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Clear entire cart
export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/user/cart');
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const sanitizePriceValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const str = value == null ? '' : value.toString();
  const cleaned = str.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const resolveCartItemPrice = (item) => {
  const candidate =
    item?.price ??
    item?.product?.price ??
    item?.productId?.price ??
    item?.coverPrice ??
    item?.realPrice ??
    0;
  return sanitizePriceValue(candidate);
};

export const resolveCartItemQuantity = (item) => {
  const quantity = Number(item?.quantity ?? 0);
  if (!Number.isFinite(quantity)) return 0;
  return Math.max(0, quantity);
};

// Helper to calculate totals
const calculateTotals = (items) => {
  const total = items.reduce(
    (sum, item) => sum + resolveCartItemPrice(item) * resolveCartItemQuantity(item),
    0,
  );
  const count = items.reduce((sum, item) => sum + resolveCartItemQuantity(item), 0);
  return { total, count };
};

// Initial cart state - will be populated from server for authenticated users
const getInitialState = () => {
  return {
    items: [],
    total: 0,
    count: 0,
    isLoading: false,
    error: null,
  };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: getInitialState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Local cart operations - no localStorage, cart managed in Redux state only
    addToCartLocal: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...product, quantity: 1 });
      }

      const { total, count } = calculateTotals(state.items);
      state.total = total;
      state.count = count;
    },
    removeFromCartLocal: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      const { total, count } = calculateTotals(state.items);
      state.total = total;
      state.count = count;
    },
    updateQuantityLocal: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== id);
        } else {
          item.quantity = quantity;
        }
      }
      const { total, count } = calculateTotals(state.items);
      state.total = total;
      state.count = count;
    },
    clearCartLocal: (state) => {
      state.items = [];
      state.total = 0;
      state.count = 0;
    },
    setCartItems: (state, action) => {
      state.items = action.payload;
      const { total, count } = calculateTotals(state.items);
      state.total = total;
      state.count = count;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || action.payload || [];
        const { total, count } = calculateTotals(state.items);
        state.total = total;
        state.count = count;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || action.payload || state.items;
        const { total, count } = calculateTotals(state.items);
        state.total = total;
        state.count = count;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || action.payload || state.items;
        const { total, count } = calculateTotals(state.items);
        state.total = total;
        state.count = count;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data?.items) {
          state.items = action.payload.data.items;
        } else {
          state.items = state.items.filter(item => item.id !== action.payload.productId);
        }
        const { total, count } = calculateTotals(state.items);
        state.total = total;
        state.count = count;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.total = 0;
        state.count = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  addToCartLocal,
  removeFromCartLocal,
  updateQuantityLocal,
  clearCartLocal,
  setCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;

// Memoized selectors to prevent unnecessary rerenders
export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) =>
    items.reduce(
      (sum, item) => sum + resolveCartItemPrice(item) * resolveCartItemQuantity(item),
      0,
    ),
);

export const selectCartCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + resolveCartItemQuantity(item), 0),
);
