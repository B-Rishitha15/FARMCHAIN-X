import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'default',
  ...props 
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };
  
  const classes = clsx(
    baseClasses,
    paddingClasses[padding],
    hover && 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
    className
  );
  
  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={clsx('mb-4', className)}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900 dark:text-gray-100', className)}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={clsx('text-sm text-gray-600 dark:text-gray-400 mt-1', className)}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={clsx('', className)}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={clsx('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
