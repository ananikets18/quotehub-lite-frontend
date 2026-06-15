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

export interface FetchQuotesParams {
  page?: number;
  search?: string;
  category?: number;
  tag?: number;
}

export const fetchQuotes = async (params: FetchQuotesParams = {}) => {
  const { page = 1, search, category, tag } = params;
  const queryParams = new URLSearchParams({ page: String(page) });
  if (search) queryParams.append('search', search);
  if (category) queryParams.append('category', String(category));
  if (tag) queryParams.append('tag', String(tag));

  const response = await api.get(`/quotes?${queryParams.toString()}`);
  return response.data;
};

export const fetchQuote = async (id: number) => {
  const response = await api.get(`/quotes/${id}`);
  return response.data;
};

export const submitQuote = async (data: { content: string; author?: string; source?: string; categories?: number[]; tags?: number[] }) => {
  const response = await api.post('/quotes', data);
  return response.data;
};

export const updateQuote = async (id: number, data: { content: string; author?: string; source?: string; categories?: number[]; tags?: number[] }) => {
  const response = await api.put(`/quotes/${id}`, data);
  return response.data;
};

export const deleteQuote = async (id: number) => {
  await api.delete(`/quotes/${id}`);
};

// Admin Operations
export const getAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const adminDeleteUser = async (id: number) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const adminDeleteQuote = async (id: number) => {
  const response = await api.delete(`/admin/quotes/${id}`);
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

export const fetchTags = async () => {
  const response = await api.get('/tags');
  return response.data;
};

export const fetchSavedQuotes = async (page = 1) => {
  const response = await api.get(`/account/saved?page=${page}`);
  return response.data;
};

export const fetchLikedQuotes = async (page = 1) => {
  const response = await api.get(`/account/liked?page=${page}`);
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

export interface User {
  id: number;
  email: string;
  fullName: string;
  username: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
}

export interface NotificationType {
  id: number;
  type: string;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export const fetchNotifications = async (page = 1) => {
  const response = await api.get(`/notifications?page=${page}`);
  return response.data;
};

export const markNotificationsRead = async () => {
  const response = await api.put('/notifications/read');
  return response.data;
};

export const submitOnboarding = async (data: { username?: string; bio?: string }) => {
  const response = await api.post('/account/onboard', data);
  return response.data;
};

export const fetchAnalytics = async () => {
  const response = await api.get('/account/analytics');
  return response.data;
};

export const fetchUserProfile = async (id: number) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const fetchUserQuotes = async (id: number, page = 1) => {
  const response = await api.get(`/users/${id}/quotes?page=${page}`);
  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await api.post('/auth/reset-password', { token, password });
  return response.data;
};
