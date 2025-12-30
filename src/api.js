import axios from 'axios';
import { addToQueue } from './SyncManager';

// Use env var if available, otherwise default to relative /api (for Vercel)
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to handle offline writes and reads
api.interceptors.request.use(async (config) => {
    if (!navigator.onLine) {
        if (['post', 'put', 'delete'].includes(config.method)) {
            // Queue write requests
            console.log('Offline: Queuing request', config.url);
            addToQueue({
                url: config.url,
                method: config.method,
                data: config.data,
                params: config.params
            });
            return Promise.reject({ message: 'OFFLINE_QUEUED', config });
        } else if (config.method === 'get') {
             // Try to serve from cache if available?
             // Not implemented fully here, but ideally we'd return cached data.
             // For now, let it fail naturally or handled by Service Worker if configured.
             // But since we didn't setup SW strategy for API yet, let's just let it be.
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        // Cache successful GET responses in localStorage for simple offline read fallback
        // WARNING: This is naive caching. In production use IndexedDB/SW.
        if (response.config.method === 'get') {
            try {
                localStorage.setItem(`cache_${response.config.url}`, JSON.stringify({
                    data: response.data,
                    timestamp: Date.now()
                }));
            } catch (e) { console.warn('Cache full/error', e); }
        }
        return response;
    },
    (error) => {
        // If offline and GET failed, try to return cached data
        if (!navigator.onLine && error.config.method === 'get') {
            const cached = localStorage.getItem(`cache_${error.config.url}`);
            if (cached) {
                const { data } = JSON.parse(cached);
                console.log('Serving from offline cache:', error.config.url);
                return Promise.resolve({ data, status: 200, statusText: 'OK (Cached)' });
            }
        }
        return Promise.reject(error);
    }
);

export const login = async (email, password) => {
  const response = await api.post(`/login`, { email, password });
  return response.data;
};

export const registerUnit = async (unitData) => {
    const response = await api.post('/register/unit', unitData);
    return response.data;
};

export const registerUser = async (userData, unitCode) => {
    const response = await api.post(`/register/user?unit_code=${unitCode}`, userData);
    return response.data;
};

export const getUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

export const createPatient = async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
};

export const approvePatient = async (patientId) => {
    const response = await api.put(`/patients/${patientId}/approve`);
    return response.data;
};

export const getUnitPatients = async (unitId) => {
  const response = await api.get(`/units/${unitId}/patients`);
  return response.data;
};

export const getUnitMessages = async (unitId, contextType = 'UNIT') => {
    const response = await api.get(`/units/${unitId}/messages?context_type=${contextType}`);
    return response.data;
};

export const getPatientMessages = async (patientId) => {
    const response = await api.get(`/patients/${patientId}/messages`);
    return response.data;
};

export const getPatientTasks = async (patientId) => {
    const response = await api.get(`/patients/${patientId}/tasks`);
    return response.data;
};

export const getUnitTasks = async (unitId) => {
    const response = await api.get(`/units/${unitId}/tasks`);
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
};

export const completeTask = async (taskId, userId) => {
    const response = await api.put(`/tasks/${taskId}/complete?user_id=${userId}`);
    return response.data;
};

export const createMessage = async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
};
