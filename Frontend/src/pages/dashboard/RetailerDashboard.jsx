import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RetailerOverview from './retailer/RetailerOverview';
import ReceivedCrops from './retailer/ReceivedCrops';
import MarkAvailable from './retailer/MarkAvailable';

const RetailerDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<RetailerOverview />} />
      <Route path="/received" element={<ReceivedCrops />} />
      <Route path="/available" element={<MarkAvailable />} />
      <Route path="*" element={<Navigate to="/dashboard/retailer" replace />} />
    </Routes>
  );
};

export default RetailerDashboard;
