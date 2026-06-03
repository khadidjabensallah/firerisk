

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os


app = FastAPI(
    title="Algerian Forest Fire Risk Engine",
    description="Predicts Fire Weather Index from meteorological inputs",
    version="1.0.0"
)

# ─────────────────────────────────────────────
# STEP 2 — CONFIGURE CORS
# ─────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing
# By default, browsers BLOCK requests between different ports
# Your React app runs on localhost:5173
# Your FastAPI runs on localhost:8000
# Without this, the browser would block the connection
# allow_origins → who is allowed to call this API
# allow_methods → which HTTP methods are allowed
# allow_headers → which headers are allowed

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# STEP 3 — LOAD THE MODEL ON STARTUP
# ─────────────────────────────────────────────
# We load the model ONCE when the server starts
# NOT inside the endpoint — that would reload it
# on every request which is very slow

MODEL_PATH = "model/forest_fire_model.pkl"

if not os.path.exists(MODEL_PATH):
    raise RuntimeError(
        f"Model file not found at {MODEL_PATH}. "
        "Please run train_model.py first."
    )

print("🔁 Loading model...")
model = joblib.load(MODEL_PATH)
print("✅ Model loaded and ready!")

# ─────────────────────────────────────────────
# STEP 4 — DEFINE THE INPUT SCHEMA
# ─────────────────────────────────────────────
# Pydantic BaseModel validates the incoming JSON automatically
# If the frontend sends wrong types or missing fields,
# FastAPI returns a clear 422 error automatically
# Field() lets us add min/max validation + description

class WeatherInput(BaseModel):
    temperature: float = Field(
        ...,           # "..." means required, no default
        ge=10,         # greater than or equal to 10
        le=50,         # less than or equal to 50
        description="Air temperature in °C"
    )
    rh: float = Field(
        ...,
        ge=10,
        le=100,
        description="Relative Humidity in %"
    )
    ws: float = Field(
        ...,
        ge=0,
        le=50,
        description="Wind Speed in km/h"
    )
    rain: float = Field(
        ...,
        ge=0,
        le=20,
        description="Rainfall in mm"
    )

# ─────────────────────────────────────────────
# STEP 5 — DEFINE THE OUTPUT SCHEMA
# ─────────────────────────────────────────────
# This documents exactly what the API returns
# Pydantic also validates the output before sending

class PredictionOutput(BaseModel):
    fwi: float              # the predicted Fire Weather Index
    risk_level: str         # Low / Moderate / High / Very High / Extreme
    risk_color: str         # hex color for the frontend gauge
    risk_message: str       # human readable message
    inputs: dict            # echo back what was sent (useful for debugging)

# ─────────────────────────────────────────────
# STEP 6 — HELPER: FWI → RISK CATEGORY
# ─────────────────────────────────────────────
# This function converts the raw FWI float
# into a structured risk assessment
# Based on the official Canadian FWI classification
# adopted by Algeria's fire management system

def classify_risk(fwi: float) -> dict:
    if fwi < 6:
        return {
            "level": "Low",
            "color": "#22c55e",
            "message": "Minimal fire risk. Normal conditions."
        }
    elif fwi < 12:
        return {
            "level": "Moderate",
            "color": "#eab308",
            "message": "Moderate fire risk. Stay observant."
        }
    elif fwi < 20:
        return {
            "level": "High",
            "color": "#f97316",
            "message": "High fire risk. Avoid open burning."
        }
    elif fwi < 30:
        return {
            "level": "Very High",
            "color": "#ef4444",
            "message": "Very high fire risk. Authorities on alert."
        }
    else:
        return {
            "level": "Extreme",
            "color": "#7f1d1d",
            "message": "Critical fire weather. Immediate response posture required."
        }

# ─────────────────────────────────────────────
# STEP 7 — HEALTH CHECK ENDPOINT
# ─────────────────────────────────────────────
# GET /health → lets you verify the server is alive
# Very useful during development and in production monitoring

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "model": "RandomForestRegressor",
        "version": "1.0.0"
    }

# ─────────────────────────────────────────────
# STEP 8 — THE MAIN PREDICTION ENDPOINT
# ─────────────────────────────────────────────
# POST /api/predict
# This is what your React frontend calls
# 1. FastAPI automatically parses + validates the JSON body
# 2. We build the feature array in the SAME ORDER as training
# 3. model.predict() returns a numpy array → we take [0]
# 4. We classify the risk and return a clean response

@app.post("/api/predict", response_model=PredictionOutput)
def predict(data: WeatherInput):
    try:
        # Build feature array — ORDER MUST MATCH train_model.py
        # In training we used: ["Temperature", "RH", "Ws", "Rain"]
        features = np.array([[
            data.temperature,
            data.rh,
            data.ws,
            data.rain
        ]])

        # Run the prediction
        fwi_raw = model.predict(features)[0]

        # Round to 1 decimal place
        fwi = round(float(fwi_raw), 1)

        # Get risk classification
        risk = classify_risk(fwi)

        # Return the full response
        return PredictionOutput(
            fwi=fwi,
            risk_level=risk["level"],
            risk_color=risk["color"],
            risk_message=risk["message"],
            inputs={
                "temperature": data.temperature,
                "rh": data.rh,
                "ws": data.ws,
                "rain": data.rain
            }
        )

    except Exception as e:
        # If anything goes wrong, return a proper HTTP error
        raise HTTPException(status_code=500, detail=str(e))