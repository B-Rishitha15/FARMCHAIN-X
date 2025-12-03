import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { TRANSACTION_TYPES } from '../../../utils/constants';
import { formatDate, generateCropJourney } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { 
  QrCode, 
  History, 
  MapPin, 
  Calendar, 
  User,
  Package,
  Search,
  Eye,
  Leaf
} from 'lucide-react';

const ScanHistory = () => {
  const { state } = useApp();
  const { user, crops, transactions } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get consumer's scan history
  const scanHistory = transactions
    .filter(transaction => 
      transaction.type === TRANSACTION_TYPES.PURCHASE && transaction.userId === user.id
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Filter scans based on search
  const filteredScans = scanHistory.filter(scan => {
    const crop = crops.find(c => c.id === scan.cropId);
    if (!crop) return false;
    
    return crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           crop.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           crop.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewDetails = (scan) => {
    const crop = crops.find(c => c.id === scan.cropId);
    if (crop) {
      setSelectedScan({
        ...scan,
        crop,
        journey: generateCropJourney(crop, transactions)
      });
      setShowDetailModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Scan History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View all your QR code scans and traceability history.
        </p>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search scans by crop name, farmer, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Scans</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{scanHistory.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unique Crops</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {new Set(scanHistory.map(scan => scan.cropId)).size}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Farmers Tracked</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {new Set(scanHistory.map(scan => {
                  const crop = crops.find(c => c.id === scan.cropId);
                  return crop ? crop.farmerId : null;
                }).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Scan History List */}
      {filteredScans.length > 0 ? (
        <div className="space-y-4">
          {filteredScans.map((scan, index) => {
            const crop = crops.find(c => c.id === scan.cropId);
            if (!crop) return null;
            
            return (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={crop.image}
                        alt={crop.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {crop.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{crop.farmerName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{crop.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(scan.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge variant="success">
                        Scanned
                      </Badge>
                      <Button
                        onClick={() => handleViewDetails(scan)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No scans found' : 'No scan history yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm 
                ? 'Try adjusting your search criteria.'
                : 'Start by scanning QR codes on food products to build your traceability history.'
              }
            </p>
            {!searchTerm && (
              <Button>
                <QrCode className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Scan Details"
        size="xl"
      >
        {selectedScan && (
          <div className="space-y-6">
            {/* Crop Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Crop Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedScan.crop.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Product Name</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedScan.crop.farmerName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Farmer</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedScan.crop.location}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Farm Location</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedScan.timestamp)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Scan Date</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Journey Timeline
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedScan.journey.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        step.status === 'completed' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                          : step.status === 'current'
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {step.status === 'completed' ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{step.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(step.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDetailModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // In a real app, you might want to share this information
                  actions.addNotification({
                    type: 'success',
                    message: 'Information shared!',
                    description: 'Crop traceability information has been shared.'
                  });
                }}
                className="flex-1"
              >
                Share Information
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScanHistory;
