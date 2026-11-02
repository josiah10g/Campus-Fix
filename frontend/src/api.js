// frontend/src/api.js
// Single centralized API client for CampusFix

const BASE_URL = import.meta.env.VITE_API_URL || '';

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
  // Auth
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/api/auth/me'),

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

  // User Management (super_admin)
  getUsers: () => request('/api/users'),
  createUser: (userData) => request('/api/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUserRole: (id, role) => request(`/api/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
};
