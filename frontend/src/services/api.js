// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL : '/api',
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;