
import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import Card from '../../../components/ui/Card';
import { formatDate } from '../../../utils/helpers';
import { ShoppingCart } from 'lucide-react';

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }

  const number = Number(value);
  return Number.isFinite(number) ? `₹${number.toFixed(2)}` : 'Not set';
};

const Purchases = () => {
  const { state } = useApp();
  const { user, transactions = [], crops = [] } = state;

  const purchases = transactions
    .filter(
      (transaction) =>
        transaction.type === 'purchase' &&
        String(transaction.userId) === String(user?.id)
    )
    .sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Purchases
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your purchased products, purchase totals, and price breakdown.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Purchase History</Card.Title>
          <Card.Description>
            Purchase details and the available farmer-to-retailer prices.
          </Card.Description>
        </Card.Header>

        <Card.Content>
          {purchases.length > 0 ? (
            <div className="space-y-4">
              {purchases.map((purchase, index) => {
                const crop = crops.find(
                  (item) =>
                    String(item.id) === String(purchase.cropId)
                );

                const farmerPrice =
                  crop?.price ?? purchase.price;

                const distributorPrice =
                  crop?.distributorPrice ?? purchase.distributorPrice;

                const retailerPrice =
                  crop?.retailerPrice ?? purchase.retailerPrice;

                return (
                  <motion.div
                    key={purchase.id ?? index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-600">
                          {crop?.image || crop?.imageUrl ? (
                            <img
                              src={crop.image || crop.imageUrl}
                              alt={crop?.name || 'Crop'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">
                              🌾
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {crop?.name || purchase.cropName || purchase.cropId}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {purchase.quantity} unit
                            {Number(purchase.quantity) !== 1 ? 's' : ''}
                            {' • '}
                            {formatDate(purchase.timestamp)}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Purchase total
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatPrice(purchase.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 dark:border-gray-600 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Farmer price
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(farmerPrice)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Distributor price
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(distributorPrice)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Retailer price
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(retailerPrice)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                You have no purchases yet.
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Purchases;
