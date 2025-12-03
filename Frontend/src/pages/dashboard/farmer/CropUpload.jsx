import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { CROP_STATUS, TRANSACTION_TYPES, DEFAULT_CROP_IMAGE } from '../../../utils/constants';
import { validateCropData, generate8DigitCode, formatDate } from '../../../utils/helpers';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import AiScoreGauge from '../../../components/ui/AiScoreGauge';
import { QRCodeSVG } from 'qrcode.react';
import { Upload, Image, MapPin, Package, CheckCircle } from 'lucide-react';
import { apiCreateProduct, apiCreateInventory, apiPythonScore } from '../../../utils/api';

const CropUpload = () => {
  const { state, actions } = useApp();
  const { user } = state;
  
  const [formData, setFormData] = useState({
    name: '',
    farmerPrice: '',
    qualityScore: 67,
    quantity: '',
    location: '',
    description: '',
    image: null,
    imageName: '',
    harvestedDate: '',
    freshUntilDate: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [uploadedCrop, setUploadedCrop] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: value
      };

      // Auto-apply quality score based on configured mapping
      if (name === 'name') {
        try {
          const raw = localStorage.getItem('qualityScoresConfig');
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const match = list.find(
                entry => entry.name.toLowerCase() === value.toLowerCase()
              );
              next.qualityScore = match ? Number(match.score) || 67 : 67;
            } else {
              next.qualityScore = 67;
            }
          } else {
            next.qualityScore = 67;
          }
        } catch {
          next.qualityScore = 67;
        }
      }

      return next;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const convertFileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await convertFileToDataUrl(file);
      setFormData(prev => ({
        ...prev,
        image: dataUrl,
        imageName: file.name
      }));
    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: 'Image upload failed',
        description: 'Please try again with a different image file.'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateCropData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const quantityValue = parseInt(formData.quantity, 10);
      const imageValue = formData.image || DEFAULT_CROP_IMAGE;
      const farmerPriceValue = formData.farmerPrice ? parseFloat(formData.farmerPrice) : 0;

      // Try to get AI score from Python AI service using the uploaded image
      let aiScore = null;
      let aiVerdict = null;

      if (formData.image) {
        try {
          const scoreResponse = await apiPythonScore(formData.image);
          if (scoreResponse && typeof scoreResponse.ai_score === 'number') {
            aiScore = scoreResponse.ai_score;
            aiVerdict = scoreResponse.quality_label || null;
          }
        } catch (err) {
          console.error('Failed to fetch AI score from Python service:', err);
        }
      }

      // Fallback: if Python AI service is unavailable, keep a deterministic default
      if (aiScore === null) {
        aiScore = 80;
        aiVerdict = null;
      }

      const productPayload = {
        name: formData.name,
        cropType: formData.name,
        quantityKg: quantityValue,
        qualityGrade: 'A',
        aiScore,
        aiVerdict,
        harvestDate: formData.harvestedDate,
        location: formData.location,
        description: formData.description,
        imageUrl: imageValue,
        price: farmerPriceValue,
        unit: 'kg'
      };

      const createdProduct = await apiCreateProduct(productPayload);
      if (!createdProduct?.id) {
        throw new Error('Failed to create product');
      }

      const ownerId = Number(user?.id);
      if (!ownerId) {
        throw new Error('Invalid farmer profile. Please re-login.');
      }

      const inventoryPayload = {
        productId: createdProduct.id,
        ownerId,
        quantity: quantityValue,
        stage: CROP_STATUS.HARVESTED
      };

      const inventoryResponse = await apiCreateInventory(inventoryPayload);
      if (!inventoryResponse?.id) {
        throw new Error('Failed to register crop inventory');
      }

      const qrCodeValue = generate8DigitCode();

      const savedCrop = {
        id: inventoryResponse.id.toString(),
        name: formData.name,
        quantity: quantityValue,
        farmerPrice: farmerPriceValue,
        location: formData.location,
        description: formData.description,
        image: imageValue,
        imageName: formData.imageName || null,
        status: CROP_STATUS.HARVESTED,
        farmerId: user.id,
        farmerName: user.name,
        createdAt: new Date().toISOString(),
        harvestedDate: formData.harvestedDate,
        freshUntilDate: formData.freshUntilDate,
        qrCode: qrCodeValue,
        aiScore,
        aiVerdict
      };

      await actions.refreshCrops();

      // Add transaction
      actions.addTransaction({
        type: TRANSACTION_TYPES.CROP_UPLOAD,
        cropId: savedCrop.id,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        details: `Uploaded ${savedCrop.name}`
      });

      // Show success notification
      actions.addNotification({
        type: 'success',
        message: 'Crop uploaded successfully!',
        description: 'Your crop has been added to the system and QR code has been generated.'
      });

      // Set uploaded crop for QR modal
      setUploadedCrop(savedCrop);
      setShowQRModal(true);

      // Reset form
      setFormData({
        name: '',
        farmerPrice: '',
        qualityScore: 67,
        quantity: '',
        location: '',
        description: '',
        image: null,
        imageName: '',
        harvestedDate: '',
        freshUntilDate: ''
      });
      setErrors({});

    } catch (error) {
      actions.addNotification({
        type: 'error',
        message: 'Failed to upload crop',
        description: 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Upload New Crop
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Add your harvested crops to the traceability system and generate QR codes.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Crop Information</Card.Title>
          <Card.Description>
            Provide details about your harvested crop for traceability.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Crop Name */}
            <Input
              label="Crop Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Organic Tomatoes"
              error={errors.name}
              required
            />

            {/* Farmer Price */}
            <Input
              label="Farmer Price per Unit"
              name="farmerPrice"
              type="number"
              value={formData.farmerPrice}
              onChange={handleInputChange}
              placeholder="e.g., 50"
              helperText="Base price set by farmer (per unit)."
            />

            {/* Quantity */}
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="e.g., 100"
              error={errors.quantity}
              helperText="Number of units harvested"
              required
            />

            {/* Harvested Date */}
            <Input
              label="Harvested Date"
              name="harvestedDate"
              type="date"
              value={formData.harvestedDate}
              onChange={handleInputChange}
              error={errors.harvestedDate}
              required
            />

            {/* Fresh Until Date */}
            <Input
              label="Fresh Until Date"
              name="freshUntilDate"
              type="date"
              value={formData.freshUntilDate}
              onChange={handleInputChange}
              error={errors.freshUntilDate}
              required
            />

            {/* Location */}
            <Input
              label="Farm Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Begumpet, Hyderabad"
              error={errors.location}
              helperText="Full address or location name"
              required
            />

            {/* Description */}
            <Input.Textarea
              label="Description (Optional)"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Additional details about the crop..."
              rows={3}
            />

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Crop Image (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Image className="h-5 w-5" />
                  <span>Choose Image</span>
                </label>
                {formData.image && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Image selected</span>
                  </div>
                )}
              </div>
              {formData.image && (
                <div className="mt-3">
                  <img
                    src={formData.image}
                    alt="Crop preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Uploading Crop...' : 'Upload Crop & Generate QR Code'}
            </Button>
          </form>
        </Card.Content>
      </Card>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Crop QR Code Generated"
        size="md"
      >
        {uploadedCrop && (
          <div className="space-y-6">
            <div className="text-center">
              <div
                id="uploaded-crop-qr"
                className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-700"
              >
                <QRCodeSVG
                  value={uploadedCrop.qrCode}
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
                <p><span className="font-medium">Name:</span> {uploadedCrop.name}</p>
                <p><span className="font-medium">Quantity:</span> {uploadedCrop.quantity} units</p>
                <p><span className="font-medium">Location:</span> {uploadedCrop.location}</p>
                <p><span className="font-medium">Harvested:</span> {uploadedCrop.harvestedDate ? formatDate(uploadedCrop.harvestedDate) : '—'}</p>
                <p><span className="font-medium">Fresh Until:</span> {uploadedCrop.freshUntilDate ? formatDate(uploadedCrop.freshUntilDate) : '—'}</p>
                <p><span className="font-medium">QR Code:</span> {uploadedCrop.qrCode}</p>
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
                  const svgElement = document.querySelector('#uploaded-crop-qr svg');
                  if (!svgElement) return;

                  const svgData = new XMLSerializer().serializeToString(svgElement);
                  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                  const url = URL.createObjectURL(blob);

                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${uploadedCrop.name || 'crop'}-qr.svg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="flex-1"
              >
                Save as Image
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CropUpload;
