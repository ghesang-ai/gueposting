import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_URL = "https://dekat-api.vercel.app/api/v1";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
