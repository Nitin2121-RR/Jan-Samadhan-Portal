import { apiClient } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'authority';
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('jansamadhan_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.currentUser = parsed.user;
        apiClient.setToken(parsed.token);
      } catch (e) {
        // Invalid data, clear it
        localStorage.removeItem('jansamadhan_auth');
      }
    }
  }

  async signup(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: 'citizen' | 'authority';
    address?: string;
    department?: string;
    position?: string;
    departmentId?: string;
    authorityLevel?: 'director' | 'nodal_officer' | 'gro' | 'field_officer';
  }): Promise<AuthResponse> {
    const response = await apiClient.signup(data);
    this.setAuth(response.user, response.token);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.login(email, password);
    this.setAuth(response.user, response.token);
    return response;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const response = await apiClient.getMe();
      this.currentUser = response.user;
      return response.user;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  private setAuth(user: AuthUser, token: string) {
    this.currentUser = user;
    apiClient.setToken(token);
    localStorage.setItem('jansamadhan_auth', JSON.stringify({ user, token }));
  }

  logout() {
    this.currentUser = null;
    apiClient.setToken(null);
    localStorage.removeItem('jansamadhan_auth');
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUserSync(): AuthUser | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();


