export const API_BASE_URL = 'http://localhost:8080/api';
// Python AI service (Flask in `Python/app.py`)
export const PYTHON_API_BASE_URL = 'http://localhost:8000';
import { MOCK_USERS, ROLE_DISPLAY_NAMES } from './constants';

// Generic helper for JSON requests (Java backend)
const jsonRequest = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
};

// Generic helper for JSON requests (Python AI backend)
const pythonJsonRequest = async (path, options = {}) => {
  const res = await fetch(`${PYTHON_API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Python API request failed with status ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
};

// Auth
export const apiLogin = async (email, password, role) => {
  try {
    // Try backend login first
    const data = await jsonRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    return data;
  } catch (err) {
    // Fallback to local mock users if backend not available
    const lowerEmail = (email || '').trim().toLowerCase();
    const matching = MOCK_USERS.find(u => {
      const sameEmail = u.email && u.email.toLowerCase() === lowerEmail;
      const sameRole = u.role === role || ROLE_DISPLAY_NAMES[u.role] === role;
      return sameEmail && sameRole;
    });
    if (matching && matching.password === password) {
      return {
        id: matching.id,
        name: matching.name,
        email: matching.email,
        token: `demo-token-${matching.id}`,
        message: 'Login successful'
      };
    }
    throw err;
  }
};

export const apiRegister = (user) =>
  jsonRequest('/users/register', {
    method: 'POST',
    body: JSON.stringify(user)
  });

export const apiGetUsers = () => jsonRequest('/users');

// Inventory / Products
export const apiGetInventory = () => jsonRequest('/inventory');

export const apiCreateProduct = (product) =>
  jsonRequest('/products', {
    method: 'POST',
    body: JSON.stringify(product)
  });

export const apiCreateInventory = (payload) =>
  jsonRequest('/inventory', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const apiUpdateInventory = (inventoryId, payload) =>
  jsonRequest(`/inventory/${inventoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

// Python AI endpoints
export const apiPythonScore = async (imageDataUrl) =>
  pythonJsonRequest('/score', {
    method: 'POST',
    body: JSON.stringify({ image: imageDataUrl })
  });

export const apiPythonChat = async (payload) =>
  pythonJsonRequest('/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });


