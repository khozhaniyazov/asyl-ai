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

const parentHeaders = () => {
  const token = localStorage.getItem('asyl_ai_parent_token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

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
  getPatients: async (skip = 0, limit = 100, search?: string, status?: string) => {
    let url = `/patients/?skip=${skip}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getPatient: async (id: number) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/patients/', data);
    return response.data;
  },

  updatePatient: async (id: number, data: Record<string, unknown>) => {
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

  createAppointment: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/appointments/', data);
    return response.data;
  },

  updateAppointment: async (id: number, data: Record<string, unknown>) => {
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
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  pollSessionStatus: async (sessionId: number) => {
    const response = await apiClient.get(`/sessions/${sessionId}/status`);
    return response.data;
  },

  updateSession: async (sessionId: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/sessions/${sessionId}`, data);
    return response.data;
  },

  sendHomework: async (sessionId: number) => {
    const response = await apiClient.post(`/sessions/${sessionId}/send-homework`);
    return response.data;
  },

  // --- SESSION PACKAGES ---
  getPackages: async (patientId?: number) => {
    let url = '/packages/';
    if (patientId) url += `?patient_id=${patientId}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getPackage: async (id: number) => {
    const response = await apiClient.get(`/packages/${id}`);
    return response.data;
  },

  createPackage: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/packages/', data);
    return response.data;
  },

  updatePackage: async (id: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/packages/${id}`, data);
    return response.data;
  },

  getPackageBalance: async (patientId: number) => {
    const response = await apiClient.get(`/packages/patient/${patientId}/balance`);
    return response.data;
  },

  // --- HOMEWORK TEMPLATES ---
  getHomeworkTemplates: async (category?: string, search?: string) => {
    let url = '/homework/templates/';
    const params: string[] = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length) url += `?${params.join('&')}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getHomeworkTemplate: async (id: number) => {
    const response = await apiClient.get(`/homework/templates/${id}`);
    return response.data;
  },

  createHomeworkTemplate: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/homework/templates/', data);
    return response.data;
  },

  updateHomeworkTemplate: async (id: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/homework/templates/${id}`, data);
    return response.data;
  },

  deleteHomeworkTemplate: async (id: number) => {
    const response = await apiClient.delete(`/homework/templates/${id}`);
    return response.data;
  },

  // --- HOMEWORK ASSIGNMENTS ---
  getHomeworkAssignments: async (patientId?: number, status?: string) => {
    let url = '/homework/assignments/';
    const params: string[] = [];
    if (patientId) params.push(`patient_id=${patientId}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (params.length) url += `?${params.join('&')}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  createHomeworkAssignment: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/homework/assignments/', data);
    return response.data;
  },

  updateHomeworkAssignment: async (id: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/homework/assignments/${id}`, data);
    return response.data;
  },

  completeHomeworkAssignment: async (id: number, parentNotes?: string) => {
    const response = await apiClient.post(`/homework/assignments/${id}/complete`, { parent_notes: parentNotes });
    return response.data;
  },

  verifyHomeworkAssignment: async (id: number, feedback?: string) => {
    const response = await apiClient.post(`/homework/assignments/${id}/verify`, { therapist_feedback: feedback });
    return response.data;
  },

  // --- SOUND PROGRESS ---
  getSoundProgress: async (patientId: number) => {
    const response = await apiClient.get(`/sound-progress/patient/${patientId}`);
    return response.data;
  },

  createSoundProgress: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/sound-progress/', data);
    return response.data;
  },

  updateSoundProgress: async (id: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/sound-progress/${id}`, data);
    return response.data;
  },

  deleteSoundProgress: async (id: number) => {
    const response = await apiClient.delete(`/sound-progress/${id}`);
    return response.data;
  },

  // --- AVAILABILITY ---
  getAvailability: async () => {
    const response = await apiClient.get('/availability/');
    return response.data;
  },

  createAvailability: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/availability/', data);
    return response.data;
  },

  updateAvailability: async (id: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/availability/${id}`, data);
    return response.data;
  },

  deleteAvailability: async (id: number) => {
    const response = await apiClient.delete(`/availability/${id}`);
    return response.data;
  },

  getTherapistSlots: async (therapistId: number) => {
    const response = await apiClient.get(`/availability/therapist/${therapistId}/slots`);
    return response.data;
  },

  // --- SCHEDULE REQUESTS ---
  getScheduleRequests: async (status?: string) => {
    let url = '/schedule-requests/';
    if (status) url += `?status=${encodeURIComponent(status)}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  approveScheduleRequest: async (id: number, notes?: string) => {
    const response = await apiClient.put(`/schedule-requests/${id}/approve`, { therapist_notes: notes });
    return response.data;
  },

  rejectScheduleRequest: async (id: number, notes?: string) => {
    const response = await apiClient.put(`/schedule-requests/${id}/reject`, { therapist_notes: notes });
    return response.data;
  },

  // --- CANCELLATIONS ---
  cancelAppointment: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/cancellations/', data);
    return response.data;
  },

  getCancellations: async (patientId?: number) => {
    let url = '/cancellations/';
    if (patientId) url += `?patient_id=${patientId}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  returnSessionToPackage: async (recordId: number) => {
    const response = await apiClient.post(`/cancellations/${recordId}/return-session`);
    return response.data;
  },

  // --- WAITLIST ---
  getWaitlist: async () => {
    const response = await apiClient.get('/waitlist/');
    return response.data;
  },

  addToWaitlist: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/waitlist/', data);
    return response.data;
  },

  updateWaitlistEntry: async (id: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/waitlist/${id}`, data);
    return response.data;
  },

  removeFromWaitlist: async (id: number) => {
    const response = await apiClient.delete(`/waitlist/${id}`);
    return response.data;
  },

  offerWaitlistSlot: async (id: number) => {
    const response = await apiClient.post(`/waitlist/${id}/offer`);
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
    const response = await apiClient.get('/parent/me', parentHeaders());
    return response.data;
  },

  parentGetChildren: async () => {
    const response = await apiClient.get('/parent/children', parentHeaders());
    return response.data;
  },

  parentGetAppointments: async () => {
    const response = await apiClient.get('/parent/appointments', parentHeaders());
    return response.data;
  },

  parentGetHomework: async () => {
    const response = await apiClient.get('/parent/homework', parentHeaders());
    return response.data;
  },

  parentGetProgress: async () => {
    const response = await apiClient.get('/parent/progress', parentHeaders());
    return response.data;
  },

  parentGetSoundProgress: async () => {
    const response = await apiClient.get('/parent/sound-progress', parentHeaders());
    return response.data;
  },

  parentGetPackages: async () => {
    const response = await apiClient.get('/parent/packages', parentHeaders());
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

  // --- FINANCE ---
  getFinanceSummary: async () => {
    const response = await apiClient.get('/finance/summary');
    return response.data;
  },

  getRevenueChart: async (months = 6) => {
    const response = await apiClient.get(`/finance/revenue-chart?months=${months}`);
    return response.data;
  },

  getDebtors: async () => {
    const response = await apiClient.get('/finance/debtors');
    return response.data;
  },

  getFinancePackages: async () => {
    const response = await apiClient.get('/finance/packages');
    return response.data;
  },

  // --- PROGRESS ---
  getPatientProgress: async (patientId: number) => {
    const response = await apiClient.get(`/progress/patients/${patientId}/progress`);
    return response.data;
  },

  // --- v3: MARKETPLACE PROFILES ---
  searchProfiles: async (params: Record<string, unknown> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    }
    const response = await apiClient.get(`/marketplace/profiles/search?${query}`);
    return response.data;
  },

  getPublicProfile: async (therapistId: number) => {
    const response = await apiClient.get(`/marketplace/profiles/${therapistId}`);
    return response.data;
  },

  getMyProfile: async () => {
    const response = await apiClient.get('/marketplace/profiles/my/profile');
    return response.data;
  },

  createMyProfile: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/marketplace/profiles/my/profile', data);
    return response.data;
  },

  updateMyProfile: async (data: Record<string, unknown>) => {
    const response = await apiClient.put('/marketplace/profiles/my/profile', data);
    return response.data;
  },

  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/marketplace/profiles/my/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // --- v3: MARKETPLACE REVIEWS ---
  getTherapistReviews: async (therapistId: number, skip = 0, limit = 20) => {
    const response = await apiClient.get(`/marketplace/reviews/therapist/${therapistId}?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getReviewSummary: async (therapistId: number) => {
    const response = await apiClient.get(`/marketplace/reviews/therapist/${therapistId}/summary`);
    return response.data;
  },

  createReview: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/marketplace/reviews/', data, parentHeaders());
    return response.data;
  },

  getMyReviews: async () => {
    const response = await apiClient.get('/marketplace/reviews/my', parentHeaders());
    return response.data;
  },

  deleteReview: async (id: number) => {
    const response = await apiClient.delete(`/marketplace/reviews/${id}`, parentHeaders());
    return response.data;
  },

  // --- v3: MARKETPLACE BOOKINGS ---
  createMarketplaceBooking: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/marketplace/bookings/', data, parentHeaders());
    return response.data;
  },

  getMyBookings: async () => {
    const response = await apiClient.get('/marketplace/bookings/my', parentHeaders());
    return response.data;
  },

  payBookingDeposit: async (bookingId: number) => {
    const response = await apiClient.post(`/marketplace/bookings/${bookingId}/pay`, {}, parentHeaders());
    return response.data;
  },

  cancelBooking: async (bookingId: number) => {
    const response = await apiClient.post(`/marketplace/bookings/${bookingId}/cancel`, {}, parentHeaders());
    return response.data;
  },

  getIncomingBookings: async (status?: string) => {
    let url = '/marketplace/bookings/incoming';
    if (status) url += `?status=${encodeURIComponent(status)}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  confirmBooking: async (bookingId: number) => {
    const response = await apiClient.put(`/marketplace/bookings/${bookingId}/confirm`);
    return response.data;
  },

  rejectBooking: async (bookingId: number) => {
    const response = await apiClient.put(`/marketplace/bookings/${bookingId}/reject`);
    return response.data;
  },

  // --- TREATMENT PLANS ---
  getTreatmentPlans: async (patientId?: number) => {
    let url = '/treatment/plans';
    if (patientId) url += `?patient_id=${patientId}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getTreatmentPlan: async (planId: number) => {
    const response = await apiClient.get(`/treatment/plans/${planId}`);
    return response.data;
  },

  createTreatmentPlan: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/treatment/plans', data);
    return response.data;
  },

  updateTreatmentPlan: async (planId: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/treatment/plans/${planId}`, data);
    return response.data;
  },

  addGoal: async (planId: number, data: Record<string, unknown>) => {
    const response = await apiClient.post(`/treatment/plans/${planId}/goals`, data);
    return response.data;
  },

  updateGoal: async (goalId: number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/treatment/goals/${goalId}`, data);
    return response.data;
  },

  deleteGoal: async (goalId: number) => {
    const response = await apiClient.delete(`/treatment/goals/${goalId}`);
    return response.data;
  },

  getGoalTemplates: async (category?: string) => {
    let url = '/treatment/goal-templates';
    if (category) url += `?category=${encodeURIComponent(category)}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  createGoalTemplate: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/treatment/goal-templates', data);
    return response.data;
  },

  deleteGoalTemplate: async (id: number) => {
    const response = await apiClient.delete(`/treatment/goal-templates/${id}`);
    return response.data;
  },

  // --- MESSAGING ---
  getConversations: async () => {
    const response = await apiClient.get('/messaging/conversations');
    return response.data;
  },

  getOrCreateConversation: async (parentId: number) => {
    const response = await apiClient.post(`/messaging/conversations/${parentId}`);
    return response.data;
  },

  getMessages: async (conversationId: number, skip = 0, limit = 50) => {
    const response = await apiClient.get(`/messaging/conversations/${conversationId}/messages?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  sendMessage: async (conversationId: number, data: Record<string, unknown>) => {
    const response = await apiClient.post(`/messaging/conversations/${conversationId}/messages`, data);
    return response.data;
  },

  parentGetConversations: async () => {
    const response = await apiClient.get('/messaging/parent/conversations', parentHeaders());
    return response.data;
  },

  parentGetMessages: async (conversationId: number) => {
    const response = await apiClient.get(`/messaging/parent/conversations/${conversationId}/messages`, parentHeaders());
    return response.data;
  },

  parentSendMessage: async (conversationId: number, data: Record<string, unknown>) => {
    const response = await apiClient.post(`/messaging/parent/conversations/${conversationId}/messages`, data, parentHeaders());
    return response.data;
  },

  // --- ANALYTICS ---
  getAnalyticsSummary: async () => {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
  },

  getAnalyticsTrends: async (weeks = 12) => {
    const response = await apiClient.get(`/analytics/trends?weeks=${weeks}`);
    return response.data;
  },

  // --- DATA EXPORT ---
  exportPatientsCsv: () => `${apiClient.defaults.baseURL}/export/patients`,
  exportSessionsCsv: () => `${apiClient.defaults.baseURL}/export/sessions`,
  exportPatientRecord: (patientId: number) => `${apiClient.defaults.baseURL}/export/patient/${patientId}`,
};
