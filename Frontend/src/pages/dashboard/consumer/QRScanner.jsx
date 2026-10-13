
import React, { useEffect, useState } from "react";
import jsQR from "jsqr";

const API_BASE_URL = "http://localhost:8080/api";

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1000px",
    margin: "0 auto",
    color: "#1f2937",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    marginBottom: "8px",
    color: "#166534",
  },
  description: {
    color: "#64748b",
    marginBottom: "24px",
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  select: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    background: "#fff",
  },
  button: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#15803d",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: "10px",
    marginTop: "12px",
  },
  secondaryButton: {
    padding: "11px 18px",
    border: "1px solid #15803d",
    borderRadius: "8px",
    background: "#fff",
    color: "#166534",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "12px",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  detail: {
    padding: "12px",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    overflowWrap: "anywhere",
  },
  message: {
    padding: "12px",
    borderRadius: "8px",
    marginTop: "14px",
    background: "#f1f5f9",
  },
  error: {
    color: "#b91c1c",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "14px",
  },
  success: {
    color: "#166534",
    background: "#f0fdf4",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "14px",
  },
  qrImage: {
    width: "220px",
    maxWidth: "100%",
    display: "block",
    margin: "16px auto",
  },
  canvas: {
    display: "none",
  },
  stage: {
    display: "inline-block",
    padding: "7px 12px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "20px",
    fontWeight: "bold",
  },
};

const toPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatPrice = (value) =>
  value !== null && value !== undefined
    ? `₹${Number(value).toLocaleString("en-IN")}`
    : "Not available";

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(`${value}`.slice(0, 10) + "T00:00:00");

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN");
};

