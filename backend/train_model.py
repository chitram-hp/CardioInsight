import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# Load dataset
df = pd.read_csv("heart.csv")

# Ensure binary target 
df["target"] = df["target"].apply(lambda x: 1 if x > 0 else 0)

print("value counts for categorical fields:")
for col in ["restecg", "slope", "thal"]:
    print(col, df[col].value_counts().to_dict())

extreme = df[(df.restecg == 2) & (df.slope == 1) & (df.target == 1)]
if not extreme.empty:
    print(f"Found {len(extreme)} extreme high‑risk rows; augmenting dataset...")
    df = pd.concat([df, extreme.sample(n=len(extreme)*10, replace=True, random_state=42)], ignore_index=True)

X = df.drop("target", axis=1)
y = df["target"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Stronger RandomForest with class weighting to help with imbalance
rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=8,
    random_state=42,
    class_weight="balanced",
)

from sklearn.calibration import CalibratedClassifierCV
model = CalibratedClassifierCV(rf, cv=5, method="isotonic")

model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("Model Accuracy:", accuracy)

rare = X[(X.restecg == 2) & (X.slope == 1)]
if not rare.empty:
    probs = model.predict_proba(rare)[:, 1]
    print(f"Probabilities for {len(rare)} rare cases:", probs)
    print("mean probability", probs.mean())
    print("targets for those rows:", y.loc[rare.index].values)

# Save model
joblib.dump(model, "model.pkl")
print("Model saved as model.pkl")