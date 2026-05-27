# Step 2: Data Mapping

**Goal:**
Ensure the frontend UI dropdowns only allow valid choices. 

**What we did:**
We ran `extract_map.py`. It read the massive CSV file and extracted every unique combination of State -> Mandi -> Commodity. 

**The End Product:**
It generated `mandi_crop_map.json`. 

**Why it matters:**
This JSON file is sent to the React frontend. It prevents a user from selecting a crop in a specific market if our AI was never trained on that combination. It removes user error entirely.
