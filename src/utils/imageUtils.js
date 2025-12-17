import axios from 'axios';

/**
 * AWS S3 Configuration from environment
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Allowed image formats
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return { 
      valid: false, 
      error: `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()} files are allowed.` 
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: `Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()} files are allowed.` 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
    };
  }

  return { valid: true };
};

/**
 * Generate unique filename with UUID
 */
const generateUniqueFileName = (originalName) => {
  const ext = originalName.split('.').pop();
  const uuid = crypto.randomUUID();
  return `${uuid}.${ext}`;
};

/**
 * Get the proper image source for display
 * Handles S3 URLs, system paths, URLs, relative paths, and base64
 * @param {string} imagePath - The image path or base64 data
 * @returns {string} - The properly formatted image source
 */
export const getImageSrc = (imagePath) => {
  if (!imagePath) {
    return '/images/product-img-1.jpg'; // fallback image
  }

  // If it's already a data URL (base64), return as-is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // If it's a blob URL, return as-is
  if (imagePath.startsWith('blob:')) {
    return imagePath;
  }

  // If it's an S3 URL, return as-is
  if (imagePath.includes('s3.') && imagePath.includes('amazonaws.com')) {
    return imagePath;
  }

  // If it's an HTTP(S) URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a Windows system path (C:/, D:/, etc.), extract the web path
  if (/^[A-Za-z]:[\/\\]/.test(imagePath)) {
    const normalizedPath = imagePath.replace(/\\/g, '/');
    const match = normalizedPath.match(/(?:public\/)?images\/(.+)$/i);
    if (match) {
      const encodedPath = match[1].split('/').map(segment => encodeURIComponent(segment)).join('/');
      return `/images/${encodedPath}`;
    }
    return '/images/product-img-1.jpg';
  }

  // If it's an absolute path starting with /, encode spaces if needed
  if (imagePath.startsWith('/')) {
    if (imagePath.includes(' ')) {
      const parts = imagePath.split('/');
      return parts.map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/');
    }
    return imagePath;
  }

  // Otherwise, assume it's a relative path and prepend /
  if (imagePath.includes(' ')) {
    return `/${encodeURIComponent(imagePath)}`;
  }
  return `/${imagePath}`;
};

/**
 * Check if an image path is a base64 data URL
 */
export const isBase64Image = (imagePath) => {
  return imagePath && imagePath.startsWith('data:');
};

/**
 * Check if an image URL is from S3
 */
export const isS3Image = (imagePath) => {
  return imagePath && (
    imagePath.includes('s3.ap-south-1.amazonaws.com') || 
    imagePath.includes('thisai-e-commerce-2025')
  );
};

/**
 * Upload image to S3 using presigned URL from backend
 * Flow: Frontend → Backend (get presigned URL) → S3 (direct upload)
 * @param {File} file - The file to upload
 * @param {string} folder - The folder within boutique (e.g., 'products', 'sarees', 'kurtis')
 * @returns {Promise<{url: string, key: string}>} - The uploaded file info
 */
export const uploadImageToS3 = async (file, folder = 'products') => {
  // Validate file before uploading
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Step 1: Get presigned URL from backend
    console.log('Step 1: Getting presigned URL from backend...');
    const presignedResponse = await axios.post(`${API_URL}/upload/presigned-url`, {
      filename: file.name,
      folder: folder,
      contentType: file.type,
    });

    if (!presignedResponse.data.success) {
      throw new Error('Failed to get presigned URL');
    }

    const { uploadUrl, fileUrl, key } = presignedResponse.data.data;
    console.log('Got presigned URL, uploading to S3...');

    // Step 2: Upload directly to S3 using presigned URL
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });

    console.log('Image uploaded to S3:', fileUrl);
    return { url: fileUrl, key };

  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload image: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Upload multiple images to S3
 * @param {File[]} files - Array of files to upload
 * @param {string} folder - The folder within boutique
 * @returns {Promise<Array<{url: string, key: string}>>}
 */
export const uploadMultipleImagesToS3 = async (files, folder = 'products') => {
  const uploadPromises = files.map(file => uploadImageToS3(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete image from S3 via backend
 * @param {string} urlOrKey - The S3 URL or key to delete
 */
export const deleteImageFromS3 = async (urlOrKey) => {
  try {
    await axios.delete(`${API_URL}/upload/image`, {
      data: { url: urlOrKey }
    });
    console.log('Image deleted from S3:', urlOrKey);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Allowed video formats
 */
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Validate video file
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validateVideoFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type. Only ${ALLOWED_VIDEO_EXTENSIONS.join(', ').toUpperCase()} files are allowed.`
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Only ${ALLOWED_VIDEO_EXTENSIONS.join(', ').toUpperCase()} files are allowed.`
    };
  }

  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB.`
    };
  }

  return { valid: true };
};

/**
 * Check if a URL is an S3 video
 */
export const isS3Video = (videoPath) => {
  return videoPath && (
    videoPath.includes('s3.ap-south-1.amazonaws.com') ||
    videoPath.includes('thisai-e-commerce-2025')
  );
};

/**
 * Upload video to S3 using presigned URL from backend
 * @param {File} file - The video file to upload
 * @param {string} folder - The folder within boutique (e.g., 'banner-videos')
 * @returns {Promise<{url: string, key: string}>} - The uploaded file info
 */
export const uploadVideoToS3 = async (file, folder = 'banner-videos') => {
  // Validate file before uploading
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Step 1: Get presigned URL from backend
    console.log('Step 1: Getting presigned URL for video from backend...');
    const presignedResponse = await axios.post(`${API_URL}/upload/presigned-url`, {
      filename: file.name,
      folder: folder,
      contentType: file.type,
    });

    if (!presignedResponse.data.success) {
      throw new Error('Failed to get presigned URL');
    }

    const { uploadUrl, fileUrl, key } = presignedResponse.data.data;
    console.log('Got presigned URL, uploading video to S3...');

    // Step 2: Upload directly to S3 using presigned URL
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      // Add progress tracking for large videos
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });

    console.log('Video uploaded to S3:', fileUrl);
    return { url: fileUrl, key };

  } catch (error) {
    console.error('Error uploading video to S3:', error);
    throw new Error(`Failed to upload video: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Delete video from S3 via backend (uses same endpoint as images)
 * @param {string} urlOrKey - The S3 URL or key to delete
 */
export const deleteVideoFromS3 = async (urlOrKey) => {
  try {
    await axios.delete(`${API_URL}/upload/image`, {
      data: { url: urlOrKey }
    });
    console.log('Video deleted from S3:', urlOrKey);
  } catch (error) {
    console.error('Error deleting video from S3:', error);
    throw new Error(`Failed to delete video: ${error.message}`);
  }
};
