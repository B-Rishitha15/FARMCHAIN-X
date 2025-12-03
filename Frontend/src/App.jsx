import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard components
import FarmerDashboard from './pages/dashboard/FarmerDashboard';
import DistributorDashboard from './pages/dashboard/DistributorDashboard';
import RetailerDashboard from './pages/dashboard/RetailerDashboard';
import ConsumerDashboard from './pages/dashboard/ConsumerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { state } = useApp();
  return state.user ? children : <Navigate to="/" replace />;
};

// Main App component
const AppContent = () => {
  const { state } = useApp();
  const { user } = state;

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={user ? <Navigate to={`/dashboard/${user.role}`} replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to={`/dashboard/${user.role}`} replace /> : <Register />} 
        />
        
        {/* Protected dashboard routes */}
        <Route
          path="/dashboard/farmer/*"
          element={
            <ProtectedRoute>
              <Layout>
                <FarmerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard/distributor/*"
          element={
            <ProtectedRoute>
              <Layout>
                <DistributorDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard/retailer/*"
          element={
            <ProtectedRoute>
              <Layout>
                <RetailerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard/consumer/*"
          element={
            <ProtectedRoute>
              <Layout>
                <ConsumerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard/admin/*"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// App component with provider
const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
