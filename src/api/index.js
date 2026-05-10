import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://day-execution-backend.onrender.com/api',
  timeout: 10000, // 10 second timeout
});

let memoizedToken = null;

export const setStoredToken = (token) => {
  memoizedToken = token;
};

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = memoizedToken || await AsyncStorage.getItem('token');
  if (token) {
    memoizedToken = token;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const taskApi = {
  getTasks: () => api.get('/tasks'),
  createTask: (task) => api.post('/tasks', task),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getCompletedTasks: (month, year) => api.get(`/tasks/completed?month=${month}&year=${year}`),
};

export const routineApi = {
  getRoutines: () => api.get('/routines'),
  createRoutine: (routine) => api.post('/routines', routine),
  updateRoutine: (id, routine) => api.put(`/routines/${id}`, routine),
  deleteRoutine: (id) => api.delete(`/routines/${id}`),
};

export const planApi = {
  getTodayPlan: (date) => api.get(`/plan/today${date ? `?date=${date}` : ''}`),
  savePlan: (plan) => api.post('/plan', plan),
  updateExecution: (planId, taskId, data) => api.put(`/plan/${planId}/task/${taskId}`, data),
};

export const summaryApi = {
  createSummary: (data) => api.post('/summary', data),
  getSummary: (date) => api.get(`/summary/${date}`),
  getAllSummaries: () => api.get('/summary'),
};

export default api;
