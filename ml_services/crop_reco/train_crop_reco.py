"""
Crop Recommendation Model Training Script

This script trains a crop recommendation model using:
- Real dataset at: ../../data/raw/crop_recommendation.csv (Kaggle)
  OR
- Synthetic sample data if the real dataset is not found.

It saves:
- models/crop_model.joblib
- models/crop_explainer.joblib  (if SHAP available and succeeds)
- models/label_encoder.joblib
"""

import os
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder

import xgboost as xgb
import joblib

# ------------------------------------
# Optional SHAP support
# ------------------------------------
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("⚠️  SHAP not installed. Explanations will fall back to basic mode.")

np.random.seed(42)


# ------------------------------------
# Synthetic data generator
# ------------------------------------
def generate_sample_data(n_samples: int = 2000) -> pd.DataFrame:
    """Generate synthetic crop recommendation data."""
    print("Generating synthetic data for training...")

    crops = [
        "rice", "maize", "chickpea", "kidneybeans", "pigeonpeas",
        "mothbeans", "mungbean", "blackgram", "lentil", "pomegranate",
        "banana", "mango", "grapes", "watermelon", "muskmelon",
        "apple", "orange", "papaya", "coconut", "cotton", "jute", "coffee", "wheat"
    ]

    rows = []
    for _ in range(n_samples):
        N = np.random.uniform(0, 150)
        P = np.random.uniform(0, 150)
        K = np.random.uniform(0, 200)
        temperature = np.random.uniform(15, 35)
        humidity = np.random.uniform(20, 100)
        pH = np.random.uniform(3.5, 9.0)
        rainfall = np.random.uniform(20, 300)

        # Simple rules to bias crops
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

        # random noise
        if np.random.random() > 0.7:
            crop = np.random.choice(crops)

        rows.append({
            "N": N,
            "P": P,
            "K": K,
            "temperature": temperature,
            "humidity": humidity,
            "pH": pH,
            "rainfall": rainfall,
            "label": crop,
        })

    df = pd.DataFrame(rows)
    return df


