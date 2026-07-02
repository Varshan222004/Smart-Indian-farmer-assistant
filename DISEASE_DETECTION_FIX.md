# Disease Detection - "Unexpected field" Error Fix

## ✅ Changes Made

1. **Frontend (`frontend/src/utils/api.js`)**:
   - Updated axios interceptor to detect FormData and remove default `Content-Type` header
   - Allows browser to set proper `multipart/form-data` with boundary

2. **Frontend (`frontend/src/pages/DiseaseDetection.jsx`)**:
   - Removed manual `Content-Type` header setting
   - Simplified API call

3. **Backend (`backend/routes/ml.js`)**:
   - Improved file forwarding using buffer instead of stream
   - Added detailed logging for debugging
   - Better error handling for FastAPI validation errors
   - Enhanced error messages

## 🧪 How to Test

### Step 1: Verify Python Service is Running

```bash
# Terminal 1: Start Python service
cd ml_services/disease_detector
python app.py
```

**Expected output:**
```
[OK] Loaded model from .../models/disease_model.h5
[OK] Loaded 12 class labels
INFO:     Uvicorn running on http://0.0.0.0:8003
```

**If you see errors:**
- Install dependencies: `pip install -r requirements.txt`
- Check model file exists: `ls models/disease_model.h5`

### Step 2: Verify Backend is Running

```bash
# Terminal 2: Start backend
cd backend
npm start
```

**Expected output:**
```
✅ Connected to MongoDB
🚀 Server running on port 5001
```

### Step 3: Verify Frontend is Running

```bash
# Terminal 3: Start frontend
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5000/
```

### Step 4: Test in Browser

1. Open: `http://localhost:5000/disease-detection`
2. Login if required
3. Click "📁 Upload Image"
4. Select a plant leaf image (JPG/PNG)
5. Click "Detect Disease"
6. Check results

## 🔍 Debugging Steps

### Check Backend Logs

When you upload an image, you should see:

```
[Disease Detection] Request received
[Disease Detection] File: image.jpg
[Disease Detection] File path: ./uploads/disease_1234567890.jpg
[Disease Detection] File mimetype: image/jpeg
[Disease Detection] Forwarding to: http://localhost:8003/predict
[Disease Detection] FormData created, sending request to ML service...
[Disease Detection] Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
[Disease Detection] Response received: Tomato - Early blight
```

### Check Python Service Logs

You should see incoming requests:
```
INFO:     127.0.0.1:xxxxx - "POST /predict HTTP/1.1" 200 OK
```

### Check Browser Console (F12)

Look for:
- Network tab: Check the request to `/api/ml/disease-detect`
- Console tab: Any JavaScript errors
- Request payload: Should show FormData with `file` field

## ❌ If "Unexpected field" Error Persists

### Check 1: Python Service Status

```bash
curl http://localhost:8003/health
```

Should return: `{"status":"healthy"}`

### Check 2: Backend Logs

Look for the detailed error in backend terminal:
```
[Disease Detection] Axios Error:
  Status: 422
  Detail: [{"loc":["body","file"],"msg":"field required","type":"value_error.missing"}]
```

This tells you exactly what FastAPI is expecting.

### Check 3: Verify Field Name

The error might show:
- `"field required"` - means `file` field is missing
- `"Unexpected field"` - means a different field name was sent

### Check 4: Test Python Service Directly

If you have `curl`:
```bash
curl -X POST http://localhost:8003/predict \
  -F "file=@path/to/image.jpg"
```

Or use Postman/Thunder Client:
- Method: POST
- URL: `http://localhost:8003/predict`
- Body: form-data
- Key: `file` (must be exactly "file")
- Value: Select file

## 🐛 Common Issues

### Issue: "Service unavailable"
**Solution**: Python service not running. Start it on port 8003.

### Issue: "Model not loaded"
**Solution**: Check `models/disease_model.h5` exists and is valid.

### Issue: "Unexpected field"
**Possible causes:**
1. Field name is not exactly `"file"` (case-sensitive)
2. Content-Type header is wrong (should include boundary)
3. FormData is malformed

**Fix**: The code now handles this correctly. If it persists:
- Check backend logs for exact error
- Verify Python service is receiving the request
- Check Content-Type includes boundary

### Issue: CORS errors
**Solution**: Python service has CORS enabled. If issues persist, check:
- Backend is on port 5001
- Frontend is on port 5000
- Vite proxy is configured

## ✅ Success Indicators

When working correctly:
1. ✅ Python service shows: `"POST /predict HTTP/1.1" 200 OK`
2. ✅ Backend shows: `[Disease Detection] Response received: ...`
3. ✅ Frontend displays: Disease name, confidence, cure steps, etc.
4. ✅ No errors in browser console
5. ✅ No errors in backend terminal
6. ✅ No errors in Python service terminal

## 📝 Next Steps

If the error persists after following all steps:

1. **Share backend logs** - Copy the `[Disease Detection]` log messages
2. **Share Python service logs** - Copy any error messages
3. **Share browser console** - Copy any errors from F12 console
4. **Check network tab** - Screenshot the request/response in browser DevTools

The enhanced logging will help identify the exact issue.

