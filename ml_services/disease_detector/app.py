from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import os
import json

app = FastAPI(title="Plant Disease Detection Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "disease_model.h5")
LABELS_PATH = os.path.join(MODELS_DIR, "class_labels.json")

model = None
class_labels: Dict[int, str] = {}

# ---------- Load model ----------
if os.path.exists(MODEL_PATH):
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"[OK] Loaded model from {MODEL_PATH}")
    except Exception as e:
        print(f"[ERROR] Could not load model: {e}")
else:
    print(f"[WARN] Model not found at {MODEL_PATH}")

# ---------- Load labels ----------
if os.path.exists(LABELS_PATH):
    try:
        with open(LABELS_PATH, "r") as f:
            raw = json.load(f)      # {"0": "Tomato_healthy", ...}
        class_labels = {int(k): v for k, v in raw.items()}
        print(f"[OK] Loaded {len(class_labels)} class labels")
    except Exception as e:
        print(f"[WARN] Could not load class labels: {e}")
else:
    print(f"[WARN] class_labels.json not found at {LABELS_PATH}")

def preprocess_image(image: Image.Image) -> np.ndarray:
    image = image.convert("RGB")
    image = image.resize((224, 224))
    arr = np.array(image).astype("float32") / 255.0
    return np.expand_dims(arr, axis=0)

def pretty_label(label: str) -> str:
    return (
        label.replace("___", " - ")
        .replace("__", " - ")
        .replace("_", " ")
        .strip()
    )

# ---------- Disease explanations / treatments ----------
# keys EXACTLY match your folders from the screenshot

