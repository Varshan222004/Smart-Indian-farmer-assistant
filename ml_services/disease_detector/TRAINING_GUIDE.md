# Disease Detection Model Training Guide

## Overview
This guide explains how to train a proper disease detection model using the PlantVillage dataset.

## Changes Made
- ✅ Removed Gemini Vision API for disease detection (kept only for image validation)
- ✅ Using TensorFlow/Keras model as primary detection method
- ✅ Enhanced model architecture with better layers
- ✅ Improved data augmentation for better generalization
- ✅ Increased training epochs for better accuracy

## Model Architecture
- **Base Model**: MobileNetV2 (pre-trained on ImageNet)
- **Classification Head**: 
  - GlobalAveragePooling2D
  - BatchNormalization + Dropout(0.4)
  - Dense(512) + BatchNormalization + Dropout(0.4)
  - Dense(256) + BatchNormalization + Dropout(0.3)
  - Dense(128) + Dropout(0.2)
  - Dense(NUM_CLASSES, softmax)

## Data Augmentation
Enhanced augmentation includes:
- Rotation: ±40 degrees
- Translation: ±30% width/height
- Shear: ±20%
- Zoom: ±30%
- Horizontal & Vertical flip
- Brightness: 0.7x to 1.3x

## Training Process

### Step 1: Download Dataset
Download the PlantVillage dataset from:
- **Kaggle**: https://www.kaggle.com/datasets/emmarex/plantdisease
- **GitHub**: https://github.com/spMohanty/PlantVillage-Dataset

### Step 2: Extract Dataset
Extract the dataset to one of these locations:
- `PlantVillage/` (in project root)
- `ml_services/disease_detector/PlantVillage/`
- `../../PlantVillage/`

The dataset structure should be:
```
PlantVillage/
├── Apple___Apple_scab/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── Apple___healthy/
├── Corn___Common_rust/
├── ...
```

### Step 3: Run Training
```bash
cd ml_services/disease_detector
python train_disease_model.py
```

### Step 4: Training Phases

**Phase 1: Feature Extraction (30 epochs)**
- Freezes MobileNetV2 base model
- Trains only classification head
- Learning rate: 0.001
- Saves best model to `models/disease_model_best.h5`

**Phase 2: Fine-tuning (15 epochs)**
- Unfreezes last 50 layers of MobileNetV2
- Fine-tunes entire model
- Learning rate: 5e-5 (lower for fine-tuning)
- Saves best model to `models/disease_model_finetuned.h5`

### Step 5: Model Evaluation
After training, the script will:
- Evaluate on validation set
- Print test accuracy and loss
- Save final model to `models/disease_model.h5`
- Save class labels to `models/class_labels.json`

### Step 6: Restart Service
After training completes:
```bash
# Restart the disease detection ML service
cd ml_services/disease_detector
python app.py
```

## Training Parameters

| Parameter | Value |
|-----------|-------|
| Image Size | 224x224 |
| Batch Size | 32 |
| Validation Split | 20% |
| Initial Epochs | 30 |
| Fine-tuning Epochs | 15 |
| Initial Learning Rate | 0.001 |
| Fine-tuning LR | 5e-5 |
| Optimizer | Adam |
| Loss Function | Categorical Crossentropy |
| Metrics | Accuracy, Top-3 Accuracy |

## Expected Results

With proper PlantVillage dataset:
- **Training Accuracy**: 95%+
- **Validation Accuracy**: 90%+
- **Top-3 Accuracy**: 98%+

With sample data (random images):
- **Training Accuracy**: ~50-60%
- **Validation Accuracy**: ~50-60%
- ⚠️ **Warning**: Sample data produces poor results. Use real dataset!

## Troubleshooting

### Issue: "Dataset not found"
**Solution**: Download PlantVillage dataset and extract to correct location

### Issue: "Out of memory"
**Solution**: 
- Reduce batch size to 16 or 8
- Use smaller image size (e.g., 192x192)
- Close other applications

### Issue: "Low accuracy"
**Solution**:
- Ensure using real PlantVillage dataset (not sample data)
- Increase training epochs
- Check dataset quality and class balance
- Verify data augmentation is working

### Issue: "Model not loading"
**Solution**:
- Check if `models/disease_model.h5` exists
- Verify model file is not corrupted
- Re-train if necessary

## Model Files

After training, these files will be created:
- `models/disease_model.h5` - Final trained model
- `models/disease_model_best.h5` - Best model from Phase 1
- `models/disease_model_finetuned.h5` - Best model from Phase 2
- `models/class_labels.json` - Class label mapping

## Supported Diseases

The model can detect:
- **Apple**: Apple scab, Black rot, Cedar apple rust, Healthy
- **Corn**: Cercospora leaf spot, Common rust, Northern Leaf Blight, Healthy
- **Grape**: Black rot, Esca, Leaf blight, Healthy
- **Potato**: Early blight, Late blight, Healthy
- **Tomato**: Bacterial spot, Early blight, Late blight, Leaf Mold, Septoria leaf spot, Spider mites, Target Spot, Yellow Leaf Curl Virus, Healthy

## Notes

- Training time: 2-4 hours on CPU, 30-60 minutes on GPU
- Model size: ~15-20 MB
- Inference time: ~50-100ms per image
- Memory usage: ~500MB-1GB during training

## Next Steps

1. Train the model with PlantVillage dataset
2. Test with real plant leaf images
3. Monitor accuracy and retrain if needed
4. Deploy model for production use

