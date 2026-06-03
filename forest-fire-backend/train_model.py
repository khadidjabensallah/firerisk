# ─────────────────────────────────────────────
# train_model.py — Algerian Forest Fire Risk Engine
# Mission: Clean data → Train model → Save it
# ─────────────────────────────────────────────

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

# ─────────────────────────────────────────────
# STEP 1 — LOAD THE RAW CSV
# ─────────────────────────────────────────────
# We tell pandas to skip the very first line ("Bejaia Region Dataset")
# because it's not a real data row — it's a region label
# header=1 means "the real column names are on line index 1"

print("📂 Loading dataset...")

df = pd.read_csv(
    "data/algerian_fires.csv",
    skiprows=1,        # skip "Bejaia Region Dataset" text
    header=0           # first remaining row = column names
)

# ─────────────────────────────────────────────
# STEP 2 — CLEAN THE DATA
# ─────────────────────────────────────────────

# 2a. Strip all whitespace from column names
# The raw file has columns like " RH" and "Rain " — this fixes that
df.columns = df.columns.str.strip()

# 2b. Strip whitespace from all string values in the dataframe
df = df.map(lambda x: x.strip() if isinstance(x, str) else x)

# 2c. Remove the duplicate region header row that appears mid-file
# When pandas reads the second region (Sidi Bel-Abbes), there's a
# line that says "day,month,year,..." again — we drop it
df = df[df["day"] != "day"]

# 2d. Remove the "Sidi-Bel Abbes Region Dataset" text row
# Same idea — it's a label, not data
df = df[~df["day"].str.contains("Sidi", na=False)]

# 2e. Drop any completely empty rows
df.dropna(how="all", inplace=True)

# 2f. Reset the index after all the deletions
df.reset_index(drop=True, inplace=True)

# 2g. Convert all columns to numeric where possible
# Some numbers were read as strings because of the messy file
# errors="coerce" turns anything unparseable into NaN
df = df.apply(pd.to_numeric, errors="coerce")

# 2h. Drop rows where our target (FWI) or features are NaN
df.dropna(subset=["Temperature", "RH", "Ws", "Rain", "FWI"], inplace=True)

print(f"✅ Dataset cleaned — {len(df)} valid rows remaining")
print(f"📊 FWI range: {df['FWI'].min()} to {df['FWI'].max()}")

# ─────────────────────────────────────────────
# STEP 3 — SELECT FEATURES AND TARGET
# ─────────────────────────────────────────────
# X = the 4 weather inputs our frontend will send
# y = FWI, the number we want to predict

X = df[["Temperature", "RH", "Ws", "Rain"]]
y = df["FWI"]

print(f"\n🔢 Features shape: {X.shape}")
print(f"🎯 Target shape:   {y.shape}")

# ─────────────────────────────────────────────
# STEP 4 — SPLIT INTO TRAIN / VALIDATION SETS
# ─────────────────────────────────────────────
# 80% of rows go to training, 20% to validation
# random_state=42 means the split is reproducible —
# running the script twice gives the same split

X_train, X_val, y_train, y_val = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

print(f"\n📦 Training rows:   {len(X_train)}")
print(f"🧪 Validation rows: {len(X_val)}")

# ─────────────────────────────────────────────
# STEP 5 — TRAIN THE MODEL
# ─────────────────────────────────────────────
# n_estimators=300 → build 300 decision trees
# random_state=42  → reproducible results
# n_jobs=-1        → use all CPU cores for speed

print("\n🌲 Training Random Forest (300 trees)...")

model = RandomForestRegressor(
    n_estimators=300,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
print("✅ Training complete!")

# ─────────────────────────────────────────────
# STEP 6 — EVALUATE ON VALIDATION SET
# ─────────────────────────────────────────────
# MAE = Mean Absolute Error
# If MAE = 1.2, it means our predictions are off by ~1.2 FWI points on average
# Lower is better. On this dataset, anything under 2.0 is excellent.

y_pred = model.predict(X_val)
mae = mean_absolute_error(y_val, y_pred)

print(f"\n📈 Validation MAE: {mae:.4f} FWI points")

# Show feature importances — which input matters most?
features = ["Temperature", "RH", "Ws", "Rain"]
importances = model.feature_importances_

print("\n🔍 Feature Importances:")
for feat, imp in sorted(zip(features, importances), key=lambda x: -x[1]):
    bar = "█" * int(imp * 40)
    print(f"  {feat:<15} {bar} {imp:.4f}")

# ─────────────────────────────────────────────
# STEP 7 — SAVE THE TRAINED MODEL
# ─────────────────────────────────────────────
# joblib serializes the model object into a .pkl file
# The FastAPI server will load this file instead of retraining

os.makedirs("model", exist_ok=True)
joblib.dump(model, "model/forest_fire_model.pkl")

print("\n💾 Model saved → model/forest_fire_model.pkl")
print("🚀 Ready for the API!")