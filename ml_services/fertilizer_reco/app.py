from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
import yaml
from typing import Optional, List

app = FastAPI(title="Fertilizer Recommendation Service")

# ---------------------------------------------------
# CORS
# ---------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# Paths
# ---------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MODEL_PATH = os.path.join(MODELS_DIR, "fertilizer_model.joblib")
CROP_ENCODER_PATH = os.path.join(MODELS_DIR, "crop_encoder.joblib")
SOIL_ENCODER_PATH = os.path.join(MODELS_DIR, "soil_encoder.joblib")
FERT_ENCODER_PATH = os.path.join(MODELS_DIR, "fertilizer_encoder.joblib")

RULES_PATH = os.path.join(BASE_DIR, "fertilizer_rules.yaml")

# ---------------------------------------------------
# Globals
# ---------------------------------------------------
model = None
crop_encoder = None
soil_encoder = None
fertilizer_encoder = None
rules = None

# ---------------------------------------------------
# Load ML model & encoders (if available)
# ---------------------------------------------------
try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"[OK] Loaded ML model from {MODEL_PATH}")
    else:
        print(f"[WARN] ML model not found at {MODEL_PATH}. Using rule-based logic only.")
except Exception as e:
    print(f"[WARN] Error loading ML model: {e}")
    model = None

try:
    if os.path.exists(CROP_ENCODER_PATH):
        crop_encoder = joblib.load(CROP_ENCODER_PATH)
        print(f"[OK] Loaded crop encoder from {CROP_ENCODER_PATH}")
except Exception as e:
    print(f"[WARN] Error loading crop encoder: {e}")
    crop_encoder = None

try:
    if os.path.exists(SOIL_ENCODER_PATH):
        soil_encoder = joblib.load(SOIL_ENCODER_PATH)
        print(f"[OK] Loaded soil encoder from {SOIL_ENCODER_PATH}")
except Exception as e:
    print(f"[WARN] Error loading soil encoder: {e}")
    soil_encoder = None

try:
    if os.path.exists(FERT_ENCODER_PATH):
        fertilizer_encoder = joblib.load(FERT_ENCODER_PATH)
        print(f"[OK] Loaded fertilizer encoder from {FERT_ENCODER_PATH}")
except Exception as e:
    print(f"[WARN] Error loading fertilizer encoder: {e}")
    fertilizer_encoder = None

# ---------------------------------------------------
# Load fertilizer rules (YAML or default)
# ---------------------------------------------------
try:
    if os.path.exists(RULES_PATH):
        with open(RULES_PATH, "r") as f:
            rules = yaml.safe_load(f)
        print(f"[OK] Loaded rules from {RULES_PATH}")
    else:
        print("[WARN] Rules YAML not found. Using built-in defaults.")
        rules = None
except Exception as e:
    print(f"[WARN] Error loading rules: {e}")
    rules = None

# ---------------------------------------------------
# Optimal NPK (kg/acre) – can be overridden by rules YAML
# ---------------------------------------------------
OPTIMAL_NPK_DEFAULT = {
    "rice":   {"N": 120, "P": 60, "K": 60},
    "wheat":  {"N": 120, "P": 60, "K": 40},
    "cotton": {"N": 100, "P": 50, "K": 50},
    "maize":  {"N": 120, "P": 60, "K": 40},
    "default": {"N": 100, "P": 50, "K": 50},
}


def get_optimal_npk_for_crop(crop_name: str):
    crop_key = crop_name.lower().strip()
    # 1) try from YAML rules
    if rules and "crops" in rules and crop_key in rules["crops"]:
        crop_info = rules["crops"][crop_key]
        if "optimal_npk" in crop_info:
            return crop_info["optimal_npk"]
    # 2) fallback to built-in
    return OPTIMAL_NPK_DEFAULT.get(crop_key, OPTIMAL_NPK_DEFAULT["default"])


# ---------------------------------------------------
# Request model
# ---------------------------------------------------
class FertilizerRequest(BaseModel):
    crop: str
    N: float
    P: float
    K: float
    pH: float
    landSize: Optional[float] = 1.0       # acres
    cropStage: Optional[str] = "vegetative"

    # Optional extra fields for ML model
    temperature: Optional[float] = None   # °C
    humidity: Optional[float] = None      # %
    moisture: Optional[float] = None      # %
    soilType: Optional[str] = None        # e.g. "Sandy", "Loamy", ...

