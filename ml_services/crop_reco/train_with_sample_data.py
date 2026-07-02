"""
Crop Recommendation Model Training Script with Sample Data Generator

This script can train a model with either:
1. Real dataset from data/raw/crop_recommendation.csv (if available)
2. Synthetic sample data (for testing/demo purposes)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import joblib
import os

# SHAP is optional - makes explanations better but not required
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("⚠️  SHAP not available. Explanations will be basic.")

# Set random seed
np.random.seed(42)

def generate_sample_data(n_samples=1000):
    """Generate synthetic crop recommendation data for training"""
    print("Generating sample data for training...")
    
    crops = ["rice", "maize", "chickpea", "kidneybeans", "pigeonpeas",
             "mothbeans", "mungbean", "blackgram", "lentil", "pomegranate",
             "banana", "mango", "grapes", "watermelon", "muskmelon",
             "apple", "orange", "papaya", "coconut", "cotton", "jute", "coffee"]
    
    data = []
    for _ in range(n_samples):
        # Generate realistic soil and weather values
        N = np.random.uniform(0, 150)
        P = np.random.uniform(0, 150)
        K = np.random.uniform(0, 200)
        temperature = np.random.uniform(15, 35)
        humidity = np.random.uniform(20, 100)
        pH = np.random.uniform(3.5, 9.0)
        rainfall = np.random.uniform(20, 300)
        
        # Simple rule to assign crop based on conditions
        if temperature > 25 and rainfall > 100:
            crop = "rice"
        elif temperature > 20 and rainfall < 50:
            crop = "wheat"
        elif pH > 7 and temperature > 25:
            crop = "cotton"
        elif N > 80 and P > 50:
            crop = "maize"
        else:
            crop = np.random.choice(crops)
        
        # Add some noise/variation
        if np.random.random() > 0.7:
            crop = np.random.choice(crops)
        
        data.append({
            'N': N,
            'P': P,
            'K': K,
            'temperature': temperature,
            'humidity': humidity,
            'pH': pH,
            'rainfall': rainfall,
            'label': crop
        })
    
    df = pd.DataFrame(data)
    return df

def main():
    # Try to load real dataset first
    data_path = '../../data/raw/crop_recommendation.csv'
    
    if os.path.exists(data_path):
        print(f"✅ Found dataset at {data_path}")
        df = pd.read_csv(data_path)
        print(f"Loaded dataset: {df.shape}")
    else:
        print(f"⚠️  Dataset not found at {data_path}")
        print("Generating sample data for training...")
        df = generate_sample_data(n_samples=2000)
        print(f"Generated {len(df)} samples")
    
    print(f"\nDataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    print(f"\nCrop distribution:")
    print(df['label'].value_counts() if 'label' in df.columns else df.iloc[:, -1].value_counts())
    
    # Feature engineering
    if 'landSize' not in df.columns:
        np.random.seed(42)
        df['landSize'] = np.random.uniform(0.5, 10, len(df))
    
    if 'landQuality' not in df.columns:
        def assign_quality(row):
            npk_score = (row['N'] + row['P'] + row['K']) / 3
            ph_score = 1 if 6.0 <= row['pH'] <= 7.0 else 0.5
            total_score = npk_score * ph_score
            if total_score > 80:
                return 2  # High
            elif total_score > 50:
                return 1  # Medium
            else:
                return 0  # Low
        df['landQuality'] = df.apply(assign_quality, axis=1)
    
    if 'soilType' not in df.columns:
        df['soilType'] = df['pH'].apply(lambda x: 1 if 6.0 <= x <= 7.5 else 0)
    
    if 'month' not in df.columns:
        df['month'] = np.random.randint(1, 13, len(df))
    
    print(f"\n✅ Feature engineering complete. Columns: {df.columns.tolist()}")
    
    # Prepare features
    feature_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'pH', 'rainfall', 'landQuality', 'soilType', 'landSize', 'month']
    X = df[feature_cols].values
    y_raw = df['label'].values if 'label' in df.columns else df.iloc[:, -1].values
    
    # Encode labels for XGBoost compatibility
    from sklearn.preprocessing import LabelEncoder
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    crop_names = label_encoder.classes_
    
    print(f"\nFeatures shape: {X.shape}")
    print(f"Target shape: {y.shape}")
    print(f"Unique crops: {len(crop_names)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"\nTrain: {X_train.shape}, Test: {X_test.shape}")
    
    # Train Random Forest
    print("\nTraining Random Forest...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_accuracy = accuracy_score(y_test, rf_pred)
    print(f"Random Forest Accuracy: {rf_accuracy:.4f}")
    
    # Train XGBoost
    print("\nTraining XGBoost...")
    xgb_model = xgb.XGBClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    xgb_accuracy = accuracy_score(y_test, xgb_pred)
    print(f"XGBoost Accuracy: {xgb_accuracy:.4f}")
    
    # Select best model
    best_model = xgb_model if xgb_accuracy >= rf_accuracy else rf_model
    best_accuracy = max(xgb_accuracy, rf_accuracy)
    model_name = 'XGBoost' if xgb_accuracy >= rf_accuracy else 'Random Forest'
    print(f"\n✅ Selected model: {model_name} (Accuracy: {best_accuracy:.4f})")
    
    # Train SHAP explainer (on sample for speed) - optional
    explainer = None
    if SHAP_AVAILABLE:
        print("\nTraining SHAP explainer...")
        try:
            sample_size = min(100, len(X_train))
            X_sample = X_train[:sample_size]
            explainer = shap.TreeExplainer(best_model)
            shap_values = explainer.shap_values(X_sample)
            print("✅ SHAP explainer trained")
        except Exception as e:
            print(f"⚠️  SHAP explainer failed: {e}")
            explainer = None
    else:
        print("\n⚠️  Skipping SHAP explainer (not installed)")
    
    # Save model and explainer
    models_dir = 'models'
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, 'crop_model.joblib')
    explainer_path = os.path.join(models_dir, 'crop_explainer.joblib')
    
    joblib.dump(best_model, model_path)
    print(f"\n✅ Model saved to {model_path}")
    
    if explainer:
        joblib.dump(explainer, explainer_path)
        print(f"✅ Explainer saved to {explainer_path}")
    
    # Save label encoder for later use
    encoder_path = os.path.join(models_dir, 'label_encoder.joblib')
    joblib.dump(label_encoder, encoder_path)
    print(f"✅ Label encoder saved to {encoder_path}")
    
    # Test prediction
    print("\nTesting prediction...")
    test_input = np.array([[90, 40, 40, 20, 80, 6.5, 200, 1, 1, 2.0, 6]])
    prediction_encoded = best_model.predict(test_input)[0]
    prediction_name = label_encoder.inverse_transform([prediction_encoded])[0]
    if hasattr(best_model, "predict_proba"):
        probabilities = best_model.predict_proba(test_input)[0]
        top_3 = np.argsort(probabilities)[-3:][::-1]
        top_3_names = [label_encoder.inverse_transform([i])[0] for i in top_3]
        print(f"Predicted crop: {prediction_name}")
        print(f"Top 3 candidates: {top_3_names}")
        confidences = [f"{probabilities[i]:.3f}" for i in top_3]
        print(f"Confidences: {confidences}")
    
    print("\n" + "="*50)
    print("✅ Model training complete!")
    print("="*50)
    print("\nNext steps:")
    print("1. Restart the ML service to load the new model")
    print("2. The crop recommendation will now use the trained model")

if __name__ == "__main__":
    main()

