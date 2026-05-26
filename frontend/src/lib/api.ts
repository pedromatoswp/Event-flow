import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterCredentials, Event, Ticket, CreateEventInput, User } from '@/types';

const API_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get('/events');
    return response.data;
  },
  getById: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  create: async (data: CreateEventInput): Promise<Event> => {
    const response = await api.post('/events', data);
    return response.data;
  },
  update: async (id: string, data: Partial<CreateEventInput>): Promise<Event> => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
  toggleFavorite: async (id: string): Promise<Event> => {
    const response = await api.post(`/events/${id}/favorite`);
    return response.data;
  },
  getFavorites: async (): Promise<Event[]> => {
    const response = await api.get('/events/favorites');
    return response.data;
  },
};

export const ticketsApi = {
  purchase: async (eventId: string): Promise<Ticket> => {
    const response = await api.post('/tickets/purchase', { eventId });
    return response.data;
  },
  getByUser: async (): Promise<Ticket[]> => {
    const response = await api.get('/tickets');
    return response.data;
  },
  getById: async (id: string): Promise<Ticket> => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },
  cancel: async (id: string): Promise<void> => {
    await api.put(`/tickets/${id}/cancel`);
  },
};

export const adminApi = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  getAllEvents: async (): Promise<Event[]> => {
    const response = await api.get('/admin/events');
    return response.data;
  },
  getAllTickets: async (): Promise<Ticket[]> => {
    const response = await api.get('/admin/tickets');
    return response.data;
  },
};

export default api;
