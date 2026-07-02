from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
import joblib
import os

app = FastAPI(title="Crop Recommendation Service")

# ------------------------------------
# CORS
# ------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------
# Paths for model artifacts
# ------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "crop_model.joblib")
EXPLAINER_PATH = os.path.join(MODELS_DIR, "crop_explainer.joblib")
LABEL_ENCODER_PATH = os.path.join(MODELS_DIR, "label_encoder.joblib")

model = None
explainer = None
label_encoder = None

# ------------------------------------
# Load model, encoder, explainer
# ------------------------------------
try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"[OK] Loaded model from {MODEL_PATH}")
    else:
        print(f"[WARN] Model not found at {MODEL_PATH}. Run train_crop_model.py first.")
except Exception as e:
    print(f"[WARN] Error loading model: {e}")
    model = None

try:
    if os.path.exists(LABEL_ENCODER_PATH):
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        print(f"[OK] Loaded label encoder from {LABEL_ENCODER_PATH}")
    else:
        print(f"[WARN] Label encoder not found at {LABEL_ENCODER_PATH}")
except Exception as e:
    print(f"[WARN] Error loading label encoder: {e}")
    label_encoder = None

try:
    if os.path.exists(EXPLAINER_PATH):
        explainer = joblib.load(EXPLAINER_PATH)
        print(f"[OK] Loaded explainer from {EXPLAINER_PATH}")
    else:
        print(f"[WARN] Explainer not found at {EXPLAINER_PATH}")
except Exception as e:
    print(f"[WARN] Error loading explainer: {e}")
    explainer = None

# ------------------------------------
# Fallback labels (only used if no encoder)
# ------------------------------------
CROP_LABELS = [
    "rice", "maize", "chickpea", "kidneybeans", "pigeonpeas",
    "mothbeans", "mungbean", "blackgram", "lentil", "pomegranate",
    "banana", "mango", "grapes", "watermelon", "muskmelon",
    "apple", "orange", "papaya", "coconut", "cotton", "jute", "coffee", "wheat"
]

# ------------------------------------
# Encodings
# ------------------------------------
SOIL_TYPE_MAP = {
    "Sandy": 0,
    "Loamy": 1,
    "Clay": 2,
    "Sandy Loam": 3,
    "Clay Loam": 4,
    "Silt Loam": 5
}

LAND_QUALITY_MAP = {
    "Low": 0,
    "Medium": 1,
    "High": 2
}

# ------------------------------------
# Request model
# ------------------------------------
class CropRecommendationRequest(BaseModel):
    N: float
    P: float
    K: float
    pH: float
    temperature: float
    humidity: float
    rainfall: float
    landSize: float
    landQuality: str
    soilType: str
    month: Optional[int] = None

