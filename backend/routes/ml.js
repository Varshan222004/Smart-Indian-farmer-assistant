const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `disease_${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Create multer instance that accepts ANY field name
// This prevents "Unexpected field" errors
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// @route   POST /ml/crop-recommend
// @desc    Get crop recommendations
// @access  Private
router.post('/crop-recommend', protect, async (req, res) => {
  try {
    const {
      N, P, K,
      pH,
      temperature,
      humidity,
      rainfall,
      landSize,
      landQuality,
      soilType,
      month
    } = req.body;

    // Validate required fields
    if (N === undefined || P === undefined || K === undefined || pH === undefined ||
        temperature === undefined || humidity === undefined || rainfall === undefined ||
        !landSize || !landQuality || !soilType) {
      return res.status(400).json({
        message: 'Missing required fields: N, P, K, pH, temperature, humidity, rainfall, landSize, landQuality, soilType'
      });
    }

    const cropServiceUrl = process.env.CROP_RECO_SERVICE_URL || 'http://localhost:8001';
    
    const response = await axios.post(`${cropServiceUrl}/predict`, {
      N, P, K,
      pH,
      temperature,
      humidity,
      rainfall,
      landSize,
      landQuality,
      soilType,
      month: month || new Date().getMonth() + 1
    }, {
      timeout: 30000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Crop recommendation error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'Crop recommendation service is unavailable. Please ensure the ML service is running.',
        error: 'Service unavailable'
      });
    }
    res.status(500).json({
      message: 'Error getting crop recommendations',
      error: error.message
    });
  }
});

// @route   POST /ml/fertilizer-recommend
// @desc    Get fertilizer recommendations
// @access  Private
router.post('/fertilizer-recommend', protect, async (req, res) => {
  try {
    const { crop, N, P, K, pH, landSize, cropStage } = req.body;

    if (!crop || N === undefined || P === undefined || K === undefined || pH === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: crop, N, P, K, pH'
      });
    }

    const fertilizerServiceUrl = process.env.FERTILIZER_RECO_SERVICE_URL || 'http://localhost:8002';
    
    const response = await axios.post(`${fertilizerServiceUrl}/predict`, {
      crop,
      N, P, K,
      pH,
      landSize: landSize || req.user.landSize || 1,
      cropStage: cropStage || 'vegetative'
    }, {
      timeout: 30000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Fertilizer recommendation error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'Fertilizer recommendation service is unavailable',
        error: 'Service unavailable'
      });
    }
    res.status(500).json({
      message: 'Error getting fertilizer recommendations',
      error: error.message
    });
  }
});

// @route   POST /ml/disease-detect
// @desc    Detect plant disease from image
// @access  Private
// Use upload.any() to accept any fields, then find the 'file' field
router.post('/disease-detect', protect, (req, res, next) => {
  // Handle multer errors before they reach the route handler
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('[Disease Detection] Multer error:', err.message);
      console.error('[Disease Detection] Error code:', err.code);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large',
          detail: 'File size must be less than 5MB'
        });
      }
      if (err.message === 'Unexpected field') {
        // This shouldn't happen with upload.any(), but handle it just in case
        console.error('[Disease Detection] Unexpected field error - this should not happen with upload.any()');
        console.error('[Disease Detection] Request headers:', req.headers['content-type']);
        return res.status(400).json({
          message: 'File upload error',
          detail: 'Please ensure you are uploading a single image file with field name "file"'
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        detail: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('[Disease Detection] Request received');
    console.log('[Disease Detection] Files received:', req.files?.length || 0);
    if (req.files && req.files.length > 0) {
      console.log('[Disease Detection] File fieldnames:', req.files.map(f => f.fieldname));
    }
    console.log('[Disease Detection] Body keys:', Object.keys(req.body));
    
    // Find the file with fieldname 'file'
    const file = req.files?.find(f => f.fieldname === 'file');
    
    if (!file) {
      console.error('[Disease Detection] No file found with fieldname "file"');
      console.error('[Disease Detection] Available files:', req.files?.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })) || []);
      return res.status(400).json({ 
        message: 'No image file provided',
        detail: 'Please upload an image file. The field name should be "file".'
      });
    }
    
    console.log('[Disease Detection] File found:', file.originalname);

    const diseaseServiceUrl = process.env.DISEASE_DETECTOR_SERVICE_URL || 'http://localhost:8003';
    console.log('[Disease Detection] Forwarding to:', `${diseaseServiceUrl}/predict`);
    console.log('[Disease Detection] File path:', file.path);
    console.log('[Disease Detection] File mimetype:', file.mimetype);
    console.log('[Disease Detection] File originalname:', file.originalname);
    
    // Read the file into a buffer
    const fileBuffer = fs.readFileSync(file.path);
    
    // Create form data using form-data package (required for Node.js)
    const FormData = require('form-data');
    const formData = new FormData();
    
    // FastAPI expects 'file' as the parameter name
    // Use buffer with proper options - CRITICAL: field name must be exactly 'file'
    formData.append('file', fileBuffer, {
      filename: file.originalname || 'image.jpg',
      contentType: file.mimetype || 'image/jpeg',
      knownLength: fileBuffer.length
    });

    console.log('[Disease Detection] FormData created');
    console.log('[Disease Detection] File size:', fileBuffer.length, 'bytes');
    console.log('[Disease Detection] File name:', file.originalname);
    
    // Get headers from form-data (includes Content-Type with boundary)
    const formHeaders = formData.getHeaders();
    console.log('[Disease Detection] Content-Type:', formHeaders['content-type']);
    
    // Verify the boundary is present
    if (!formHeaders['content-type'] || !formHeaders['content-type'].includes('boundary')) {
      console.error('[Disease Detection] WARNING: Content-Type missing boundary!');
    }
    
    let response;
    try {
      // Send the form data stream directly to Python service
      // CRITICAL: Use formData as the body and let form-data package handle the stream
      response = await axios({
        method: 'POST',
        url: `${diseaseServiceUrl}/predict`,
        data: formData,
        headers: formHeaders, // Use form-data headers (includes boundary)
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Prevent axios from transforming FormData
        transformRequest: []
      });
      console.log('[Disease Detection] ✅ Success! Response received:', response.data?.label || 'No label');
    } catch (axiosError) {
      // Log detailed error information for debugging
      console.error('[Disease Detection] ❌ Axios Error:');
      if (axiosError.response) {
        console.error('  Status:', axiosError.response.status);
        console.error('  Status Text:', axiosError.response.statusText);
        console.error('  Response Data:', JSON.stringify(axiosError.response.data, null, 2));
        
        if (axiosError.response.data?.detail) {
          const detail = axiosError.response.data.detail;
          console.error('  Detail:', detail);
          
          if (Array.isArray(detail)) {
            detail.forEach((err, idx) => {
              console.error(`  Validation Error ${idx + 1}:`, {
                location: err.loc,
                message: err.msg,
                type: err.type
              });
            });
          }
        }
      } else if (axiosError.request) {
        console.error('  Request made but no response received');
        console.error('  Error:', axiosError.message);
        console.error('  Code:', axiosError.code);
      } else {
        console.error('  Error setting up request:', axiosError.message);
      }
      throw axiosError;
    }

    // Clean up uploaded file
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log('[Disease Detection] Cleaned up uploaded file');
      } catch (unlinkError) {
        console.error('[Disease Detection] Error cleaning up file:', unlinkError.message);
      }
    }

    res.json(response.data);
  } catch (error) {
    console.error('[Disease Detection] Error:', error.message);
    console.error('[Disease Detection] Error stack:', error.stack);
    if (error.response) {
      console.error('[Disease Detection] ML Service response:', error.response.status, error.response.data);
    }
    
    // Clean up file on error
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log('[Disease Detection] Cleaned up uploaded file on error');
      } catch (unlinkError) {
        console.error('[Disease Detection] Error cleaning up file:', unlinkError.message);
      }
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        message: 'Disease detection service is unavailable. Please ensure the ML service is running on port 8003.',
        error: 'Service unavailable',
        detail: error.message
      });
    }
    if (error.response) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || error.message;
      const errorData = error.response.data;
      console.error('[Disease Detection] ML Service error detail:', errorDetail);
      console.error('[Disease Detection] ML Service error data:', JSON.stringify(errorData, null, 2));
      console.error('[Disease Detection] ML Service status:', error.response.status);
      
      // Handle FastAPI validation errors specifically (422 = Unprocessable Entity)
      if (error.response.status === 422) {
        let validationMessage = 'Invalid request format';
        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            validationMessage = errorData.detail.map(e => {
              const field = e.loc ? e.loc.join('.') : 'unknown';
              return `${field}: ${e.msg}`;
            }).join('; ');
          } else {
            validationMessage = String(errorData.detail);
          }
        }
        console.error('[Disease Detection] Validation error:', validationMessage);
        return res.status(422).json({
          message: 'Invalid request format sent to ML service',
          error: validationMessage,
          detail: validationMessage,
          hint: 'The field name must be exactly "file"'
        });
      }
      
      // Handle 400 Bad Request (often "Unexpected field")
      if (error.response.status === 400) {
        return res.status(400).json({
          message: 'Invalid request to ML service',
          error: errorDetail,
          detail: errorDetail,
          hint: 'Please check that the file is a valid image (JPG/PNG/BMP)'
        });
      }
      
      return res.status(error.response.status).json({
        message: 'Error detecting disease',
        error: errorDetail,
        detail: errorDetail,
        statusCode: error.response.status
      });
    }
    res.status(500).json({
      message: 'Error detecting disease',
      error: error.message,
      detail: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

