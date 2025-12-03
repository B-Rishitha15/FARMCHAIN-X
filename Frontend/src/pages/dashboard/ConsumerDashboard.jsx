import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ConsumerOverview from './consumer/ConsumerOverview';
import QRScanner from './consumer/QRScanner';
import ScanHistory from './consumer/ScanHistory';
import Purchases from './consumer/Purchases';

const ConsumerDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<ConsumerOverview />} />
      <Route path="/scanner" element={<QRScanner />} />
      <Route path="/history" element={<ScanHistory />} />
      <Route path="/purchases" element={<Purchases />} />
      <Route path="*" element={<Navigate to="/dashboard/consumer" replace />} />
    </Routes>
  );
};

export default ConsumerDashboard;
