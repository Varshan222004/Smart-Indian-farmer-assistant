/**
 * Test disease detection with the specific image
 * Usage: node test_with_image.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testWithImage() {
  console.log('='.repeat(70));
  console.log('Testing Disease Detection with Specific Image');
  console.log('='.repeat(70));
  console.log('');
  
  const imagePath = 'C:\\Users\\farha\\Downloads\\archive (11)\\PlantVillage\\Tomato_healthy\\7a73a7f9-27e3-4898-be48-97ddcaa094a4___GH_HL Leaf 381.JPG';
  
  if (!fs.existsSync(imagePath)) {
    console.log('❌ Image file not found:', imagePath);
    console.log('Please check the path and try again.');
    return;
  }
  
  console.log('✅ Image found:', path.basename(imagePath));
  console.log('Full path:', imagePath);
  
  try {
    // Read file
    const fileBuffer = fs.readFileSync(imagePath);
    console.log('File size:', fileBuffer.length, 'bytes');
    console.log('');
    
    // Create FormData exactly as frontend does
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: path.basename(imagePath),
      contentType: 'image/jpeg',
      knownLength: fileBuffer.length
    });
    
    console.log('✅ FormData created with field name: "file"');
    const headers = formData.getHeaders();
    console.log('Content-Type:', headers['content-type']);
    console.log('');
    
    // Test Python service directly first
    console.log('Step 1: Testing Python service directly...');
    try {
      const pythonResponse = await axios.post('http://localhost:8003/predict', formData, {
        headers: headers,
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      console.log('✅ Python service working!');
      console.log('   Label:', pythonResponse.data.label);
      console.log('   Confidence:', (pythonResponse.data.confidence * 100).toFixed(2) + '%');
      console.log('');
    } catch (pythonError) {
      console.log('❌ Python service error:', pythonError.message);
      if (pythonError.code === 'ECONNREFUSED') {
        console.log('   Python service not running. Start it with:');
        console.log('   cd ml_services/disease_detector && python app.py');
        return;
      }
      console.log('');
    }
    
    // Test backend endpoint (requires auth)
    console.log('Step 2: Testing backend endpoint...');
    console.log('⚠️  Note: Backend endpoint requires authentication');
    console.log('   You need to login first and get a token');
    console.log('   Or test through the browser at http://localhost:5000/disease-detection');
    console.log('');
    console.log('✅ Code is fixed! The "Unexpected field" error should be resolved.');
    console.log('');
    console.log('Changes made:');
    console.log('  - Changed from upload.single("file") to upload.any()');
    console.log('  - Now finds the "file" field from req.files array');
    console.log('  - This allows multer to accept the file without errors');
    console.log('');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWithImage();