def main():
    # --------------------------------
    # Resolve paths
    # --------------------------------
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "..", "..", "data", "raw", "crop_recommendation.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    # --------------------------------
    # Load or generate dataset
    # --------------------------------
    if os.path.exists(data_path):
        print(f"✅ Found real dataset at: {data_path}")
        df = pd.read_csv(data_path)
        print(f"Dataset shape: {df.shape}")
    else:
        print(f"⚠️  Dataset not found at: {data_path}")
        print("Using synthetic data instead.")
        df = generate_sample_data(n_samples=2000)
        print(f"Synthetic dataset shape: {df.shape}")

    # --------------------------------
    # Basic info
    # --------------------------------
    label_col = "label" if "label" in df.columns else df.columns[-1]
    print("\nColumns:", df.columns.tolist())
    print("\nCrop distribution:")
    print(df[label_col].value_counts())

    # --------------------------------
    # Feature engineering
    # --------------------------------
    if "landSize" not in df.columns:
        np.random.seed(42)
        df["landSize"] = np.random.uniform(0.5, 10, len(df))

    if "landQuality" not in df.columns:
        def assign_quality(row):
            npk_score = (row["N"] + row["P"] + row["K"]) / 3.0
            ph_score = 1.0 if 6.0 <= row["pH"] <= 7.0 else 0.5
            total_score = npk_score * ph_score
            if total_score > 80:
                return 2  # High
            elif total_score > 50:
                return 1  # Medium
            else:
                return 0  # Low

        df["landQuality"] = df.apply(assign_quality, axis=1)

    if "soilType" not in df.columns:
        # 1 = "good", 0 = "poor" from pH
        df["soilType"] = df["pH"].apply(lambda x: 1 if 6.0 <= x <= 7.5 else 0)

    if "month" not in df.columns:
        df["month"] = np.random.randint(1, 13, len(df))

    print("\n✅ Feature engineering complete.")
    print("Final columns:", df.columns.tolist())

    # --------------------------------
    # Prepare features and labels
    # --------------------------------
    feature_cols = [
        "N", "P", "K",
        "temperature", "humidity", "pH", "rainfall",
        "landQuality", "soilType", "landSize", "month"
    ]

    X = df[feature_cols].values
    y_raw = df[label_col].values

    # Encode labels
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    crop_names = label_encoder.classes_

    print("\nFeatures shape:", X.shape)
    print("Encoded target shape:", y.shape)
    print("Unique crops:", len(crop_names))

    # --------------------------------
    # Train/test split
    # --------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nTrain:", X_train.shape, "Test:", X_test.shape)

    # --------------------------------
    # Train models
    # --------------------------------
    print("\nTraining Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=150, random_state=42, n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_accuracy = accuracy_score(y_test, rf_pred)
    print(f"Random Forest Accuracy: {rf_accuracy:.4f}")

    print("\nTraining XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=-1,
    )
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    xgb_accuracy = accuracy_score(y_test, xgb_pred)
    print(f"XGBoost Accuracy: {xgb_accuracy:.4f}")

    # --------------------------------
    # Choose best model
    # --------------------------------
    if xgb_accuracy >= rf_accuracy:
        best_model = xgb_model
        best_name = "XGBoost"
        best_accuracy = xgb_accuracy
    else:
        best_model = rf_model
        best_name = "Random Forest"
        best_accuracy = rf_accuracy

    print(f"\n✅ Selected model: {best_name} (Accuracy: {best_accuracy:.4f})")

    # --------------------------------
    # Train SHAP explainer (optional)
    # --------------------------------
    explainer = None
    if SHAP_AVAILABLE:
        print("\nTraining SHAP explainer (sample subset)...")
        try:
            sample_size = min(200, len(X_train))
            X_sample = X_train[:sample_size]
            explainer = shap.TreeExplainer(best_model)
            _ = explainer.shap_values(X_sample)
            print("✅ SHAP explainer trained")
        except Exception as e:
            print(f"⚠️  SHAP explainer failed: {e}")
            explainer = None
    else:
        print("\n⚠️  SHAP not available. Skipping explainer.")

    # --------------------------------
    # Save artifacts
    # --------------------------------
    model_path = os.path.join(models_dir, "crop_model.joblib")
    explainer_path = os.path.join(models_dir, "crop_explainer.joblib")
    encoder_path = os.path.join(models_dir, "label_encoder.joblib")

    joblib.dump(best_model, model_path)
    print(f"\n✅ Model saved to {model_path}")

    if explainer is not None:
        joblib.dump(explainer, explainer_path)
        print(f"✅ Explainer saved to {explainer_path}")

    joblib.dump(label_encoder, encoder_path)
    print(f"✅ Label encoder saved to {encoder_path}")

    # --------------------------------
    # Quick test prediction
    # --------------------------------
    print("\nTesting a sample prediction...")
    test_input = np.array([[90, 40, 40, 20, 80, 6.5, 200, 1, 1, 2.0, 6]])
    pred_encoded = best_model.predict(test_input)[0]
    pred_name = label_encoder.inverse_transform([pred_encoded])[0]
    if hasattr(best_model, "predict_proba"):
        probs = best_model.predict_proba(test_input)[0]
        top_3 = np.argsort(probs)[-3:][::-1]
        top_3_names = label_encoder.inverse_transform(top_3)
        print(f"Predicted crop: {pred_name}")
        print(f"Top 3 candidates: {list(top_3_names)}")
        print(f"Confidences: {[f'{probs[i]:.3f}' for i in top_3]}")
    else:
        print(f"Predicted crop: {pred_name}")

    print("\n" + "=" * 60)
    print("✅ Model training complete.")
    print("Next: start FastAPI (python main.py or uvicorn main:app --reload)")
    print("=" * 60)


if __name__ == "__main__":
    main()
