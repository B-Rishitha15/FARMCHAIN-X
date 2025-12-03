// User roles
export const USER_ROLES = {
  FARMER: 'farmer',
  DISTRIBUTOR: 'distributor',
  RETAILER: 'retailer',
  CONSUMER: 'consumer',
  ADMIN: 'admin'
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.FARMER]: 'Farmer',
  [USER_ROLES.DISTRIBUTOR]: 'Distributor',
  [USER_ROLES.RETAILER]: 'Retailer',
  [USER_ROLES.CONSUMER]: 'Consumer',
  [USER_ROLES.ADMIN]: 'Admin'
};

// Role colors for UI
export const ROLE_COLORS = {
  [USER_ROLES.FARMER]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [USER_ROLES.DISTRIBUTOR]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [USER_ROLES.RETAILER]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [USER_ROLES.CONSUMER]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [USER_ROLES.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export const DEFAULT_CROP_IMAGE = 'https://placehold.co/600x400?text=Crop';

// Crop status
export const CROP_STATUS = {
  PLANTED: 'planted',
  HARVESTED: 'harvested',
  IN_TRANSIT: 'in_transit',
  AT_DISTRIBUTOR: 'at_distributor',
  AT_RETAILER: 'at_retailer',
  AVAILABLE_FOR_SALE: 'available_for_sale',
  SOLD: 'sold'
};

// Status display names
export const STATUS_DISPLAY_NAMES = {
  [CROP_STATUS.PLANTED]: 'Planted',
  [CROP_STATUS.HARVESTED]: 'Harvested',
  [CROP_STATUS.IN_TRANSIT]: 'In Transit',
  [CROP_STATUS.AT_DISTRIBUTOR]: 'At Distributor',
  [CROP_STATUS.AT_RETAILER]: 'At Retailer',
  [CROP_STATUS.AVAILABLE_FOR_SALE]: 'Available for Sale',
  [CROP_STATUS.SOLD]: 'Sold'
};

// Status colors
export const STATUS_COLORS = {
  [CROP_STATUS.PLANTED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [CROP_STATUS.HARVESTED]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [CROP_STATUS.IN_TRANSIT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [CROP_STATUS.AT_DISTRIBUTOR]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [CROP_STATUS.AT_RETAILER]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  [CROP_STATUS.AVAILABLE_FOR_SALE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [CROP_STATUS.SOLD]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

// Transaction types
export const TRANSACTION_TYPES = {
  CROP_UPLOAD: 'crop_upload',
  FORWARD_TO_RETAILER: 'forward_to_retailer',
  MARK_AVAILABLE: 'mark_available',
  PURCHASE: 'purchase'
};

// Transaction type display names
export const TRANSACTION_TYPE_DISPLAY_NAMES = {
  [TRANSACTION_TYPES.CROP_UPLOAD]: 'Crop Uploaded',
  [TRANSACTION_TYPES.FORWARD_TO_RETAILER]: 'Forwarded to Retailer',
  [TRANSACTION_TYPES.MARK_AVAILABLE]: 'Marked Available',
  [TRANSACTION_TYPES.PURCHASE]: 'Purchased'
};

// Mock data for initial setup
export const MOCK_USERS = [
  { id: '1', name: 'John Farmer', role: USER_ROLES.FARMER, email: 'john@farm.com' },
  { id: '2', name: 'Sarah Distributor', role: USER_ROLES.DISTRIBUTOR, email: 'sarah@dist.com' },
  { id: '3', name: 'Mike Retailer', role: USER_ROLES.RETAILER, email: 'mike@retail.com' },
  { id: '4', name: 'Lisa Consumer', role: USER_ROLES.CONSUMER, email: 'lisa@consumer.com' },
  { id: '5', name: 'Admin User', role: USER_ROLES.ADMIN, email: 'admin@example.com', password: 'password123' }
];

export const MOCK_CROPS = [
  {
    id: '1',
    name: 'Organic Tomatoes',
    quantity: 100,
    location: 'Green Valley Farm, CA',
    image: DEFAULT_CROP_IMAGE,
    status: CROP_STATUS.HARVESTED,
    farmerId: '1',
    farmerName: 'John Farmer',
    createdAt: new Date('2024-01-15').toISOString(),
    qrCode: 'CROP_001_TOMATOES'
  },
  {
    id: '2',
    name: 'Fresh Lettuce',
    quantity: 50,
    location: 'Sunny Acres, TX',
    image: DEFAULT_CROP_IMAGE,
    status: CROP_STATUS.AT_DISTRIBUTOR,
    farmerId: '1',
    farmerName: 'John Farmer',
    createdAt: new Date('2024-01-16').toISOString(),
    qrCode: 'CROP_002_LETTUCE'
  }
];

export const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: TRANSACTION_TYPES.CROP_UPLOAD,
    cropId: '1',
    userId: '1',
    userName: 'John Farmer',
    timestamp: new Date('2024-01-15T10:00:00').toISOString(),
    details: 'Uploaded Organic Tomatoes'
  },
  {
    id: '2',
    type: TRANSACTION_TYPES.FORWARD_TO_RETAILER,
    cropId: '2',
    userId: '2',
    userName: 'Sarah Distributor',
    timestamp: new Date('2024-01-16T14:30:00').toISOString(),
    details: 'Forwarded Fresh Lettuce to retailer'
  }
];
