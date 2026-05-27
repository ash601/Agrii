import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENGINEERED_DATA_PATH = os.path.join(BASE_DIR, '../03_feature_engineering/engineered_dataset.csv')
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, 'price_predictor.pkl')

def train_model():
    print("1. Loading Engineered Data...")
    df = pd.read_csv(ENGINEERED_DATA_PATH)
    
    print("2. Splitting Data (80% Training, 20% Exam)...")
    X = df.drop(columns=['Modal_Price'])
    y = df['Modal_Price']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("3. Training XGBoost Model...")
    model = XGBRegressor(n_estimators=200, learning_rate=0.1, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    print("4. Running Accuracy Exam...")
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    print(f"-> Exam Score: R-Squared = {r2:.3f} (Closer to 1.0 is better)")
    print(f"-> Average Error Margin: ₹{mae:.2f}")
    
    print("5. Exporting AI Brain...")
    joblib.dump(model, MODEL_OUTPUT_PATH)
    print(f"Success! Model saved to {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    train_model()
