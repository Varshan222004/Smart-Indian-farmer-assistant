# Disease Detection - Testing Guide

## ✅ Implementation Complete

### Files Updated:
1. **Python Service**: `ml_services/disease_detector/app.py` - Updated with your exact code
2. **Frontend**: `frontend/src/pages/DiseaseDetection.jsx` - Updated with your exact code
3. **Backend Route**: `backend/routes/ml.js` - Fixed to accept 'file' instead of 'image'

## 🚀 How to Test

### Step 1: Start the Python ML Service

```bash
cd ml_services/disease_detector
python app.py
```

**Expected output:**
```
[OK] Loaded model from .../models/disease_model.h5
[OK] Loaded 12 class labels
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8003
```

### Step 2: Start the Backend Server

```bash
cd backend
npm start
```

**Expected output:**
```
✅ Connected to MongoDB
🚀 Server running on port 5001
```

### Step 3: Start the Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5000/
```

### Step 4: Test the Service

1. **Open browser**: Navigate to `http://localhost:5000/disease-detection`
2. **Login** (if required)
3. **Upload an image**:
   - Click "📁 Upload Image"
   - Select a plant leaf image (JPG/PNG)
   - Or use "📷 Use Camera" to capture from device
4. **Click "Detect Disease"**
5. **View results**:
   - Disease name and confidence
   - Top 3 predictions
   - Explanation
   - Cure steps
   - Recommended pesticide
   - Recommended fertilizer

## 📋 Expected Output Format

```json
{
  "label": "Tomato - Early blight",
  "disease": "Tomato___Early_blight",
  "confidence": 0.95,
  "top3": [
    {"label": "Tomato - Early blight", "confidence": 0.95},
    {"label": "Tomato - Late blight", "confidence": 0.03},
    {"label": "Tomato - healthy", "confidence": 0.02}
  ],
  "explanation": "Early blight in tomato shows concentric brown spots...",
  "cureSteps": [
    "Remove infected leaves and destroy away from field",
    "Spray Mancozeb, Chlorothalonil or Azoxystrobin",
    ...
  ],
  "recommendedPesticide": "Mancozeb, Chlorothalonil or Azoxystrobin.",
  "recommendedFertilizer": "Balanced NPK with adequate potassium and calcium.",
  "detection_method": "MobileNetV2 Transfer Learning"
}
```

## 🔍 Troubleshooting

### Issue: "Service unavailable" error
**Solution**: Make sure Python service is running on port 8003
```bash
cd ml_services/disease_detector
python app.py
```

### Issue: "Model not loaded" error
**Solution**: Check if model file exists:
```bash
ls ml_services/disease_detector/models/disease_model.h5
```

### Issue: "No file uploaded" error
**Solution**: 
- Make sure you're selecting an image file
- Check browser console for errors
- Verify backend route accepts 'file' parameter

### Issue: CORS errors
**Solution**: The Python service has CORS enabled for all origins. If issues persist, check:
- Backend is running on port 5001
- Frontend is running on port 5000
- Vite proxy is configured correctly

## ✅ Test Checklist

- [ ] Python service starts without errors
- [ ] Model loads successfully
- [ ] Backend server starts
- [ ] Frontend loads disease detection page
- [ ] Can upload image file
- [ ] Can capture from camera (if device supports)
- [ ] Prediction returns results
- [ ] Results display correctly with all fields
- [ ] Error handling works for invalid files
- [ ] Error handling works when service is down

## 🎯 Quick Test Command

Run the test script:
```bash
cd ml_services/disease_detector
python test_service.py
```

This will test:
- Service health
- Model loading
- Prediction endpoint
- Sample image processing

## 📝 Notes

- The service expects images in JPG, PNG, or BMP format
- Maximum file size: 5MB
- Model input size: 224x224 pixels (automatically resized)
- Supported diseases: Apple scab, Corn rust, Grape black rot, Potato blights, Tomato diseases, and healthy variants

