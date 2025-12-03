import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FarmerOverview from './farmer/FarmerOverview';
import CropUpload from './farmer/CropUpload';
import MyCrops from './farmer/MyCrops';
import QualityScore from './farmer/QualityScore';

const FarmerDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<FarmerOverview />} />
      <Route path="/upload" element={<CropUpload />} />
      <Route path="/crops" element={<MyCrops />} />
      <Route path="/quality-score" element={<QualityScore />} />
      <Route path="*" element={<Navigate to="/dashboard/farmer" replace />} />
    </Routes>
  );
};

export default FarmerDashboard;
