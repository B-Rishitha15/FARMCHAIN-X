import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { CROP_STATUS, TRANSACTION_TYPES, STATUS_DISPLAY_NAMES } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import { apiUpdateInventory } from '../../../utils/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { Store, Package, MapPin, Calendar, CheckCircle, Tag } from 'lucide-react';

const MarkAvailable = () => {
  const { state, actions } = useApp();
  const { user, crops } = state;

  const [selectedCrops, setSelectedCrops] = useState([]);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [retailerPrices, setRetailerPrices] = useState({});
  const [savingRetailerPriceId, setSavingRetailerPriceId] = useState(null);
  const [retailerPriceMessages, setRetailerPriceMessages] = useState({});

  const availableCrops = crops.filter(crop => crop.status === CROP_STATUS.AT_RETAILER);

  const handleCropSelect = cropId => {
    setSelectedCrops(prev =>
      prev.includes(cropId) ? prev.filter(id => id !== cropId) : [...prev, cropId]
    );
  };

  const saveRetailerPrice = async crop => {
    const enteredPrice = retailerPrices[crop.id];
    if (enteredPrice === undefined || enteredPrice === '' ||
        !Number.isFinite(Number(enteredPrice)) || Number(enteredPrice) <= 0) {
      setRetailerPriceMessages(prev => ({
        ...prev, [crop.id]: 'Enter a valid retail price greater than 0.'
      }));
      return;
    }

    setSavingRetailerPriceId(crop.id);
    setRetailerPriceMessages(prev => ({ ...prev, [crop.id]: '' }));
    try {
      await apiUpdateInventory(crop.inventoryId ?? crop.id, {
        retailerPrice: Number(enteredPrice)
      });
      // Keep the displayed price in sync after a successful API save.
      setRetailerPrices(prev => ({ ...prev, [crop.id]: String(Number(enteredPrice)) }));
      setRetailerPriceMessages(prev => ({
        ...prev, [crop.id]: 'Retailer price saved successfully.'
      }));
      // Update shared app state if updateCrop merges supplied fields.
      actions.updateCrop({ id: crop.id, retailerPrice: Number(enteredPrice) });
    } catch (error) {
      console.error('Failed to save retailer price:', error);
      setRetailerPriceMessages(prev => ({
        ...prev, [crop.id]: error?.message || 'Failed to save retailer price.'
      }));
    } finally {
      setSavingRetailerPriceId(null);
    }
  };

  const handleMarkAvailable = () => {
    if (selectedCrops.length > 0) setShowMarkModal(true);
  };

  const confirmMarkAvailable = async () => {
    if (selectedCrops.length === 0) return;

    const missingRetailPrice = selectedCrops.find(cropId => {
      const crop = crops.find(item => String(item.id) === String(cropId));
      const savedPrice = crop?.retailerPrice ?? retailerPrices[cropId];
      return savedPrice == null || savedPrice === '' || !Number.isFinite(Number(savedPrice)) || Number(savedPrice) <= 0;
    });

    if (missingRetailPrice) {
      actions.addNotification({
        type: 'error',
        message: 'Retailer price required',
        description: 'Save the retailer selling price for every selected crop before marking it available.'
      });
      setShowMarkModal(false);
      return;
    }

    setIsMarking(true);
    try {
      for (const cropId of selectedCrops) {
        const crop = crops.find(item => String(item.id) === String(cropId));
        if (!crop) throw new Error(`Crop not found in the current dashboard: ${cropId}`);

        await apiUpdateInventory(crop.inventoryId ?? cropId, {
          stage: 'AVAILABLE_FOR_SALE'
        });

        actions.updateCrop({ id: cropId, status: CROP_STATUS.AVAILABLE_FOR_SALE });
        actions.addTransaction({
          type: TRANSACTION_TYPES.MARK_AVAILABLE,
          cropId,
          userId: user?.id,
          userName: user?.name,
          timestamp: new Date().toISOString(),
          details: `Marked ${crop.name} as available for sale`
        });
      }

      actions.addNotification({
        type: 'success',
        message: 'Crops marked as available!',
        description: `${selectedCrops.length} crop(s) updated successfully.`
      });
      setSelectedCrops([]);
      setShowMarkModal(false);
    } catch (error) {
      console.error('Failed to mark crops as available:', error);
      actions.addNotification({
        type: 'error',
        message: 'Failed to mark crops as available',
        description: error?.message || 'Backend update failed. Please try again.'
      });
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mark Crops as Available</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Check farmer and distributor prices, enter your retail price, then mark crops for sale.
        </p>
      </div>

      {selectedCrops.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-600 rounded-lg"><Store className="h-5 w-5 text-white" /></div>
                <div>
                  <h3 className="font-semibold text-primary-900 dark:text-primary-100">{selectedCrops.length} crops selected</h3>
                  <p className="text-sm text-primary-700 dark:text-primary-300">Ready to mark as available for sale</p>
                </div>
              </div>
              <Button onClick={handleMarkAvailable}><Tag className="h-4 w-4 mr-2" />Mark as Available</Button>
            </div>
          </Card>
        </motion.div>
      )}

      <Card>
        <Card.Header>
          <Card.Title>Received Crops</Card.Title>
          <Card.Description>
            Farmer and distributor prices are read-only. Enter and save your retail selling price.
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
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                  >
                    <div
                      className="flex flex-col md:flex-row md:items-start gap-4 cursor-pointer"
                      onClick={() => handleCropSelect(crop.id)}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                      </div>
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={crop.image} alt={crop.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{crop.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center space-x-1"><Package className="h-4 w-4" /><span>{crop.quantity} units</span></div>
                          <div className="flex items-center space-x-1"><MapPin className="h-4 w-4" /><span>{crop.location || 'Location unavailable'}</span></div>
                          {crop.createdAt && <div className="flex items-center space-x-1"><Calendar className="h-4 w-4" /><span>{formatDate(crop.createdAt)}</span></div>}
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <Badge variant="primary">{STATUS_DISPLAY_NAMES[crop.status] || crop.status}</Badge>
                      </div>
                    </div>

                    <div
                      className="mt-4 ml-0 md:ml-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 space-y-3"
                      onClick={e => e.stopPropagation()}
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white">Price Details (per kg)</h4>
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Farmer Price</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{crop.price != null ? `₹${crop.price}` : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Distributor Price</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{crop.distributorPrice != null ? `₹${crop.distributorPrice}` : 'Not set'}</span>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Retail Selling Price (₹/kg)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={retailerPrices[crop.id] ?? crop.retailerPrice ?? ''}
                        onChange={e => setRetailerPrices(prev => ({ ...prev, [crop.id]: e.target.value }))}
                        placeholder="Enter retail price"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
                      />
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={savingRetailerPriceId === crop.id}
                        onClick={() => saveRetailerPrice(crop)}
                      >
                        {savingRetailerPriceId === crop.id ? 'Saving...' : 'Save Retailer Price'}
                      </Button>
                      {retailerPriceMessages[crop.id] && (
                        <p role="status" className="text-sm text-gray-600 dark:text-gray-300">{retailerPriceMessages[crop.id]}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No crops available for marking</h3>
              <p className="text-gray-600 dark:text-gray-400">Crops will appear here when they are received from distributors.</p>
            </div>
          )}
        </Card.Content>
      </Card>

      <Modal isOpen={showMarkModal} onClose={() => setShowMarkModal(false)} title="Mark Crops as Available" size="lg">
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Confirm that each selected crop has a saved retailer selling price before making it available for sale.
          </p>
          <div className="space-y-4">
            {selectedCrops.map(cropId => {
              const crop = crops.find(item => String(item.id) === String(cropId));
              if (!crop) return null;
              return (
                <div key={cropId} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                      <img src={crop.image} alt={crop.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{crop.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{crop.quantity} units</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p>Farmer price: {crop.price != null ? `₹${crop.price}` : 'Not set'}</p>
                    <p>Distributor price: {crop.distributorPrice != null ? `₹${crop.distributorPrice}` : 'Not set'}</p>
                    <p>Retailer price: {(crop.retailerPrice ?? retailerPrices[cropId]) != null ? `₹${crop.retailerPrice ?? retailerPrices[cropId]}` : 'Not set'}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => setShowMarkModal(false)} variant="secondary" className="flex-1" disabled={isMarking}>Cancel</Button>
            <Button onClick={confirmMarkAvailable} className="flex-1" disabled={isMarking} loading={isMarking}>
              {isMarking ? 'Marking Available...' : 'Mark as Available'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarkAvailable;
