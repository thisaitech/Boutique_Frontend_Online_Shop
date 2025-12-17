import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api/axiosConfig';

// Async Thunks

// Fetch all products
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/products', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch single product by ID
export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/products/${productId}`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch products by category
export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchByCategory',
  async (category, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/products/category/${category}`);
      return { category, products: response.data.data || response.data };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch featured products
export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/products/filter/featured');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch top selling products
export const fetchTopSellingProducts = createAsyncThunk(
  'products/fetchTopSelling',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/products/filter/top-selling');
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Helper function to normalize product data (convert _id to id)
const normalizeProduct = (product) => {
  if (!product) return product;
  return {
    ...product,
    id: product._id || product.id, // Use _id from MongoDB or existing id
  };
};

const normalizeProducts = (products) => {
  if (!Array.isArray(products)) return products;
  return products.map(normalizeProduct);
};

const initialState = {
  products: [],
  currentProduct: null,
  featured: [],
  topSelling: [],
  categoryProducts: {},
  isLoading: false,
  error: null,
  lastFetched: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = normalizeProducts(action.payload);
        state.lastFetched = Date.now();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch single product
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = normalizeProduct(action.payload);
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch by category
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryProducts[action.payload.category] = normalizeProducts(action.payload.products);
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch featured
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featured = normalizeProducts(action.payload);
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch top selling
      .addCase(fetchTopSellingProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTopSellingProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.topSelling = normalizeProducts(action.payload);
      })
      .addCase(fetchTopSellingProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProduct, clearError } = productSlice.actions;
export default productSlice.reducer;

// Selectors
export const selectAllProducts = (state) => state.products.products;
export const selectProducts = (state) => state.products.products; // Alias
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectFeaturedProducts = (state) => state.products.featured;
export const selectFeatured = (state) => state.products.featured; // Alias
export const selectTopSellingProducts = (state) => state.products.topSelling;
export const selectTopSelling = (state) => state.products.topSelling; // Alias
export const selectCategoryProducts = (category) => (state) =>
  state.products.categoryProducts[category] || [];
export const selectProductsLoading = (state) => state.products.isLoading;
export const selectProductsError = (state) => state.products.error;
