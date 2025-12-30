const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage
    const auth = localStorage.getItem('jansamadhan_auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        this.token = parsed.token || null;
      } catch (e) {
        // Invalid auth data
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
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
  }) {
    return this.request<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Grievance endpoints
  async createGrievance(data: {
    title: string;
    description: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    ward?: string;
    fileIds?: string[];
  }) {
    return this.request<{
      grievance: any;
      aiAnalysis: {
        categorization: {
          category: string;
          department: string;
          severity: number;
          priorityScore: number;
        };
        translation: {
          detectedLanguage: string;
          wasTranslated: boolean;
        };
        duplicates: {
          isDuplicate: boolean;
          similarCount: number;
          similarGrievances: Array<{
            id: string;
            title: string;
            similarity: number;
            status: string;
          }>;
        };
        autoResponse: {
          acknowledgment: string;
          expectedResolutionDays: number;
          nextSteps: string[];
          trackingInfo: string;
        };
        imageAnalysis: {
          description: string;
          detectedIssues: string[];
          severityFromImage: number;
          suggestedCategory: string;
          confidence: number;
          landmarks: string[];
        } | null;
        aiAnalysisHash: string;
      };
    }>('/grievances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGrievances(params?: {
    status?: string;
    category?: string;
    ward?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<{ grievances: any[]; pagination: any }>(
      `/grievances${queryString ? `?${queryString}` : ''}`
    );
  }

  async getGrievance(id: string) {
    return this.request<{ grievance: any }>(`/grievances/${id}`);
  }

  async updateGrievance(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
  }) {
    return this.request<{ grievance: any }>(`/grievances/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async upvoteGrievance(id: string) {
    return this.request<{ upvoted: boolean }>(`/grievances/${id}/upvote`, {
      method: 'POST',
    });
  }

  async getCommunityFeed(params?: {
    status?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<{ grievances: any[]; pagination: any }>(
      `/grievances/community${queryString ? `?${queryString}` : ''}`
    );
  }

  async getMyGrievances(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<{ grievances: any[]; pagination: any }>(
      `/grievances/my${queryString ? `?${queryString}` : ''}`
    );
  }

  // Authority endpoints
  async getDashboard(ward?: string) {
    const query = ward ? `?ward=${ward}` : '';
    return this.request<{
      stats: any;
      grievances: any[];
      categoryStats: any[];
    }>(`/authority/dashboard${query}`);
  }

  async acknowledgeGrievance(id: string) {
    return this.request<{ grievance: any }>(
      `/authority/grievances/${id}/acknowledge`,
      { method: 'POST' }
    );
  }

  async updateGrievanceStatus(id: string, status: string, message?: string) {
    return this.request<{ grievance: any }>(
      `/authority/grievances/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, message }),
      }
    );
  }

  async assignGrievance(id: string, assignedToId: string) {
    return this.request<{ grievance: any }>(
      `/authority/grievances/${id}/assign`,
      {
        method: 'POST',
        body: JSON.stringify({ assignedToId }),
      }
    );
  }

  async reassignGrievance(id: string, assignedToId: string, reason?: string) {
    return this.request<{
      grievance: any;
      reassignment: {
        from: string;
        to: string;
        by: string;
        reason: string | null;
      };
    }>(
      `/authority/grievances/${id}/reassign`,
      {
        method: 'POST',
        body: JSON.stringify({ assignedToId, reason }),
      }
    );
  }

  async getAnalytics(params?: {
    ward?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<any>(`/authority/analytics${queryString ? `?${queryString}` : ''}`);
  }

  // File endpoints
  async uploadFile(file: File, grievanceId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (grievanceId) {
      formData.append('grievanceId', grievanceId);
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  getFileUrl(fileId: string) {
    return `${this.baseURL.replace('/api', '')}/files/${fileId}`;
  }

  // User endpoints
  async getProfile() {
    return this.request<{ user: any; stats?: { reported: number; resolved: number; upvotes: number } }>('/users/profile');
  }

  async updateProfile(data: {
    name?: string;
    phone?: string;
    address?: string;
    department?: string;
    position?: string;
    password?: string;
  }) {
    return this.request<{ user: any }>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Notification endpoints
  async getNotifications(params?: {
    read?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<{
      notifications: any[];
      pagination: any;
      unreadCount: number;
    }>(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<{ message: string }>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async deleteNotification(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Blockchain endpoints
  async verifyGrievance(id: string) {
    return this.request<{
      verified: boolean;
      hash?: string;
      txHash?: string;
      contractAddress?: string;
      message?: string;
    }>(`/blockchain/verify-grievance/${id}`, {
      method: 'POST',
    });
  }

  async getGrievanceHistory(id: string) {
    return this.request<{
      onChainHistory: any[];
      dbHistory: any[];
    }>(`/blockchain/grievance/${id}/history`);
  }

  async getContractAddress() {
    return this.request<{
      contractAddress: string | null;
      network: string;
      available: boolean;
    }>('/blockchain/contract-address');
  }

  // Priority endpoints
  async recalculateAllPriorities() {
    return this.request<{
      message: string;
      updated: number;
      errors: number;
    }>('/priority/recalculate-all', {
      method: 'POST',
    });
  }

  async recalculateGrievancePriority(id: string) {
    return this.request<{
      grievanceId: string;
      newPriorityScore: number;
    }>(`/priority/recalculate/${id}`, {
      method: 'POST',
    });
  }

  async getPriorityBreakdown(id: string) {
    return this.request<{
      totalScore: number;
      severityScore: number;
      upvoteScore: number;
      timeScore: number;
      categoryScore: number;
      urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
    }>(`/priority/${id}/breakdown`);
  }

  async getGrievancesByPriority(options?: {
    department?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<{ grievances: any[] }>(`/priority/grievances${queryString ? `?${queryString}` : ''}`);
  }

  // Department endpoints
  async getDepartments() {
    return this.request<{
      departments: Array<{
        id: string;
        code: string;
        name: string;
        category: string;
        description: string | null;
      }>;
    }>('/departments');
  }

  async getDepartment(id: string) {
    return this.request<{
      department: {
        id: string;
        code: string;
        name: string;
        category: string;
        description: string | null;
        authorities: Array<{
          id: string;
          name: string;
          email: string;
          authorityLevel: string;
          position: string | null;
        }>;
        _count: { grievances: number };
      };
    }>(`/departments/${id}`);
  }

  async getDepartmentAuthorities(departmentId: string) {
    return this.request<{
      authorities: Array<{
        id: string;
        name: string;
        email: string;
        authorityLevel: string;
        position: string | null;
      }>;
    }>(`/departments/${departmentId}/authorities`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