DISEASE_EXPLANATIONS: Dict[str, Dict[str, Any]] = {
    "Apple___Apple_scab": {
        "explanation": "Apple scab is a fungal disease that causes dark, scaly lesions on leaves and fruits.",
        "cure_steps": [
            "Remove and destroy infected leaves and fruits",
            "Apply fungicides like Captan, Mancozeb or Thiophanate-methyl",
            "Prune trees to improve air circulation",
            "Remove fallen leaves and fruits in autumn"
        ],
        "pesticide": "Captan, Mancozeb or Thiophanate-methyl fungicides.",
        "fertilizer": "Balanced NPK with adequate potassium."
    },
    "Apple___healthy": {
        "explanation": "Apple tree appears healthy with no visible disease symptoms.",
        "cure_steps": [
            "Maintain proper pruning and spacing",
            "Monitor regularly for early disease symptoms",
            "Apply preventive fungicides during wet seasons"
        ],
        "pesticide": "Preventive fungicides only during high disease pressure.",
        "fertilizer": "Balanced NPK as per soil test recommendations."
    },
    "Corn___Common_rust": {
        "explanation": "Common rust of corn causes reddish-brown pustules on leaves that can reduce yield.",
        "cure_steps": [
            "Remove infected leaves if possible",
            "Apply fungicides like Propiconazole or Azoxystrobin",
            "Use rust-resistant corn varieties",
            "Practice crop rotation"
        ],
        "pesticide": "Propiconazole or Azoxystrobin fungicides.",
        "fertilizer": "Balanced NPK with adequate nitrogen."
    },
    "Corn___healthy": {
        "explanation": "Corn plant is healthy with no visible disease symptoms.",
        "cure_steps": [
            "Maintain proper spacing and irrigation",
            "Monitor for early disease symptoms",
            "Use preventive measures during humid weather"
        ],
        "pesticide": "No pesticide needed for healthy plants.",
        "fertilizer": "Balanced NPK fertilizer as per soil test."
    },
    "Grape___Black_rot": {
        "explanation": "Black rot of grape causes dark circular spots on leaves and fruits, leading to fruit rot.",
        "cure_steps": [
            "Remove and destroy infected plant parts",
            "Apply fungicides like Mancozeb, Captan or Myclobutanil",
            "Improve air circulation through pruning",
            "Remove fallen leaves and fruits"
        ],
        "pesticide": "Mancozeb, Captan or Myclobutanil fungicides.",
        "fertilizer": "Balanced NPK with adequate potassium."
    },
    "Grape___healthy": {
        "explanation": "Grape vine appears healthy with no visible disease symptoms.",
        "cure_steps": [
            "Maintain proper pruning and training",
            "Monitor regularly for disease symptoms",
            "Apply preventive fungicides during wet seasons"
        ],
        "pesticide": "Preventive fungicides only during high disease pressure.",
        "fertilizer": "Balanced NPK with adequate potassium and calcium."
    },
    "Tomato___Early_blight": {
        "explanation": "Early blight in tomato shows concentric brown spots on older leaves, starting from lower canopy.",
        "cure_steps": [
            "Remove infected leaves and destroy away from field",
            "Spray Mancozeb, Chlorothalonil or Azoxystrobin",
            "Mulch around plants to reduce soil splash",
            "Rotate away from tomato and other solanaceous crops"
        ],
        "pesticide": "Mancozeb, Chlorothalonil or Azoxystrobin.",
        "fertilizer": "Balanced NPK with adequate potassium and calcium."
    },
    "Tomato___Late_blight": {
        "explanation": "Late blight of tomato (Phytophthora infestans) causes dark water-soaked lesions and rapid plant death.",
        "cure_steps": [
            "Remove and destroy heavily infected plants immediately",
            "Spray systemic + contact fungicides (Metalaxyl + Mancozeb, Chlorothalonil)",
            "Avoid overhead irrigation and ensure good drainage",
            "Do not store infected fruits; destroy them away from fields"
        ],
        "pesticide": "Metalaxyl + Mancozeb combinations or other recommended late blight fungicides.",
        "fertilizer": "Reduce nitrogen, increase potassium; follow soil-test-based doses."
    },
    "Tomato___healthy": {
        "explanation": "Tomato plant is healthy with no apparent disease or pest damage.",
        "cure_steps": [
            "Continue good irrigation and nutrient management",
            "Scout regularly for disease or pest symptoms",
            "Use preventive fungicide sprays during long wet/humid periods"
        ],
        "pesticide": "No pesticide required now.",
        "fertilizer": "Balanced NPK plus calcium for good fruit quality."
    },
    "Pepper__bell__Bacterial_spot": {
        "explanation": "Bacterial spot on bell pepper causes small water-soaked spots that turn dark brown with yellow halos.",
        "cure_steps": [
            "Remove and destroy infected leaves and fruits",
            "Spray copper-based bactericide (Copper Oxychloride / Copper Hydroxide)",
            "Avoid overhead irrigation; water at the base of the plants",
            "Use disease-free seeds or seedlings and practice crop rotation"
        ],
        "pesticide": "Copper-based bactericide (Copper Oxychloride or Copper Hydroxide)",
        "fertilizer": "Balanced NPK; avoid excessive nitrogen."
    },
    "Pepper__bell__healthy": {
        "explanation": "Bell pepper plant appears healthy with no visible disease symptoms.",
        "cure_steps": [
            "Maintain proper spacing and good air circulation",
            "Keep the field weed-free and remove crop residues",
            "Monitor plants regularly for early symptoms",
        ],
        "pesticide": "No pesticide needed now; only preventive sprays during high disease pressure.",
        "fertilizer": "Balanced NPK (e.g. 19:19:19) as per soil test."
    },
    "Potato___Early_blight": {
        "explanation": "Early blight of potato caused by Alternaria solani shows brown lesions with concentric rings on older leaves.",
        "cure_steps": [
            "Remove infected lower leaves",
            "Spray fungicides such as Mancozeb, Chlorothalonil or Azoxystrobin",
            "Avoid overhead irrigation and mulch soil to prevent splash",
            "Rotate with non-solanaceous crops for 2–3 years"
        ],
        "pesticide": "Mancozeb, Chlorothalonil or Azoxystrobin-based fungicides.",
        "fertilizer": "Balanced NPK, especially adequate potassium."
    },
    "Potato___Late_blight": {
        "explanation": "Late blight of potato (Phytophthora infestans) causes dark water-soaked lesions and rapid leaf death.",
        "cure_steps": [
            "Remove and destroy heavily infected plants immediately",
            "Spray systemic + contact fungicides (Metalaxyl + Mancozeb, Chlorothalonil)",
            "Avoid overhead irrigation and ensure good drainage",
            "Do not store infected tubers; destroy them away from fields"
        ],
        "pesticide": "Metalaxyl + Mancozeb combinations or other recommended late blight fungicides.",
        "fertilizer": "Reduce nitrogen, increase potassium; follow soil-test-based doses."
    },
    "Potato___healthy": {
        "explanation": "Potato plant is healthy with green foliage and no obvious disease.",
        "cure_steps": [
            "Maintain recommended irrigation schedule",
            "Use preventive fungicide sprays during cool, humid weather",
            "Remove volunteer potato plants and maintain field sanitation"
        ],
        "pesticide": "Preventive fungicides only during favourable weather.",
        "fertilizer": "Balanced NPK such as 12:12:17 as per local recommendation."
    },
    "Tomato___Early_blight": {
        "explanation": "Early blight in tomato shows concentric brown spots on older leaves, starting from lower canopy.",
        "cure_steps": [
            "Remove infected leaves and destroy away from field",
            "Spray Mancozeb, Chlorothalonil or Azoxystrobin",
            "Mulch around plants to reduce soil splash",
            "Rotate away from tomato and other solanaceous crops"
        ],
        "pesticide": "Mancozeb, Chlorothalonil or Azoxystrobin.",
        "fertilizer": "Balanced NPK with adequate potassium and calcium."
    },
    "Tomato___Late_blight": {
        "explanation": "Late blight of tomato (Phytophthora infestans) causes dark water-soaked lesions and rapid plant death.",
        "cure_steps": [
            "Remove and destroy heavily infected plants immediately",
            "Spray systemic + contact fungicides (Metalaxyl + Mancozeb, Chlorothalonil)",
            "Avoid overhead irrigation and ensure good drainage",
            "Do not store infected fruits; destroy them away from fields"
        ],
        "pesticide": "Metalaxyl + Mancozeb combinations or other recommended late blight fungicides.",
        "fertilizer": "Reduce nitrogen, increase potassium; follow soil-test-based doses."
    },
    "Tomato___healthy": {
        "explanation": "Tomato plant is healthy with no apparent disease or pest damage.",
        "cure_steps": [
            "Continue good irrigation and nutrient management",
            "Scout regularly for disease or pest symptoms",
            "Use preventive fungicide sprays during long wet/humid periods"
        ],
        "pesticide": "No pesticide required now.",
        "fertilizer": "Balanced NPK plus calcium for good fruit quality."
    },
    "Tomato_Bacterial_spot": {
        "explanation": "Bacterial spot of tomato causes small dark spots with yellow halos on leaves and fruits.",
        "cure_steps": [
            "Remove severely affected leaves and fruits",
            "Spray copper-based bactericides at recommended intervals",
            "Avoid working in the crop when foliage is wet",
            "Use healthy planting material and rotate crops"
        ],
        "pesticide": "Copper Oxychloride / Copper Hydroxide bactericide.",
        "fertilizer": "Balanced NPK; avoid heavy nitrogen that makes foliage tender."
    },
    "Tomato_Early_blight": {
        "explanation": "Early blight in tomato shows concentric brown spots on older leaves, starting from lower canopy.",
        "cure_steps": [
            "Remove infected leaves and destroy away from field",
            "Spray Mancozeb, Chlorothalonil or Azoxystrobin",
            "Mulch around plants to reduce soil splash",
            "Rotate away from tomato and other solanaceous crops"
        ],
        "pesticide": "Mancozeb, Chlorothalonil or Azoxystrobin.",
        "fertilizer": "Balanced NPK with adequate potassium and calcium."
    },
    "Tomato_healthy": {
        "explanation": "Tomato plant is healthy with no apparent disease or pest damage.",
        "cure_steps": [
            "Continue good irrigation and nutrient management",
            "Scout regularly for disease or pest symptoms",
            "Use preventive fungicide sprays during long wet/humid periods"
        ],
        "pesticide": "No pesticide required now.",
        "fertilizer": "Balanced NPK plus calcium for good fruit quality."
    },
    "Tomato_Leaf_Mold": {
        "explanation": "Leaf mold causes yellow patches on upper leaf surface and olive-green velvety growth underneath.",
        "cure_steps": [
            "Improve air circulation (pruning, spacing, ventilation in polyhouse)",
            "Reduce humidity, avoid overhead irrigation",
            "Remove heavily infected leaves",
            "Spray Chlorothalonil or Mancozeb fungicides"
        ],
        "pesticide": "Chlorothalonil or Mancozeb.",
        "fertilizer": "Balanced NPK with sufficient calcium and magnesium."
    },
    "Tomato_Septoria_leaf_spot": {
        "explanation": "Septoria leaf spot produces many small circular spots with dark margins and gray centers on lower leaves.",
        "cure_steps": [
            "Remove and destroy lower infected leaves",
            "Apply fungicides like Chlorothalonil, Mancozeb or copper",
            "Mulch around plants; avoid overhead irrigation"
        ],
        "pesticide": "Chlorothalonil, Mancozeb or copper-based fungicides.",
        "fertilizer": "Balanced NPK; avoid excessive nitrogen."
    },
    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "explanation": "Two-spotted spider mites cause yellow stippling, bronzing and fine webbing on leaves.",
        "cure_steps": [
            "Spray water on foliage to knock down mite population",
            "Apply recommended miticides (Abamectin, Spiromesifen etc.)",
            "Remove heavily infested leaves and weeds around the field"
        ],
        "pesticide": "Abamectin or Spiromesifen miticides; neem oil for softer control.",
        "fertilizer": "Balanced NPK; avoid too much nitrogen."
    },
    "Tomato__Target_Spot": {
        "explanation": "Target spot causes circular lesions with concentric rings on tomato leaves, stems and fruits.",
        "cure_steps": [
            "Remove infected plant parts",
            "Spray Azoxystrobin, Pyraclostrobin or Chlorothalonil",
            "Provide good air circulation and avoid persistent leaf wetness"
        ],
        "pesticide": "Azoxystrobin / Pyraclostrobin / Chlorothalonil.",
        "fertilizer": "Balanced NPK with good potassium supply."
    },
    "Tomato__Tomato_mosaic_virus": {
        "explanation": "Tomato mosaic virus causes mottling, distortion and hardening of leaves; fruits may be malformed.",
        "cure_steps": [
            "Rogue out infected plants immediately (no direct cure)",
            "Use virus-free seed and seedlings",
            "Disinfect tools and hands frequently",
            "Control insect vectors and avoid tobacco use near crop"
        ],
        "pesticide": "No direct pesticide for virus; control vector insects as recommended.",
        "fertilizer": "Balanced NPK; healthy plants handle virus stress better."
    },
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "explanation": "Tomato yellow leaf curl virus (TYLCV) causes upward leaf curling, yellowing and severe stunting.",
        "cure_steps": [
            "Remove and destroy infected plants early",
            "Control whiteflies with insecticides and yellow sticky traps",
            "Use TYLCV-resistant hybrids where available",
            "Remove alternate host weeds and rotate crops"
        ],
        "pesticide": "Imidacloprid, Thiamethoxam or Spinosad for whitefly control (follow label).",
        "fertilizer": "Balanced NPK with adequate micronutrients."
    },
    "default": {
        "explanation": "Disease detected but a specific advisory is not available.",
        "cure_steps": [
            "Remove affected plant parts",
            "Apply a broad-spectrum fungicide/bactericide if disease is suspected",
            "Maintain field sanitation and crop rotation",
            "Consult local agricultural extension officer for precise diagnosis"
        ],
        "pesticide": "Consult local agricultural expert for exact product and dose.",
        "fertilizer": "Balanced NPK as per soil-test recommendation."
    }
}

