
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import {
  CROP_STATUS,
  STATUS_DISPLAY_NAMES,
} from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import {
  Truck,
  Package,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  X,
  Sprout,
  User,
  Calendar,
  MapPinned,
  Loader,
  Eye,
} from 'lucide-react';

const DistributorOverview = () => {
  const { state, actions } = useApp();
  const { user, crops = [] } = state;
  const navigate = useNavigate();

  const [selectedCrop, setSelectedCrop] = useState(null);
  const [isForwarding, setIsForwarding] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const distributorStages = [
    CROP_STATUS.HARVESTED,
    CROP_STATUS.IN_TRANSIT,
    CROP_STATUS.AT_DISTRIBUTOR,
  ];

  const availableCrops = crops.filter((crop) =>
    distributorStages.includes(crop.status)
  );

  const harvestedCrops = crops.filter(
    (crop) => crop.status === CROP_STATUS.HARVESTED
  );

  const atDistributorCrops = crops.filter(
    (crop) => crop.status === CROP_STATUS.AT_DISTRIBUTOR
  );

  const inTransitCrops = crops.filter(
    (crop) => crop.status === CROP_STATUS.IN_TRANSIT
  );

  const recentCrops = availableCrops.slice(0, 5);

  const processedCrops = crops.filter((crop) =>
    [
      CROP_STATUS.AT_RETAILER,
      CROP_STATUS.AVAILABLE_FOR_SALE,
      CROP_STATUS.SOLD,
    ].includes(crop.status)
  );

  const currentMonthCrops = crops.filter((crop) => {
    if (!crop.createdAt) return false;

    const cropDate = new Date(crop.createdAt);
    const now = new Date();

    return (
      !Number.isNaN(cropDate.getTime()) &&
      cropDate.getMonth() === now.getMonth() &&
      cropDate.getFullYear() === now.getFullYear()
    );
  });

  const stats = [
    {
      title: 'Available Crops',
      value: availableCrops.length,
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'In Transit',
      value: inTransitCrops.length,
      icon: Truck,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    {
      title: 'Freshly Harvested',
      value: harvestedCrops.length,
      icon: Sprout,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      title: 'Total Processed',
      value: processedCrops.length,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'This Month',
      value: currentMonthCrops.length,
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  const getStatusLabel = (status) =>
    STATUS_DISPLAY_NAMES?.[status] ||
    String(status || 'Unknown').replaceAll('_', ' ');

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleForwardCrop = async () => {
    if (!selectedCrop) return;

    if (selectedCrop.status === CROP_STATUS.IN_TRANSIT) {
      showMessage('This crop is already in transit.', 'error');
      return;
    }

    if (selectedCrop.status !== CROP_STATUS.HARVESTED &&
        selectedCrop.status !== CROP_STATUS.AT_DISTRIBUTOR) {
      showMessage('This crop cannot be forwarded from its current stage.', 'error');
      return;
    }

    if (typeof actions?.updateInventoryStage !== 'function') {
      showMessage(
        'Backend update action is missing. Check your AppContext.jsx.',
        'error'
      );
      return;
    }

    setIsForwarding(true);
    setMessage(null);

    try {
      const success = await actions.updateInventoryStage(
        selectedCrop,
        CROP_STATUS.IN_TRANSIT
      );

      if (success === false) {
        showMessage('Crop forwarding failed. Please try again.', 'error');
        return;
      }

      showMessage(
        `${selectedCrop.name || 'Crop'} forwarded successfully. Status updated to In Transit.`
      );

      setSelectedCrop(null);
    } catch (error) {
      showMessage(
        error?.message || 'Unable to update the crop in the backend.',
        'error'
      );
    } finally {
      setIsForwarding(false);
    }
  };

  const handleOpenCrop = (crop) => {
    setSelectedCrop(crop);
    setMessage(null);
  };

  const handleCloseModal = () => {
    if (isForwarding) return;
    setSelectedCrop(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {user?.name || 'Distributor'}!
        </h1>

        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage crop distribution and forward crops to retailers in your
          network.
        </p>
      </div>

      {/* Success and error messages */}
      {message && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${
            messageType === 'error'
              ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
              : 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
          }`}
        >
          <p>{message}</p>

          <button
            type="button"
            onClick={() => setMessage(null)}
            className="rounded p-1 hover:bg-black/5"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="transition-shadow duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>

                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>

                  <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Available Crops and Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Available Crops</Card.Title>
            <Card.Description>
              Select a crop to view its details and forwarding options.
            </Card.Description>
          </Card.Header>

          <Card.Content>
            {recentCrops.length > 0 ? (
              <div className="space-y-4">
                {recentCrops.map((crop, index) => (
                  <motion.button
                    type="button"
                    key={crop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => handleOpenCrop(crop)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 text-left transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
                        <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate font-medium text-gray-900 dark:text-white">
                          {crop.name || 'Unnamed Crop'}
                        </h4>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {crop.quantity ?? 0} units · {crop.farmerName || 'Unknown Farmer'}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="primary">
                        {getStatusLabel(crop.status)}
                      </Badge>

                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />

                <p className="text-gray-600 dark:text-gray-400">
                  No crops available for distribution yet.
                </p>
              </div>
            )}

            {availableCrops.length > 5 && (
              <button
                type="button"
                onClick={() => navigate('/dashboard/distributor/inventory')}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 p-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                View All Crops
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Quick Actions</Card.Title>
            <Card.Description>
              Access your distribution tasks.
            </Card.Description>
          </Card.Header>

          <Card.Content>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/distributor/forward')}
                className="flex w-full items-center gap-3 rounded-lg bg-primary-50 p-3 text-left transition hover:bg-primary-100 dark:bg-primary-900 dark:hover:bg-primary-800"
              >
                <Truck className="h-5 w-5 text-primary-600 dark:text-primary-400" />

                <span className="font-medium text-primary-700 dark:text-primary-300">
                  Forward to Retailer
                </span>

                <ArrowRight className="ml-auto h-4 w-4 text-primary-600 dark:text-primary-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/distributor/inventory')}
                className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <Package className="h-5 w-5 text-gray-600 dark:text-gray-300" />

                <span className="font-medium text-gray-700 dark:text-gray-200">
                  View Inventory
                </span>

                <ArrowRight className="ml-auto h-4 w-4 text-gray-500" />
              </button>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Distribution Network */}
      {availableCrops.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Distribution Network</Card.Title>
            <Card.Description>
              Crops currently moving through your distribution network.
            </Card.Description>
          </Card.Header>

          <Card.Content>
            <div className="space-y-3">
              {availableCrops.map((crop, index) => (
                <motion.button
                  type="button"
                  key={crop.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleOpenCrop(crop)}
                  className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <MapPin className="h-5 w-5 shrink-0 text-gray-500" />

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {crop.name || 'Unnamed Crop'}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From: {crop.location || 'Location not available'}
                    </p>
                  </div>

                  <Badge variant="success">
                    {crop.quantity ?? 0} units
                  </Badge>
                </motion.button>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Crop Details Modal */}
      {selectedCrop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="crop-modal-title"
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                >
                  Crop Details
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Review the crop before forwarding it.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isForwarding}
                aria-label="Close crop details"
                className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
                <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCrop.name || 'Unnamed Crop'}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedCrop.quantity ?? 0} units
                </p>
              </div>

              <Badge variant="primary">
                {getStatusLabel(selectedCrop.status)}
              </Badge>
            </div>

            <div className="space-y-4">
              <DetailRow
                icon={User}
                label="Farmer"
                value={selectedCrop.farmerName || 'Not available'}
              />

              <DetailRow
                icon={MapPinned}
                label="Location"
                value={selectedCrop.location || 'Not available'}
              />

              <DetailRow
                icon={Calendar}
                label="Created Date"
                value={
                  selectedCrop.createdAt
                    ? formatDate(selectedCrop.createdAt)
                    : 'Not available'
                }
              />

              <DetailRow
                icon={Package}
                label="Inventory ID"
                value={
                  selectedCrop.inventoryId ??
                  selectedCrop.id ??
                  'Not available'
                }
              />

              {selectedCrop.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </p>

                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedCrop.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isForwarding}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Close
              </button>

              {selectedCrop.status !== CROP_STATUS.IN_TRANSIT && (
                <button
                  type="button"
                  onClick={handleForwardCrop}
                  disabled={isForwarding}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isForwarding ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Truck className="h-5 w-5" />
                      Forward to Retailer
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="break-words text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

export default DistributorOverview;
