import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { CROP_STATUS, STATUS_DISPLAY_NAMES, STATUS_COLORS } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { 
  Package, 
  Store, 
  MapPin, 
  Calendar, 
  Search,
  Filter,
  Eye,
  CheckCircle
} from 'lucide-react';

const ReceivedCrops = () => {
  const { state } = useApp();
  const { user, crops } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter crops that are at retailer
  const receivedCrops = crops.filter(crop => crop.status === CROP_STATUS.AT_RETAILER);

  // Filter crops based on search and status
  const filteredCrops = receivedCrops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || crop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Received Crops
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage crops received from distributors.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search crops by name, location, or farmer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              <option value="at_retailer">At Retailer</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Received</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{receivedCrops.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ready to Mark</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {receivedCrops.filter(crop => crop.status === CROP_STATUS.AT_RETAILER).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {receivedCrops.filter(crop => {
                  const cropDate = new Date(crop.createdAt);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return cropDate >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Crops List */}
      {filteredCrops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop, index) => (
            <motion.div
              key={crop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <Card.Content>
                  <div className="space-y-4">
                    {/* Crop Image */}
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={crop.image}
                        alt={crop.name}
                        className="w-full h-32 object-cover"
                      />
                    </div>

                    {/* Crop Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {crop.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {crop.quantity} units
                      </p>
                    </div>

                    {/* Farmer */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Package className="h-4 w-4" />
                      <span>From: {crop.farmerName}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{crop.location}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(crop.createdAt)}</span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(crop.status)}>
                        {STATUS_DISPLAY_NAMES[crop.status]}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Available
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No crops found' : 'No crops received yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Crops will appear here when distributors forward them to your store.'
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReceivedCrops;
