/**
 * Direct test of Python service file upload
 * Run: node test_file_upload.js (from backend directory)
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  console.log('='.repeat(60));
  console.log('Testing Python Service File Upload');
  console.log('='.repeat(60));
  console.log('');
  
  // Find a sample image
  const sampleDir = path.join(__dirname, '..', 'ml_services', 'disease_detector', 'sample_data');
  let testImage = null;
  
  // Look for any sample image
  if (fs.existsSync(sampleDir)) {
    const dirs = fs.readdirSync(sampleDir);
    for (const dir of dirs) {
      const dirPath = path.join(sampleDir, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));
        if (files.length > 0) {
          testImage = path.join(dirPath, files[0]);
          break;
        }
      }
    }
  }
  
  if (!testImage) {
    console.log('❌ No sample image found.');
    console.log('Please ensure you have an image file to test with.');
    console.log('Expected location:', sampleDir);
    return;
  }
  
  console.log('✅ Found test image:', path.basename(testImage));
  console.log('Full path:', testImage);
  
  try {
    // Read file
    const fileBuffer = fs.readFileSync(testImage);
    console.log('File size:', fileBuffer.length, 'bytes');
    console.log('');
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: path.basename(testImage),
      contentType: 'image/jpeg',
      knownLength: fileBuffer.length
    });
    
    console.log('✅ FormData created');
    const headers = formData.getHeaders();
    console.log('Content-Type:', headers['content-type']);
    console.log('');
    console.log('Sending request to http://localhost:8003/predict...');
    console.log('');
    
    // Send request
    const response = await axios.post('http://localhost:8003/predict', formData, {
      headers: headers,
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('='.repeat(60));
    console.log('✅ SUCCESS! Python service is working correctly!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Response Data:');
    console.log('  Label:', response.data.label);
    console.log('  Disease:', response.data.disease);
    console.log('  Confidence:', (response.data.confidence * 100).toFixed(2) + '%');
    if (response.data.top3) {
      console.log('  Top 3 predictions:');
      response.data.top3.forEach((p, i) => {
        console.log(`    ${i + 1}. ${p.label} (${(p.confidence * 100).toFixed(2)}%)`);
      });
    }
    if (response.data.explanation) {
      console.log('  Explanation:', response.data.explanation.substring(0, 100) + '...');
    }
    console.log('');
    console.log('✅ The Python service is ready to receive requests!');
    
  } catch (error) {
    console.log('='.repeat(60));
    console.log('❌ ERROR:');
    console.log('='.repeat(60));
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
      if (error.response.data?.detail) {
        console.log('');
        console.log('Detail:', error.response.data.detail);
        if (Array.isArray(error.response.data.detail)) {
          console.log('');
          console.log('Validation Errors:');
          error.response.data.detail.forEach((err, idx) => {
            console.log(`  ${idx + 1}. Location: ${err.loc?.join('.')}`);
            console.log(`     Message: ${err.msg}`);
            console.log(`     Type: ${err.type}`);
          });
        }
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused - Python service not running on port 8003');
      console.log('');
      console.log('To start the service:');
      console.log('  cd ml_services/disease_detector');
      console.log('  python app.py');
    } else {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    }
    console.log('');
  }
}

testUpload();

