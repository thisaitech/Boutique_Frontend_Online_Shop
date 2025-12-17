import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// Async Thunks

// Request OTP for phone-based login (with optional name for signup)
export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async ({ phone, name }, { rejectWithValue }) => {
    try {
      const payload = { phone };
      if (name) payload.name = name; // Include name for new users
      const response = await api.post('/user/request-otp', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Register new user with phone + OTP
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/register', userData);
      // Backend returns { success, message, data: { user, accessToken, refreshToken } }
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens only
      localStorage.setItem('thisai_accessToken', accessToken);
      localStorage.setItem('thisai_refreshToken', refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Verify OTP and login
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/verify-otp', { phone, otp });
      // Backend returns { success, message, data: { user, accessToken, refreshToken } }
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens only
      localStorage.setItem('thisai_accessToken', accessToken);
      localStorage.setItem('thisai_refreshToken', refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Admin login (username/password based from siteconfigs)
export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      console.log('🔐 [authSlice] Calling /auth/admin-login with username:', username)
      const response = await api.post('/auth/admin-login', { username, password });
      console.log('✅ [authSlice] Admin login response received:', response.data)
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens only
      localStorage.setItem('thisai_accessToken', accessToken);
      localStorage.setItem('thisai_refreshToken', refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error) {
      console.error('❌ [authSlice] Admin login error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      })
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/user/logout');
    } catch (error) {
      // Continue with logout even if API fails
      console.error('Logout API error:', error);
    } finally {
      // Clear tokens regardless of API result
      localStorage.removeItem('thisai_accessToken');
      localStorage.removeItem('thisai_refreshToken');
    }
    return null;
  }
);

// Refresh access token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const storedRefreshToken = localStorage.getItem('thisai_refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/user/refresh-token', {
        refreshToken: storedRefreshToken,
      });

      // Backend returns { success, message, data: { user, accessToken, refreshToken } }
      const { user, accessToken, refreshToken: newRefreshToken } = response.data.data;

      // Store new tokens
      localStorage.setItem('thisai_accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('thisai_refreshToken', newRefreshToken);
      }

      return { user, accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('thisai_accessToken');
      localStorage.removeItem('thisai_refreshToken');
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initialize auth - validate existing tokens or refresh if expired
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      const storedAccessToken = localStorage.getItem('thisai_accessToken');
      const storedRefreshToken = localStorage.getItem('thisai_refreshToken');

      // No tokens stored - user is not logged in
      if (!storedAccessToken && !storedRefreshToken) {
        return { user: null, accessToken: null, refreshToken: null };
      }

      // Try to get profile to validate the access token
      // The axios interceptor will automatically refresh if 401
      try {
        const response = await api.get('/user/profile');
        const user = response.data.data || response.data;

        return {
          user,
          accessToken: localStorage.getItem('thisai_accessToken'),
          refreshToken: localStorage.getItem('thisai_refreshToken'),
        };
      } catch (profileError) {
        // If profile fetch fails even after token refresh (handled by interceptor),
        // the tokens are invalid - clear them
        console.log('Profile fetch failed, clearing auth state');
        localStorage.removeItem('thisai_accessToken');
        localStorage.removeItem('thisai_refreshToken');
        return { user: null, accessToken: null, refreshToken: null };
      }
    } catch (error) {
      // Clear tokens on any error
      localStorage.removeItem('thisai_accessToken');
      localStorage.removeItem('thisai_refreshToken');
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Initialize auth state - tokens only from localStorage
const getInitialState = () => {
  const accessToken = localStorage.getItem('thisai_accessToken');
  const refreshToken = localStorage.getItem('thisai_refreshToken');

  return {
    user: null, // User data will be fetched from backend via initializeAuth
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
    isLoading: false,
    otpSent: false,
    otpPhone: null,
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOtpState: (state) => {
      state.otpSent = false;
      state.otpPhone = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Request OTP
      .addCase(requestOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.otpPhone = action.meta.arg;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.otpSent = false;
        state.otpPhone = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Verify OTP (Login)
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.otpSent = false;
        state.otpPhone = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Admin Login
      .addCase(adminLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.otpSent = false;
        state.otpPhone = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        // Still clear state even if API failed
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })

      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })

      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearOtpState, setUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.accessToken;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRefreshToken = (state) => state.auth.refreshToken;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectOtpSent = (state) => state.auth.otpSent;
export const selectOtpPhone = (state) => state.auth.otpPhone;
