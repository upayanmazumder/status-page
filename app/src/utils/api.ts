import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_ENV === "production"
    ? "https://api.status-page.upayan.dev"
    : "http://localhost:5000";

const instance = axios.create({
  baseURL,
});

instance.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
