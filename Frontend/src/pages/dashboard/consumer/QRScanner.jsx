import React, { useState, useRef } from 'react';
import jsQR from 'jsqr';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { TRANSACTION_TYPES } from '../../../utils/constants';
import { parseQRData, generateCropJourney } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { 
  QrCode, 
  Camera, 
  AlertCircle, 
  CheckCircle,
  MapPin,
  Calendar,
  User,
  Package,
  ArrowRight,
  Leaf
} from 'lucide-react';

const QRScanner = () => {
  const { state, actions } = useApp();
  const { user, crops, transactions } = state;
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [error, setError] = useState('');
  const [cropJourney, setCropJourney] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleScan = () => {
    setIsScanning(true);
    setError('');
    
    // Simulate QR code scanning
    setTimeout(() => {
      // Mock QR data - in a real app, this would come from the camera
      const mockQRData = {
        cropId: crops[0]?.id || '1',
        name: crops[0]?.name || 'Organic Tomatoes',
        farmer: crops[0]?.farmerName || 'John Farmer',
        location: crops[0]?.location || 'Green Valley Farm, CA',
        timestamp: crops[0]?.createdAt || new Date().toISOString()
      };
      
      const crop = crops.find(c => c.id === mockQRData.cropId);
      if (crop) {
        setScannedData(mockQRData);
        setCropJourney(generateCropJourney(crop, transactions));
        setShowResultModal(true);
        
        // Add scan transaction
        actions.addTransaction({
          type: TRANSACTION_TYPES.PURCHASE,
          cropId: crop.id,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
          details: `Scanned QR code for ${crop.name}`
        });
        
        actions.addNotification({
          type: 'success',
          message: 'QR Code scanned successfully!',
          description: `Found information for ${crop.name}`
        });
      } else {
        setError('Crop not found in the system. Please try scanning a valid QR code.');
      }
      
      setIsScanning(false);
    }, 2000);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // reset
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError('');
    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const image = new Image();
          image.onload = () => {
            const canvas = canvasRef?.current || document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            try {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imgData.data, imgData.width, imgData.height);
              if (!code || !code.data) {
                setError('No QR code found in the uploaded image.');
                setIsScanning(false);
                return;
              }

              // code.data contains the QR payload
              const parsed = parseQRData(code.data);
              if (!parsed) {
                // If not JSON, assume raw id string
                const cropById = crops.find(c => c.id === code.data || c.qrCode === code.data);
                if (cropById) {
                  setScannedData({ cropId: cropById.id, name: cropById.name, farmer: cropById.farmerName, location: cropById.location, timestamp: cropById.createdAt });
                  setCropJourney(generateCropJourney(cropById, transactions));
                  setShowResultModal(true);
                  actions.addTransaction({
                    type: TRANSACTION_TYPES.PURCHASE,
                    cropId: cropById.id,
                    userId: user.id,
                    userName: user.name,
                    timestamp: new Date().toISOString(),
                    details: `Uploaded QR image and scanned ${cropById.name}`
                  });
                  actions.addNotification({ type: 'success', message: 'QR uploaded and parsed successfully', description: `Found ${cropById.name}` });
                } else {
                  setError('QR payload not recognized or crop not found');
                }
              } else {
                const found = crops.find(c => c.id === parsed.cropId || c.qrCode === parsed.cropId || c.qrCode === parsed.qrCode);
                if (found) {
                  setScannedData(parsed);
                  setCropJourney(generateCropJourney(found, transactions));
                  setShowResultModal(true);
                  actions.addTransaction({
                    type: TRANSACTION_TYPES.PURCHASE,
                    cropId: found.id,
                    userId: user.id,
                    userName: user.name,
                    timestamp: new Date().toISOString(),
                    details: `Uploaded QR image and scanned ${found.name}`
                  });
                  actions.addNotification({ type: 'success', message: 'QR uploaded and parsed successfully', description: `Found ${found.name}` });
                } else {
                  setError('Crop not found in the system for the uploaded QR.');
                }
              }
            } catch (err) {
              setError('Failed to process the uploaded image.');
            }
            setIsScanning(false);
          };
          image.onerror = () => {
            setError('Unable to read the image file.');
            setIsScanning(false);
          };
          image.src = event.target.result;
        } catch (err) {
          setError('Invalid file format or unable to decode.');
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read the uploaded file.');
      setIsScanning(false);
    }
  };

  // Demo manual input removed — upload option replaces demo scan.

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          QR Code Scanner
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Scan QR codes on food products to trace their journey from farm to table.
        </p>
      </div>

      {/* Scanner Interface */}
      <Card>
        <Card.Header>
          <Card.Title>Scan QR Code</Card.Title>
          <Card.Description>
            Point your camera at a QR code or upload a QR image using the button below.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-6">
            {/* Camera Preview Area */}
            <div className="relative">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                {isScanning ? (
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      Scanning for QR code...
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Camera preview will appear here
                    </p>
                  </div>
                )}
              </div>
              
              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary-500 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
                  </div>
                </div>
              )}
            </div>
            {/* hidden canvas used for uploaded image decoding */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleScan}
                disabled={isScanning}
                loading={isScanning}
                className="flex-1"
                size="lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                {isScanning ? 'Scanning...' : 'Start Scanning'}
              </Button>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                onClick={handleUploadClick}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Upload QR Image
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Instructions */}
      <Card>
        <Card.Header>
          <Card.Title>How to Use</Card.Title>
          <Card.Description>
            Follow these steps to scan QR codes and trace your food.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Camera className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Scan QR Code</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Point your camera at the QR code on the food product
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. View Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See detailed information about the crop and its origin
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Trace Journey</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Follow the complete journey from farm to your table
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Scan Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Crop Information"
        size="xl"
      >
        {scannedData && (
          <div className="space-y-6">
            {/* Crop Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Crop Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{scannedData.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Product Name</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{scannedData.farmer}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Farmer</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{scannedData.location}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Farm Location</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(scannedData.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Harvest Date</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Journey Timeline
                </h3>
                <div className="space-y-3">
                  {cropJourney.map((step, index) => (
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
                onClick={() => setShowResultModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // In a real app, you might want to save this scan or share it
                  actions.addNotification({
                    type: 'success',
                    message: 'Scan saved to history!',
                    description: 'You can view this scan in your history.'
                  });
                  setShowResultModal(false);
                }}
                className="flex-1"
              >
                Save to History
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QRScanner;
