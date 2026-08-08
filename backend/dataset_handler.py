import pandas as pd

# Load dataset once
df = pd.read_csv("dataset.csv")
# Get baseline value from dataset
def get_motion_baseline():
    return df.drop(columns=["subject", "Activity"]).mean().mean()

# Optional: print dataset info (for debugging)
def print_dataset_info():
    print(df.head())
    print(df.columns)