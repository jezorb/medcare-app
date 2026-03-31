import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/' : 'http://localhost:5000');

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  },
);
