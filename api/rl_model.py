import numpy as np
import pandas as pd
import pickle
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from collections import defaultdict


def _default_dict():
    """Default dict factory for Q-table (pickle-compatible)"""
    return defaultdict(float)


def _default_float():
    """Default float factory (pickle-compatible)"""
    return 0.0

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split


@dataclass
class RLFeedback:
    """Stores reinforcement learning feedback"""
    features: Dict[str, any]
    predicted_score: int
    feedback: str  # "true", "higher", or "lower"
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def get_reward(self) -> float:
        """Calculate reward based on feedback"""
        if self.feedback == "true":
            return 1.0  # Positive reward for correct prediction
        else:
            return -0.5  # Negative reward for incorrect prediction

    def get_target_adjustment(self) -> int:
        """Get the adjustment needed based on feedback"""
        if self.feedback == "true":
            return 0  # No adjustment needed
        elif self.feedback == "higher":
            return 1  # Need to increase score (more cooked)
        elif self.feedback == "lower":
            return -1  # Need to decrease score (less cooked)
        return 0


class RLAdjustmentLayer:
    """
    Reinforcement Learning adjustment layer that learns from user feedback.

    Uses Q-learning approach to learn optimal adjustments for predictions.
    State: Current predicted score
    Action: Adjustment to apply (-2, -1, 0, +1, +2)
    Reward: Based on user feedback
    """

    def __init__(self, learning_rate: float = 0.1, discount_factor: float = 0.9, epsilon: float = 0.1):
        self.learning_rate = learning_rate  # α: how much we update Q-values
        self.discount_factor = discount_factor  # γ: importance of future rewards
        self.epsilon = epsilon  # Exploration rate (for epsilon-greedy)

        # Q-table: Q(state, action) -> expected reward
        # State = predicted score (1-10)
        # Action = adjustment (-2, -1, 0, +1, +2)
        self.q_table = defaultdict(_default_dict)

        # Available actions (adjustments to score)
        self.actions = [-2, -1, 0, 1, 2]

        # Track episode rewards for monitoring
        self.episode_rewards: List[float] = []

        # Feature-based adjustments: learn patterns from features
        self.feature_adjustments = defaultdict(_default_dict)

    def get_state_key(self, score: int, features: Optional[Dict] = None) -> str:
        """Convert score (and optionally features) to state key"""
        # Simple state: just the score
        state = f"score_{score}"

        # Optionally include key features for more granular learning
        if features:
            # Include key controllable features
            if 'studytime' in features:
                state += f"_st{features['studytime']}"
            if 'failures' in features:
                state += f"_f{features['failures']}"

        return state

    def select_action(self, state: str, training: bool = True) -> int:
        """
        Select action using epsilon-greedy policy

        Args:
            state: Current state key
            training: If True, use epsilon-greedy. If False, use greedy (best action)
        """
        if training and np.random.random() < self.epsilon:
            # Exploration: random action
            return np.random.choice(self.actions)
        else:
            # Exploitation: best action based on Q-values
            q_values = [self.q_table[state][action] for action in self.actions]
            max_q = max(q_values)
            # If multiple actions have same Q-value, choose randomly among them
            best_actions = [action for action, q in zip(self.actions, q_values) if q == max_q]
            return np.random.choice(best_actions)

    def update_q_value(self, state: str, action: int, reward: float, next_state: str):
        """
        Update Q-value using Q-learning update rule:
        Q(s,a) ← Q(s,a) + α[r + γ max_a' Q(s',a') - Q(s,a)]
        """
        current_q = self.q_table[state][action]

        # Get max Q-value for next state
        next_max_q = max([self.q_table[next_state][a] for a in self.actions])

        # Q-learning update
        new_q = current_q + self.learning_rate * (reward + self.discount_factor * next_max_q - current_q)

        self.q_table[state][action] = new_q

        # Track reward
        self.episode_rewards.append(reward)

    def get_adjustment(self, predicted_score: int, features: Optional[Dict] = None, training: bool = False) -> int:
        """Get the adjustment to apply to the predicted score"""
        state = self.get_state_key(predicted_score, features)
        action = self.select_action(state, training=training)
        return action

    def apply_feedback(self, predicted_score: int, feedback: str, features: Optional[Dict] = None):
        """
        Apply user feedback to update the Q-table

        Args:
            predicted_score: The score that was predicted
            feedback: "true", "higher", or "lower"
            features: Optional features for more granular learning
        """
        # Current state
        state = self.get_state_key(predicted_score, features)

        # Determine what action should have been taken
        if feedback == "true":
            optimal_action = 0  # No adjustment needed
            reward = 1.0  # High reward for correct prediction
        elif feedback == "higher":
            optimal_action = 1  # Should have increased score
            reward = 0.5  # Positive reward to encourage adjustment
        elif feedback == "lower":
            optimal_action = -1  # Should have decreased score
            reward = 0.5  # Positive reward to encourage adjustment
        else:
            return

        # Calculate next state (after applying optimal action)
        next_score = np.clip(predicted_score + optimal_action, 1, 10)
        next_state = self.get_state_key(next_score, features)

        # Update Q-value for the action that should have been taken
        self.update_q_value(state, optimal_action, reward, next_state)

        # Also update Q-values for actual action taken (if we tracked it)
        # For now, we're doing offline learning from feedback


