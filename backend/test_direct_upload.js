/**
 * Test direct file upload to backend endpoint
 * Usage: node test_direct_upload.js "C:\path\to\image.jpg"
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testDirectUpload(imagePath) {
  console.log('='.repeat(60));
  console.log('Testing Direct Backend Upload');
  console.log('='.repeat(60));
  console.log('');
  
  if (!imagePath) {
    console.log('❌ Please provide image path');
    console.log('Usage: node test_direct_upload.js "C:\\path\\to\\image.jpg"');
    return;
  }
  
  if (!fs.existsSync(imagePath)) {
    console.log('❌ Image file not found:', imagePath);
    return;
  }
  
  console.log('Image:', path.basename(imagePath));
  console.log('Full path:', imagePath);
  
  try {
    // Read file
    const fileBuffer = fs.readFileSync(imagePath);
    console.log('File size:', fileBuffer.length, 'bytes');
    console.log('');
    
    // Create FormData (same as frontend)
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: path.basename(imagePath),
      contentType: 'image/jpeg',
      knownLength: fileBuffer.length
    });
    
    console.log('✅ FormData created');
    console.log('Field name: file');
    console.log('');
    
    // Get auth token (you'll need to login first to get token)
    // For testing, we'll try without auth first
    const headers = formData.getHeaders();
    
    console.log('Sending to: http://localhost:5001/api/ml/disease-detect');
    console.log('Content-Type:', headers['content-type']);
    console.log('');
    
    // Try with auth token if available
    const token = process.env.AUTH_TOKEN || '';
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Using auth token');
    } else {
      console.log('⚠️  No auth token - endpoint may require authentication');
      console.log('Set AUTH_TOKEN env var or login first');
    }
    console.log('');
    
    // Send request
    const response = await axios.post('http://localhost:5001/api/ml/disease-detect', formData, {
      headers: headers,
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('='.repeat(60));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('='.repeat(60));
    console.log('❌ ERROR:');
    console.log('='.repeat(60));
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused - Backend not running on port 5001');
      console.log('Start backend: cd backend && npm start');
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Get image path from command line
const imagePath = process.argv[2] || 'C:\\Users\\farha\\Downloads\\archive (11)\\PlantVillage\\Tomato_healthy\\7a73a7f9-27e3-4898-be48-97ddcaa094a4___GH_HL Leaf 381.JPG';

testDirectUpload(imagePath);

