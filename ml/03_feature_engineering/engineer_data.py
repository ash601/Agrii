import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DATA_PATH = os.path.join(BASE_DIR, '../01_raw_data/Agriculture_price_dataset.csv')
ENGINEERED_CSV_PATH = os.path.join(BASE_DIR, 'engineered_dataset.csv')
ENCODER_OUTPUT_PATH = os.path.join(BASE_DIR, 'encoders.pkl')

def engineer_features():
    print("1. Loading raw data...")
    df = pd.read_csv(RAW_DATA_PATH)
    
    print("2. Deep Data Cleaning & Outlier Removal...")
    df = df.dropna(subset=['Modal_Price'])
    
    # Remove top and bottom 1% of prices per commodity to destroy extreme outliers
    q_low = df.groupby('Commodity')['Modal_Price'].transform(lambda x: x.quantile(0.01))
    q_hi  = df.groupby('Commodity')['Modal_Price'].transform(lambda x: x.quantile(0.99))
    df = df[(df['Modal_Price'] >= q_low) & (df['Modal_Price'] <= q_hi)]
    
    print("3. Time-Series Feature Engineering...")
    df['Price Date'] = pd.to_datetime(df['Price Date'], errors='coerce')
    df = df.dropna(subset=['Price Date']) 
    
    df['Day'] = df['Price Date'].dt.day
    df['Month'] = df['Price Date'].dt.month
    df['Year'] = df['Price Date'].dt.year
    df['DayOfYear'] = df['Price Date'].dt.dayofyear  
    df['WeekOfYear'] = df['Price Date'].dt.isocalendar().week.astype(int) 
    
    print("4. Label Encoding...")
    categorical_columns = ['STATE', 'District Name', 'Market Name', 'Commodity', 'Variety', 'Grade']
    encoders = {}
    
    for col in categorical_columns:
        df[col] = df[col].astype(str)
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
        
    print(f"5. Saving transformed data to {ENGINEERED_CSV_PATH}...")
    
    # Keep only the engineered features and the target.
    # CRITICAL FIX: Removed 'Year' to prevent XGBoost Extrapolation Trap. 
    # This turns the model into a pure seasonal price estimator.
    final_columns = ['STATE', 'District Name', 'Market Name', 'Commodity', 'Variety', 'Grade', 
                     'Day', 'Month', 'DayOfYear', 'WeekOfYear', 'Modal_Price']
    final_df = df[final_columns]
    
    final_df.to_csv(ENGINEERED_CSV_PATH, index=False)
    joblib.dump(encoders, ENCODER_OUTPUT_PATH)
    
    print("Success! Data has been transformed and securely saved.")

if __name__ == "__main__":
    engineer_features()
