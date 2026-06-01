import axios, { AxiosError } from 'axios';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  Event,
  Ticket,
  CreateEventInput,
  User,
} from '@/types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error(response.data.message || 'Request failed');
  }
  return response.data.data as T;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return unwrap(response);
  },
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    return unwrap(response);
  },
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return unwrap(response);
  },
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/users/me', {
      fullName: data.name,
      phone: undefined,
    });
    return unwrap(response) as unknown as User;
  },
};

export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<ApiResponse<Event[]>>('/events');
    return unwrap(response);
  },
  getById: async (id: string): Promise<Event> => {
    const response = await api.get<ApiResponse<Event>>(`/events/${id}`);
    return unwrap(response);
  },
  create: async (
    data: CreateEventInput & { categoryId: number }
  ): Promise<Event> => {
    const response = await api.post<ApiResponse<Event>>('/events', {
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      location: data.location,
      capacity: Number(data.capacity),
      price: 0,
      category_id: data.categoryId,
    });
    return unwrap(response);
  },
  update: async (id: string, data: Partial<CreateEventInput>): Promise<Event> => {
    const response = await api.put<ApiResponse<Event>>(`/events/${id}`, {
      title: data.title,
      description: data.description,
      location: data.location,
      capacity: data.capacity,
    });
    return unwrap(response);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
  toggleFavorite: async (id: string): Promise<Event> => {
    const response = await api.post<ApiResponse<Event>>(`/events/${id}/favorite`);
    return unwrap(response);
  },
  getFavorites: async (): Promise<Event[]> => {
    const response = await api.get<ApiResponse<Event[]>>('/events/favorites');
    return unwrap(response);
  },
};

export const ticketsApi = {
  purchase: async (eventId: string): Promise<Ticket> => {
    const response = await api.post<ApiResponse<Ticket>>('/tickets/purchase', {
      eventId,
      quantity: 1,
    });
    return unwrap(response);
  },
  getByUser: async (): Promise<Ticket[]> => {
    const response = await api.get<ApiResponse<Ticket[]>>('/tickets/me');
    return unwrap(response);
  },
  getById: async (id: string): Promise<Ticket> => {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return unwrap(response);
  },
  cancel: async (id: string): Promise<void> => {
    await api.put(`/tickets/${id}/cancel`);
  },
};

export const categoriesApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<unknown[]>>('/categories');
    return unwrap(response);
  },
};

export const adminApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<unknown>>('/admin/dashboard');
    return unwrap(response);
  },
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<
      ApiResponse<
        Array<{
          id: number;
          name: string;
          email: string;
          role: string;
          created_at?: string;
        }>
      >
    >('/users');
    const rows = unwrap(response);
    return rows.map((u) => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role as User['role'],
      createdAt: u.created_at ?? new Date().toISOString(),
    }));
  },
  getAllEvents: async (): Promise<Event[]> => {
    const response = await api.get<ApiResponse<Event[]>>('/events?status=all');
    return unwrap(response);
  },
  getAllTickets: async (): Promise<Ticket[]> => {
    const response = await api.get<ApiResponse<Ticket[]>>('/tickets/admin/all');
    return unwrap(response);
  },
};

export default api;
