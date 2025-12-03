from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os

# -------------------------------
# 1️⃣ Initialize Flask app
# -------------------------------
app = Flask(__name__)

# -------------------------------
# 2️⃣ Load trained model
# -------------------------------
MODEL_PATH = "fruit_freshness_model.keras"  # keep this same as your saved file name

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Model file not found: {MODEL_PATH}")

model = load_model(MODEL_PATH)
print("✅ Model loaded successfully")

# -------------------------------
# 3️⃣ Define class names (update if needed)
# -------------------------------
class_names = [
    'freshapples', 'freshbanana', 'freshbittergroud', 'freshcapsicum', 'freshcucumber',
    'freshokra', 'freshoranges', 'freshpotato', 'freshtomato',
    'rottenapples', 'rottenbanana', 'rottenbittergroud', 'rottencapsicum', 'rottencucumber',
    'rottenokra', 'rottenoranges', 'rottenpotato', 'rottentomato'
]
print(f"Detected {len(class_names)} classes:", class_names[:8], "...")

# -------------------------------
# 4️⃣ Define /predict endpoint
# -------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Please upload with key 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    # Save uploaded image
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    file.save(file_path)

    try:
        # Preprocess image
        img = image.load_img(file_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0

        # Predict
        preds = model.predict(img_array)[0]
        predicted_index = np.argmax(preds)
        predicted_class = class_names[predicted_index]
        confidence = float(preds[predicted_index] * 100)

        # Calculate Fresh vs Rotten %
        fresh_indices = [i for i, c in enumerate(class_names) if "fresh" in c.lower()]
        rotten_indices = [i for i, c in enumerate(class_names) if "rotten" in c.lower()]

        fresh_conf = float(np.sum(preds[fresh_indices]) * 100)
        rotten_conf = float(np.sum(preds[rotten_indices]) * 100)

        # Determine Quality Label
        quality_label = "Good Quality" if fresh_conf > rotten_conf else "Bad Quality"

        return jsonify({
            "predicted_class": predicted_class,
            "confidence": f"{confidence:.2f}%",
            "fresh_percentage": f"{fresh_conf:.2f}%",
            "rotten_percentage": f"{rotten_conf:.2f}%",
            "quality_label": quality_label
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------
# 5️⃣ Run Flask server
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
