import { apiClient, BASE_URL } from '../config/api';

class UploadService {
  /**
   * Upload recipe image to MinIO
   * @param {File} file - Image file to upload
   * @returns {Promise}
   */
  async uploadImage(file) {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: .jpg, .jpeg, .png, .webp');
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      // Upload to server via shared apiClient so baseURL and interceptors are consistent
      // Note: apiClient's default Content-Type is application/json, so override per-request
      // Log start of upload for debugging
      // eslint-disable-next-line no-console
      console.log('[upload] start upload to', BASE_URL ? `${BASE_URL}/api/v1/upload` : '/api/v1/upload');

      const response = await apiClient.post('/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for upload
      });

      // apiClient interceptor returns response.data already
      // eslint-disable-next-line no-console
      console.log('[upload] upload success', response);
      return response;
    } catch (error) {
      // Log error for debugging and rethrow a normalized error object
      // eslint-disable-next-line no-console
      console.error('[upload] upload error', error);
      // Normalize common axios/network error shapes
      if (!error || !error.message) {
        throw { message: 'Unknown upload error', original: error };
      }
      throw { message: error.message || 'Upload failed', original: error };
    }
  }
}

export default new UploadService();