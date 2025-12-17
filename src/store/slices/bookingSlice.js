import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// Async Thunks

// Fetch service types (public)
export const fetchServiceTypes = createAsyncThunk(
  'bookings/fetchServiceTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/bookings/services');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch available slots for a date (public)
export const fetchAvailableSlots = createAsyncThunk(
  'bookings/fetchAvailableSlots',
  async (date, { rejectWithValue }) => {
    try {
      const response = await api.get(`/user/bookings/slots/${date}`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Create guest booking (no auth required)
export const createGuestBooking = createAsyncThunk(
  'bookings/createGuest',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/bookings/guest', bookingData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Create authenticated booking
export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/bookings', bookingData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch my bookings
export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/bookings');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Cancel my booking
export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async ({ bookingId, cancellationReason }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/user/bookings/${bookingId}`, {
        data: { cancellationReason },
      });
      return { bookingId, data: response.data.data || response.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const initialState = {
  serviceTypes: [],
  availableSlots: [],
  myBookings: [],
  currentBooking: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearAvailableSlots: (state) => {
      state.availableSlots = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch service types
      .addCase(fetchServiceTypes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceTypes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchServiceTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch available slots
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableSlots = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create guest booking
      .addCase(createGuestBooking.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createGuestBooking.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentBooking = action.payload;
      })
      .addCase(createGuestBooking.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })

      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentBooking = action.payload;
        state.myBookings.unshift(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })

      // Fetch my bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myBookings = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Cancel booking
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.myBookings.findIndex(b => b.id === action.payload.bookingId);
        if (index !== -1) {
          state.myBookings[index] = { ...state.myBookings[index], status: 'cancelled' };
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentBooking, clearAvailableSlots } = bookingSlice.actions;
export default bookingSlice.reducer;

// Selectors
export const selectServiceTypes = (state) => state.bookings.serviceTypes;
export const selectAvailableSlots = (state) => state.bookings.availableSlots;
export const selectMyBookings = (state) => state.bookings.myBookings;
export const selectCurrentBooking = (state) => state.bookings.currentBooking;
export const selectBookingsLoading = (state) => state.bookings.isLoading;
export const selectBookingsSubmitting = (state) => state.bookings.isSubmitting;
export const selectBookingsError = (state) => state.bookings.error;
