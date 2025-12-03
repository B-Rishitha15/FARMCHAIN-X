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
  Store, 
  Package, 
  MapPin, 
  Calendar, 
  CheckCircle,
  Tag
} from 'lucide-react';

const MarkAvailable = () => {
  const { state, actions } = useApp();
  const { user, crops } = state;
  
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  // Filter crops that are at retailer
  const availableCrops = crops.filter(crop => crop.status === CROP_STATUS.AT_RETAILER);

  const handleCropSelect = (cropId) => {
    setSelectedCrops(prev => 
      prev.includes(cropId) 
        ? prev.filter(id => id !== cropId)
        : [...prev, cropId]
    );
  };

  const handleMarkAvailable = () => {
    if (selectedCrops.length === 0) return;
    setShowMarkModal(true);
  };

  const confirmMarkAvailable = async () => {
    setIsMarking(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update selected crops status only
      selectedCrops.forEach(cropId => {
        const crop = crops.find(c => c.id === cropId);
        if (crop) {
          actions.updateCrop({
            id: cropId,
            status: CROP_STATUS.AVAILABLE_FOR_SALE
          });

          // Add transaction
          actions.addTransaction({
            type: TRANSACTION_TYPES.MARK_AVAILABLE,
            cropId: cropId,
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
            details: `Marked ${crop.name} as available for sale at ₹${pricing[cropId]}`
          });
        }
      });

      // Show success notification
      actions.addNotification({
        type: 'success',
        message: 'Crops marked as available!',
        description: `${selectedCrops.length} crops are now available for sale.`
      });

      // Reset state
      setSelectedCrops([]);
      setShowMarkModal(false);

    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: 'Failed to mark crops as available',
        description: 'Please try again later.'
      });
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mark Crops as Available
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Select crops to mark as available for sale and set their pricing.
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
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                    {selectedCrops.length} crops selected
                  </h3>
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    Ready to mark as available for sale
                  </p>
                </div>
              </div>
              <Button onClick={handleMarkAvailable}>
                <Tag className="h-4 w-4 mr-2" />
                Mark as Available
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Available Crops */}
      <Card>
        <Card.Header>
          <Card.Title>Received Crops</Card.Title>
          <Card.Description>
            Select crops that are ready to be marked as available for sale.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {availableCrops.length > 0 ? (
            <div className="space-y-4">
              {availableCrops.map((crop, index) => {
                const isSelected = selectedCrops.includes(crop.id);
                
                return (
                  <motion.div
                    key={crop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                    onClick={() => handleCropSelect(crop.id)}
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
              <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No crops available for marking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Crops will appear here when they are received from distributors.
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Mark Available Modal */}
      <Modal
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        title="Mark Crops as Available"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select crops to mark as available for sale. Pricing will use the base price set at upload.
            </p>
          </div>

          <div className="space-y-4">
            {selectedCrops.map(cropId => {
              const crop = crops.find(c => c.id === cropId);
              if (!crop) return null;
              
              return (
                <div key={cropId} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                    <img
                      src={crop.image}
                      alt={crop.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{crop.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{crop.quantity} units</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowMarkModal(false)}
              variant="secondary"
              className="flex-1"
              disabled={isMarking}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmMarkAvailable}
              className="flex-1"
              disabled={isMarking}
              loading={isMarking}
            >
              {isMarking ? 'Marking Available...' : 'Mark as Available'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarkAvailable;
