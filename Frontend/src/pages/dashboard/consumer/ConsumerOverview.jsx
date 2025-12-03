import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { CROP_STATUS, STATUS_DISPLAY_NAMES, TRANSACTION_TYPES } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import AiScoreGauge from '../../../components/ui/AiScoreGauge';
import { decodeQrFromFile } from '../../../utils/qr';
import { apiPythonChat } from '../../../utils/api';
import { 
  QrCode, 
  Package, 
  TrendingUp, 
  History,
  MapPin,
  Leaf,
  Upload,
  Search as SearchIcon,
  Bot,
  Send,
  Loader2,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';

const ConsumerOverview = () => {
  const { state, actions } = useApp();
  const { user, crops, transactions } = state;
  const navigate = useNavigate();

  // Filter crops visible to consumers:
  // - crops explicitly marked as available for sale
  // - crops that have reached the retailer (forwarded by distributor)
  const availableCrops = crops.filter(
    crop =>
      crop.status === CROP_STATUS.AVAILABLE_FOR_SALE ||
      crop.status === CROP_STATUS.AT_RETAILER
  );
  
  // Get consumer's scan history (transactions where user is consumer)
  const scanHistory = transactions.filter(transaction => 
    transaction.type === 'purchase' && transaction.userId === user.id
  );
  
  const recentScans = scanHistory.slice(0, 5);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchFeedback, setSearchFeedback] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const fileInputRef = useRef(null);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'bot-welcome',
      sender: 'bot',
      text: 'Hi! Upload a QR code or ask me questions about the app (e.g., "How to upload crop").'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Purchase flow states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isQuantityInvalid, setIsQuantityInvalid] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const stats = [
    {
      title: 'Available Crops',
      value: availableCrops.length,
      icon: Package,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Scans This Month',
      value: scanHistory.filter(scan => {
        const scanDate = new Date(scan.timestamp);
        const now = new Date();
        return scanDate.getMonth() === now.getMonth() && scanDate.getFullYear() === now.getFullYear();
      }).length,
      icon: QrCode,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: 'Total Scans',
      value: scanHistory.length,
      icon: History,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
    },
    {
      title: 'Farmers Tracked',
      value: new Set(scanHistory.map(scan => {
        const crop = crops.find(c => c.id === scan.cropId);
        return crop ? crop.farmerId : null;
      }).filter(Boolean)).size,
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900'
    }
  ];

  const findCropByCode = (code) => {
    if (!code) return null;
    const normalized = code.trim().toLowerCase();
    return crops.find(crop => {
      const idMatch = crop.id?.toString().toLowerCase() === normalized;
      const qrMatch = crop.qrCode?.toLowerCase() === normalized;
      return idMatch || qrMatch;
    }) || null;
  };

  const handleManualSearch = () => {
    if (!searchId.trim()) {
      setSearchFeedback('Enter a crop ID or QR reference.');
      setSearchResult(null);
      return;
    }

    const result = findCropByCode(searchId);
    setSearchResult(result);
    setSearchFeedback(result ? '' : 'No crop found for that ID.');
  };

  const handleQrUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsDecoding(true);
    setSearchFeedback('');
    try {
      const decoded = await decodeQrFromFile(file);
      if (!decoded) {
        throw new Error('Could not decode the QR code. Please try another image.');
      }
      setSearchId(decoded);
      const result = findCropByCode(decoded);
      setSearchResult(result);
      setSearchFeedback(result ? '' : 'QR decoded, but no crop matches this reference.');
    } catch (error) {
      setSearchFeedback(error.message || 'Failed to decode QR image.');
      setSearchResult(null);
    } finally {
      setIsDecoding(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendChat = async () => {
    const question = chatInput.trim();
    if (!question) return;

    const userMessage = { id: `user-${Date.now()}`, sender: 'user', text: question };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Call Python chatbot backend for a reply
      const payload = {
        question,
        userId: user?.id,
        // Provide crops so Python can answer queries like
        // "list products above 85 ai score"
        crops: crops.map(crop => ({
          id: crop.id,
          name: crop.name,
          location: crop.location,
          aiScore: typeof crop.aiScore === 'number' ? crop.aiScore : null,
          aiVerdict: crop.aiVerdict || null,
          harvestDate: crop.harvestedDate || crop.harvestDate || null,
          invCode: crop.qrCode || crop.id || null
        }))
      };
      const response = await apiPythonChat(payload);
      const replyText = response?.reply || 'Sorry, I could not get a response right now.';
      const replyProducts = Array.isArray(response?.products) ? response.products : [];

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        products: replyProducts
      };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot request failed:', error);
      const fallbackMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Sorry, I could not connect to the assistant service right now. Please try again later.',
        products: []
      };
      setChatMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Get effective unit price (use final/base price only)
  const getUnitPrice = () => {
    if (!selectedCrop) return 0;
    if (typeof selectedCrop.price === 'number' && selectedCrop.price > 0) {
      return selectedCrop.price;
    }
    return 0;
  };

  // Calculate total amount based on quantity and price
  const calculateTotal = () => {
    if (!selectedCrop) return 0;
    const price = getUnitPrice();
    return price * purchaseQuantity;
  };

  // Handle Buy button click
  const handleBuyClick = (crop) => {
    setSelectedCrop(crop);
    setPurchaseQuantity(1);
    setIsQuantityInvalid(false);
    setShowPurchaseModal(true);
    setShowSuccessMessage(false);
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    const maxQuantity = selectedCrop?.quantity || 1;

    if (!value) {
      setPurchaseQuantity(1);
      setIsQuantityInvalid(false);
      return;
    }

    if (isNaN(numValue) || numValue <= 0) {
      setPurchaseQuantity(1);
      setIsQuantityInvalid(true);
      return;
    }

    setPurchaseQuantity(numValue);
    setIsQuantityInvalid(numValue > maxQuantity);
  };

  // Handle Pay button click
  const handlePayClick = () => {
    if (!selectedCrop) return;

    // Reduce available quantity for this crop
    actions.updateCrop({
      id: selectedCrop.id,
      quantity: Math.max((selectedCrop.quantity || 0) - purchaseQuantity, 0)
    });

    // Add transaction
    actions.addTransaction({
      type: TRANSACTION_TYPES.PURCHASE,
      cropId: selectedCrop.id,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
      details: `Purchased ${purchaseQuantity} units of ${selectedCrop.name}`,
      quantity: purchaseQuantity,
      totalAmount: calculateTotal()
    });

    // Show success message
    setShowSuccessMessage(true);
    
    // Show notification
    actions.addNotification({
      type: 'success',
      message: 'Crop Purchased Successfully!',
      description: `You have successfully purchased ${purchaseQuantity} units of ${selectedCrop.name} for ₹${calculateTotal().toFixed(2)}.`
    });

    // Close modal after 2 seconds
    setTimeout(() => {
      setShowPurchaseModal(false);
      setShowSuccessMessage(false);
      setSelectedCrop(null);
      setPurchaseQuantity(1);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Scan QR codes to trace your food from farm to table and discover the journey of your produce.
        </p>
      </div>

      {/* QR Upload + Chat Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Trace via QR or ID</Card.Title>
            <Card.Description>
              Upload a QR image or search by crop identifier to view authenticity details.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <Input
                label="Crop ID / QR Reference"
                name="searchId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="e.g., INV-123456 or 987654"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleManualSearch} className="flex-1">
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload QR
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrUpload}
              />
              {isDecoding && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Decoding QR image...
                </p>
              )}
              {searchFeedback && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {searchFeedback}
                </p>
              )}
              {searchResult && (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {searchResult.name}
                    </h4>
                    <Badge variant="primary">
                      {STATUS_DISPLAY_NAMES[searchResult.status] || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p><span className="font-semibold text-gray-900 dark:text-white">Location:</span> {searchResult.location}</p>
                    <p><span className="font-semibold text-gray-900 dark:text-white">Quantity:</span> {searchResult.quantity} units</p>
                    <p><span className="font-semibold text-gray-900 dark:text-white">Price:</span> ₹{searchResult.price || 'N/A'} per unit</p>
                    <p><span className="font-semibold text-gray-900 dark:text-white">Harvested:</span> {searchResult.harvestedDate ? formatDate(searchResult.harvestedDate) : '—'}</p>
                    <p><span className="font-semibold text-gray-900 dark:text-white">QR Code:</span> {searchResult.qrCode}</p>
                  </div>
                  {typeof searchResult.aiScore === 'number' && (
                    <div className="flex flex-col items-center">
                      <AiScoreGauge score={searchResult.aiScore} size={120} />
                      {searchResult.aiVerdict && (
                        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                          {searchResult.aiVerdict}
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    onClick={() => handleBuyClick(searchResult)}
                    className="w-full mt-4"
                    variant="primary"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Consumer Assistant</Card.Title>
            <Card.Description>
              Chat with the dashboard assistant for product insights or availability. Responses are generated locally from a preset knowledge base.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col space-y-4">
              <div className="h-80 overflow-y-auto space-y-3 pr-1 flex flex-col">
                {chatMessages.map(message => {
                  const isUser = message.sender === 'user';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-full sm:max-w-md rounded-2xl px-4 py-3 text-sm ${
                          isUser
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {!isUser && <Bot className="h-4 w-4" />}
                          <p className="font-semibold text-xs uppercase tracking-wide">
                            {isUser ? 'You' : 'Assistant'}
                          </p>
                        </div>
                        <p>{message.text}</p>
                        {Array.isArray(message.products) && message.products.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.products.map(product => {
                              // Find the full crop object from crops array
                              const fullCrop = crops.find(c => 
                                c.id?.toString() === product.id?.toString() || 
                                c.name?.toLowerCase() === product.name?.toLowerCase()
                              );
                              
                              return (
                                <div
                                  key={`${message.id}-${product.id || product.name}`}
                                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                  <p className="text-sm font-semibold">{product.name}</p>
                                  {product.invCode && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      INV Code: {product.invCode}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Location: {product.location || 'N/A'}
                                  </p>
                                  {typeof product.aiScore === 'number' && (
                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                      AI Score: {Math.round(product.aiScore)} {product.aiVerdict ? `(${product.aiVerdict})` : ''}
                                    </p>
                                  )}
                                  {product.harvestDate && (
                                    <p className="text-xs text-gray-500">
                                      Harvested: {formatDate(product.harvestDate)}
                                    </p>
                                  )}
                                  {fullCrop && (
                                    <Button
                                      onClick={() => handleBuyClick(fullCrop)}
                                      className="w-full mt-2 text-xs py-1"
                                      variant="primary"
                                      size="sm"
                                    >
                                      <ShoppingCart className="h-3 w-3 mr-1" />
                                      Buy
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    placeholder='Ask e.g. "How to upload crop"'
                    className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-gray-100"
                  />
                </div>
                <Button
                  onClick={handleSendChat}
                  disabled={chatLoading}
                  className="sm:w-auto"
                >
                  {chatLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Available Crops & Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Available Crops</Card.Title>
            <Card.Description>
              Fresh produce available for purchase with full traceability.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {availableCrops.length > 0 ? (
              <div className="space-y-4">
                {availableCrops.slice(0, 5).map((crop, index) => (
                  <motion.div
                    key={crop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {crop.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {crop.quantity} units • {crop.farmerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="success">
                        ₹{crop.price || 'N/A'}
                      </Badge>
                      <QrCode className="h-4 w-4 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No crops available for purchase yet.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Recent Scans</Card.Title>
            <Card.Description>
              Your recent QR code scans and crop traceability history.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {recentScans.length > 0 ? (
              <div className="space-y-4">
                {recentScans.map((scan, index) => {
                  const crop = crops.find(c => c.id === scan.cropId);
                  return crop ? (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {crop.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(scan.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="primary">
                        Scanned
                      </Badge>
                    </motion.div>
                  ) : null;
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No scans yet. Start by scanning a QR code!
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
          <Card.Description>
            Common tasks you can perform as a consumer.
          </Card.Description>
        </Card.Header>
        <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/consumer/scanner')}
              className="flex items-center space-x-3 p-4 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
            >
              <QrCode className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <div className="text-left">
                <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                  Scan QR Code
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Trace your food's journey
                </p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/consumer/history')}
              className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <History className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  View Scan History
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See all your previous scans
                </p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/consumer/purchases')}
              className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">View Purchases</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">See all your purchases</p>
              </div>
            </motion.button>
          </div>
        </Card.Content>
      </Card>

      {/* Farm Locations */}
      {availableCrops.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Farm Locations</Card.Title>
            <Card.Description>
              Geographic origins of available crops in your area.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {availableCrops.map((crop, index) => (
                <motion.div
                  key={crop.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {crop.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From: {crop.location}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">
                      {crop.quantity} units
                    </Badge>
                    <Badge variant="primary">
                      ₹{crop.price || 'N/A'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Purchase Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => {
          if (!showSuccessMessage) {
            setShowPurchaseModal(false);
            setSelectedCrop(null);
            setPurchaseQuantity(1);
          }
        }}
        title={showSuccessMessage ? "Purchase Successful!" : "Purchase Crop"}
        size="md"
      >
        {showSuccessMessage ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Crop Purchased Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your purchase has been completed. Thank you for your order!
            </p>
          </div>
        ) : (
          selectedCrop && (
            <div className="space-y-6">
              {/* Crop Details */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {selectedCrop.name}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Price per unit:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹{getUnitPrice().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Available quantity:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedCrop.quantity} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedCrop.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  max={selectedCrop.quantity}
                  value={purchaseQuantity}
                  onChange={handleQuantityChange}
                  className={`w-full ${
                    isQuantityInvalid
                      ? 'ring-2 ring-red-500 focus:ring-red-500 focus:border-red-500'
                      : ''
                  }`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isQuantityInvalid
                    ? `Quantity cannot exceed available stock (${selectedCrop.quantity}).`
                    : `Maximum available: ${selectedCrop.quantity} units`}
                </p>
              </div>

              {/* Total Amount */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {purchaseQuantity} unit{purchaseQuantity !== 1 ? 's' : ''} × ₹{getUnitPrice().toFixed(2)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedCrop(null);
                    setPurchaseQuantity(1);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayClick}
                  className="flex-1"
                  variant="primary"
                  disabled={
                    purchaseQuantity < 1 ||
                    purchaseQuantity > selectedCrop.quantity ||
                    isQuantityInvalid
                  }
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Pay ₹{calculateTotal().toFixed(2)}
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default ConsumerOverview;
