import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// Async Thunks

// Fetch product reviews (public - no auth required)
export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/user/reviews/product/${productId}`);
      console.log('Fetched reviews for product', productId, ':', response.data);
      // Backend returns { success, data: { reviews, stats } }
      const reviewsData = response.data.data?.reviews || response.data.reviews || response.data.data || response.data;
      return { productId, reviews: Array.isArray(reviewsData) ? reviewsData : [] };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch my reviews
export const fetchMyReviews = createAsyncThunk(
  'reviews/fetchMyReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/reviews');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Submit a review
export const submitReview = createAsyncThunk(
  'reviews/submit',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/reviews', reviewData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update my review
export const updateReview = createAsyncThunk(
  'reviews/update',
  async ({ reviewId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/user/reviews/${reviewId}`, reviewData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Delete my review
export const deleteReview = createAsyncThunk(
  'reviews/delete',
  async (reviewId, { rejectWithValue }) => {
    try {
      await api.delete(`/user/reviews/${reviewId}`);
      return reviewId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const initialState = {
  productReviews: {}, // keyed by productId
  myReviews: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProductReviews: (state, action) => {
      if (action.payload) {
        delete state.productReviews[action.payload];
      } else {
        state.productReviews = {};
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch product reviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productReviews[action.payload.productId] = action.payload.reviews;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch my reviews
      .addCase(fetchMyReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myReviews = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Submit review
      .addCase(submitReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.myReviews.unshift(action.payload);
        // Also add to product reviews if we have them cached
        const productId = action.payload.productId;
        if (state.productReviews[productId]) {
          state.productReviews[productId].unshift(action.payload);
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })

      // Update review
      .addCase(updateReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.myReviews.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.myReviews[index] = action.payload;
        }
        // Update in product reviews if cached
        const productId = action.payload.productId;
        if (state.productReviews[productId]) {
          const pIndex = state.productReviews[productId].findIndex(r => r.id === action.payload.id);
          if (pIndex !== -1) {
            state.productReviews[productId][pIndex] = action.payload;
          }
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })

      // Delete review
      .addCase(deleteReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myReviews = state.myReviews.filter(r => r.id !== action.payload);
        // Remove from product reviews if cached
        Object.keys(state.productReviews).forEach(productId => {
          state.productReviews[productId] = state.productReviews[productId].filter(
            r => r.id !== action.payload
          );
        });
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearProductReviews } = reviewSlice.actions;
export default reviewSlice.reducer;

// Selectors
export const selectProductReviews = (productId) => (state) =>
  state.reviews.productReviews[productId] || [];
export const selectMyReviews = (state) => state.reviews.myReviews;
export const selectReviewsLoading = (state) => state.reviews.isLoading;
export const selectReviewsSubmitting = (state) => state.reviews.isSubmitting;
export const selectReviewsError = (state) => state.reviews.error;
