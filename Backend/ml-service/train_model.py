"""
Generates a synthetic training dataset that mimics historical trainee cohorts,
then trains a small, interpretable Gradient Boosting classifier that predicts
the probability of a "poor outcome" (dropout / prolonged unemployment).

This is clearly synthetic data, built with intentional, realistic correlations
(low attendance / low assessment score / poor program-industry match => higher
risk) so the model has genuine signal to learn from. Swap in real historical
cohort data here once it's available (Sept 22 build), keeping the same
feature schema: attendance_pct, assessment_score, program_industry_match.

Run directly to (re)train and save model.pkl:
    python train_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
import joblib

RANDOM_SEED = 42
N_SAMPLES = 4000


def generate_synthetic_dataset(n=N_SAMPLES, seed=RANDOM_SEED):
    rng = np.random.default_rng(seed)

    attendance_pct = rng.uniform(30, 100, n)
    assessment_score = rng.uniform(20, 100, n)
    program_industry_match = rng.integers(0, 2, n)  # 0 = poor match, 1 = good match

    # Weighted "true" risk signal with some noise, then threshold into a binary outcome.
    risk_signal = (
        (100 - attendance_pct) * 0.45
        + (100 - assessment_score) * 0.40
        + (1 - program_industry_match) * 100 * 0.15
    )
    noise = rng.normal(0, 12, n)
    risk_signal_noisy = risk_signal + noise

    # poor_outcome = 1 means "at risk" (dropout / prolonged unemployment)
    threshold = np.percentile(risk_signal_noisy, 65)  # ~35% of cohort labeled at-risk, roughly realistic
    poor_outcome = (risk_signal_noisy > threshold).astype(int)

    df = pd.DataFrame(
        {
            "attendance_pct": attendance_pct,
            "assessment_score": assessment_score,
            "program_industry_match": program_industry_match,
            "poor_outcome": poor_outcome,
        }
    )
    return df


def train_and_save(path="model.pkl"):
    df = generate_synthetic_dataset()
    X = df[["attendance_pct", "assessment_score", "program_industry_match"]]
    y = df["poor_outcome"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    model = GradientBoostingClassifier(
        n_estimators=100, max_depth=3, learning_rate=0.1, random_state=RANDOM_SEED
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    print(f"Validation accuracy: {accuracy_score(y_test, preds):.3f}")
    print(f"Validation ROC-AUC:  {roc_auc_score(y_test, probs):.3f}")
    print("Feature importances:", dict(zip(X.columns, model.feature_importances_.round(3))))

    joblib.dump(model, path)
    print(f"Saved model to {path}")


if __name__ == "__main__":
    train_and_save()
