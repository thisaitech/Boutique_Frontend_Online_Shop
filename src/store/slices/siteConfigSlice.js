import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// Async Thunks

// Fetch public site configuration
export const fetchPublicConfig = createAsyncThunk(
  'siteConfig/fetchPublic',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/site-config/public');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch promo cards
export const fetchPromoCards = createAsyncThunk(
  'siteConfig/fetchPromoCards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/site-config/promo-cards');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch banners
export const fetchBanners = createAsyncThunk(
  'siteConfig/fetchBanners',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/site-config/banners');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch delivery settings
export const fetchDeliverySettings = createAsyncThunk(
  'siteConfig/fetchDeliverySettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/site-config/delivery');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Empty config - only show data from database
const emptyConfig = {
  flashSaleText: '',
  sectionTitles: {},
  carouselSettings: {},
  productSizes: {},
  deliverySettings: {},
  trustBadges: [],
  bannerImages: [],
  promoCards: {},
  parallaxCategories: [],
  contactPhone: '',
  contactEmail: '',
  contactAddress: '',
  socialLinks: {},
  aboutPageContent: {},
  contactPageContent: {},
  servicePageContent: {},
  limitedTimeOffer: {},
};

const initialState = {
  config: emptyConfig,
  isLoading: false,
  error: null,
  lastFetched: null,
};

const siteConfigSlice = createSlice({
  name: 'siteConfig',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setConfig: (state, action) => {
      state.config = { ...state.config, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch public config
      .addCase(fetchPublicConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('Fetched site config:', action.payload);
        state.config = { ...emptyConfig, ...action.payload };
        state.lastFetched = Date.now();
      })
      .addCase(fetchPublicConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch promo cards
      .addCase(fetchPromoCards.fulfilled, (state, action) => {
        state.config.promoCards = action.payload || {};
      })

      // Fetch banners
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.config.bannerImages = Array.isArray(action.payload) ? action.payload : [];
      })

      // Fetch delivery settings
      .addCase(fetchDeliverySettings.fulfilled, (state, action) => {
        state.config.deliverySettings = action.payload || {};
      });
  },
});

export const { clearError, setConfig } = siteConfigSlice.actions;
export default siteConfigSlice.reducer;

// Selectors
export const selectSiteConfig = (state) => state.siteConfig.config;
export const selectConfigLoading = (state) => state.siteConfig.isLoading;
export const selectConfigError = (state) => state.siteConfig.error;
export const selectFlashSaleText = (state) => state.siteConfig.config.flashSaleText;
export const selectSectionTitles = (state) => state.siteConfig.config.sectionTitles;
export const selectCarouselSettings = (state) => state.siteConfig.config.carouselSettings;
export const selectProductSizes = (state) => state.siteConfig.config.productSizes;
export const selectDeliverySettings = (state) => state.siteConfig.config.deliverySettings;
export const selectTrustBadges = (state) => state.siteConfig.config.trustBadges;
export const selectBannerImages = (state) => state.siteConfig.config.bannerImages;
export const selectPromoCards = (state) => state.siteConfig.config.promoCards;
export const selectParallaxCategories = (state) => state.siteConfig.config.parallaxCategories;
export const selectContactInfo = (state) => ({
  phone: state.siteConfig.config.contactPhone,
  email: state.siteConfig.config.contactEmail,
  address: state.siteConfig.config.contactAddress,
});
export const selectSocialLinks = (state) => state.siteConfig.config.socialLinks;
export const selectAboutPageContent = (state) => state.siteConfig.config.aboutPageContent;
export const selectContactPageContent = (state) => state.siteConfig.config.contactPageContent;
export const selectServicePageContent = (state) => state.siteConfig.config.servicePageContent;
export const selectSiteConfigLoading = (state) => state.siteConfig.isLoading;
export const selectSiteConfigError = (state) => state.siteConfig.error;
