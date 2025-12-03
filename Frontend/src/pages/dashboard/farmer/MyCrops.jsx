import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { STATUS_DISPLAY_NAMES, STATUS_COLORS, DEFAULT_CROP_IMAGE } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import AiScoreGauge from '../../../components/ui/AiScoreGauge';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Package, 
  QrCode, 
  MapPin, 
  Calendar, 
  Eye,
  Search
} from 'lucide-react';

const MyCrops = () => {
  const { state, actions } = useApp();
  const { user, crops } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [qrCrop, setQrCrop] = useState(null);
  const [detailsCrop, setDetailsCrop] = useState(null);
  const [editCrop, setEditCrop] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: '',
    location: '',
    description: ''
  });

  // Filter crops by current farmer
  const myCrops = crops.filter(crop => crop.farmerId === user.id);

  // Filter crops based on search and status
  const filteredCrops = myCrops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || crop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getImageSource = (imageValue) => {
    if (!imageValue) return DEFAULT_CROP_IMAGE;
    const trimmed = imageValue.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('http')) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
  };

  const handleViewQR = (crop) => {
    setQrCrop(crop);
    setShowQRModal(true);
  };

  const handleViewDetails = (crop) => {
    setDetailsCrop(crop);
    setShowDetailsModal(true);
  };

  const handleEditClick = (crop) => {
    setEditCrop(crop);
    setEditForm({
      name: crop.name || '',
      quantity: String(crop.quantity ?? ''),
      location: crop.location || '',
      description: crop.description || ''
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    if (!editCrop) return;
    const quantityNum = parseInt(editForm.quantity, 10);

    actions.updateCrop({
      id: editCrop.id,
      name: editForm.name.trim() || editCrop.name,
      quantity: !isNaN(quantityNum) ? quantityNum : editCrop.quantity,
      location: editForm.location.trim() || editCrop.location,
      description: editForm.description
    });

    setShowEditModal(false);
    setEditCrop(null);
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Crops
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage all your uploaded crops.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search crops by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              <option value="harvested">Harvested</option>
              <option value="in_transit">In Transit</option>
              <option value="at_distributor">At Distributor</option>
              <option value="at_retailer">At Retailer</option>
              <option value="available_for_sale">Available for Sale</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Crops</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{myCrops.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Harvested</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {myCrops.filter(crop => crop.status === 'harvested').length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {myCrops.filter(crop => crop.status === 'in_transit').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Crops List */}
      {filteredCrops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop, index) => (
            <motion.div
              key={crop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <Card.Content>
                  <div className="space-y-4">
                    {/* Crop Image */}
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={getImageSource(crop.image)}
                        alt={crop.name}
                        className="w-full h-32 object-cover"
                      />
                    </div>

                    {/* Crop Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {crop.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {crop.quantity} units
                      </p>
                    </div>

                    {/* Location */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{crop.location}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(crop.createdAt)}</span>
                    </div>

                    {typeof crop.aiScore === 'number' && (
                      <div className="pt-2 flex flex-col items-center text-center">
                        <AiScoreGauge score={crop.aiScore} size={110} />
                        {crop.aiVerdict && (
                          <p className="mt-2 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                            {crop.aiVerdict}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(crop.status)}>
                        {STATUS_DISPLAY_NAMES[crop.status]}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleViewQR(crop)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        View QR
                      </Button>
                      <Button
                        onClick={() => handleViewDetails(crop)}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        onClick={() => handleEditClick(crop)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No crops found' : 'No crops uploaded yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by uploading your first crop to begin tracking.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button>
                Upload First Crop
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setQrCrop(null);
        }}
        title="Crop QR Code"
        size="md"
      >
        {qrCrop && (
          <div className="space-y-6">
            <div className="text-center">
              <div id="qr-modal-qr" className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <QRCodeSVG
                  value={qrCrop.qrCode}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Scan this QR code to view crop details
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Crop Details:
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {qrCrop.name}</p>
                <p><span className="font-medium">Quantity:</span> {qrCrop.quantity} units</p>
                <p><span className="font-medium">Location:</span> {qrCrop.location}</p>
                <p><span className="font-medium">Status:</span> {STATUS_DISPLAY_NAMES[qrCrop.status]}</p>
                <p><span className="font-medium">QR Code:</span> {qrCrop.qrCode}</p>
                {typeof qrCrop.aiScore === 'number' && (
                  <p><span className="font-medium">AI Score:</span> {Math.round(qrCrop.aiScore)} / 100 {qrCrop.aiVerdict ? `(${qrCrop.aiVerdict})` : ''}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowQRModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const svgElement = document.querySelector('#qr-modal-qr svg');
                  if (!svgElement) return;

                  try {
                    const svgData = new XMLSerializer().serializeToString(svgElement);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);
                    const img = new Image();

                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      canvas.width = img.width;
                      canvas.height = img.height;
                      const ctx = canvas.getContext('2d');
                      // Fill white background for JPG
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0);

                      canvas.toBlob(
                        (blob) => {
                          if (!blob) {
                            URL.revokeObjectURL(url);
                            return;
                          }
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = `${(qrCrop.name || 'crop')}-qr.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(link.href);
                          URL.revokeObjectURL(url);
                        },
                        'image/jpeg',
                        0.92
                      );
                    };

                    img.onerror = () => {
                      // fallback: download SVG directly
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${(qrCrop.name || 'crop')}-qr.svg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    };

                    img.src = url;
                  } catch (e) {
                    console.error('Failed to save QR image', e);
                  }
                }}
                className="flex-1"
              >
                Save as Image (JPG)
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setDetailsCrop(null);
        }}
        title="Crop Details"
        size="lg"
      >
        {detailsCrop && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <img
                  src={getImageSource(detailsCrop.image)}
                  alt={detailsCrop.name}
                  className="w-full md:w-64 h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <p><span className="font-semibold">Name:</span> {detailsCrop.name}</p>
                <p><span className="font-semibold">Quantity:</span> {detailsCrop.quantity} units</p>
                <p><span className="font-semibold">Location:</span> {detailsCrop.location}</p>
                <p><span className="font-semibold">Harvested:</span> {detailsCrop.harvestedDate ? formatDate(detailsCrop.harvestedDate) : '—'}</p>
                <p><span className="font-semibold">Status:</span> {STATUS_DISPLAY_NAMES[detailsCrop.status]}</p>
                <p><span className="font-semibold">QR Reference:</span> {detailsCrop.qrCode}</p>
                {typeof detailsCrop.aiScore === 'number' ? (
                  <p><span className="font-semibold">AI Score:</span> {Math.round(detailsCrop.aiScore)} / 100 {detailsCrop.aiVerdict ? `(${detailsCrop.aiVerdict})` : ''}</p>
                ) : (
                  <p><span className="font-semibold">AI Score:</span> Not available</p>
                )}
                {detailsCrop.description && (
                  <p className="text-gray-600 dark:text-gray-300">
                    {detailsCrop.description}
                  </p>
                )}
              </div>
            </div>

            {typeof detailsCrop.aiScore === 'number' && (
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                <AiScoreGauge score={detailsCrop.aiScore} />
                <div className="text-center md:text-left space-y-2">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {detailsCrop.aiVerdict || 'AI Quality Score'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Automated AI analysis of the uploaded crop image. Scores nearer 100 indicate fresher produce.
                  </p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Score captured at upload: {Math.round(detailsCrop.aiScore)} / 100
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={() => setShowDetailsModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      {/* Edit Crop Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Crop"
        size="md"
      >
        {editCrop && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Crop name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <input
                name="quantity"
                type="number"
                value={editForm.quantity}
                onChange={handleEditChange}
                placeholder="Quantity"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <input
                name="location"
                value={editForm.location}
                onChange={handleEditChange}
                placeholder="Location"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="Description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyCrops;
