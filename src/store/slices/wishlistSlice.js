import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// Async Thunks

// Fetch wishlist
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/wishlist');
      const wishlistData = response.data.data || response.data;
      // Map MongoDB _id to id for frontend compatibility
      const mappedData = Array.isArray(wishlistData) 
        ? wishlistData.map(item => ({ ...item, id: item._id || item.id }))
        : wishlistData;
      return mappedData;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Add to wishlist
export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/wishlist', { productId });
      const wishlistData = response.data.data || response.data;
      // Map MongoDB _id to id for frontend compatibility
      const mappedData = Array.isArray(wishlistData) 
        ? wishlistData.map(item => ({ ...item, id: item._id || item.id }))
        : wishlistData;
      return mappedData;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Remove from wishlist
export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/user/wishlist/${productId}`);
      return { productId, data: response.data.data || response.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initial wishlist state - will be populated from server for authenticated users
const getInitialState = () => {
  return {
    items: [],
    isLoading: false,
    error: null,
  };
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: getInitialState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Local wishlist operations - no localStorage, wishlist managed in Redux state only
    addToWishlistLocal: (state, action) => {
      const product = action.payload;
      if (!state.items.find(item => item.id === product.id)) {
        state.items.push(product);
      }
    },
    removeFromWishlistLocal: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearWishlistLocal: (state) => {
      state.items = [];
    },
    setWishlistItems: (state, action) => {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || action.payload || [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || action.payload || state.items;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data?.items) {
          state.items = action.payload.data.items;
        } else {
          state.items = state.items.filter(item => item.id !== action.payload.productId);
        }
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  addToWishlistLocal,
  removeFromWishlistLocal,
  clearWishlistLocal,
  setWishlistItems,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;

// Selectors
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistCount = (state) => state.wishlist.items.length;
export const selectWishlistLoading = (state) => state.wishlist.isLoading;
export const selectIsInWishlist = (productId) => (state) =>
  state.wishlist.items.some(item => item.id === productId);
