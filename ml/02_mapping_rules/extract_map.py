import csv
import json
import os

# Define file paths relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, '../01_raw_data/Agriculture_price_dataset.csv')
OUTPUT_FILE = os.path.join(BASE_DIR, 'mandi_crop_map.json')

def generate_map():
    print(f"Reading data from: {INPUT_FILE}...")
    mapping = {}

    with open(INPUT_FILE, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            state = row.get('STATE')
            market = row.get('Market Name')
            commodity = row.get('Commodity')
            
            # Skip rows with missing critical data
            if not state or not market or not commodity:
                continue
                
            # Build the nested dictionary
            if state not in mapping:
                mapping[state] = {}
                
            if market not in mapping[state]:
                mapping[state][market] = set()
                
            mapping[state][market].add(commodity)

    # Convert sets to lists so it can be saved as JSON
    for state in mapping:
        for market in mapping[state]:
            mapping[state][market] = sorted(list(mapping[state][market]))

    print("Saving map to JSON...")
    with open(OUTPUT_FILE, mode='w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2)

    print(f"Success! Saved map to {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_map()
