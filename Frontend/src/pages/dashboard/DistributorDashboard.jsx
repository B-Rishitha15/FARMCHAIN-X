import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DistributorOverview from './distributor/DistributorOverview';
import CropInventory from './distributor/CropInventory';
import ForwardCrops from './distributor/ForwardCrops';

const DistributorDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<DistributorOverview />} />
      <Route path="/inventory" element={<CropInventory />} />
      <Route path="/forward" element={<ForwardCrops />} />
      <Route path="*" element={<Navigate to="/dashboard/distributor" replace />} />
    </Routes>
  );
};

export default DistributorDashboard;
