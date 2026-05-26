export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  category: string;
  price: number;
  capacity: number;
  availableTickets: number;
  organizerId: string;
  organizer?: User;
  isFavorite?: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  event?: Event;
  userId: string;
  user?: User;
  purchaseDate: string;
  status: 'active' | 'used' | 'cancelled';
  qrCode: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  category: string;
  price: number;
  capacity: number;
}
