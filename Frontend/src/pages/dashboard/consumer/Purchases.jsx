import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { formatDate } from '../../../utils/helpers';
import { ShoppingCart } from 'lucide-react';

const Purchases = () => {
  const { state } = useApp();
  const { user, transactions, crops } = state;

  const purchases = transactions
    .filter(t => t.type === 'purchase' && t.userId === user.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Purchases</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">All products you purchased on the platform.</p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Purchase History</Card.Title>
          <Card.Description>List of items you bought along with details.</Card.Description>
        </Card.Header>
        <Card.Content>
          {purchases.length > 0 ? (
            <div className="space-y-4">
              {purchases.map((p, idx) => {
                const crop = crops.find(c => c.id === p.cropId);
                return (
                  <motion.div key={p.id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img src={crop?.image} alt={crop?.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{crop?.name || p.cropId}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{p.quantity} unit{p.quantity !== 1 ? 's' : ''} • {formatDate(p.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
                      <div className="text-lg font-bold">₹{Number(p.totalAmount || 0).toFixed(2)}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">You have no purchases yet.</p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Purchases;