class AmICookedRLModel:
    """
    Reinforcement Learning enhanced ML model for predicting exam scores.

    Combines:
    1. Base ML model (Gradient Boosting) for initial predictions
    2. RL adjustment layer that learns from user feedback in real-time

    Scoring: 1 = Chilling (doing great), 10 = Cooked (struggling)
    """

    def __init__(self):
        # Base ML model (same as before)
        self.base_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42,
            subsample=0.8,
        )

        # RL adjustment layer
        self.rl_layer = RLAdjustmentLayer(
            learning_rate=0.1,
            discount_factor=0.9,
            epsilon=0.05  # Low exploration rate
        )

        # Label encoders for categorical features
        self.label_encoders = {}

        # Feature names (same as before)
        self.feature_names = [
            "sex", "age", "address", "famsize", "Pstatus", "Medu", "Fedu",
            "Mjob", "Fjob", "traveltime", "studytime", "failures", "schoolsup",
            "famsup", "paid", "activities", "nursery", "higher", "internet",
            "romantic", "famrel", "freetime", "goout", "Dalc", "Walc",
            "health", "absences", "G1", "G2"
        ]

        # Non-controllable features (weighted at 70%)
        self.non_controllable_features = [
            "sex", "age", "address", "famsize", "Pstatus",
            "Medu", "Fedu", "Mjob", "Fjob", "nursery"
        ]
        self.non_controllable_weight = 0.7

        # Categorical features
        self.categorical_features = [
            "sex", "address", "famsize", "Pstatus", "Mjob", "Fjob",
            "schoolsup", "famsup", "paid", "activities", "nursery",
            "higher", "internet", "romantic"
        ]

        # Feedback history
        self.feedback_history: List[RLFeedback] = []
        self.training_data: Optional[pd.DataFrame] = None
        self.is_trained = False

        # Performance tracking
        self.initial_score: Optional[float] = None
        self.current_score: Optional[float] = None
        self.total_corrections = 0
        self.correct_predictions = 0

    def load_and_train_initial_model(self):
        """Load dataset and train initial base model"""
        print("Loading dataset...")

        df = pd.read_csv("api/student-por.csv")

        print(f"Dataset loaded: {df.shape}")
        self.training_data = df.copy()

        # Prepare features and target
        X = df[self.feature_names].copy()
        y = df["G3"].values  # Final grade (0-20 scale)

        # Encode categorical features
        for col in self.categorical_features:
            if col in X.columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.label_encoders[col] = le

        # Scale down non-controllable features
        for col in self.non_controllable_features:
            if col in X.columns:
                X[col] = X[col] * self.non_controllable_weight

        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.1, random_state=42
        )

        print(f"Training base model on {len(X_train)} samples...")
        self.base_model.fit(X_train, y_train)

        # Evaluate
        train_score = self.base_model.score(X_train, y_train)
        test_score = self.base_model.score(X_test, y_test)

        self.initial_score = test_score
        self.current_score = test_score
        self.is_trained = True

        print("Training complete!")
        print(f"Train R² score: {train_score:.4f}")
        print(f"Test R² score: {test_score:.4f}")

        return {
            "train_score": train_score,
            "test_score": test_score,
        }

    def prepare_features(self, features: Dict[str, any]) -> np.ndarray:
        """Convert input features dict to model input array"""
        feature_values = []

        for feature_name in self.feature_names:
            if feature_name in features and features[feature_name] is not None:
                value = features[feature_name]

                # Encode categorical features
                if feature_name in self.categorical_features:
                    if feature_name in self.label_encoders:
                        try:
                            value = self.label_encoders[feature_name].transform([str(value)])[0]
                        except ValueError:
                            value = 0
                    else:
                        value = 0
                elif isinstance(value, bool):
                    value = 1 if value else 0

                # Scale down non-controllable features
                if feature_name in self.non_controllable_features:
                    value = float(value) * self.non_controllable_weight

                feature_values.append(float(value))
            else:
                # Use mean from training data
                if self.training_data is not None and feature_name in self.training_data.columns:
                    if feature_name in self.categorical_features:
                        feature_values.append(0)
                    else:
                        feature_values.append(float(self.training_data[feature_name].mean()))
                else:
                    feature_values.append(0.0)

        return np.array(feature_values).reshape(1, -1)

    def predict_score(self, features: Dict[str, any], use_rl_adjustment: bool = True) -> int:
        """
        Predict AmICooked score (1-10) with RL adjustments

        Args:
            features: Student features
            use_rl_adjustment: Whether to apply RL adjustment layer

        Returns:
            Score from 1-10 (1=Chilling, 10=Cooked)
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call load_and_train_initial_model() first.")

        # Get base prediction from ML model
        X = self.prepare_features(features)
        grade_prediction = self.base_model.predict(X)[0]

        # Convert grade (0-20) to cooked score (1-10)
        base_score = max(1, min(10, 11 - int(grade_prediction / 2.2)))

        # Apply RL adjustment if enabled
        if use_rl_adjustment:
            adjustment = self.rl_layer.get_adjustment(base_score, features, training=False)
            adjusted_score = np.clip(base_score + adjustment, 1, 10)
            return int(adjusted_score)
        else:
            return int(base_score)

    def apply_feedback(self, features: Dict[str, any], predicted_score: int, feedback: str):
        """
        Apply user feedback to improve predictions via reinforcement learning

        Args:
            features: Features used for the prediction
            predicted_score: The score that was predicted
            feedback: "true" (correct), "higher" (should be more cooked), or "lower" (should be less cooked)
        """
        # Validate feedback
        if feedback not in ["true", "higher", "lower"]:
            raise ValueError(f"Invalid feedback: {feedback}. Must be 'true', 'higher', or 'lower'")

        # Store feedback
        rl_feedback = RLFeedback(
            features=features,
            predicted_score=predicted_score,
            feedback=feedback
        )
        self.feedback_history.append(rl_feedback)

        # Calculate base_score to identify the correct state
        # (Must match the state used in predict_score)
        X = self.prepare_features(features)
        grade_prediction = self.base_model.predict(X)[0]
        base_score = max(1, min(10, 11 - int(grade_prediction / 2.2)))

        # Update RL layer immediately (online learning)
        # We use base_score as the state, so the RL layer learns adjustments relative to base
        self.rl_layer.apply_feedback(base_score, feedback, features)

        # Update statistics
        self.total_corrections += 1
        if feedback == "true":
            self.correct_predictions += 1

    def get_score_label(self, score: int) -> str:
        """Get human-readable label for score"""
        labels = {
            1: "Chilling - You're crushing it!",
            2: "Excellent - Doing great!",
            3: "Very Good - On a strong path",
            4: "Good - Keeping up well",
            5: "Pretty Good - On track",
            6: "Okay - Room for improvement",
            7: "Concerning - Need to step up",
            8: "Struggling - Seek help soon",
            9: "Very Cooked - Urgent action needed",
            10: "Completely Cooked - Critical situation",
        }
        return labels.get(score, "Unknown")

    def get_stats(self) -> Dict:
        """Get model statistics"""
        accuracy = (self.correct_predictions / self.total_corrections
                   if self.total_corrections > 0 else 0.0)

        # Calculate average reward from RL layer
        avg_reward = (np.mean(self.rl_layer.episode_rewards)
                     if self.rl_layer.episode_rewards else 0.0)

        return {
            "is_trained": self.is_trained,
            "base_model_r2": self.current_score,
            "total_feedback": len(self.feedback_history),
            "correct_predictions": self.correct_predictions,
            "total_corrections": self.total_corrections,
            "accuracy": accuracy,
            "avg_rl_reward": avg_reward,
            "rl_episodes": len(self.rl_layer.episode_rewards),
            "q_table_size": len(self.rl_layer.q_table),
        }

    def save_model(self, path: str = "api/rl_model.pkl"):
        """Save model and all state"""
        data = {
            "base_model": self.base_model,
            "rl_layer": self.rl_layer,
            "label_encoders": self.label_encoders,
            "feedback_history": self.feedback_history,
            "training_data": self.training_data,
            "is_trained": self.is_trained,
            "initial_score": self.initial_score,
            "current_score": self.current_score,
            "total_corrections": self.total_corrections,
            "correct_predictions": self.correct_predictions,
        }
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(data, f)
        print(f"RL Model saved to {path}")

    @classmethod
    def load_model(cls, path: str = "api/rl_model.pkl"):
        """Load model and all state"""
        try:
            with open(path, "rb") as f:
                data = pickle.load(f)

            model_instance = cls()
            model_instance.base_model = data["base_model"]
            model_instance.rl_layer = data["rl_layer"]
            model_instance.label_encoders = data["label_encoders"]
            model_instance.feedback_history = data.get("feedback_history", [])
            model_instance.training_data = data.get("training_data")
            model_instance.is_trained = data.get("is_trained", False)
            model_instance.initial_score = data.get("initial_score")
            model_instance.current_score = data.get("current_score")
            model_instance.total_corrections = data.get("total_corrections", 0)
            model_instance.correct_predictions = data.get("correct_predictions", 0)

            print(f"RL Model loaded from {path}")
            return model_instance
        except FileNotFoundError:
            print("No saved RL model found, creating new instance")
            return cls()
