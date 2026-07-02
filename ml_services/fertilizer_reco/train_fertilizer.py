"""
Fertilizer Recommendation Model Training Script

Hybrid system:
- Rule-based engine: always available (uses NPK + pH logic)
- ML model: optional, enhances recommendation when Kaggle dataset is present

Dataset:
Download from: https://www.kaggle.com/datasets/gdabhishek/fertilizer-prediction
Place CSV at: ../../data/raw/fertilizer_prediction.csv
"""

import os
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import joblib
import yaml

np.random.seed(42)


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "..", "..", "data", "raw", "fertilizer_prediction.csv")

    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    rules_path = os.path.join(base_dir, "fertilizer_rules.yaml")

    # ------------------------------------
    # Load dataset if available
    # ------------------------------------
    if not os.path.exists(data_path):
        print(f"⚠️  Dataset not found at {data_path}")
        print("⚠️  Skipping ML training. Rule-based system will still work.")
        df = None
    else:
        df = pd.read_csv(data_path)
        print(f"✅ Loaded dataset from {data_path}: {df.shape}")
        print(df.head())

    # ------------------------------------
    # Train ML model if dataset is present
    # ------------------------------------
    if df is not None and "Fertilizer Name" in df.columns:
        # Handle possible column naming issues (e.g., 'Humidity ' with trailing space)
        col_map = {c.strip(): c for c in df.columns}

        required_cols = ["Temperature", "Humidity", "Moisture",
                         "Soil Type", "Crop Type",
                         "Nitrogen", "Phosphorous", "Potassium", "Fertilizer Name"]

        for rc in required_cols:
            if rc not in col_map:
                raise ValueError(f"Required column '{rc}' not found in dataset. Available: {list(df.columns)}")

        # Standardized access
        temp_col = col_map["Temperature"]
        humid_col = col_map["Humidity"]
        moist_col = col_map["Moisture"]
        soil_col = col_map["Soil Type"]
        crop_col = col_map["Crop Type"]
        n_col = col_map["Nitrogen"]
        p_col = col_map["Phosphorous"]
        k_col = col_map["Potassium"]
        fert_col = col_map["Fertilizer Name"]

        # Label encoders
        le_crop = LabelEncoder()
        le_soil = LabelEncoder()
        le_fert = LabelEncoder()

        df["crop_encoded"] = le_crop.fit_transform(df[crop_col])
        df["soil_encoded"] = le_soil.fit_transform(df[soil_col])
        df["fertilizer_encoded"] = le_fert.fit_transform(df[fert_col])

        # Features must match the service
        # [Temperature, Humidity, Moisture, soil_encoded, crop_encoded, Nitrogen, Phosphorous, Potassium]
        X = df[[temp_col, humid_col, moist_col, "soil_encoded", "crop_encoded", n_col, p_col, k_col]].values
        y = df["fertilizer_encoded"].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        print("Training XGBoost fertilizer model...")
        model = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        accuracy = (y_pred == y_test).mean()
        print(f"✅ Fertilizer prediction accuracy: {accuracy:.4f}")

        # Save model & encoders
        joblib.dump(model, os.path.join(models_dir, "fertilizer_model.joblib"))
        joblib.dump(le_crop, os.path.join(models_dir, "crop_encoder.joblib"))
        joblib.dump(le_soil, os.path.join(models_dir, "soil_encoder.joblib"))
        joblib.dump(le_fert, os.path.join(models_dir, "fertilizer_encoder.joblib"))

        print("✅ ML model and encoders saved.")
    else:
        print("⚠️  No valid dataset. Only rule-based logic will be used.")

    # ------------------------------------
    # Create/Update fertilizer rules YAML
    # ------------------------------------
    rules = {
        "fertilizers": [
            {"name": "Urea", "n_content": 46, "application": "Top dressing"},
            {"name": "DAP", "n_content": 18, "p_content": 46, "application": "Basal"},
            {"name": "MOP", "k_content": 60, "application": "Basal or top dressing"},
        ],
        "crops": {
            "rice":  {"optimal_npk": {"N": 120, "P": 60, "K": 60}},
            "wheat": {"optimal_npk": {"N": 120, "P": 60, "K": 40}},
            "cotton": {"optimal_npk": {"N": 100, "P": 50, "K": 50}},
            "maize": {"optimal_npk": {"N": 120, "P": 60, "K": 40}},
        },
    }

    with open(rules_path, "w") as f:
        yaml.dump(rules, f, default_flow_style=False)

    print(f"✅ Fertilizer rules saved to {rules_path}")
    print("\nDone. You can now start the FastAPI service.")


if __name__ == "__main__":
    main()
