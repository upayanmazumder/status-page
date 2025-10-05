import axios from 'axios';

const baseURL =
  process.env.NEXT_PUBLIC_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://api.status-page.upayan.dev';

const instance = axios.create({
  baseURL,
  withCredentials: true,
});

instance.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export { baseURL };
export default instance;
