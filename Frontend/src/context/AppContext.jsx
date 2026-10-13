
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback
} from 'react';

import {
  CROP_STATUS,
  MOCK_TRANSACTIONS,
  DEFAULT_CROP_IMAGE,
  MOCK_USERS,
  USER_ROLES,
  ROLE_DISPLAY_NAMES
} from '../utils/constants';

import { generate8DigitCode } from '../utils/helpers';

import {
  apiGetInventory,
  apiGetUsers,
  apiUpdateInventory
} from '../utils/api';

const initialState = {
  user: null,
  crops: [],
  users: [...MOCK_USERS],
  transactions: [...MOCK_TRANSACTIONS],
  darkMode: false,
  notifications: [],
  loading: false
};

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
  SET_LOADING: 'SET_LOADING',
  ADD_USER: 'ADD_USER',
  UPDATE_USER: 'UPDATE_USER',
  REMOVE_USER: 'REMOVE_USER'
};

// Convert valid numeric prices while preserving missing values as null.
const toPrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload };

    case ActionTypes.LOGOUT:
      return { ...state, user: null };

    case ActionTypes.ADD_CROP:
      return {
        ...state,
        crops: [...state.crops, action.payload]
      };

    case ActionTypes.UPDATE_CROP:
      return {
        ...state,
        crops: state.crops.map((crop) =>
          String(crop.id) === String(action.payload.id)
            ? { ...crop, ...action.payload }
            : crop
        )
      };

    case ActionTypes.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [
          ...state.transactions,
          {
            ...action.payload,
            id: Date.now().toString()
          }
        ]
      };

    case ActionTypes.TOGGLE_DARK_MODE:
      return { ...state, darkMode: !state.darkMode };

    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            ...action.payload,
            id: Date.now().toString()
          }
        ]
      };

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) =>
            notification.id !== action.payload
        )
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
        users: Array.isArray(action.payload)
          ? action.payload
          : state.users
      };

    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };

    case ActionTypes.ADD_USER:
      return {
        ...state,
        users: [...state.users, action.payload]
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        users: state.users.map((user) =>
          String(user.id) === String(action.payload.id)
            ? { ...user, ...action.payload }
            : user
        )
      };

    case ActionTypes.REMOVE_USER:
      return {
        ...state,
        users: state.users.filter(
          (user) => String(user.id) !== String(action.payload)
        )
      };

    default:
      return state;
  }
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState
  );

  // Restore saved application data.
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('farmChainXData');

      if (savedData) {
        const parsedData = JSON.parse(savedData);

        dispatch({
          type: ActionTypes.LOAD_DATA,
          payload: parsedData
        });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Persist application state.
  useEffect(() => {
    try {
      const { loading, ...persistable } = state;

      localStorage.setItem(
        'farmChainXData',
        JSON.stringify(persistable)
      );
    } catch (error) {
      console.error('Error saving app data:', error);
    }
  }, [state]);

  // Map backend inventory into the frontend crop format.
  const mapInventoryToCrop = (inventory) => {
    const product = inventory.product || {};
    const owner = inventory.owner || {};

    const stage = String(inventory.stage || '')
      .trim()
      .toLowerCase();

    const allowedStatuses = Object.values(CROP_STATUS).map(
      (status) => String(status).toLowerCase()
    );

    let normalizedStatus;

    if (allowedStatuses.includes(stage)) {
      normalizedStatus = stage;
    } else {
      switch (String(product.status || '').toLowerCase()) {
        case 'pending':
        case 'approved':
          normalizedStatus = CROP_STATUS.HARVESTED;
          break;

        case 'in_transit':
        case 'intransit':
          normalizedStatus = CROP_STATUS.IN_TRANSIT;
          break;

        default:
          normalizedStatus = CROP_STATUS.HARVESTED;
      }
    }

    const basePrice = toPrice(product.price);
    const distributorPrice = toPrice(product.distributorPrice);
    const retailerPrice = toPrice(product.retailerPrice);

    return {
      id: inventory.id?.toString()
        || product.id?.toString()
        || generate8DigitCode(),

      inventoryId: inventory.id,
      productId: product.id,

      name: product.name || 'Unnamed Crop',

      quantity:
        inventory.quantity
        ?? product.quantityKg
        ?? 0,

      location: product.location || 'Unknown location',
      description: product.description || '',

      status: normalizedStatus,

      // Keep all price fields from the backend response.
      farmerPrice: basePrice,
      price: basePrice,
      distributorPrice,
      retailerPrice,

      farmerId: owner.id?.toString() || '',
      farmerName: owner.name || 'Unknown Farmer',

      createdAt:
        product.harvestDate || new Date().toISOString(),

      harvestedDate: product.harvestDate || null,
      freshUntilDate: null,

      image: product.imageUrl || DEFAULT_CROP_IMAGE,

      qrCode: `INV-${inventory.id || generate8DigitCode()}`,

      aiScore: toPrice(product.aiScore),
      aiVerdict: product.aiVerdict || null
    };
  };

  // Fetch inventory and replace crops with current backend data.
  const fetchInventory = useCallback(async () => {
    dispatch({
      type: ActionTypes.SET_LOADING,
      payload: true
    });

    try {
      const data = await apiGetInventory();

      const mapped = Array.isArray(data)
        ? data.map(mapInventoryToCrop)
        : [];

      dispatch({
        type: ActionTypes.SET_CROPS,
        payload: mapped
      });

      return mapped;
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

      throw error;
    } finally {
      dispatch({
        type: ActionTypes.SET_LOADING,
        payload: false
      });
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await apiGetUsers();

      const normalized = Array.isArray(users)
        ? users.map((user) => {
            const roleVal = user.role;

            if (!roleVal) return user;

            if (Object.values(USER_ROLES).includes(roleVal)) {
              return user;
            }

            const foundKey = Object.keys(
              ROLE_DISPLAY_NAMES
            ).find(
              (key) => ROLE_DISPLAY_NAMES[key] === roleVal
            );

            return foundKey
              ? { ...user, role: foundKey }
              : user;
          })
        : users;

      dispatch({
        type: ActionTypes.SET_USERS,
        payload: normalized
      });
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    fetchInventory().catch(() => {});
    fetchUsers();
  }, [fetchInventory, fetchUsers]);

  // Update inventory stage without overwriting any prices.
  const updateInventoryStage = async (crop, newStage) => {
    const inventoryId = crop?.inventoryId ?? crop?.id;

    if (
      inventoryId === undefined ||
      inventoryId === null ||
      !/^\d+$/.test(String(inventoryId))
    ) {
      throw new Error(
        'A valid backend inventory ID is required.'
      );
    }

    await apiUpdateInventory(inventoryId, {
      stage: String(newStage).toUpperCase()
    });

    await fetchInventory();

    dispatch({
      type: ActionTypes.ADD_NOTIFICATION,
      payload: {
        type: 'success',
        message: 'Crop status updated successfully',
        description: `Inventory #${inventoryId} is now ${String(newStage).toUpperCase()}.`
      }
    });

    return true;
  };

  const actions = {
    setUser: (user) =>
      dispatch({
        type: ActionTypes.SET_USER,
        payload: user
      }),

    logout: () =>
      dispatch({ type: ActionTypes.LOGOUT }),

    addCrop: (crop) => {
      const uniqueId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const newCrop = {
        ...crop,
        id: uniqueId
      };

      dispatch({
        type: ActionTypes.ADD_CROP,
        payload: newCrop
      });

      return newCrop;
    },

    updateCrop: (crop) =>
      dispatch({
        type: ActionTypes.UPDATE_CROP,
        payload: crop
      }),

    updateInventoryStage,

    addUser: (user) => {
      const uniqueId =
        user.id
        || (
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`
        );

      dispatch({
        type: ActionTypes.ADD_USER,
        payload: { ...user, id: uniqueId }
      });

      return uniqueId;
    },

    updateUser: (user) =>
      dispatch({
        type: ActionTypes.UPDATE_USER,
        payload: user
      }),

    removeUser: (userId) =>
      dispatch({
        type: ActionTypes.REMOVE_USER,
        payload: userId
      }),

    addTransaction: (transaction) =>
      dispatch({
        type: ActionTypes.ADD_TRANSACTION,
        payload: transaction
      }),

    toggleDarkMode: () =>
      dispatch({
        type: ActionTypes.TOGGLE_DARK_MODE
      }),

    addNotification: (notification) =>
      dispatch({
        type: ActionTypes.ADD_NOTIFICATION,
        payload: notification
      }),

    removeNotification: (id) =>
      dispatch({
        type: ActionTypes.REMOVE_NOTIFICATION,
        payload: id
      }),

    refreshCrops: fetchInventory,
    refreshUsers: fetchUsers
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
};

export default AppContext;
