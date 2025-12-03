import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { CROP_STATUS, TRANSACTION_TYPES, STATUS_DISPLAY_NAMES } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  ArrowRight,
  CheckCircle,
  User
} from 'lucide-react';
import { apiUpdateInventory } from '../../../utils/api';

const ForwardCrops = () => {
  const { state, actions } = useApp();
  const { user, crops } = state;
  
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [retailerName, setRetailerName] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  // Filter crops that are ready for forwarding (harvested or already at distributor)
  const forwardableStages = [CROP_STATUS.HARVESTED, CROP_STATUS.AT_DISTRIBUTOR];
  const availableCrops = crops.filter(crop => forwardableStages.includes(crop.status));

  const handleCropSelect = (cropKey) => {
    setSelectedCrops(prev => 
      prev.includes(cropKey) 
        ? prev.filter(id => id !== cropKey)
        : [...prev, cropKey]
    );
  };

  const handleForwardCrops = () => {
    if (selectedCrops.length === 0) return;
    setShowForwardModal(true);
  };

  const confirmForward = async () => {
    if (!retailerName.trim()) return;
    
    setIsForwarding(true);

    try {
      const updates = selectedCrops.map(async (cropKey) => {
        const crop = crops.find(c => (c.inventoryId || c.id) === cropKey);
        if (!crop) return;

        await apiUpdateInventory(crop.inventoryId || crop.id, {
          stage: CROP_STATUS.AT_RETAILER
        });

        actions.addTransaction({
          type: TRANSACTION_TYPES.FORWARD_TO_RETAILER,
          cropId: crop.id,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
          details: `Forwarded ${crop.name} to ${retailerName}`
        });
      });

      await Promise.all(updates);
      await actions.refreshCrops();

      // Show success notification
      actions.addNotification({
        type: 'success',
        message: 'Crops forwarded successfully!',
        description: `${selectedCrops.length} crops have been forwarded to ${retailerName}.`
      });

      // Reset state
      setSelectedCrops([]);
      setRetailerName('');
      setShowForwardModal(false);

    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: 'Failed to forward crops',
        description: 'Please try again later.'
      });
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Forward Crops to Retailers
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Select crops to forward to retailers in your network.
        </p>
      </div>

      {/* Selection Summary */}
      {selectedCrops.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-600 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                    {selectedCrops.length} crops selected
                  </h3>
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    Ready to forward to retailers
                  </p>
                </div>
              </div>
              <Button onClick={handleForwardCrops}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Forward Selected
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Available Crops */}
      <Card>
        <Card.Header>
          <Card.Title>Available Crops</Card.Title>
          <Card.Description>
            Select crops that are ready to be forwarded to retailers.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {availableCrops.length > 0 ? (
            <div className="space-y-4">
              {availableCrops.map((crop, index) => {
                const cropKey = crop.inventoryId || crop.id;
                const isSelected = selectedCrops.includes(cropKey);
                
                return (
                  <motion.div
                    key={cropKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                    onClick={() => handleCropSelect(cropKey)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                      </div>
                      
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={crop.image}
                          alt={crop.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {crop.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span>{crop.quantity} units</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{crop.farmerName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{crop.location}</span>
                          </div>
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
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No crops available for forwarding
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Crops will appear here when they reach your distribution center.
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Forward Modal */}
      <Modal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        title="Forward Crops to Retailer"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You are about to forward {selectedCrops.length} crops to a retailer. 
              Please provide the retailer information below.
            </p>
            
            <Input
              label="Retailer Name"
              value={retailerName}
              onChange={(e) => setRetailerName(e.target.value)}
              placeholder="Enter retailer name or store"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Selected Crops:
            </h4>
            <div className="space-y-2">
              {selectedCrops.map(cropKey => {
                const crop = crops.find(c => (c.inventoryId || c.id) === cropKey);
                return crop ? (
                  <div key={cropKey} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 dark:text-white">{crop.name}</span>
                    <span className="text-gray-600 dark:text-gray-400">{crop.quantity} units</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowForwardModal(false)}
              variant="secondary"
              className="flex-1"
              disabled={isForwarding}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmForward}
              className="flex-1"
              disabled={!retailerName.trim() || isForwarding}
              loading={isForwarding}
            >
              {isForwarding ? 'Forwarding...' : 'Confirm Forward'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ForwardCrops;
