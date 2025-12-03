import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { CROP_STATUS, STATUS_DISPLAY_NAMES, STATUS_COLORS } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { 
  Package, 
  Search,
  Filter,
  Eye,
  MapPin,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';

const AllCrops = () => {
  const { state } = useApp();
  const { crops } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [farmerFilter, setFarmerFilter] = useState('all');

  // Get unique farmers for filter
  const farmers = [...new Set(crops.map(crop => crop.farmerName))];

  // Filter crops based on search and filters
  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || crop.status === statusFilter;
    const matchesFarmer = farmerFilter === 'all' || crop.farmerName === farmerFilter;
    return matchesSearch && matchesStatus && matchesFarmer;
  });

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const [detailsCrop, setDetailsCrop] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (crop) => {
    setDetailsCrop(crop);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          All Crops
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage all crops in the Farm Chain X system.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search crops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              {Object.values(CROP_STATUS).map(status => (
                <option key={status} value={status}>
                  {STATUS_DISPLAY_NAMES[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={farmerFilter}
              onChange={(e) => setFarmerFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Farmers</option>
              {farmers.map(farmer => (
                <option key={farmer} value={farmer}>
                  {farmer}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Crops</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{crops.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {crops.filter(crop => crop.status === CROP_STATUS.AVAILABLE_FOR_SALE).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sold</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {crops.filter(crop => crop.status === CROP_STATUS.SOLD).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {crops.filter(crop => {
                  const cropDate = new Date(crop.createdAt);
                  const now = new Date();
                  return cropDate.getMonth() === now.getMonth() && cropDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Crops Table */}
      <Card>
        <Card.Header>
          <Card.Title>Crop Inventory</Card.Title>
          <Card.Description>
            Complete list of all crops in the system with their current status.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {filteredCrops.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Crop</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Farmer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrops.map((crop, index) => (
                    <motion.tr
                      key={crop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={crop.image}
                              alt={crop.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{crop.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{crop.qrCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900 dark:text-white">{crop.farmerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900 dark:text-white truncate max-w-32">{crop.location}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-white">{crop.quantity} units</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(crop.status)}>
                          {STATUS_DISPLAY_NAMES[crop.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900 dark:text-white">{formatDate(crop.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(crop)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || statusFilter !== 'all' || farmerFilter !== 'all' ? 'No crops found' : 'No crops in system'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || farmerFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Crops will appear here when farmers upload them.'
                }
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsCrop(null);
        }}
        title="Crop Details"
        size="lg"
      >
        {detailsCrop && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <img
                  src={detailsCrop.image}
                  alt={detailsCrop.name}
                  className="w-full md:w-64 h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <p><span className="font-semibold">Name:</span> {detailsCrop.name}</p>
                <p><span className="font-semibold">Farmer:</span> {detailsCrop.farmerName}</p>
                <p><span className="font-semibold">Quantity:</span> {detailsCrop.quantity} units</p>
                <p><span className="font-semibold">Location:</span> {detailsCrop.location}</p>
                <p><span className="font-semibold">Harvested:</span> {detailsCrop.harvestedDate ? formatDate(detailsCrop.harvestedDate) : '—'}</p>
                <p><span className="font-semibold">Status:</span> {STATUS_DISPLAY_NAMES[detailsCrop.status]}</p>
                <p><span className="font-semibold">QR Reference:</span> {detailsCrop.qrCode}</p>
                {typeof detailsCrop.aiScore === 'number' && (
                  <p><span className="font-semibold">AI Score:</span> {Math.round(detailsCrop.aiScore)} / 100 {detailsCrop.aiVerdict ? `(${detailsCrop.aiVerdict})` : ''}</p>
                )}
                {detailsCrop.description && (
                  <p className="text-gray-600 dark:text-gray-300">
                    {detailsCrop.description}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => setShowDetailsModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllCrops;

