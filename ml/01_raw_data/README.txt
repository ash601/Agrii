# Step 1: Data Acquisition

**What happens here?**
This folder holds the raw historical dataset (`Agriculture_price_dataset.csv`). 

**Where did we get this?**
We downloaded this 737,000-row dataset from Kaggle. We cross-verified the data by checking the mid-June 2023 onion prices in Lasalgaon against the official Government of India Agmarknet portal, proving its authenticity.

**Why is this isolated?**
This is the raw, unedited baseline. We isolate it in this `01_data` folder so that our Python scripts can read it, but they will never accidentally overwrite or delete it. Our production web app will never directly touch this massive 55MB file; it is only used to train the AI.

**Next Step $\rightarrow$**
We will move to the `02_mapping` folder to write a script that reads this CSV and extracts the valid State/Mandi/Crop dropdown combinations.
