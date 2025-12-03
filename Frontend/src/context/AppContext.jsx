import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { CROP_STATUS, MOCK_TRANSACTIONS, DEFAULT_CROP_IMAGE, MOCK_USERS } from '../utils/constants';
import { generate8DigitCode } from '../utils/helpers';
import { apiGetInventory, apiGetUsers } from '../utils/api';
import { USER_ROLES, ROLE_DISPLAY_NAMES } from '../utils/constants';

// Initial state
const initialState = {
  user: null,
  crops: [],
  users: [...MOCK_USERS],
  transactions: [...MOCK_TRANSACTIONS],
  darkMode: false,
  notifications: [],
  loading: false
};

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  ADD_CROP: 'ADD_CROP',
  UPDATE_CROP: 'UPDATE_CROP',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  LOAD_DATA: 'LOAD_DATA',
  SET_CROPS: 'SET_CROPS',
  SET_USERS: 'SET_USERS',
  SET_LOADING: 'SET_LOADING'
  ,
  ADD_USER: 'ADD_USER',
  UPDATE_USER: 'UPDATE_USER',
  REMOVE_USER: 'REMOVE_USER'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload
      };
    
    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null
      };
    
    case ActionTypes.ADD_CROP:
      return {
        ...state,
        crops: [...state.crops, action.payload]
      };
    
    case ActionTypes.UPDATE_CROP:
      return {
        ...state,
        crops: state.crops.map(crop => 
          crop.id === action.payload.id ? { ...crop, ...action.payload } : crop
        )
      };
    
    case ActionTypes.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [...state.transactions, { ...action.payload, id: Date.now().toString() }]
      };
    
    case ActionTypes.TOGGLE_DARK_MODE:
      return {
        ...state,
        darkMode: !state.darkMode
      };
    
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, { ...action.payload, id: Date.now().toString() }]
      };
    
    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload)
      };
    
    case ActionTypes.LOAD_DATA:
      return {
        ...state,
        ...action.payload
      };
    
    case ActionTypes.SET_CROPS:
      return {
        ...state,
        crops: action.payload
      };
    case ActionTypes.SET_USERS:
      return {
        ...state,
        users: Array.isArray(action.payload) ? action.payload : state.users
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case ActionTypes.ADD_USER:
      return {
        ...state,
        users: [...state.users, action.payload]
      };
    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u)
      };
    case ActionTypes.REMOVE_USER:
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload)
      };
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('farmChainXData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: ActionTypes.LOAD_DATA, payload: parsedData });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const { loading, ...persistable } = state;
    localStorage.setItem('farmChainXData', JSON.stringify(persistable));
  }, [state]);

  const mapInventoryToCrop = (inventory) => {
    const product = inventory.product || {};
    const owner = inventory.owner || {};

    // Try to preserve any existing local data (like pricing) for this inventory
    const existing =
      state.crops.find(
        (c) =>
          (c.inventoryId && inventory.id && c.inventoryId === inventory.id) ||
          c.id === (inventory.id?.toString() || product.id?.toString())
      ) || {};

    const stage = (inventory.stage || '').toLowerCase();
    const normalizedStatus = Object.values(CROP_STATUS).includes(stage)
      ? stage
      : (() => {
          switch ((product.status || '').toLowerCase()) {
            case 'pending':
            case 'approved':
              return CROP_STATUS.HARVESTED;
            case 'in_transit':
            case 'intransit':
              return CROP_STATUS.IN_TRANSIT;
            default:
              return CROP_STATUS.HARVESTED;
          }
        })();

    const imageSrc = product.imageUrl || DEFAULT_CROP_IMAGE;
    const basePrice = typeof product.price === 'number' ? product.price : null;

    return {
      id: inventory.id?.toString() || product.id?.toString() || generate8DigitCode(),
      inventoryId: inventory.id,
      productId: product.id,
      name: product.name || existing.name || 'Unnamed Crop',
      quantity: inventory.quantity ?? product.quantityKg ?? existing.quantity ?? 0,
      location: product.location || existing.location || 'Unknown location',
      description: product.description || existing.description || '',
      status: normalizedStatus,
      // Preserve any locally computed pricing (farmer / distributor / retailer / final)
      farmerPrice:
        typeof existing.farmerPrice === 'number'
          ? existing.farmerPrice
          : basePrice,
      distributorPrice:
        typeof existing.distributorPrice === 'number'
          ? existing.distributorPrice
          : null,
      retailerPrice:
        typeof existing.retailerPrice === 'number'
          ? existing.retailerPrice
          : null,
      price:
        typeof existing.price === 'number'
          ? existing.price
          : basePrice,
      farmerId: owner.id ? owner.id.toString() : '',
      farmerName: owner.name || 'Unknown Farmer',
      createdAt: product.harvestDate || new Date().toISOString(),
      harvestedDate: product.harvestDate,
      freshUntilDate: product.harvestDate,
      image: imageSrc,
      qrCode: `INV-${inventory.id || generate8DigitCode()}`,
      aiScore: typeof product.aiScore === 'number' ? product.aiScore : null,
      aiVerdict: product.aiVerdict || null
    };
  };

  const fetchInventory = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const data = await apiGetInventory();
      const mapped = Array.isArray(data) ? data.map(mapInventoryToCrop) : [];
      dispatch({ type: ActionTypes.SET_CROPS, payload: mapped });
    } catch (error) {
      console.error('Failed to load inventory:', error);
      dispatch({
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          type: 'error',
          message: 'Failed to load inventory data',
          description: error.message
        }
      });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await apiGetUsers();
      // If backend returns an array of users with role in display name, try to map back to key if possible
      const normalized = Array.isArray(users) ? users.map(u => {
        const roleVal = u.role;
        if (!roleVal) return u;
        // If roleVal is one of the keys already, keep
        if (Object.values(USER_ROLES).includes(roleVal)) return u;
        // If it's a display name, map back to a key
        const foundKey = Object.keys(ROLE_DISPLAY_NAMES).find(k => ROLE_DISPLAY_NAMES[k] === roleVal);
        if (foundKey) return { ...u, role: foundKey };
        return u;
      }) : users;
      dispatch({ type: ActionTypes.SET_USERS, payload: normalized });
    } catch (error) {
      // Fallback: do nothing, keep local/mock users
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchUsers();
  }, [fetchInventory, fetchUsers]);

  // Actions
  const actions = {
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    logout: () => dispatch({ type: ActionTypes.LOGOUT }),
    addCrop: (crop) => {
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const newCrop = {
        ...crop,
        id: uniqueId
      };

      dispatch({ type: ActionTypes.ADD_CROP, payload: newCrop });
      return newCrop;
    },
    updateCrop: (crop) => dispatch({ type: ActionTypes.UPDATE_CROP, payload: crop }),
    addUser: (user) => {
      const uniqueId = user.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      dispatch({ type: ActionTypes.ADD_USER, payload: { ...user, id: uniqueId } });
      return uniqueId;
    },
    updateUser: (user) => dispatch({ type: ActionTypes.UPDATE_USER, payload: user }),
    removeUser: (userId) => dispatch({ type: ActionTypes.REMOVE_USER, payload: userId }),
    addTransaction: (transaction) => dispatch({ type: ActionTypes.ADD_TRANSACTION, payload: transaction }),
    toggleDarkMode: () => dispatch({ type: ActionTypes.TOGGLE_DARK_MODE }),
    addNotification: (notification) => dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notification }),
    removeNotification: (id) => dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: id }),
    refreshCrops: fetchInventory
    ,refreshUsers: fetchUsers
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
