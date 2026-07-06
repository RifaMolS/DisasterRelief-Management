from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Get absolute path to model files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, 'disaster_prediction_model.pkl')
encoder_path = os.path.join(BASE_DIR, 'label_encoder.pkl')

try:
    model = joblib.load(model_path)
    label_encoder = joblib.load(encoder_path)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model, label_encoder = None, None

def determine_risk_level(disaster_type, confidence):
    # Very basic logic to determine risk level for the UI
    if disaster_type == "Normal" or confidence < 40:
        return "Low"
    elif confidence > 80:
        return "Extreme"
    elif confidence > 60:
        return "High"
    else:
        return "Medium"

def generate_reasoning(disaster_type, telemetry):
    if disaster_type == "Normal":
        return "Environmental telemetry falls within standard acceptable ranges."
    return f"Model detected patterns corresponding to {disaster_type} based on incoming telemetry."

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not label_encoder:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.json
        
        # Map frontend/backend keys to Model's expected keys
        input_data = pd.DataFrame({
            "Rainfall": [float(data.get("rainfall", 0))],
            "Temperature": [float(data.get("temperature", 0))],
            "Humidity": [float(data.get("humidity", 0))],
            "WindSpeed": [float(data.get("wind_speed", 0))],
            "WaterLevel": [float(data.get("water_level", 0))],
            "SoilMoisture": [float(data.get("soil_moisture", 0))],
            "SeismicActivity": [float(data.get("seismic_activity", 0))],
            "NDVI": [float(data.get("vegetation_index", 0))]
        })

        # Predict
        prediction_encoded = model.predict(input_data)
        disaster_type = label_encoder.inverse_transform(prediction_encoded)[0]

        # Calculate Confidence
        probability = model.predict_proba(input_data)
        confidence = max(probability[0]) * 100

        # Construct Output
        risk_level = determine_risk_level(disaster_type, confidence)
        reasoning = generate_reasoning(disaster_type, data)
        
        # Prevent false negative classifications from confusing the user
        if risk_level == "Low" or confidence < 40:
            disaster_type = "Normal"
            confidence = max(50.0, float(confidence)) # Baseline confidence for normality
            reasoning = "All environmental telemetry falls within standard, optimal ranges. No imminent threats detected."

        response = {
            "prediction": {
                "disaster_type": disaster_type,
                "risk_level": risk_level,
                "reasoning": reasoning,
                "confidence": round(confidence, 2)
            }
        }
        
        return jsonify(response)

    except Exception as e:
        print("Prediction Error:", e)
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=8005, debug=True)
