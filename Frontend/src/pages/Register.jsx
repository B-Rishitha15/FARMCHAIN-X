import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { USER_ROLES, ROLE_DISPLAY_NAMES } from '../utils/constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { User, Truck, Store, ShoppingCart, Shield, Leaf } from 'lucide-react';
import { apiRegister, apiLogin } from '../utils/api';

const Register = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { actions } = useApp();
  const navigate = useNavigate();

  const roleIcons = {
    [USER_ROLES.FARMER]: User,
    [USER_ROLES.DISTRIBUTOR]: Truck,
    [USER_ROLES.RETAILER]: Store,
    [USER_ROLES.CONSUMER]: ShoppingCart,
    [USER_ROLES.ADMIN]: Shield
  };

  const validate = () => {
    const nextErrors = {};
    if (!selectedRole) nextErrors.role = 'Please select a role';
    if (!name || name.trim().length === 0) nextErrors.name = 'Name is required';
    if (!email || email.trim().length === 0) nextErrors.email = 'Email is required';
    if (!password || password.trim().length === 0) nextErrors.password = 'Password is required';
    // Password strength checks: min 8 chars, uppercase, lowercase, number, special char
    if (password && password.trim().length > 0) {
      const pwd = password;
      const pwdErrors = [];
      if (pwd.length < 8) pwdErrors.push('at least 8 characters');
      if (!/[A-Z]/.test(pwd)) pwdErrors.push('one uppercase letter');
      if (!/[a-z]/.test(pwd)) pwdErrors.push('one lowercase letter');
      if (!/[0-9]/.test(pwd)) pwdErrors.push('one number');
      if (!/[^A-Za-z0-9]/.test(pwd)) pwdErrors.push('one special character');
      if (pwdErrors.length) nextErrors.password = `Password must include ${pwdErrors.join(', ')}.`;
    }
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    // If role is admin, require admin code
    if (selectedRole === USER_ROLES.ADMIN) {
      if (!adminCode || adminCode.trim().length === 0) nextErrors.adminCode = 'Admin code is required';
      if (adminCode.trim() !== '123456') nextErrors.adminCode = 'Wrong admin code';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const backendRole = ROLE_DISPLAY_NAMES[selectedRole];
      await apiRegister({
        name,
        email,
        password,
        role: backendRole
      });

      // Auto-login after successful registration
      const response = await apiLogin(email, password, backendRole);
      if (!response || response.message !== 'Login successful') {
        throw new Error('Registration succeeded but login failed. Please try logging in.');
      }

      const user = {
        id: response.id?.toString(),
        name: response.name || name,
        role: selectedRole,
        email: response.email || email,
        token: response.token
        ,createdAt: new Date().toISOString(),
        isActive: true
      };

      // Add to users list so admin can see newly registered users
      actions.addUser(user);
      // Refresh users from server so admin sees the new users if backend stored them
      if (actions.refreshUsers) actions.refreshUsers();
      actions.setUser(user);
      actions.addNotification({
        type: 'success',
        message: `Account created! Welcome, ${user.name}.`,
        duration: 3000
      });

      actions.refreshCrops();
      navigate(`/dashboard/${selectedRole}`);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error.message || 'Registration failed'
      }));
      actions.addNotification({
        type: 'error',
        message: 'Registration failed',
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4"
          >
            <Leaf className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Join Farm Chain X</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <Card.Header>
            <Card.Title>Select Your Role</Card.Title>
            <Card.Description>Choose your role to tailor your experience.</Card.Description>
          </Card.Header>

          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.values(USER_ROLES).map((role) => {
                const Icon = roleIcons[role];
                const isSelected = selectedRole === role;
                return (
                  <motion.button
                    key={role}
                    onClick={() => setSelectedRole(role)}
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
                        <h3 className="font-semibold text-gray-900 dark:text-white">{ROLE_DISPLAY_NAMES[role]}</h3>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {errors.role && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{errors.role}</p>
            )}

            <div className="space-y-4 mb-6">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                error={errors.name}
                required
              />
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
                placeholder="Create a password"
                error={errors.password}
                required
              />
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.
              </p>
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                required
              />
              {selectedRole === USER_ROLES.ADMIN && (
                <Input
                  label="Admin Code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter admin code"
                  error={errors.adminCode}
                  required
                />
              )}
            </div>

            {errors.form && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{errors.form}</p>
            )}

            <Button
              onClick={handleRegister}
              disabled={!selectedRole || isSubmitting}
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              {selectedRole
                ? isSubmitting
                  ? 'Creating account...'
                  : `Create ${ROLE_DISPLAY_NAMES[selectedRole]} Account`
                : 'Select a Role'}
            </Button>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
              <Link to="/" className="text-primary-600 hover:underline">Log in</Link>
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;










