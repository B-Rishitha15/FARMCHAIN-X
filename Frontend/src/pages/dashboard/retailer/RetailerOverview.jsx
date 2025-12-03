import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { CROP_STATUS, STATUS_DISPLAY_NAMES, TRANSACTION_TYPES } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { 
  Store, 
  Package, 
  TrendingUp, 
  ShoppingCart,
  MapPin,
  CheckCircle
} from 'lucide-react';

const RetailerOverview = () => {
  const { state } = useApp();
  const { user, crops, transactions } = state;

  // Filter crops that are at retailer or available for sale
  const retailerCrops = crops.filter(crop => 
    crop.status === CROP_STATUS.AT_RETAILER || crop.status === CROP_STATUS.AVAILABLE_FOR_SALE
  );
  
  const receivedCrops = crops.filter(crop => crop.status === CROP_STATUS.AT_RETAILER);
  const availableCrops = crops.filter(crop => crop.status === CROP_STATUS.AVAILABLE_FOR_SALE);
  const soldCrops = crops.filter(crop => crop.status === CROP_STATUS.SOLD);
  const recentCrops = retailerCrops.slice(0, 5);


  const stats = [
    {
      title: 'Received Crops',
      value: receivedCrops.length,
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: 'Available for Sale',
      value: availableCrops.length,
      icon: Store,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Sold',
      value: soldCrops.length,
      icon: ShoppingCart,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
    },
    {
      title: 'This Month',
      value: crops.filter(crop => {
        const cropDate = new Date(crop.createdAt);
        const now = new Date();
        return cropDate.getMonth() === now.getMonth() && cropDate.getFullYear() === now.getFullYear();
      }).length,
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your retail inventory and mark crops as available for sale.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Crops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Recent Inventory</Card.Title>
            <Card.Description>
              Latest crops received and their current status.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {recentCrops.length > 0 ? (
              <div className="space-y-4">
                {recentCrops.map((crop, index) => (
                  <motion.div
                    key={crop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {crop.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {crop.quantity} units • {crop.farmerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="primary">
                        {STATUS_DISPLAY_NAMES[crop.status]}
                      </Badge>
                      {crop.status === CROP_STATUS.AT_RETAILER && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No crops in inventory yet.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
            <Card.Description>
              Common retail tasks you can perform.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center space-x-3 p-3 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
              >
                <Store className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="font-medium text-primary-700 dark:text-primary-300">
                  Mark as Available
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  View Received Crops
                </span>
              </motion.button>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Store Locations */}
      {retailerCrops.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Store Inventory</Card.Title>
            <Card.Description>
              Current inventory across your retail locations.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {retailerCrops.map((crop, index) => (
                <motion.div
                  key={crop.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {crop.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From: {crop.location}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">
                      {crop.quantity} units
                    </Badge>
                    <Badge variant="primary">
                      {STATUS_DISPLAY_NAMES[crop.status]}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default RetailerOverview;
