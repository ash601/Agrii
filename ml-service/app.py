import os
import random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

# Note: In a production environment, this would load XGBoost models using joblib
# from xgboost import XGBRegressor
# import joblib

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "service": "AgriTrade ML Microservice",
        "model": "XGBoost v2.0"
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Mock XGBoost prediction endpoint for development.
    Accepts: { "commodity": "Rice", "state": "Punjab", "historical_prices": [...] }
    Returns: 7-day forecast
    """
    data = request.json
    commodity = data.get('commodity')
    state = data.get('state')
    
    if not commodity or not state:
        return jsonify({"error": "Missing commodity or state"}), 400
        
    # Simulate model latency
    import time
    time.sleep(1.5)
    
    # In a real scenario, we'd:
    # 1. df = pd.DataFrame(data['historical_prices'])
    # 2. features = engineer_features(df)
    # 3. model = joblib.load(f"saved_models/{commodity.lower()}.pkl")
    # 4. predictions = model.predict(features)
    
    # Generate realistic pseudo-predictions
    base_price = 2000
    if commodity == 'Rice': base_price = 2400
    elif commodity == 'Wheat': base_price = 2100
    elif commodity == 'Tomato': base_price = 1800
    elif commodity == 'Onion': base_price = 1200
    elif commodity == 'Potato': base_price = 800
    
    # Add upward bias for trend simulation
    trend_factor = 0.005 # 0.5% daily increase
    
    predictions = []
    current_date = datetime.now()
    
    for i in range(1, 8):
        target_date = current_date + timedelta(days=i)
        
        # Base predicted price with trend and noise
        noise = random.uniform(-0.02, 0.02)
        predicted = int(base_price * (1 + (i * trend_factor) + noise))
        
        # Uncertainty grows over time
        std_dev = base_price * 0.05 * (1 + i * 0.1)
        
        # Confidence decays over time
        confidence = max(60, int(98 - (i * 3) + random.uniform(-2, 2)))
        
        predictions.append({
            "date": target_date.strftime('%Y-%m-%d'),
            "predictedPrice": predicted,
            "lowerBound": int(predicted - (std_dev * 1.5)),
            "upperBound": int(predicted + (std_dev * 1.5)),
            "confidence": confidence
        })
        
    # Set overall confidence
    overall_confidence = int(np.mean([p['confidence'] for p in predictions]))
        
    return jsonify({
        "commodity": commodity,
        "state": state,
        "predictions": predictions,
        "overallConfidence": overall_confidence,
        "modelInfo": {
            "algorithm": "XGBoost Regressor (Mock via Flask)",
            "version": "1.4.2",
            "lastTrained": (datetime.now() - timedelta(days=2)).isoformat()
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"🌾 Starting ML Microservice on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
