// frontend/src/api.js
// Single centralized API client for CampusFix

// Development uses Vite's /api proxy so local UI work talks to the local backend.
// Production uses the separately deployed backend URL from VITE_API_URL.
const BASE_URL = (import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Helper to retrieve stored auth token
 */
export const getToken = () => localStorage.getItem('campusfix_token');

/**
 * Helper to save auth session
 */
export const setAuthSession = (token, user) => {
  localStorage.setItem('campusfix_token', token);
  localStorage.setItem('campusfix_user', JSON.stringify(user));
};

/**
 * Helper to clear auth session
 */
export const clearAuthSession = () => {
  localStorage.removeItem('campusfix_token');
  localStorage.removeItem('campusfix_user');
};

/**
 * Helper to get currently stored user
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem('campusfix_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Base fetch wrapper handling headers, auth token, and HTTP error parsing
 */
const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new Error('Network error: Unable to connect to the CampusFix server. Please check your connection.');
  }

  // Handle unauthorized (expired or invalid token)
  if (response.status === 401) {
    clearAuthSession();
    // Dispatch a custom event so UI can redirect smoothly to login
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  // Parse JSON or text
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.error) ? data.error : `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// API Endpoints
export const api = {
  getPublicStats: () => request('/api/public/stats'),
  getPublicIssues: (params = {}) => {
    const search = new URLSearchParams();
    for (const key of ['search', 'status', 'category', 'page', 'limit']) {
      if (params[key] !== undefined && params[key] !== '') search.set(key, params[key]);
    }
    const query = search.toString();
    return request(`/api/public/issues${query ? `?${query}` : ''}`);
  },
  // Auth
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  verifyEmail: (data) => request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
  resendVerification: (email) => request('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: () => request('/api/auth/me'),
  updateProfile: (profile) => request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),

  // Stats & Health
  getStats: () => request('/api/stats'),
  getHealth: () => request('/api/health'),

  // Issues CRUD
  getIssues: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'All statuses') searchParams.set('status', params.status);
    if (params.category && params.category !== 'All categories') searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    if (params.myReports) searchParams.set('myReports', 'true');
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/api/issues${query}`);
  },

  getIssue: (id) => request(`/api/issues/${id}`),
  createIssue: (issueData) => request('/api/issues', { method: 'POST', body: JSON.stringify(issueData) }),
  updateIssue: (id, issueData) => request(`/api/issues/${id}`, { method: 'PUT', body: JSON.stringify(issueData) }),
  deleteIssue: (id) => request(`/api/issues/${id}`, { method: 'DELETE' }),

  // User management
  getUsers: () => request('/api/users'),
  createUser: (userData) => request('/api/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUserRole: (id, role) => request(`/api/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
};

