# Disease Detection Classes - PlantVillage Dataset

## Overview
This document lists all disease classes supported by the trained model, matching the PlantVillage dataset folder structure.

## Supported Disease Classes (16 Total)

### Bell Pepper (2 classes)
1. **Pepper__bell___Bacterial_spot**
   - Description: Images of bell pepper leaves infected with Bacterial Spot
   - Caused by: Xanthomonas bacteria
   - Symptoms: Small, water-soaked spots that turn brown with yellow halos

2. **Pepper__bell___healthy**
   - Description: Images of healthy bell pepper leaves
   - Status: No disease detected

### Potato (3 classes)
3. **Potato___Early_blight**
   - Description: Potato leaves infected with Early Blight
   - Caused by: Alternaria solani (fungus)
   - Symptoms: Dark brown spots with concentric rings on older leaves

4. **Potato___Late_blight**
   - Description: Potato leaves infected with Late Blight
   - Caused by: Phytophthora infestans (fungus)
   - Symptoms: Dark, water-soaked lesions with white fungal growth

5. **Potato___healthy**
   - Description: Healthy potato leaf images
   - Status: No disease detected

### Tomato (11 classes)
6. **Tomato_Bacterial_spot**
   - Description: Tomato leaves with bacterial spot
   - Caused by: Xanthomonas species
   - Symptoms: Small, dark, water-soaked spots with yellow halos

7. **Tomato_Early_blight**
   - Description: Tomato early blight infection
   - Caused by: Alternaria solani (fungus)
   - Symptoms: Dark brown spots with concentric rings

8. **Tomato_Late_blight**
   - Description: Tomato late blight infection
   - Caused by: Phytophthora infestans (fungus)
   - Symptoms: Rapid leaf death with dark lesions

9. **Tomato_Leaf_Mold**
   - Description: Tomato leaf mold images
   - Caused by: Passalora fulva (fungus)
   - Symptoms: Yellow patches with velvety olive-green mold

10. **Tomato__Tomato_mosaic_virus**
    - Description: Tomato mosaic virus infection
    - Caused by: Tomato mosaic virus (ToMV)
    - Symptoms: Mottled, distorted leaves with yellow/green patches

11. **Tomato__Tomato_YellowLeaf__Curl_Virus**
    - Description: Yellow leaf curl virus
    - Caused by: TYLCV (transmitted by whiteflies)
    - Symptoms: Yellowing, curling, and stunting of leaves

12. **Tomato_Spider_mites_Two_spotted_spider_mite**
    - Description: Tomato leaves damaged by spider mites
    - Caused by: Two-spotted spider mite (pest)
    - Symptoms: Stippling, yellowing, and webbing on leaves

13. **Tomato_Septoria_leaf_spot**
    - Description: Septoria leaf spot infection
    - Caused by: Septoria lycopersici (fungus)
    - Symptoms: Small circular spots with dark borders and gray centers

14. **Tomato__Target_Spot**
    - Description: Target spot disease
    - Caused by: Corynespora cassiicola (fungus)
    - Symptoms: Circular, target-like lesions with concentric rings

15. **Tomato_healthy**
    - Description: Healthy tomato leaves
    - Status: No disease detected

## Dataset Statistics
- **Total Classes**: 16
- **Training Images**: 33,027
- **Validation Images**: 8,249
- **Total Images**: 41,276

## Folder Name Variations
The model handles variations in folder naming:
- Single underscore: `Tomato_Bacterial_spot`
- Double underscore: `Tomato__Target_Spot`
- Triple underscore: `Pepper__bell___Bacterial_spot`

The matching algorithm normalizes these variations for proper disease identification.

## Model Output
For each detected disease, the model provides:
1. **Disease Name**: Normalized disease label
2. **Confidence Score**: Probability (0-1)
3. **Top 3 Predictions**: Best 3 matches with confidence
4. **Explanation**: Detailed description of the disease
5. **Cure Steps**: Step-by-step treatment instructions
6. **Recommended Pesticide**: Specific pesticide recommendations
7. **Recommended Fertilizer**: Fertilizer advice for recovery

## Training Information
- **Model Architecture**: MobileNetV2 (Transfer Learning)
- **Image Size**: 224x224 pixels
- **Training Epochs**: 30 (Phase 1) + 15 (Phase 2)
- **Batch Size**: 32
- **Validation Split**: 20%
- **Expected Accuracy**: 90%+ with proper training

