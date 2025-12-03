import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminOverview from './admin/AdminOverview';
import AllCrops from './admin/AllCrops';
import AllUsers from './admin/AllUsers';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminOverview />} />
      <Route path="/overview" element={<AdminOverview />} />
      <Route path="/crops" element={<AllCrops />} />
      <Route path="/users" element={<AllUsers />} />
      <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
    </Routes>
  );
};

export default AdminDashboard;
