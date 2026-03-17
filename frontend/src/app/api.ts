import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Automatically attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('asyl_ai_token');
  if (token) {
    config.headers.Authorization = \Bearer ${token}\;
  }
  return config;
});

export const api = {
  // --- AUTH ---
  login: async (email: string, password: string) => {
    // OAuth2PasswordRequestForm expects form data
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

  // --- PATIENTS ---
  getPatients: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(\/patients/?skip=${skip}&limit=${limit}\);
    return response.data;
  },
  
  createPatient: async (data: { first_name: string; last_name: string; diagnosis?: string; parent_phone?: string }) => {
    const response = await apiClient.post('/patients/', data);
    return response.data;
  },

  // --- APPOINTMENTS ---
  getAppointments: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(\/appointments/?skip=${skip}&limit=${limit}\);
    return response.data;
  },

  createAppointment: async (data: { patient_id: number; start_time: string; end_time: string }) => {
    const response = await apiClient.post('/appointments/', data);
    return response.data;
  },

  generateKaspiLink: async (appointmentId: number, amount: number = 5000) => {
    const response = await apiClient.post(\/appointments/${appointmentId}/generate-kaspi-link?amount=${amount}\);
    return response.data;
  },

  // --- SESSIONS (EMR & AI) ---
  transcribeAndAnalyze: async (appointmentId: number, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'session.webm');
    
    // Start background processing
    const response = await apiClient.post(\/sessions/${appointmentId}/transcribe-and-analyze\, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Returns { message: "started", session_id: 123 }
  },

  pollSessionStatus: async (sessionId: number) => {
    const response = await apiClient.get(\/sessions/${sessionId}/status\);
    return response.data; // Returns { id: 123, status: 'processing' | 'completed', soap: {...} }
  }
};