def get_treatment(label: str) -> Dict[str, Any]:
    # Normalize label for matching (handle both ___ and __)
    normalized_label = label.replace("___", "__").replace("_", "")
    
    # Direct match
    if label in DISEASE_EXPLANATIONS:
        return DISEASE_EXPLANATIONS[label]
    
    # Try normalized matching
    for key in DISEASE_EXPLANATIONS.keys():
        normalized_key = key.replace("___", "__").replace("_", "")
        if normalized_key == normalized_label:
            return DISEASE_EXPLANATIONS[key]
    
    # Loose match (case insensitive, ignore underscores)
    for key in DISEASE_EXPLANATIONS.keys():
        if key.lower().replace("_", "").replace("-", "") == label.lower().replace("_", "").replace("-", ""):
            return DISEASE_EXPLANATIONS[key]
    
    return DISEASE_EXPLANATIONS["default"]

# ---------- Routes ----------

@app.get("/")
def root():
    return {
        "service": "Plant Disease Detection",
        "status": "running",
        "model_loaded": model is not None,
        "num_classes": len(class_labels),
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run train_disease.py then restart the service.",
        )

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".bmp"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload JPG/PNG/BMP image.",
        )

    # read image
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file.")

        image = Image.open(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    # preprocess + predict
    img_arr = preprocess_image(image)
    try:
        probs = model.predict(img_arr, verbose=0)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction error: {e}")

    pred_idx = int(np.argmax(probs))
    confidence = float(probs[pred_idx])

    disease_label = class_labels.get(pred_idx, f"Class_{pred_idx}")

    display_label = pretty_label(disease_label)

    # top-3
    top_indices = np.argsort(probs)[-3:][::-1]
    top3: List[Dict[str, Any]] = []

    for idx in top_indices:
        name = class_labels.get(int(idx), f"Class_{int(idx)}")
        top3.append(
            {
                "label": pretty_label(name),
                "confidence": float(probs[int(idx)]),
            }
        )

    treatment = get_treatment(disease_label)

    return {
        "label": display_label,
        "disease": disease_label,
        "confidence": confidence,
        "top3": top3,
        "explanation": treatment["explanation"],
        "cureSteps": treatment["cure_steps"],
        "recommendedPesticide": treatment["pesticide"],
        "recommendedFertilizer": treatment["fertilizer"],
        "detection_method": "MobileNetV2 Transfer Learning",
    }

# alias so frontend can call /ml/disease-detect
@app.post("/ml/disease-detect")
async def ml_disease_detect(file: UploadFile = File(...)):
    return await predict(file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
