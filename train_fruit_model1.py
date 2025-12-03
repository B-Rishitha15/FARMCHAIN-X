import os
import shutil
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt

# -----------------------------
# 1. Dataset paths
# -----------------------------
base_path = r"C:\Users\rishi\Downloads\archive (2)\dataset"
train_dir = os.path.join(base_path, "train")
test_dir  = os.path.join(base_path, "test")

# -----------------------------
# 2. Ensure all train classes exist in test
# -----------------------------
train_classes = sorted(os.listdir(train_dir))
test_classes = sorted(os.listdir(test_dir))

for cls in train_classes:
    cls_path = os.path.join(test_dir, cls)
    if not os.path.exists(cls_path):
        os.makedirs(cls_path)  # create empty folder if missing
        print(f"Created missing test folder: {cls_path}")

num_classes = len(train_classes)
print(f"Total classes: {num_classes}")

# -----------------------------
# 3. Parameters
# -----------------------------
img_size = (224, 224)
batch_size = 32
epochs = 10  # adjust for testing

# -----------------------------
# 4. Data generators
# -----------------------------
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.12,
    height_shift_range=0.12,
    shear_range=0.12,
    zoom_range=0.12,
    horizontal_flip=True,
    fill_mode='nearest'
)

test_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=img_size,
    batch_size=batch_size,
    classes=train_classes,  # explicitly use all train classes
    class_mode='categorical'
)

test_generator = test_datagen.flow_from_directory(
    test_dir,
    target_size=img_size,
    batch_size=batch_size,
    classes=train_classes,  # match train classes
    class_mode='categorical'
)

# -----------------------------
# 5. Build MobileNetV2 model
# -----------------------------
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224,224,3))
base_model.trainable = False  # freeze base for faster training

model = Sequential([
    base_model,
    GlobalAveragePooling2D(),
    Dropout(0.3),
    Dense(128, activation='relu'),
    Dropout(0.2),
    Dense(num_classes, activation='softmax')  # multi-class output
])

model.compile(
    optimizer=Adam(1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# -----------------------------
# 6. Train the model
# -----------------------------
history = model.fit(
    train_generator,
    steps_per_epoch=100,  # safe for testing; remove for full training
    epochs=epochs,
    validation_data=test_generator
)

# -----------------------------
# 7. Plot metrics
# -----------------------------
plt.figure(figsize=(12,4))

plt.subplot(1,2,1)
plt.plot(history.history['accuracy'], label='train_acc')
plt.plot(history.history['val_accuracy'], label='val_acc')
plt.legend(); plt.title('Accuracy')

plt.subplot(1,2,2)
plt.plot(history.history['loss'], label='train_loss')
plt.plot(history.history['val_loss'], label='val_loss')
plt.legend(); plt.title('Loss')

plt.show()

# -----------------------------
# 8. Save model
# -----------------------------
model.save("fruit_freshness_model.keras", save_format="keras")
print("✅ Model saved as fruit_freshness_model.keras")
