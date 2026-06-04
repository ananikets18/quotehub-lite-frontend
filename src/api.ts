import axios from 'axios';

type AuthUser = {
  id: number;
  name: string;
  email?: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

const API_URL = import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? 'http://localhost:3333/api/v1' : '');

if (!API_URL) {
  throw new Error('VITE_API_URL is required in production.');
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to append the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchQuotes = async (page = 1) => {
  const response = await api.get(`/quotes?page=${page}`);
  return response.data;
};

export const fetchQuote = async (id: number) => {
  const response = await api.get(`/quotes/${id}`);
  return response.data;
};

export const submitQuote = async (data: { content: string; author?: string; source?: string }) => {
  const response = await api.post('/quotes', data);
  return response.data;
};

export const deleteQuote = async (id: number) => {
  const response = await api.delete(`/quotes/${id}`);
  return response.data;
};

export const toggleLike = async (id: number): Promise<{ liked: boolean; count: number }> => {
  const response = await api.post(`/quotes/${id}/like`);
  return response.data;
};

export const toggleSave = async (id: number): Promise<{ saved: boolean; count: number }> => {
  const response = await api.post(`/quotes/${id}/save`);
  return response.data;
};

export const fetchCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const login = async (data: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data.data;
};

export const signup = async (data: SignupPayload): Promise<AuthResponse> => {
  const response = await api.post('/auth/signup', data);
  return response.data.data;
};

export const logout = async () => {
  const response = await api.post('/account/logout');
  return response.data;
};