const formatStage = (value) => {
  if (!value) return "Not available";

  const normalized = String(value)
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();

  const labels = {
    AT_FARMER: "At Farmer",
    AT_DISTRIBUTOR: "At Distributor",
    SENT_TO_DISTRIBUTOR: "Sent to Distributor",
    AT_RETAILER: "At Retailer",
    SENT_TO_RETAILER: "Sent to Retailer",
    AVAILABLE_FOR_SALE: "Available for Sale",
    SOLD: "Sold to Consumer",
    SOLD_TO_CONSUMER: "Sold to Consumer",
  };

  return (
    labels[normalized] ||
    String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
};

const mapInventoryItem = (item) => {
  const product =
    item.product && typeof item.product === "object"
      ? item.product
      : {};

  const owner =
    item.owner && typeof item.owner === "object"
      ? item.owner
      : {};

  return {
    id: item.id,
    inventoryId: item.id,
    productId: item.productId ?? product.id ?? null,

    name:
      product.name ||
      item.name ||
      item.cropName ||
      "Unknown Crop",

    category:
      product.category ||
      item.category ||
      product.cropType ||
      "Not available",

    quantity:
      item.quantity ??
      product.quantityKg ??
      product.quantity ??
      null,

    quality:
      product.qualityGrade ??
      product.quality ??
      item.qualityGrade ??
      item.quality ??
      "Not available",

    location:
      product.location ||
      item.location ||
      item.farmLocation ||
      "Not available",

    farmerName:
      owner.name ||
      item.ownerName ||
      item.farmerName ||
      "Not available",

    harvestDate:
      product.harvestDate ||
      item.harvestDate ||
      null,

    farmerPrice: toPrice(
      product.price ??
      product.farmerPrice ??
      item.price ??
      item.farmerPrice
    ),

    distributorPrice: toPrice(
      product.distributorPrice ??
      item.distributorPrice
    ),

    retailerPrice: toPrice(
      product.retailerPrice ??
      item.retailerPrice
    ),

    aiScore:
      product.aiScore ??
      item.aiScore ??
      null,

    aiVerdict:
      product.aiVerdict ||
      item.aiVerdict ||
      null,

    stage: formatStage(
      item.stage ||
      item.status ||
      product.status
    ),
  };
};

const QRScanner = () => {
  const [crops, setCrops] = useState([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [scannedCrop, setScannedCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [qrLibraryReady, setQrLibraryReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/inventory`);

        if (!response.ok) {
          throw new Error(
            `Inventory request failed (${response.status}).`
          );
        }

        const inventory = await response.json();

        if (!Array.isArray(inventory)) {
          throw new Error("The inventory API did not return a list.");
        }

        const mappedCrops = inventory.map(mapInventoryItem);

        if (!cancelled) {
          setCrops(mappedCrops);

          if (mappedCrops.length > 0) {
            setSelectedInventoryId(String(mappedCrops[0].inventoryId));
          } else {
            setMessage("No inventory records are available.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            `${err.message} Make sure the Spring Boot backend is running.`
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  const createQR = async () => {
    setError("");
    setMessage("");
    setQrImage("");
    setScannedCrop(null);

    const selectedCrop = crops.find(
      (crop) =>
        String(crop.inventoryId) === String(selectedInventoryId)
    );

    if (!selectedCrop) {
      setError("Please select a valid inventory record.");
      return;
    }

    try {
      const QRCode = await import("qrcode");

      const payload = JSON.stringify({
        type: "FARMCHAINX_INVENTORY",
        inventoryId: selectedCrop.inventoryId,
        productId: selectedCrop.productId,
      });

      const image = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      setQrImage(image);
      setMessage("QR code generated successfully.");
    } catch (err) {
      setError(
        "QR generation failed. Check that the qrcode package is installed."
      );
    }
  };

  const downloadQR = () => {
    if (!qrImage) {
      setError("Generate a QR code before downloading.");
      return;
    }

    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `farmchainx-inventory-${selectedInventoryId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const findInventoryFromQR = (payload) => {
    let qrData;

    try {
      qrData = JSON.parse(payload);
    } catch {
      setError("This QR code does not contain valid FarmChainX data.");
      return;
    }

    if (
      !qrData ||
      qrData.type !== "FARMCHAINX_INVENTORY" ||
      qrData.inventoryId === undefined ||
      qrData.inventoryId === null
    ) {
      setError("This is not a valid FarmChainX inventory QR code.");
      return;
    }

    const matchedCrop = crops.find(
      (crop) =>
        String(crop.inventoryId) === String(qrData.inventoryId)
    );

    if (!matchedCrop) {
      setError(
        `Inventory ID ${qrData.inventoryId} was not found. Refresh the inventory list and scan again.`
      );
      return;
    }

    if (
      qrData.productId !== undefined &&
      qrData.productId !== null &&
      matchedCrop.productId !== null &&
      String(qrData.productId) !== String(matchedCrop.productId)
    ) {
      setError("The product ID in the QR code does not match the inventory record.");
      return;
    }

    setScannedCrop(matchedCrop);
    setSelectedInventoryId(String(matchedCrop.inventoryId));
    setQrImage("");
    setError("");
    setMessage("Crop details loaded from the QR code.");
  };

  const handleQRUpload = async (event) => {
    const file = event.target.files?.[0];

    setError("");
    setMessage("");
    setScannedCrop(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a QR code image, such as PNG or JPG.");
      event.target.value = "";
      return;
    }

    setScanning(true);

    try {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", {
            willReadFrequently: true,
          });

          if (!context) {
            setError("Could not read the uploaded image.");
            return;
          }

          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;

          context.drawImage(image, 0, 0);

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          const code = jsQR(
            imageData.data,
            imageData.width,
            imageData.height
          );

          if (!code) {
            setError(
              "No QR code was detected. Upload a clear, uncropped QR image."
            );
            return;
          }

          findInventoryFromQR(code.data);
        } catch (err) {
          setError(`Could not scan this image: ${err.message}`);
        } finally {
          URL.revokeObjectURL(imageUrl);
          setScanning(false);
          event.target.value = "";
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setError("The selected image could not be opened.");
        setScanning(false);
        event.target.value = "";
      };

      image.src = imageUrl;
    } catch (err) {
      setError(`QR scanning failed: ${err.message}`);
      setScanning(false);
      event.target.value = "";
    }
  };

  const scanSelectedInventory = () => {
    setError("");
    setMessage("");

    const selectedCrop = crops.find(
      (crop) =>
        String(crop.inventoryId) === String(selectedInventoryId)
    );

    if (!selectedCrop) {
      setError("Crop not found in the system. Please select a valid inventory record.");
      return;
    }

    setScannedCrop(selectedCrop);
    setQrImage("");
    setMessage("Crop details loaded successfully.");
  };

  const refreshInventory = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/inventory`);

      if (!response.ok) {
        throw new Error(`Inventory request failed (${response.status}).`);
      }

      const inventory = await response.json();

      if (!Array.isArray(inventory)) {
        throw new Error("The inventory API did not return a list.");
      }

      const mappedCrops = inventory.map(mapInventoryItem);

      setCrops(mappedCrops);
      setScannedCrop(null);
      setQrImage("");

      if (mappedCrops.length > 0) {
        const exists = mappedCrops.some(
          (crop) =>
            String(crop.inventoryId) === String(selectedInventoryId)
        );

        if (!exists) {
          setSelectedInventoryId(String(mappedCrops[0].inventoryId));
        }
      }

      setMessage("Inventory refreshed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>FarmChainX QR Scanner</h2>

      <p style={styles.description}>
        Scan a crop QR code to view its recorded origin, quality, prices,
        AI assessment, and supply-chain stage.
      </p>

      <section style={styles.section}>
        <h3>1. Select Crop Inventory</h3>

        <label htmlFor="inventorySelect">
          Choose an inventory record
        </label>

        <select
          id="inventorySelect"
          style={styles.select}
          value={selectedInventoryId}
          onChange={(event) => {
            setSelectedInventoryId(event.target.value);
            setQrImage("");
            setScannedCrop(null);
            setError("");
            setMessage("");
          }}
          disabled={loading || crops.length === 0}
        >
          {crops.length === 0 && (
            <option value="">No inventory available</option>
          )}

          {crops.map((crop) => (
            <option
              key={crop.inventoryId}
              value={String(crop.inventoryId)}
            >
              {crop.name} — Inventory ID: {crop.inventoryId}
              {crop.productId !== null
                ? ` — Product ID: ${crop.productId}`
                : ""}
            </option>
          ))}
        </select>

        <div>
          <button
            type="button"
            style={styles.button}
            onClick={createQR}
            disabled={loading || crops.length === 0}
          >
            Generate QR Code
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={scanSelectedInventory}
            disabled={loading || crops.length === 0}
          >
            View Selected Crop
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={refreshInventory}
            disabled={loading}
          >
            Refresh Inventory
          </button>
        </div>

        {qrImage && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h4>Generated Crop QR Code</h4>

            <img
              src={qrImage}
              alt="FarmChainX crop QR code"
              style={styles.qrImage}
            />

            <button
              type="button"
              style={styles.button}
              onClick={downloadQR}
            >
              Download QR Code
            </button>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h3>2. Scan QR Code Image</h3>

        <p>
          Upload a QR code image previously generated by FarmChainX.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleQRUpload}
          disabled={loading || scanning}
        />

        {scanning && (
          <p style={styles.message}>Scanning QR image...</p>
        )}
      </section>

      {loading && (
        <p style={styles.message}>Loading crop inventory...</p>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {message && !error && (
        <p style={styles.success}>{message}</p>
      )}

      {scannedCrop && (
        <section style={styles.section}>
          <h3>Verified Crop Details</h3>

          <p>
            <span style={styles.stage}>{scannedCrop.stage}</span>
          </p>

          <div style={styles.detailGrid}>
            <div style={styles.detail}>
              <strong>Crop Name</strong>
              <div>{scannedCrop.name}</div>
            </div>

            <div style={styles.detail}>
              <strong>Inventory ID</strong>
              <div>{scannedCrop.inventoryId}</div>
            </div>

            <div style={styles.detail}>
              <strong>Product ID</strong>
              <div>{scannedCrop.productId ?? "Not available"}</div>
            </div>

            <div style={styles.detail}>
              <strong>Farmer / Owner</strong>
              <div>{scannedCrop.farmerName}</div>
            </div>

            <div style={styles.detail}>
              <strong>Location</strong>
              <div>{scannedCrop.location}</div>
            </div>

            <div style={styles.detail}>
              <strong>Quantity</strong>
              <div>
                {scannedCrop.quantity ?? "Not available"}
                {scannedCrop.quantity !== null ? " kg" : ""}
              </div>
            </div>

            <div style={styles.detail}>
              <strong>Quality Grade</strong>
              <div>{scannedCrop.quality}</div>
            </div>

            <div style={styles.detail}>
              <strong>Harvest Date</strong>
              <div>{formatDate(scannedCrop.harvestDate)}</div>
            </div>

            <div style={styles.detail}>
              <strong>Farmer Price</strong>
              <div>{formatPrice(scannedCrop.farmerPrice)}</div>
            </div>

            <div style={styles.detail}>
              <strong>Distributor Price</strong>
              <div>{formatPrice(scannedCrop.distributorPrice)}</div>
            </div>

            <div style={styles.detail}>
              <strong>Retailer Selling Price</strong>
              <div>{formatPrice(scannedCrop.retailerPrice)}</div>
            </div>

            <div style={styles.detail}>
              <strong>AI Quality Score</strong>
              <div>
                {scannedCrop.aiScore !== null &&
                scannedCrop.aiScore !== undefined
                  ? `${scannedCrop.aiScore}%`
                  : "Not available"}
              </div>
            </div>

            <div style={styles.detail}>
              <strong>AI Verdict</strong>
              <div>{scannedCrop.aiVerdict || "Not available"}</div>
            </div>

            <div style={styles.detail}>
              <strong>Supply Chain Stage</strong>
              <div>{scannedCrop.stage}</div>
            </div>
          </div>

          <p style={styles.message}>
            These details are based on the inventory record returned by
            the backend. Viewing or scanning a QR code does not itself
            mean the crop has been purchased or sold.
          </p>
        </section>
      )}
    </div>
  );
};

export default QRScanner;
