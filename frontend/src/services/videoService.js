import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
);

export const videoService = {
  // Upload a video file
  uploadVideo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response;
  },

  // Get all jobs
  getJobs: async () => {
    const response = await api.get('/jobs');
    return response;
  },

  // Get job status
  getJobStatus: async (jobId) => {
    const response = await api.get(`/status/${jobId}`);
    return response;
  },

  // Download processed video
  downloadVideo: async (jobId) => {
    const response = await api.get(`/download/${jobId}`);
    return response;
  },

  // Get video thumbnail
  getThumbnail: async (jobId) => {
    const response = await api.get(`/thumbnail/${jobId}`);
    return response;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response;
  },
};

export default api;
