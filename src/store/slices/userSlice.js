import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// Async Thunks

// Fetch user profile
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/profile');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update user profile
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/profile', profileData);
      const data = response.data.data || response.data;
      return data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch addresses
export const fetchAddresses = createAsyncThunk(
  'user/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/addresses');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Add new address
export const addAddress = createAsyncThunk(
  'user/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      console.log('[userSlice] Adding address, data:', addressData);
      const response = await api.post('/user/addresses', addressData);
      console.log('[userSlice] Add address response:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('[userSlice] Add address error:', error.response?.data || error.message);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update address
export const updateAddress = createAsyncThunk(
  'user/updateAddress',
  async ({ addressId, addressData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/user/addresses/${addressId}`, addressData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Delete address
export const deleteAddress = createAsyncThunk(
  'user/deleteAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/user/addresses/${addressId}`);
      // Return the updated addresses array if available, otherwise return the addressId
      return response.data.data || addressId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Set default address
export const setDefaultAddress = createAsyncThunk(
  'user/setDefaultAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/user/addresses/${addressId}/default`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const initialState = {
  profile: null,
  addresses: [],
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    clearUserData: (state) => {
      state.profile = null;
      state.addresses = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch addresses
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add address
      .addCase(addAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns full array of addresses
        if (Array.isArray(action.payload)) {
          state.addresses = action.payload;
        } else if (action.payload.addresses) {
          state.addresses = action.payload.addresses;
        } else {
          state.addresses.push(action.payload);
        }
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update address
      .addCase(updateAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns full array of addresses
        if (Array.isArray(action.payload)) {
          state.addresses = action.payload;
        } else if (action.payload.addresses) {
          state.addresses = action.payload.addresses;
        } else {
          const index = state.addresses.findIndex(a => a.id === action.payload.id || a._id === action.payload._id);
          if (index !== -1) {
            state.addresses[index] = action.payload;
          }
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete address
      .addCase(deleteAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns full array of addresses
        if (Array.isArray(action.payload)) {
          state.addresses = action.payload;
        } else {
          // Fallback: filter by addressId
          state.addresses = state.addresses.filter(a => (a.id !== action.payload && a._id !== action.payload));
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Set default address
      .addCase(setDefaultAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns full array of addresses
        if (Array.isArray(action.payload)) {
          state.addresses = action.payload;
        } else if (action.payload.addresses) {
          state.addresses = action.payload.addresses;
        } else {
          // Mark all as not default, then set the one as default
          state.addresses.forEach(a => {
            a.isDefault = (a.id === action.meta.arg || a._id === action.meta.arg);
          });
        }
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setProfile, clearUserData } = userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectProfile = (state) => state.user.profile;
export const selectAddresses = (state) => state.user.addresses;
export const selectDefaultAddress = (state) =>
  state.user.addresses.find(a => a.isDefault) || state.user.addresses[0];
export const selectUserLoading = (state) => state.user.isLoading;
export const selectUserError = (state) => state.user.error;
