import { CROP_STATUS, TRANSACTION_TYPES } from './constants';

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date for relative time
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateString);
};

// Generate 8-digit numeric code (10000000 - 99999999)
export const generate8DigitCode = () => {
  const min = 10000000;
  const max = 99999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

// Generate QR code data
export const generateQRData = (crop) => {
  return JSON.stringify({
    cropId: crop.id,
    name: crop.name,
    farmer: crop.farmerName,
    location: crop.location,
    timestamp: crop.createdAt,
    harvestedDate: crop.harvestedDate,
    freshUntilDate: crop.freshUntilDate
  });
};

// Parse QR code data
export const parseQRData = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
};

// Get next status in the chain
export const getNextStatus = (currentStatus, userRole) => {
  const statusFlow = {
    [CROP_STATUS.PLANTED]: CROP_STATUS.HARVESTED,
    [CROP_STATUS.HARVESTED]: CROP_STATUS.IN_TRANSIT,
    [CROP_STATUS.IN_TRANSIT]: CROP_STATUS.AT_DISTRIBUTOR,
    [CROP_STATUS.AT_DISTRIBUTOR]: CROP_STATUS.AT_RETAILER,
    [CROP_STATUS.AT_RETAILER]: CROP_STATUS.AVAILABLE_FOR_SALE,
    [CROP_STATUS.AVAILABLE_FOR_SALE]: CROP_STATUS.SOLD
  };
  
  return statusFlow[currentStatus] || currentStatus;
};

// Check if user can perform action on crop
export const canUserPerformAction = (crop, userRole) => {
  switch (userRole) {
    case 'farmer':
      return crop.status === CROP_STATUS.PLANTED;
    case 'distributor':
      return crop.status === CROP_STATUS.AT_DISTRIBUTOR;
    case 'retailer':
      return crop.status === CROP_STATUS.AT_RETAILER;
    case 'consumer':
      return crop.status === CROP_STATUS.AVAILABLE_FOR_SALE;
    default:
      return false;
  }
};

// Generate crop journey timeline
export const generateCropJourney = (crop, transactions) => {
  const journey = [
    {
      id: '1',
      title: 'Crop Planted',
      description: `${crop.name} was planted at ${crop.location}`,
      timestamp: crop.createdAt,
      status: 'completed',
      icon: '🌱'
    }
  ];
  
  // Add transaction-based journey steps
  transactions
    .filter(t => t.cropId === crop.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .forEach((transaction, index) => {
      let title, description, icon;
      
      switch (transaction.type) {
        case TRANSACTION_TYPES.CROP_UPLOAD:
          title = 'Crop Harvested & Uploaded';
          description = `Farmer ${transaction.userName} uploaded the crop`;
          icon = '📤';
          break;
        case TRANSACTION_TYPES.FORWARD_TO_RETAILER:
          title = 'Forwarded to Retailer';
          description = `Distributor ${transaction.userName} forwarded the crop`;
          icon = '🚚';
          break;
        case TRANSACTION_TYPES.MARK_AVAILABLE:
          title = 'Available for Sale';
          description = `Retailer ${transaction.userName} marked as available`;
          icon = '🏪';
          break;
        case TRANSACTION_TYPES.PURCHASE:
          title = 'Purchased by Consumer';
          description = `Consumer ${transaction.userName} purchased the crop`;
          icon = '🛒';
          break;
        default:
          title = 'Status Update';
          description = transaction.details;
          icon = '📝';
      }
      
      journey.push({
        id: `transaction-${transaction.id}`,
        title,
        description,
        timestamp: transaction.timestamp,
        status: 'completed',
        icon
      });
    });
  
  // Add current status
  const currentStatus = {
    id: 'current',
    title: `Current Status: ${crop.status.replace('_', ' ').toUpperCase()}`,
    description: `The crop is currently ${crop.status.replace('_', ' ')}`,
    timestamp: new Date().toISOString(),
    status: 'current',
    icon: '📍'
  };
  
  journey.push(currentStatus);
  
  return journey;
};

// Validate crop data
export const validateCropData = (cropData) => {
  const errors = {};
  
  if (!cropData.name || cropData.name.trim().length < 2) {
    errors.name = 'Crop name must be at least 2 characters long';
  }
  
  if (!cropData.quantity || cropData.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1';
  }
  
  if (!cropData.location || cropData.location.trim().length < 5) {
    errors.location = 'Location must be at least 5 characters long';
  }
  
  // Date validations
  if (!cropData.harvestedDate) {
    errors.harvestedDate = 'Harvested date is required';
  }
  if (!cropData.freshUntilDate) {
    errors.freshUntilDate = 'Fresh-until date is required';
  }
  if (cropData.harvestedDate && cropData.freshUntilDate) {
    const h = new Date(cropData.harvestedDate);
    const f = new Date(cropData.freshUntilDate);
    if (isNaN(h.getTime())) {
      errors.harvestedDate = 'Provide a valid harvested date';
    }
    if (isNaN(f.getTime())) {
      errors.freshUntilDate = 'Provide a valid fresh-until date';
    }
    if (!errors.harvestedDate && !errors.freshUntilDate && f < h) {
      errors.freshUntilDate = 'Fresh-until date must be after harvested date';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
