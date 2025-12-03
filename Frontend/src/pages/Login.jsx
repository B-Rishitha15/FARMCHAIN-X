import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USER_ROLES, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '../utils/constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { 
  User, 
  Truck, 
  Store, 
  ShoppingCart, 
  Shield,
  Sun,
  Moon,
  Leaf
} from 'lucide-react';
import { apiLogin } from '../utils/api';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { actions, state } = useApp();
  const navigate = useNavigate();

  const roleIcons = {
    [USER_ROLES.FARMER]: User,
    [USER_ROLES.DISTRIBUTOR]: Truck,
    [USER_ROLES.RETAILER]: Store,
    [USER_ROLES.CONSUMER]: ShoppingCart,
    [USER_ROLES.ADMIN]: Shield
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Prefill admin demo credentials when admin role selected for convenience
    if (role === USER_ROLES.ADMIN) {
      setEmail(prev => prev );
      setPassword(prev => prev );
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!selectedRole) nextErrors.role = 'Please select a role';
    if (!email || email.trim().length === 0) nextErrors.email = 'Email is required';
    if (!password || password.trim().length === 0) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const backendRole = ROLE_DISPLAY_NAMES[selectedRole];
      const response = await apiLogin(email, password, backendRole);

      if (!response || response.message !== 'Login successful') {
        throw new Error(response?.message || 'Login failed');
      }

      const user = {
        id: response.id?.toString(),
        name: response.name || backendRole,
        role: selectedRole,
        email: response.email || email,
        token: response.token
      };

      actions.setUser(user);
      actions.addNotification({
        type: 'success',
        message: `Welcome, ${user.name}!`,
        duration: 3000
      });

      actions.refreshCrops();
      navigate(`/dashboard/${selectedRole}`);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error.message || 'Failed to login'
      }));
      actions.addNotification({
        type: 'error',
        message: 'Login failed',
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDarkMode = () => {
    actions.toggleDarkMode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow"
      >
        {state.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4"
          >
            <Leaf className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Farm Chain X
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Agricultural Traceability System
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <Card.Header>
            <Card.Title>Select Your Role</Card.Title>
            <Card.Description>
              Choose your role in the agricultural supply chain to access the appropriate dashboard.
            </Card.Description>
          </Card.Header>

          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.values(USER_ROLES).map((role) => {
                const Icon = roleIcons[role];
                const isSelected = selectedRole === role;
                
                return (
                  <motion.button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {ROLE_DISPLAY_NAMES[role]}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getRoleDescription(role)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {errors.form && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errors.form}</p>
            )}

            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mb-6 space-y-4"
              >
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  error={errors.email}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  error={errors.password}
                  required
                />
              </motion.div>
            )}

            <Button
              onClick={handleLogin}
              disabled={!selectedRole || isSubmitting}
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              {selectedRole
                ? isSubmitting
                  ? 'Signing in...'
                  : `Login as ${ROLE_DISPLAY_NAMES[selectedRole]}`
                : 'Select a Role'}
            </Button>
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
              <Link to="/register" className="text-primary-600 hover:underline">Register</Link>
            </div>
          </Card.Content>
        </Card>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Leaf className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Traceability</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track crops from farm to consumer</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Transparency</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Complete supply chain visibility</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-2">
              <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Multi-Role</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Support for all stakeholders</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const getRoleDescription = (role) => {
  const descriptions = {
    [USER_ROLES.FARMER]: 'Upload crops and generate QR codes',
    [USER_ROLES.DISTRIBUTOR]: 'Manage crop distribution to retailers',
    [USER_ROLES.RETAILER]: 'Mark crops as available for sale',
    [USER_ROLES.CONSUMER]: 'Scan QR codes to view crop journey',
    [USER_ROLES.ADMIN]: 'Monitor entire system and analytics'
  };
  return descriptions[role];
};

export default Login;
