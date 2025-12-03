import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Upload, 
  Package, 
  Store, 
  QrCode, 
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Leaf,
  ShoppingCart
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const { user, darkMode } = state;

  if (!user) return null;

  const navigationItems = {
    [user.role]: [
      { name: 'Dashboard', path: `/dashboard/${user.role}`, icon: Home },
      ...(user.role === 'farmer' ? [
        { name: 'Upload Crop', path: `/dashboard/${user.role}/upload`, icon: Upload },
        { name: 'My Crops', path: `/dashboard/${user.role}/crops`, icon: Package }
      ] : []),
      ...(user.role === 'distributor' ? [
        { name: 'Crop Inventory', path: `/dashboard/${user.role}/inventory`, icon: Package },
        { name: 'Forward Crops', path: `/dashboard/${user.role}/forward`, icon: Package }
      ] : []),
      ...(user.role === 'retailer' ? [
        { name: 'Received Crops', path: `/dashboard/${user.role}/received`, icon: Package },
        { name: 'Mark Available', path: `/dashboard/${user.role}/available`, icon: Store }
      ] : []),
      ...(user.role === 'consumer' ? [
        { name: 'QR Scanner', path: `/dashboard/${user.role}/scanner`, icon: QrCode },
        { name: 'Scan History', path: `/dashboard/${user.role}/history`, icon: Package },
        { name: 'Purchases', path: `/dashboard/${user.role}/purchases`, icon: ShoppingCart }
      ] : []),
      ...(user.role === 'admin' ? [
        { name: 'All Crops', path: `/dashboard/${user.role}/crops`, icon: Package },
        { name: 'All Users', path: `/dashboard/${user.role}/users`, icon: Home }
      ] : [])
    ]
  };

  const handleLogout = () => {
    actions.logout();
    navigate('/');
  };

  const toggleDarkMode = () => {
    actions.toggleDarkMode();
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Farm Chain X
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.name}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems[user.role]?.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