# ------------------------------------
# Health endpoints
# ------------------------------------
@app.get("/")
def root():
    return {
        "service": "Crop Recommendation",
        "status": "running",
        "model_loaded": model is not None,
        "has_label_encoder": label_encoder is not None,
        "has_explainer": explainer is not None,
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

# ------------------------------------
# Prediction endpoint
# ------------------------------------
@app.post("/predict")
def predict(request: CropRecommendationRequest):
    # --------------------------------
    # Fallback rule-based logic
    # --------------------------------
    if model is None:
        crop_suggestion = "rice"  # default

        if request.temperature > 25 and request.rainfall > 100:
            crop_suggestion = "rice"
        elif request.temperature > 20 and request.rainfall < 50:
            crop_suggestion = "wheat"
        elif request.pH > 7:
            crop_suggestion = "cotton"
        else:
            crop_suggestion = "maize"

        return {
            "top_crop": crop_suggestion,
            "top_candidates": list(dict.fromkeys([crop_suggestion, "wheat", "maize"]))[:3],
            "explanation": (
                f"Recommended {crop_suggestion} based on simple rules (model not loaded). "
                f"Train the model for more accurate predictions."
            ),
            "allocation_advice": f"For {request.landSize} acres, consider {crop_suggestion}.",
            "confidence": 0.5,
            "note": "[WARN] Model not trained. This is a basic rule-based recommendation."
        }

    try:
        # Encode categorical features
        soil_type_encoded = SOIL_TYPE_MAP.get(request.soilType, 1)
        land_quality_encoded = LAND_QUALITY_MAP.get(request.landQuality, 1)
        month = request.month if request.month else 6  # default June

        # Build feature vector (must match training order)
        features = np.array([[
            request.N,
            request.P,
            request.K,
            request.temperature,
            request.humidity,
            request.pH,
            request.rainfall,
            land_quality_encoded,
            soil_type_encoded,
            request.landSize,
            month
        ]])

        # Predict
        prediction_encoded = model.predict(features)[0]

        probabilities = None
        top_candidates = []

        # If we trained with label encoding (recommended)
        if label_encoder is not None:
            # prediction_encoded is an integer class index
            top_crop = label_encoder.inverse_transform([prediction_encoded])[0]

            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(features)[0]  # shape: (n_classes,)
                top_indices = np.argsort(probabilities)[-3:][::-1]
                top_candidates = [
                    label_encoder.inverse_transform([idx])[0] for idx in top_indices
                ]
            else:
                top_candidates = [top_crop]

        else:
            # Fallback: assume model returns integer index and map via CROP_LABELS
            if isinstance(prediction_encoded, (int, np.integer)):
                if 0 <= prediction_encoded < len(CROP_LABELS):
                    top_crop = CROP_LABELS[prediction_encoded]
                else:
                    top_crop = f"Crop_{prediction_encoded}"
            else:
                # model predicted a string label
                top_crop = str(prediction_encoded)

            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(features)[0]
                top_indices = np.argsort(probabilities)[-3:][::-1]
                for idx in top_indices:
                    if 0 <= idx < len(CROP_LABELS):
                        top_candidates.append(CROP_LABELS[idx])
                    else:
                        top_candidates.append(f"Crop_{idx}")
            else:
                top_candidates = [top_crop]

        # --------------------------------
        # SHAP-based explanation (optional)
        # --------------------------------
        explanation = None
        if explainer is not None:
            try:
                shap_values = explainer.shap_values(features)

                # shap_values can be [n_classes][n_samples][n_features] or [n_samples][n_features]
                if isinstance(shap_values, list):
                    # multi-class: use SHAP values for predicted class
                    class_idx = int(prediction_encoded)
                    class_shap = shap_values[class_idx][0]
                else:
                    # binary/other: first sample
                    class_shap = shap_values[0]

                feature_names = [
                    "N", "P", "K", "Temperature", "Humidity",
                    "pH", "Rainfall", "Land Quality", "Soil Type",
                    "Land Size", "Month"
                ]

                top_feature_indices = np.argsort(np.abs(class_shap))[-3:][::-1]
                important_features = [feature_names[i] for i in top_feature_indices]

                explanation = (
                    f"Recommended {top_crop} mainly based on: "
                    + ", ".join(important_features)
                )
            except Exception as e:
                print(f"[WARN] SHAP explanation failed: {e}")
                explanation = (
                    f"Recommended {top_crop} based on your soil NPK values "
                    f"({request.N}, {request.P}, {request.K}), pH ({request.pH}), "
                    f"and weather (temperature: {request.temperature}°C, "
                    f"rainfall: {request.rainfall} mm)."
                )
        else:
            explanation = (
                f"Recommended {top_crop} based on your soil NPK values "
                f"({request.N}, {request.P}, {request.K}), pH ({request.pH}), "
                f"and weather (temperature: {request.temperature}°C, "
                f"rainfall: {request.rainfall} mm)."
            )

        # --------------------------------
        # Land allocation suggestion
        # --------------------------------
        allocation_advice = None
        if request.landSize > 1.0:
            second_crop = top_candidates[1] if len(top_candidates) > 1 else "other crops"
            allocation_advice = (
                f"For {request.landSize} acres, consider allocating "
                f"60% to {top_crop} and 40% to {second_crop}."
            )

        confidence = None
        if probabilities is not None:
            # prediction_encoded is index of class
            confidence = float(probabilities[int(prediction_encoded)])

        return {
            "top_crop": top_crop,
            "top_candidates": list(dict.fromkeys(top_candidates))[:3],
            "explanation": explanation,
            "allocation_advice": allocation_advice,
            "confidence": confidence,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
