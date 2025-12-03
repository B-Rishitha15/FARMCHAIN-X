import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Input = ({ 
  label,
  error,
  helperText,
  className = '',
  ...props 
}) => {
  const inputClasses = clsx(
    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200',
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
    'border-gray-300 dark:border-gray-600',
    error && 'border-red-500 focus:ring-red-500',
    className
  );
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <motion.input
        className={inputClasses}
        whileFocus={{ scale: 1.01 }}
        {...props}
      />
      {error && (
        <motion.p 
          className="text-sm text-red-600 dark:text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

const Textarea = ({ 
  label,
  error,
  helperText,
  className = '',
  ...props 
}) => {
  const textareaClasses = clsx(
    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 resize-none',
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
    'border-gray-300 dark:border-gray-600',
    error && 'border-red-500 focus:ring-red-500',
    className
  );
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <motion.textarea
        className={textareaClasses}
        whileFocus={{ scale: 1.01 }}
        {...props}
      />
      {error && (
        <motion.p 
          className="text-sm text-red-600 dark:text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

const Select = ({ 
  label,
  error,
  helperText,
  options = [],
  className = '',
  ...props 
}) => {
  const selectClasses = clsx(
    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200',
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
    'border-gray-300 dark:border-gray-600',
    error && 'border-red-500 focus:ring-red-500',
    className
  );
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <motion.select
        className={selectClasses}
        whileFocus={{ scale: 1.01 }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </motion.select>
      {error && (
        <motion.p 
          className="text-sm text-red-600 dark:text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

Input.Textarea = Textarea;
Input.Select = Select;

export default Input;