# ---------------------------------------------------
# Health endpoints
# ---------------------------------------------------
@app.get("/")
def root():
    return {
        "service": "Fertilizer Recommendation",
        "status": "running",
        "model_loaded": model is not None,
        "has_crop_encoder": crop_encoder is not None,
        "has_soil_encoder": soil_encoder is not None,
        "has_fertilizer_encoder": fertilizer_encoder is not None,
        "rules_loaded": rules is not None,
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ---------------------------------------------------
# Core rule-based NPK + pH logic
# ---------------------------------------------------
def rule_based_recommendations(req: FertilizerRequest):
    crop_lower = req.crop.lower().strip()
    optimal = get_optimal_npk_for_crop(crop_lower)

    # Deficits (assuming N,P,K are current available nutrient levels per acre)
    n_deficit = max(0.0, optimal["N"] - req.N)
    p_deficit = max(0.0, optimal["P"] - req.P)
    k_deficit = max(0.0, optimal["K"] - req.K)

    recommendations = []

    # Nitrogen (Urea ~46% N)
    if n_deficit > 20:
        n_dosage = (n_deficit / 46.0) * req.landSize
        recommendations.append({
            "name": "Urea (46% N)",
            "dosage": f"{n_dosage:.1f} kg for {req.landSize} acre(s)",
            "schedule": "Apply in 2–3 splits during vegetative stage",
            "reason": f"Low nitrogen (current: {req.N}, optimal: {optimal['N']})"
        })

    # Phosphorus (DAP ~46% P2O5, ~20% actual P but we keep simple)
    if p_deficit > 10:
        p_dosage = (p_deficit / 46.0) * req.landSize
        recommendations.append({
            "name": "DAP (Diammonium Phosphate)",
            "dosage": f"{p_dosage:.1f} kg for {req.landSize} acre(s)",
            "schedule": "Apply at sowing/transplanting as basal dose",
            "reason": f"Low phosphorus (current: {req.P}, optimal: {optimal['P']})"
        })

    # Potassium (MOP ~60% K2O)
    if k_deficit > 10:
        k_dosage = (k_deficit / 60.0) * req.landSize
        recommendations.append({
            "name": "MOP (Muriate of Potash)",
            "dosage": f"{k_dosage:.1f} kg for {req.landSize} acre(s)",
            "schedule": "Apply before flowering or as basal dose",
            "reason": f"Low potassium (current: {req.K}, optimal: {optimal['K']})"
        })

    # pH correction
    if req.pH < 6.0:
        recommendations.append({
            "name": "Agricultural Lime",
            "dosage": "500–1000 kg per acre",
            "schedule": "Apply 2–3 months before sowing, mix well with soil",
            "reason": f"Soil is acidic (pH {req.pH:.1f}). Lime can raise pH to 6.5–7.0."
        })
    elif req.pH > 7.5:
        recommendations.append({
            "name": "Gypsum",
            "dosage": "200–500 kg per acre",
            "schedule": "Apply before sowing and incorporate into topsoil",
            "reason": f"Soil is alkaline (pH {req.pH:.1f}). Gypsum helps reduce sodicity and improve structure."
        })

    if not recommendations:
        recommendations.append({
            "name": "Balanced NPK",
            "dosage": "No immediate fertilizer required",
            "schedule": "Monitor crop and repeat soil test after the season",
            "reason": "Soil NPK values are close to recommended optimum levels."
        })

    soil_analysis = {
        "N": req.N,
        "P": req.P,
        "K": req.K,
        "pH": req.pH,
        "optimal_N": optimal["N"],
        "optimal_P": optimal["P"],
        "optimal_K": optimal["K"],
        "landSize_acres": req.landSize,
        "crop": req.crop,
    }

    return recommendations, soil_analysis


# ---------------------------------------------------
# ML-based suggestion (optional, used as extra info)
# ---------------------------------------------------
def ml_fertilizer_prediction(req: FertilizerRequest):
    if model is None or fertilizer_encoder is None:
        return None

    # Need these fields for the ML model
    if req.temperature is None or req.humidity is None or req.moisture is None:
        return None
    if soil_encoder is None or crop_encoder is None or req.soilType is None:
        return None

    try:
        crop_value = req.crop.strip()
        soil_value = req.soilType.strip()

        crop_encoded = crop_encoder.transform([crop_value])[0]
        soil_encoded = soil_encoder.transform([soil_value])[0]

        # Feature order must match training:
        # [Temperature, Humidity, Moisture, soil_encoded, crop_encoded, Nitrogen, Phosphorous, Potassium]
        X = np.array([[
            req.temperature,
            req.humidity,
            req.moisture,
            soil_encoded,
            crop_encoded,
            req.N,
            req.P,
            req.K
        ]])

        pred_encoded = model.predict(X)[0]
        fertilizer_name = fertilizer_encoder.inverse_transform([pred_encoded])[0]

        confidence = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)[0]
            # fertilizer_encoder.classes_ aligns with model.classes_
            idx = int(pred_encoded)
            confidence = float(probs[idx])

        return {
            "fertilizer": fertilizer_name,
            "confidence": confidence
        }
    except Exception as e:
        print(f"[WARN] ML fertilizer prediction failed: {e}")
        return None


# ---------------------------------------------------
# Main prediction endpoint
# ---------------------------------------------------
@app.post("/predict")
def predict(request: FertilizerRequest):
    try:
        # Rule-based core recommendation (always used)
        rule_recs, soil_analysis = rule_based_recommendations(request)

        # Optional ML suggestion (if model + encoders + extra fields available)
        ml_recommendation = ml_fertilizer_prediction(request)

        response = {
            "fertilizers": rule_recs,
            "soil_analysis": soil_analysis,
        }

        if ml_recommendation is not None:
            response["ml_recommendation"] = ml_recommendation
        else:
            response["ml_recommendation"] = None

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
