"""
Plant Disease Detection Model Training Script

This script trains a transfer learning model (MobileNetV2) for plant disease detection.

Dataset: Download PlantVillage from https://www.kaggle.com/datasets/emmarex/plantdisease
Extract to: ../../data/raw/plantvillage/
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
import json

print(f"TensorFlow version: {tf.__version__}")

def main():
    # Dataset paths
    data_dir = '../../data/raw/plantvillage'
    
    if not os.path.exists(data_dir):
        print(f"⚠️  Dataset not found at {data_dir}")
        print("Please download from: https://www.kaggle.com/datasets/emmarex/plantdisease")
        return
    
    print(f"✅ Dataset found at {data_dir}")
    classes = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    print(f"Found {len(classes)} classes")
    
    # Parameters
    IMG_SIZE = 224
    BATCH_SIZE = 32
    EPOCHS = 10
    
    # Data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        validation_split=0.2
    )
    
    train_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )
    
    val_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )
    
    NUM_CLASSES = train_generator.num_classes
    print(f"Number of classes: {NUM_CLASSES}")
    
    # Build model
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    base_model.trainable = False
    
    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.2),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(NUM_CLASSES, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.summary()
    
    # Train model
    print("Training model...")
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=val_generator,
        verbose=1
    )
    
    # Fine-tuning
    print("Fine-tuning...")
    base_model.trainable = True
    for layer in base_model.layers[:-20]:
        layer.trainable = False
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    history_fine = model.fit(
        train_generator,
        epochs=5,
        validation_data=val_generator,
        verbose=1
    )
    
    # Save model
    models_dir = 'models'
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, 'disease_model.h5')
    model.save(model_path)
    print(f"✅ Model saved to {model_path}")
    
    # Save class labels
    class_labels = {v: k for k, v in train_generator.class_indices.items()}
    with open(os.path.join(models_dir, 'class_labels.json'), 'w') as f:
        json.dump(class_labels, f)
    print(f"✅ Class labels saved")
    
    # Evaluate
    test_loss, test_accuracy = model.evaluate(val_generator)
    print(f"Test Accuracy: {test_accuracy:.4f}")

if __name__ == "__main__":
    main()

