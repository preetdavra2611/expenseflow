import axios from 'axios';
import {
  User,
  Transaction,
  Category,
  Budget,
  RecurringTransaction,
  SmartInsight,
  DashboardSummary,
  CategoryAnalyticsItem,
  MonthlyAnalyticsItem,
  DailyAnalyticsItem,
  FilterState,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; user: User; token: string }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, name: string, currency = 'INR', timezone = 'Asia/Kolkata') => {
    const res = await api.post<{ success: boolean; user: User; token: string }>('/auth/register', {
      email,
      password,
      name,
      currency,
      timezone,
    });
    return res.data;
  },
  me: async () => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data;
  },
  updateSettings: async (data: Partial<User>) => {
    const res = await api.put<{ success: boolean; user: User }>('/auth/settings', data);
    return res.data;
  },
};

export const transactionsApi = {
  getTransactions: async (filters: Partial<FilterState> & { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) => {
    const res = await api.get<{
      success: boolean;
      data: Transaction[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/transactions', { params: filters });
    return res.data;
  },
  getTransactionById: async (id: string) => {
    const res = await api.get<{ success: boolean; transaction: Transaction }>(`/transactions/${id}`);
    return res.data;
  },
  createTransaction: async (data: any) => {
    const res = await api.post<{ success: boolean; transaction: Transaction; budgetAlert: string | null }>('/transactions', data);
    return res.data;
  },
  updateTransaction: async (id: string, data: any) => {
    const res = await api.put<{ success: boolean; transaction: Transaction }>(`/transactions/${id}`, data);
    return res.data;
  },
  deleteTransaction: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/transactions/${id}`);
    return res.data;
  },
  undoTransaction: async () => {
    const res = await api.post<{ success: boolean; transaction: Transaction }>('/transactions/undo');
    return res.data;
  },
  parseNLP: async (text: string) => {
    const res = await api.post<{ success: boolean; result: any }>('/transactions/parse-nlp', { text });
    return res.data;
  },
};

export const categoriesApi = {
  getCategories: async (type?: string) => {
    const res = await api.get<{ success: boolean; categories: Category[] }>('/categories', { params: { type } });
    return res.data;
  },
  createCategory: async (data: { name: string; type: 'EXPENSE' | 'INCOME'; icon: string; color: string }) => {
    const res = await api.post<{ success: boolean; category: Category }>('/categories', data);
    return res.data;
  },
  updateCategory: async (id: string, data: Partial<Category>) => {
    const res = await api.put<{ success: boolean; category: Category }>(`/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/categories/${id}`);
    return res.data;
  },
};

export const budgetsApi = {
  getBudgets: async () => {
    const res = await api.get<{ success: boolean; budgets: Budget[] }>('/budgets');
    return res.data;
  },
  upsertBudget: async (data: { categoryId: string; amount: number; period?: string }) => {
    const res = await api.post<{ success: boolean; budget: Budget }>('/budgets', data);
    return res.data;
  },
  deleteBudget: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/budgets/${id}`);
    return res.data;
  },
};

export const recurringApi = {
  getRecurring: async () => {
    const res = await api.get<{ success: boolean; recurring: RecurringTransaction[] }>('/recurring');
    return res.data;
  },
  createRecurring: async (data: any) => {
    const res = await api.post<{ success: boolean; recurring: RecurringTransaction }>('/recurring', data);
    return res.data;
  },
  updateRecurring: async (id: string, data: any) => {
    const res = await api.put<{ success: boolean; message: string }>(`/recurring/${id}`, data);
    return res.data;
  },
  deleteRecurring: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/recurring/${id}`);
    return res.data;
  },
  processDue: async () => {
    const res = await api.post<{ success: boolean; processed: number }>('/recurring/process-due');
    return res.data;
  },
};

export const dashboardApi = {
  getSummary: async () => {
    const res = await api.get<{ success: boolean; summary: DashboardSummary }>('/dashboard/summary');
    return res.data;
  },
  getCategories: async (filters: Partial<FilterState> = {}) => {
    const res = await api.get<{ success: boolean; totalAmount: number; categories: CategoryAnalyticsItem[] }>('/dashboard/categories', {
      params: filters,
    });
    return res.data;
  },
  getMonthly: async () => {
    const res = await api.get<{ success: boolean; monthly: MonthlyAnalyticsItem[] }>('/dashboard/monthly');
    return res.data;
  },
  getDaily: async (year?: number, month?: number) => {
    const res = await api.get<{ success: boolean; daily: DailyAnalyticsItem[] }>('/dashboard/daily', {
      params: { year, month },
    });
    return res.data;
  },
};

export const insightsApi = {
  getInsights: async () => {
    const res = await api.get<{ success: boolean; insights: SmartInsight[] }>('/insights');
    return res.data;
  },
};

export const exportApi = {
  downloadCSV: async (filters: Partial<FilterState> = {}) => {
    const res = await api.get('/export/csv', { params: filters, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadExcel: async (filters: Partial<FilterState> = {}) => {
    const res = await api.get('/export/excel', { params: filters, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadPDF: async (filters: Partial<FilterState> = {}) => {
    const res = await api.get('/export/pdf', { params: filters, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `statement_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export const telegramApi = {
  simulate: async (text: string) => {
    const res = await api.post<{ success: boolean; reply: string; handled: boolean }>('/telegram/simulate', { text });
    return res.data;
  },
};

export default api;
