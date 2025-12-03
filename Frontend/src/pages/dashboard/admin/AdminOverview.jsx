import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { USER_ROLES, CROP_STATUS, TRANSACTION_TYPES, ROLE_DISPLAY_NAMES, STATUS_DISPLAY_NAMES } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp,
  MapPin,
  Calendar,
  Activity,
  Shield
} from 'lucide-react';

const AdminOverview = () => {
  const { state } = useApp();
  const { user, crops, transactions, users } = state;

  // Calculate statistics
  const totalUsers = users.length;
  const totalCrops = crops.length;
  const totalTransactions = transactions.length;
  
  // User statistics by role
  const usersByRole = Object.values(USER_ROLES).map(role => ({
    role,
    count: users.filter(u => u.role === role).length
  }));
  
  // Crop statistics by status
  const cropsByStatus = Object.values(CROP_STATUS).map(status => ({
    status,
    count: crops.filter(c => c.status === status).length
  }));
  
  // Recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  
  // Recent crops
  const recentCrops = crops
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // total sales amount removed as dashboard-level stat was requested to be removed

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: 'Total Crops',
      value: totalCrops,
      icon: Package,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Total Transactions',
      value: totalTransactions,
      icon: Activity,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
    },
    {
      title: 'Active This Month',
      value: transactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        const now = new Date();
        return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
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
          System Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor the entire Farm Chain X system and track all activities across the supply chain.
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

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card>
          <Card.Header>
            <Card.Title>Users by Role</Card.Title>
            <Card.Description>
              Distribution of users across different roles in the system.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {usersByRole.map((item, index) => (
                <motion.div
                  key={item.role}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {ROLE_DISPLAY_NAMES[item.role]}
                    </span>
                  </div>
                  <Badge variant="primary">
                    {item.count}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Crops by Status */}
        <Card>
          <Card.Header>
            <Card.Title>Crops by Status</Card.Title>
            <Card.Description>
              Current status distribution of all crops in the system.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {cropsByStatus.filter(item => item.count > 0).map((item, index) => (
                <motion.div
                  key={item.status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {STATUS_DISPLAY_NAMES[item.status]}
                    </span>
                  </div>
                  <Badge variant="success">
                    {item.count}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Recent Transactions</Card.Title>
            <Card.Description>
              Latest activities across the supply chain.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.userName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.details}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No transactions yet.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Recent Crops</Card.Title>
            <Card.Description>
              Latest crops added to the system.
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
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {crop.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {crop.farmerName} • {crop.quantity} units
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="primary">
                        {STATUS_DISPLAY_NAMES[crop.status]}
                      </Badge>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatDate(crop.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No crops added yet.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <Card.Header>
          <Card.Title>System Health</Card.Title>
          <Card.Description>
            Overall system status and performance metrics.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">System Status</h3>
              <p className="text-sm text-green-600 dark:text-green-400">All Systems Operational</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Performance</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">Excellent</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Growth</h3>
              <p className="text-sm text-purple-600 dark:text-purple-400">+25% This Month</p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default AdminOverview;
