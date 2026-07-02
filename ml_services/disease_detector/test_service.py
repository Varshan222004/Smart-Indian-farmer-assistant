#!/usr/bin/env python3
"""
Quick test script to verify the disease detection service is working
"""
import requests
import json
import sys
import os

# Test if service is running
def test_service():
    base_url = "http://localhost:8003"
    
    print("=" * 50)
    print("Testing Disease Detection Service")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed:", response.json())
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Service is not running on port 8003")
        print("   Please start the service with: python app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 2: Root endpoint
    print("\n2. Testing root endpoint...")
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Root endpoint working")
            print(f"   Service: {data.get('service')}")
            print(f"   Model loaded: {data.get('model_loaded')}")
            print(f"   Number of classes: {data.get('num_classes')}")
            if not data.get('model_loaded'):
                print("⚠️  WARNING: Model is not loaded!")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 3: Check if we have a sample image
    print("\n3. Testing with sample image...")
    sample_dir = os.path.join(os.path.dirname(__file__), "sample_data")
    sample_files = []
    
    if os.path.exists(sample_dir):
        for root, dirs, files in os.walk(sample_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    sample_files.append(os.path.join(root, file))
                    break  # Just get one from each folder
            if sample_files:
                break
    
    if not sample_files:
        print("⚠️  No sample images found for testing")
        print("   Service appears to be running correctly")
        return True
    
    test_image = sample_files[0]
    print(f"   Using sample image: {os.path.basename(test_image)}")
    
    try:
        with open(test_image, 'rb') as f:
            files = {'file': (os.path.basename(test_image), f, 'image/jpeg')}
            response = requests.post(f"{base_url}/predict", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Prediction successful!")
            print(f"   Detected: {data.get('label', 'Unknown')}")
            print(f"   Confidence: {data.get('confidence', 0) * 100:.2f}%")
            print(f"   Disease: {data.get('disease', 'Unknown')}")
            if data.get('top3'):
                print(f"   Top 3 predictions: {len(data['top3'])}")
            return True
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        return False

if __name__ == "__main__":
    success = test_service()
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Service is ready.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check the service.")
        sys.exit(1)

