import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { USER_ROLES, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { 
  Users, 
  Search,
  Eye,
  Mail,
  Calendar,
  Shield,
  TrendingUp
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';

const AllUsers = () => {
  const { state, actions } = useApp();
  const { users } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Ensure we refresh users when this admin screen is visited to ensure we sync new users added via other sessions
  React.useEffect(() => {
    if (actions && actions.refreshUsers) {
      actions.refreshUsers();
    }
  }, [actions]);

  const getRoleColor = (role) => {
    return ROLE_COLORS[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // No per-user crop or transaction counts necessary for the admin table view

  const [detailsUser, setDetailsUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [manageUser, setManageUser] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageForm, setManageForm] = useState({ role: '', isActive: true });

  const handleViewUser = (user) => {
    setDetailsUser(user);
    setShowDetailsModal(true);
  };

  const handleOpenManage = (user) => {
    setManageUser(user);
    setManageForm({ role: user.role, isActive: user.isActive !== false });
    setShowManageModal(true);
  };

  const handleManageChange = (e) => {
    const { name, type, value, checked } = e.target;
    setManageForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveManage = () => {
    if (!manageUser) return;
    const updated = {
      ...manageUser,
      role: manageForm.role,
      isActive: manageForm.isActive
    };
    // Use AppContext actions to update the user
    actions.updateUser(updated);
    setShowManageModal(false);
    setManageUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          All Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage all users in the Farm Chain X system.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Roles</option>
              {Object.values(USER_ROLES).map(role => (
                <option key={role} value={role}>
                  {ROLE_DISPLAY_NAMES[role]}
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
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Farmers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {users.filter(user => user.role === USER_ROLES.FARMER).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Consumers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {users.filter(user => user.role === USER_ROLES.CONSUMER).length}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Today</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {users.filter(user => {
                  // In a real app, you would check actual activity
                  return Math.random() > 0.5; // Mock data
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <Card.Header>
          <Card.Title>User Directory</Card.Title>
          <Card.Description>
            Complete list of all users in the system with their roles and activity.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="flex justify-end mb-2">
            <Button size="sm" variant="outline" onClick={() => actions.refreshUsers && actions.refreshUsers()}>
              Refresh
            </Button>
          </div>
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Email</th>
                    
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Joined</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getRoleColor(user.role)}>
                            {ROLE_DISPLAY_NAMES[user.role]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-900 dark:text-white">{user.email}</span>
                          </div>
                        </td>
                        
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-900 dark:text-white">
                              {formatDate(user.createdAt || new Date().toISOString())}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {user.role !== USER_ROLES.ADMIN && (
                                <Button variant="secondary" size="sm" onClick={() => handleOpenManage(user)}>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Manage
                                </Button>
                              )}
                            </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || roleFilter !== 'all' ? 'No users found' : 'No users in system'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Users will appear here when they register.'
                }
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
      <Modal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setDetailsUser(null); }}
        title="User Details"
        size="md"
      >
        {detailsUser && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold">{detailsUser.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{detailsUser.email}</p>
                <p className="text-sm text-gray-500">Role: {ROLE_DISPLAY_NAMES[detailsUser.role]}</p>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">ID:</span> {detailsUser.id}</p>
              <p><span className="font-medium">Joined:</span> {formatDate(detailsUser.createdAt || new Date().toISOString())}</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => { setShowDetailsModal(false); setDetailsUser(null); }} className="flex-1">Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showManageModal}
        onClose={() => { setShowManageModal(false); setManageUser(null); }}
        title="Manage User"
        size="md"
      >
        {manageUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm">Role</label>
              <select name="role" value={manageForm.role} onChange={handleManageChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {Object.values(USER_ROLES).map(r => (
                  <option key={r} value={r}>{ROLE_DISPLAY_NAMES[r]}</option>
                ))}
              </select>
              <label className="text-sm flex items-center space-x-2"><input type="checkbox" name="isActive" checked={manageForm.isActive} onChange={handleManageChange} /> <span>Active</span></label>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowManageModal(false); setManageUser(null); }}>Cancel</Button>
              <Button className="flex-1" onClick={saveManage}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllUsers;
