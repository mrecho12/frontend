import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { DDMSResponse } from '@/types';
import toast from 'react-hot-toast';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'https://backend-production-a53c.up.railway.app',
      headers: {
      'Content-Type': 'application/json'
    }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const { token, currentStore } = useAuthStore.getState();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (currentStore) {
          config.headers['X-Store-ID'] = currentStore.id;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<DDMSResponse>) => {
        const { DDMS_status, DDMS_login_status, DDMS_error_code } = response.data;

        // Don't process authentication responses for public endpoints
        const authEndpoints = ['/auth/send-otp', '/auth/login', '/auth/refresh', '/auth/logout'];
        const isAuthEndpoint = authEndpoints.some(endpoint => response.config.url?.includes(endpoint));

        // For auth endpoints, just return the response
        if (isAuthEndpoint) {
          return response;
        }

        // Handle authentication status - but only for success responses (not 401)
        // 401 errors are handled in the error handler below
        if (response.status !== 401 && (DDMS_login_status === 'unauthenticated' || DDMS_login_status === 'expired')) {
          // Call logout action to properly clear state through persist middleware
          useAuthStore.getState().logout();
          return Promise.reject(new Error('Authentication required'));
        }

        // Handle error status
        if (DDMS_status === 'error') {
          const errorMessage = DDMS_error_code || 'An error occurred';
          return Promise.reject(new Error(errorMessage));
        }

        return response;
      },
      async (error) => {
        // If it's a refresh request that failed
        if (error.config?.url?.includes('/auth/refresh')) {
          useAuthStore.getState().logout();
          return Promise.reject(new Error('Session expired. Please login again.'));
        }

        // If already retried, logout
        if (error.config?._retry) {
          useAuthStore.getState().logout();
          return Promise.reject(new Error('Session expired. Please login again.'));
        }

        if (error.response?.status === 401) {
          // Check if we have a refresh token
          const { refreshToken, isAuthenticated } = useAuthStore.getState();

          if (!isAuthenticated || !refreshToken) {
            useAuthStore.getState().logout();
            return Promise.reject(new Error('Authentication required'));
          }

          // Mark this request as a retry
          error.config._retry = true;

          try {
            // Attempt to refresh the token using raw axios to bypass interceptors
            const response = await axios.post<DDMSResponse>(
              `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.DDMS_status === 'success' && response.data.DDMS_data) {
              const { token: newToken, refreshToken: newRefreshToken } = response.data.DDMS_data;

              // Update tokens in store
              const { user } = useAuthStore.getState();
              if (user && newToken) {
                useAuthStore.getState().setAuth(user, newToken, newRefreshToken || refreshToken);

                // Retry the original request with new token
                return this.api.request(error.config);
              }
            }

            throw new Error('Token refresh failed');
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            useAuthStore.getState().logout();
            return Promise.reject(new Error('Session expired. Please login again.'));
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(mobile: string, password?: string, otp?: string, newPassword?: string) {
    const response = await this.api.post<DDMSResponse>('/auth/login', {
      mobile,
      password,
      otp,
      newPassword,
    });
    return response.data;
  }

  async sendOTP(mobile: string) {
  try {
     console.log('>>> sendOTP calling (full URL):', this.api.defaults.baseURL + '/auth/send-otp');
    const res = await this.api.post('/auth/send-otp', { mobile });
    return res.data;
  } catch (err: any) {
    throw err;
   }
};  


  async refreshAuthToken(refreshToken: string) {
    const response = await this.api.post<DDMSResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  async logout() {
    const response = await this.api.post<DDMSResponse>('/auth/logout');
    return response.data;
  }

  // Store Management
  async  getStores() {
    const response = await this.api.get<DDMSResponse>('/stores');
    return response.data;
  }

  async createStore(storeData: any) {
    const response = await this.api.post<DDMSResponse>('/stores', storeData);
    return response.data;
  }

  async updateStore(storeId: string, storeData: any) {
    const response = await this.api.put<DDMSResponse>(`/stores/${storeId}`, storeData);
    return response.data;
  }

  async createStoreWithAdmin(storeWithAdminData: any) {
    const response = await this.api.post<DDMSResponse>('/stores/with-admin', storeWithAdminData);
    return response.data;
  }

  // User Management
  async getUsers() {
    const response = await this.api.get<DDMSResponse>('/users');
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.api.post<DDMSResponse>('/users', userData);
    return response.data;
  }

  async updateUser(userId: string, userData: any) {
    const response = await this.api.put<DDMSResponse>(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.api.delete<DDMSResponse>(`/users/${userId}`);
    return response.data;
  }

  // Customer Management
  async getCustomers() {
    const response = await this.api.get<DDMSResponse>('/customers');
    return response.data;
  }

  async createCustomer(customerData: any) {
    const response = await this.api.post<DDMSResponse>('/customers', customerData);
    return response.data;
  }

  async updateCustomer(customerId: string, customerData: any) {
    const response = await this.api.put<DDMSResponse>(`/customers/${customerId}`, customerData);
    return response.data;
  }

  async deleteCustomer(customerId: string) {
    const response = await this.api.delete<DDMSResponse>(`/customers/${customerId}`);
    return response.data;
  }

  // Supplier Management
  async getSuppliers() {
    const response = await this.api.get<DDMSResponse>('/suppliers');
    return response.data;
  }

  async createSupplier(supplierData: any) {
    const response = await this.api.post<DDMSResponse>('/suppliers', supplierData);
    return response.data;
  }

  async updateSupplier(supplierId: string, supplierData: any) {
    const response = await this.api.put<DDMSResponse>(`/suppliers/${supplierId}`, supplierData);
    return response.data;
  }

  async deleteSupplier(supplierId: string) {
    const response = await this.api.delete<DDMSResponse>(`/suppliers/${supplierId}`);
    return response.data;
  }

  // Particulars Management
  async getParticulars(type?: 'RECEIPT' | 'CHALLAN') {
    const response = await this.api.get<DDMSResponse>('/particulars', {
      params: { type },
    });
    return response.data;
  }

  async createParticular(particularData: any) {
    const response = await this.api.post<DDMSResponse>('/particulars', particularData);
    return response.data;
  }

  async updateParticular(particularId: string, particularData: any) {
    const response = await this.api.put<DDMSResponse>(`/particulars/${particularId}`, particularData);
    return response.data;
  }

  async deleteParticular(particularId: string) {
    const response = await this.api.delete<DDMSResponse>(`/particulars/${particularId}`);
    return response.data;
  }

  // Receipt Management
  async getReceipts(filters?: any) {
    const response = await this.api.get<DDMSResponse>('/receipts', { params: filters });
    return response.data;
  }

  async createReceipt(receiptData: any) {
    const response = await this.api.post<DDMSResponse>('/receipts', receiptData);
    return response.data;
  }

  async updateReceipt(receiptId: string, receiptData: any) {
    const response = await this.api.put<DDMSResponse>(`/receipts/${receiptId}`, receiptData);
    return response.data;
  }

  async approveReceipt(receiptId: string) {
    const response = await this.api.post<DDMSResponse>(`/receipts/${receiptId}/approve`);
    return response.data;
  }

  async generateReceiptPDF(receiptId: string) {
    const response = await this.api.get(`/receipts/${receiptId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Challan Management
  async getChallans(filters?: any) {
    const response = await this.api.get<DDMSResponse>('/challans', { params: filters });
    return response.data;
  }

  async createChallan(challanData: any) {
    const response = await this.api.post<DDMSResponse>('/challans', challanData);
    return response.data;
  }

  async updateChallan(challanId: string, challanData: any) {
    const response = await this.api.put<DDMSResponse>(`/challans/${challanId}`, challanData);
    return response.data;
  }

  async approveChallan(challanId: string) {
    const response = await this.api.post<DDMSResponse>(`/challans/${challanId}/approve`);
    return response.data;
  }

  // Transaction Management
  async getTransactions(filters?: any) {
    const response = await this.api.get<DDMSResponse>('/transactions', { params: filters });
    return response.data;
  }

  // Reports
  async exportData(type: string, filters?: any) {
    const response = await this.api.get(`/reports/export/${type}`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  async importData(type: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post<DDMSResponse>(`/reports/import/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Dashboard
  async getDashboardStats() {
    const response = await this.api.get<DDMSResponse>('/dashboard/stats');
    return response.data;
  }

  // Notifications
  async getNotifications() {
    const response = await this.api.get<DDMSResponse>('/notifications');
    return response.data;
  }

  async markNotificationRead(notificationId: string) {
    const response = await this.api.put<DDMSResponse>(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // News & Events
  async getNewsEvents() {
    const response = await this.api.get<DDMSResponse>('/news-events');
    return response.data;
  }

  async createNewsEvent(newsEventData: any) {
    const response = await this.api.post<DDMSResponse>('/news-events', newsEventData);
    return response.data;
  }

  async updateNewsEvent(newsEventId: string, newsEventData: any) {
    const response = await this.api.put<DDMSResponse>(`/news-events/${newsEventId}`, newsEventData);
    return response.data;
  }

  async deleteNewsEvent(newsEventId: string) {
    const response = await this.api.delete<DDMSResponse>(`/news-events/${newsEventId}`);
    return response.data;
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: any) {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: any) {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: any) {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: any) {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }
}

export const apiService = new ApiService();