"""
Test script for Disease Detection Model
Tests the model with sample images from PlantVillage dataset
"""

import requests
import json
import os
from pathlib import Path

def test_disease_detection(image_path, service_url="http://localhost:8003"):
    """Test disease detection with an image"""
    print(f"\n{'='*60}")
    print(f"Testing Disease Detection")
    print(f"{'='*60}")
    print(f"Image: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    try:
        # Prepare file for upload
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
            response = requests.post(f"{service_url}/predict", files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Detection Successful!")
            print(f"\nResults:")
            print(f"  Disease: {result.get('label', 'Unknown')}")
            print(f"  Confidence: {result.get('confidence', 0) * 100:.2f}%")
            print(f"  Detection Method: {result.get('detection_method', 'Unknown')}")
            
            if result.get('top3'):
                print(f"\n  Top 3 Predictions:")
                for i, pred in enumerate(result.get('top3', [])[:3], 1):
                    print(f"    {i}. {pred.get('label', 'Unknown')}: {pred.get('confidence', 0) * 100:.2f}%")
            
            print(f"\n  Explanation:")
            print(f"    {result.get('explanation', 'No explanation available')}")
            
            if result.get('cureSteps'):
                print(f"\n  Cure Steps:")
                for i, step in enumerate(result.get('cureSteps', [])[:3], 1):
                    print(f"    {i}. {step}")
            
            print(f"\n  Recommended Pesticide:")
            print(f"    {result.get('recommendedPesticide', 'Not specified')}")
            
            print(f"\n  Recommended Fertilizer:")
            print(f"    {result.get('recommendedFertilizer', 'Not specified')}")
            
            return True
        else:
            print(f"\n❌ Detection Failed!")
            print(f"  Status Code: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error during testing:")
        print(f"  {str(e)}")
        return False

def test_service_health(service_url="http://localhost:8003"):
    """Test if the service is running"""
    try:
        response = requests.get(f"{service_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Service is healthy")
            return True
        else:
            print(f"⚠️  Service returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Service not available: {str(e)}")
        return False

def test_service_info(service_url="http://localhost:8003"):
    """Get service information"""
    try:
        response = requests.get(f"{service_url}/", timeout=5)
        if response.status_code == 200:
            info = response.json()
            print(f"\nService Information:")
            print(f"  Service: {info.get('service', 'Unknown')}")
            print(f"  Status: {info.get('status', 'Unknown')}")
            print(f"  Model Loaded: {info.get('model_loaded', False)}")
            return True
        else:
            return False
    except Exception as e:
        print(f"❌ Could not get service info: {str(e)}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("Disease Detection Model Test")
    print("="*60)
    
    # Test service health
    print("\n1. Testing Service Health...")
    if not test_service_health():
        print("\n❌ Service is not running. Please start the ML service first.")
        print("   Run: python app.py")
        exit(1)
    
    # Get service info
    print("\n2. Getting Service Information...")
    test_service_info()
    
    # Test with sample images
    print("\n3. Testing Disease Detection...")
    
    # Try to find test images
    test_images = []
    
    # Check PlantVillage dataset
    plantvillage_paths = [
        r"C:\Users\farha\OneDrive\Desktop\Documents\new_project_satyabama\PlantVillage",
        r"C:\Users\farha\OneDrive\Desktop\Documents\new_project_satyabama\PlantVillage\PlantVillage"
    ]
    
    for pv_path in plantvillage_paths:
        if os.path.exists(pv_path):
            # Try to find a tomato healthy image
            tomato_healthy = os.path.join(pv_path, "Tomato_healthy")
            if os.path.exists(tomato_healthy):
                images = [f for f in os.listdir(tomato_healthy) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if images:
                    test_images.append(os.path.join(tomato_healthy, images[0]))
                    break
            
            # Try potato early blight
            potato_early = os.path.join(pv_path, "Potato___Early_blight")
            if os.path.exists(potato_early):
                images = [f for f in os.listdir(potato_early) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if images:
                    test_images.append(os.path.join(potato_early, images[0]))
                    break
    
    # Check sample_data
    sample_data_path = "sample_data"
    if os.path.exists(sample_data_path):
        tomato_healthy_sample = os.path.join(sample_data_path, "Tomato___healthy", "sample_0000.jpg")
        if os.path.exists(tomato_healthy_sample):
            test_images.append(tomato_healthy_sample)
    
    if test_images:
        print(f"\nFound {len(test_images)} test image(s)")
        for img_path in test_images[:2]:  # Test first 2 images
            test_disease_detection(img_path)
    else:
        print("\n⚠️  No test images found")
        print("   Please provide an image path to test:")
        print("   python test_model.py <image_path>")
        
        # If image path provided as argument
        import sys
        if len(sys.argv) > 1:
            test_image = sys.argv[1]
            test_disease_detection(test_image)
    
    print(f"\n{'='*60}")
    print("Test Complete!")
    print(f"{'='*60}\n")

