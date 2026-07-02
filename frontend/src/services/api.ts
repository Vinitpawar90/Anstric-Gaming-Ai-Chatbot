import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Use a flag to prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    // Call refresh endpoint
                    // We use a new axios instance or fetch to avoid interceptor loop, 
                    // though since this is 401 handler, as long as refresh endpoint doesn't return 401 it keeps going.
                    // But safe to use axios directly or fetch.
                    const response = await axios.post(`${API_BASE_URL}/users/refresh`, {
                        refreshToken
                    });

                    const { accessToken } = response.data.data; // Assuming response structure { data: { accessToken: ... } }

                    if (accessToken) {
                        localStorage.setItem('token', accessToken);

                        // Update header for original request
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                        // Update default headers for future requests
                        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                        return api(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
            }

            // Token expired or invalid and refresh failed - logout user
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/signin';
        }
        return Promise.reject(error);
    }
);

export default api;
