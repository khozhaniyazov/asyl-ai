import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Automatically attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('asyl_ai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401/403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('asyl_ai_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // --- AUTH ---
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await apiClient.post('/auth/login', formData);
    if (response.data.access_token) {
      localStorage.setItem('asyl_ai_token', response.data.access_token);
    }
    return response.data;
  },

  register: async (data: { email: string; password: string; full_name: string; clinic_name?: string }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('asyl_ai_token');
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('asyl_ai_token');
  },

  // --- PATIENTS ---
  getPatients: async (skip = 0, limit = 100, search?: string) => {
    let url = `/patients/?skip=${skip}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getPatient: async (id: number) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (data: { first_name: string; last_name: string; diagnosis?: string; parent_phone?: string }) => {
    const response = await apiClient.post('/patients/', data);
    return response.data;
  },

  updatePatient: async (id: number, data: { first_name?: string; last_name?: string; diagnosis?: string; parent_phone?: string }) => {
    const response = await apiClient.put(`/patients/${id}`, data);
    return response.data;
  },

  deletePatient: async (id: number) => {
    const response = await apiClient.delete(`/patients/${id}`);
    return response.data;
  },

  // --- APPOINTMENTS ---
  getAppointments: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/appointments/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getAppointment: async (id: number) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: { patient_id: number; start_time: string; end_time: string }) => {
    const response = await apiClient.post('/appointments/', data);
    return response.data;
  },

  updateAppointment: async (id: number, data: { start_time?: string; end_time?: string; status?: string }) => {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return response.data;
  },

  deleteAppointment: async (id: number) => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  },

  generateKaspiLink: async (appointmentId: number, amount: number = 5000) => {
    const response = await apiClient.post(`/appointments/${appointmentId}/generate-kaspi-link?amount=${amount}`);
    return response.data;
  },

  // --- SESSIONS (EMR & AI) ---
  transcribeAndAnalyze: async (appointmentId: number, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'session.webm');

    const response = await apiClient.post(`/sessions/${appointmentId}/transcribe-and-analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  pollSessionStatus: async (sessionId: number) => {
    const response = await apiClient.get(`/sessions/${sessionId}/status`);
    return response.data;
  },

  updateSession: async (sessionId: number, data: {
    soap_subjective?: string;
    soap_objective?: string;
    soap_assessment?: string;
    soap_plan?: string;
    homework_for_parents?: string;
  }) => {
    const response = await apiClient.put(`/sessions/${sessionId}`, data);
    return response.data;
  },

  sendHomework: async (sessionId: number) => {
    const response = await apiClient.post(`/sessions/${sessionId}/send-homework`);
    return response.data;
  },

  // --- PARENT AUTH ---
  parentRequestOtp: async (phone: string) => {
    const response = await apiClient.post('/parent/request-otp', { phone });
    return response.data;
  },

  parentVerifyOtp: async (phone: string, code: string) => {
    const response = await apiClient.post('/parent/verify-otp', { phone, code });
    if (response.data.access_token) {
      localStorage.setItem('asyl_ai_parent_token', response.data.access_token);
    }
    return response.data;
  },

  parentLogout: () => {
    localStorage.removeItem('asyl_ai_parent_token');
  },

  isParentAuthenticated: () => {
    return !!localStorage.getItem('asyl_ai_parent_token');
  },

  // --- PARENT PORTAL ---
  parentGetMe: async () => {
    const token = localStorage.getItem('asyl_ai_parent_token');
    const response = await apiClient.get('/parent/me', { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  },

  parentGetChildren: async () => {
    const token = localStorage.getItem('asyl_ai_parent_token');
    const response = await apiClient.get('/parent/children', { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  },

  parentGetAppointments: async () => {
    const token = localStorage.getItem('asyl_ai_parent_token');
    const response = await apiClient.get('/parent/appointments', { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  },

  parentGetHomework: async () => {
    const token = localStorage.getItem('asyl_ai_parent_token');
    const response = await apiClient.get('/parent/homework', { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  },

  parentGetProgress: async () => {
    const token = localStorage.getItem('asyl_ai_parent_token');
    const response = await apiClient.get('/parent/progress', { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  },

  // --- BILLING ---
  getBillingStatus: async () => {
    const response = await apiClient.get('/billing/status');
    return response.data;
  },

  subscribe: async (plan: string) => {
    const response = await apiClient.post('/billing/subscribe', { plan });
    return response.data;
  },

  // --- PROGRESS ---
  getPatientProgress: async (patientId: number) => {
    const response = await apiClient.get(`/progress/patients/${patientId}/progress`);
    return response.data;
  },
};
