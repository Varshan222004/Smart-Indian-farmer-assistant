"""
Plant Disease Detection Model Training Script

- Uses Transfer Learning (MobileNetV2 pre-trained on ImageNet)
- Trains on YOUR dataset folders (see DATA_DIR below)
- Saves:
    models/disease_model.h5
    models/class_labels.json
"""

import os
import json
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

print("TensorFlow version:", tf.__version__)


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # ✅ CHANGE THIS if your dataset is elsewhere
    DATA_DIR = os.path.join(base_dir, "PlantVillage")

    if not os.path.exists(DATA_DIR):
        print(f"⚠️ Dataset not found at: {DATA_DIR}")
        print("Put your class folders (Tomato_..., Potato_..., Pepper_...) inside this folder.")
        return

    print(f"✅ Dataset found at: {DATA_DIR}")

    IMG_SIZE = 224
    BATCH_SIZE = 32
    EPOCHS = 10

    # ----- Data generators with augmentation -----
    datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        zoom_range=0.2,
        horizontal_flip=True,
        validation_split=0.2,
    )

    train_gen = datagen.flow_from_directory(
        DATA_DIR,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="training",
    )

    val_gen = datagen.flow_from_directory(
        DATA_DIR,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="validation",
    )

    num_classes = train_gen.num_classes
    print(f"Number of classes: {num_classes}")
    print("Classes:", train_gen.class_indices)

    # ----- Build model (MobileNetV2) -----
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # freeze backbone

    model = keras.Sequential(
        [
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.3),
            layers.Dense(128, activation="relu"),
            layers.Dropout(0.3),
            layers.Dense(num_classes, activation="softmax"),
        ]
    )

    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    # ----- Train head -----
    print("Training classification head...")
    history = model.fit(
        train_gen,
        epochs=EPOCHS,
        validation_data=val_gen,
        verbose=1,
    )

    # ----- Fine-tune last layers of MobileNetV2 -----
    print("Fine-tuning backbone...")
    base_model.trainable = True
    # freeze first ~80% layers
    for layer in base_model.layers[:100]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history_fine = model.fit(
        train_gen,
        epochs=5,
        validation_data=val_gen,
        verbose=1,
    )

    # ----- Save model + label mapping -----
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, "disease_model.h5")
    model.save(model_path)
    print(f"✅ Model saved to {model_path}")

    # class_indices: {"Tomato_healthy": 0, ...}
    class_labels = {v: k for k, v in train_gen.class_indices.items()}
    labels_path = os.path.join(models_dir, "class_labels.json")
    with open(labels_path, "w") as f:
        json.dump(class_labels, f)
    print(f"✅ Class labels saved to {labels_path}")

    # Evaluate
    loss, acc = model.evaluate(val_gen, verbose=0)
    print(f"Validation Accuracy: {acc:.4f}")


if __name__ == "__main__":
    main()
