import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import NotificationToast from '../ui/NotificationToast';

const Layout = ({ children }) => {
  const { state } = useApp();
  const { user, darkMode } = state;

  // Apply dark mode to document
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!user) {
    return children;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {children}
        </motion.div>
      </main>
      <NotificationToast />
    </div>
  );
};

export default Layout;
