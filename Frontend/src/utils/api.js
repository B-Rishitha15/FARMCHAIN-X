
export const API_BASE_URL = 'http://localhost:8080/api';

// Python AI service
export const PYTHON_API_BASE_URL = 'http://localhost:8000';

import { MOCK_USERS, ROLE_DISPLAY_NAMES } from './constants';

// Generic helper for Java backend JSON requests
const jsonRequest = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text || `Request failed with status ${res.status}`
    );
  }

  // Handle empty response
  if (res.status === 204) {
    return null;
  }

  return res.json();
};

// Generic helper for Python AI backend JSON requests
const pythonJsonRequest = async (path, options = {}) => {
  const res = await fetch(`${PYTHON_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text || `Python API request failed with status ${res.status}`
    );
  }

  // Handle empty response
  if (res.status === 204) {
    return null;
  }

  return res.json();
};

// Authentication
export const apiLogin = async (email, password, role) => {
  try {
    // Try backend login first
    const data = await jsonRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });

    return data;
  } catch (err) {
    // Fallback to mock users if backend login fails
    const lowerEmail = (email || '').trim().toLowerCase();

    const matching = MOCK_USERS.find((user) => {
      const sameEmail =
        user.email &&
        user.email.toLowerCase() === lowerEmail;

      const sameRole =
        user.role === role ||
        ROLE_DISPLAY_NAMES[user.role] === role;

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

// User registration
export const apiRegister = (user) =>
  jsonRequest('/users/register', {
    method: 'POST',
    body: JSON.stringify(user)
  });

// Get all users
export const apiGetUsers = () =>
  jsonRequest('/users');

// Products
export const apiGetProducts = () =>
  jsonRequest('/products');

// Create a product
export const apiCreateProduct = (product) =>
  jsonRequest('/products', {
    method: 'POST',
    body: JSON.stringify(product)
  });

// Inventory
// Get all inventory records
export const apiGetInventory = () =>
  jsonRequest('/inventory');

// Get inventory records by owner ID
export const apiGetInventoryByOwner = (ownerId) =>
  jsonRequest(`/inventory/owner/${ownerId}`);

// Create inventory
export const apiCreateInventory = (payload) =>
  jsonRequest('/inventory', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

// Update inventory by ID
export const apiUpdateInventory = (inventoryId, payload) => {
  if (inventoryId === undefined || inventoryId === null) {
    throw new Error('Inventory ID is required to update inventory.');
  }

  return jsonRequest(`/inventory/${inventoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

// Delete inventory by ID
export const apiDeleteInventory = (inventoryId) => {
  if (inventoryId === undefined || inventoryId === null) {
    throw new Error('Inventory ID is required to delete inventory.');
  }

  return jsonRequest(`/inventory/${inventoryId}`, {
    method: 'DELETE'
  });
};

// Python AI endpoints
// Score an image
export const apiPythonScore = (imageDataUrl) =>
  pythonJsonRequest('/score', {
    method: 'POST',
    body: JSON.stringify({ image: imageDataUrl })
  });

// Send a chat request
export const apiPythonChat = (payload) =>
  pythonJsonRequest('/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
