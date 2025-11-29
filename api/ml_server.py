from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, Dict, Literal, Any
from rl_model import AmICookedRLModel
import uvicorn
import threading
import numpy as np

app = FastAPI(title="AmICooked RL API", version="3.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize RL model (load from disk if exists)
model = AmICookedRLModel.load_model()

# Train on startup if not trained
if not model.is_trained:
    print("Model not trained. Training on startup...")
    try:
        model.load_and_train_initial_model()
        model.save_model()
        print("Startup training complete.")
    except Exception as e:
        print(f"Startup training failed: {e}")

# Training lock to prevent concurrent retraining
training_lock = threading.Lock()


class StudentFeatures(BaseModel):
    """Input features for scoring - Portugal student dataset

    Note: Non-controllable features (sex, age, parent education, etc.) are
    weighted at 70% to reduce their impact compared to controllable factors.
    """
    # Categorical features (some non-controllable, weighted at 70%)
    sex: Optional[Literal["M", "F"]] = Field(None, description="Student's sex (weighted 70%)")
    address: Optional[Literal["U", "R"]] = Field(None, description="Home address type - U=urban, R=rural (weighted 70%)")
    famsize: Optional[Literal["LE3", "GT3"]] = Field(None, description="Family size - LE3=<=3, GT3=>3 (weighted 70%)")
    Pstatus: Optional[Literal["T", "A"]] = Field(None, description="Parent's cohabitation status - T=together, A=apart (weighted 70%)")
    Mjob: Optional[Literal["teacher", "health", "services", "at_home", "other"]] = Field(None, description="Mother's job (weighted 70%)")
    Fjob: Optional[Literal["teacher", "health", "services", "at_home", "other"]] = Field(None, description="Father's job (weighted 70%)")

    # Numeric features
    age: Optional[int] = Field(None, ge=15, le=22, description="Student age (weighted 70%)")
    Medu: Optional[int] = Field(None, ge=0, le=4, description="Mother's education 0-4 (weighted 70%)")
    Fedu: Optional[int] = Field(None, ge=0, le=4, description="Father's education 0-4 (weighted 70%)")
    traveltime: Optional[int] = Field(None, ge=0, le=4, description="Home to school travel time (1-4 or raw minutes)")
    studytime: Optional[int] = Field(None, ge=0, le=4, description="Weekly study time (1-4 or raw hours)")
    failures: Optional[int] = Field(None, ge=0, description="Number of past class failures")
    famrel: Optional[int] = Field(None, ge=1, le=5, description="Quality of family relationships (1-5)")
    freetime: Optional[int] = Field(None, ge=1, le=5, description="Free time after school (1-5)")
    goout: Optional[int] = Field(None, ge=1, le=5, description="Going out with friends (1-5)")
    Dalc: Optional[int] = Field(None, ge=1, le=5, description="Workday alcohol consumption (1-5)")
    Walc: Optional[int] = Field(None, ge=1, le=5, description="Weekend alcohol consumption (1-5)")
    health: Optional[int] = Field(None, ge=1, le=5, description="Current health status (1-5)")
    absences: Optional[int] = Field(None, ge=0, description="Number of school absences")
    G1: Optional[int] = Field(None, ge=0, description="First period grade (0-20)")
    G2: Optional[int] = Field(None, ge=0, description="Second period grade (0-20)")

    # Boolean/Categorical features (yes/no)
    schoolsup: Optional[Literal["yes", "no"]] = Field(None, description="Extra educational support")
    famsup: Optional[Literal["yes", "no"]] = Field(None, description="Family educational support")
    paid: Optional[Literal["yes", "no"]] = Field(None, description="Extra paid classes")
    activities: Optional[Literal["yes", "no"]] = Field(None, description="Extra-curricular activities")
    nursery: Optional[Literal["yes", "no"]] = Field(None, description="Attended nursery school (weighted 70%)")
    higher: Optional[Literal["yes", "no"]] = Field(None, description="Wants higher education")
    internet: Optional[Literal["yes", "no"]] = Field(None, description="Internet access at home")
    romantic: Optional[Literal["yes", "no"]] = Field(None, description="In a romantic relationship")

    @model_validator(mode='before')
    @classmethod
    def normalize_inputs(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalize studytime (raw hours to 1-4 scale)
            # 1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h
            if 'studytime' in data and data['studytime'] is not None:
                val = data['studytime']
                # Assume any input is raw hours since we expect unnormalized data
                if val < 2:
                    data['studytime'] = 1
                elif val <= 5:
                    data['studytime'] = 2
                elif val <= 10:
                    data['studytime'] = 3
                else:
                    data['studytime'] = 4
            
            # Normalize traveltime (raw minutes to 1-4 scale)
            # 1: <15m, 2: 15-30m, 3: 30-60m, 4: >60m
            if 'traveltime' in data and data['traveltime'] is not None:
                val = data['traveltime']
                if val < 15:
                    data['traveltime'] = 1
                elif val <= 30:
                    data['traveltime'] = 2
                elif val <= 60:
                    data['traveltime'] = 3
                else:
                    data['traveltime'] = 4
            
            # Clamp values
            if 'failures' in data and data['failures'] is not None:
                data['failures'] = min(data['failures'], 4)
            
            if 'absences' in data and data['absences'] is not None:
                data['absences'] = min(data['absences'], 93)
                
            if 'G1' in data and data['G1'] is not None:
                data['G1'] = min(data['G1'], 20)
                
            if 'G2' in data and data['G2'] is not None:
                data['G2'] = min(data['G2'], 20)
            
            # Clamp age (15-22)
            if 'age' in data and data['age'] is not None:
                data['age'] = max(15, min(data['age'], 22))
                
            # Clamp 0-4 scale features
            for field in ['Medu', 'Fedu']:
                if field in data and data[field] is not None:
                    data[field] = max(0, min(data[field], 4))
            
            # Clamp 1-5 scale features
            for field in ['famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health']:
                if field in data and data[field] is not None:
                    data[field] = max(1, min(data[field], 5))
                
        return data

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "studytime": 3,
                "absences": 4,
                "failures": 0,
                "G1": 14,
                "G2": 15,
                "higher": "yes",
                "internet": "yes",
                "goout": 2,
                "Dalc": 1,
                "Walc": 2,
                "schoolsup": "no",
                "famsup": "yes"
            }
        }
    )


class ScoreResponse(BaseModel):
    """Response with AmICooked score"""
    score: int = Field(..., ge=1, le=10, description="AmICooked score (1=Chilling, 10=Cooked)")
    label: str = Field(..., description="Human-readable label")
    message: str = Field(..., description="Detailed message")
    confidence: Optional[str] = Field(None, description="Model confidence indicator")


class FeedbackRequest(BaseModel):
    """User feedback on a prediction using reinforcement learning"""
    features: Dict = Field(..., description="Original features used for prediction")
    predicted_score: int = Field(..., ge=1, le=10, description="Score that was predicted")
    feedback: Literal["true", "higher", "lower"] = Field(
        ...,
        description="Feedback: 'true' (correct), 'higher' (should be more cooked), 'lower' (should be less cooked)"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "features": {
                    "studytime": 3,
                    "G1": 14,
                    "G2": 15,
                    "failures": 0
                },
                "predicted_score": 3,
                "feedback": "higher"
            }
        }
    )


class FeedbackResponse(BaseModel):
    """Response after processing feedback"""
    message: str
    feedback_applied: bool
    current_accuracy: float
    total_feedback_count: int
    rl_stats: Dict


class TrainingResponse(BaseModel):
    """Response from training operations"""
    success: bool
    message: str
    details: Optional[Dict] = None


@app.get("/")
def read_root():
    """API health check"""
    return {
        "message": "AmICooked RL API is running",
        "version": "3.0.0",
        "model": "Reinforcement Learning with Q-Learning Adjustment Layer",
        "description": "Uses base ML model + online RL learning from user feedback",
        "endpoints": ["/predict", "/feedback", "/stats", "/train", "/average-stats"]
    }


@app.post("/train", response_model=TrainingResponse)
def train_initial_model(background_tasks: BackgroundTasks):
    """
    Train the initial model on the student performance dataset.
    This downloads the dataset and trains a Gradient Boosting model.
    Call this once before making predictions.
    """
    if model.is_trained:
        return TrainingResponse(
            success=False,
            message="Model is already trained. Use /retrain to retrain with feedback.",
            details={"is_trained": True}
        )

    try:
        with training_lock:
            print("Starting initial training...")
            results = model.load_and_train_initial_model()
            model.save_model()

        return TrainingResponse(
            success=True,
            message="Model trained successfully on dataset",
            details=results
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@app.post("/retrain", response_model=TrainingResponse)
def retrain_model(background_tasks: BackgroundTasks):
    """
    Retrain the base model on the student performance dataset.
    Useful if the underlying CSV data has changed.
    Preserves existing RL feedback history.
    """
    try:
        with training_lock:
            print("Starting retraining...")
            results = model.load_and_train_initial_model()
            model.save_model()

        return TrainingResponse(
            success=True,
            message="Model successfully retrained on dataset",
            details=results
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")


@app.post("/predict", response_model=ScoreResponse)
def predict_score(features: StudentFeatures):
    """
    Predict AmICooked score based on student features using ML model

    Returns a score from 1-10:
    - 1-2: Chilling (doing great)
    - 3-4: Very Good (strong performance)
    - 5-6: Okay (room for improvement)
    - 7-8: Concerning (need help)
    - 9-10: Cooked (urgent attention needed)
    """
    if not model.is_trained:
        raise HTTPException(
            status_code=400,
            detail="Model not trained yet. Call POST /train first."
        )

    # Convert Pydantic model to dict, excluding None values
    features_dict = {k: v for k, v in features.model_dump().items() if v is not None}

    if not features_dict:
        raise HTTPException(
            status_code=400,
            detail="At least one feature must be provided"
        )

    try:
        score = model.predict_score(features_dict)
        label = model.get_score_label(score)

        # Generate detailed message (1 = best, 10 = worst)
        if score <= 2:
            message = "You're doing excellent! Keep up the great work."
            confidence = "High"
        elif score <= 4:
            message = "You're on a good track. Stay consistent with your efforts."
            confidence = "High"
        elif score <= 6:
            message = "You're doing okay, but there's room for improvement. Consider studying more or getting additional support."
            confidence = "Medium"
        elif score <= 8:
            message = "This is concerning. You should significantly increase your study time and seek help."
            confidence = "Medium"
        else:
            message = "Critical situation! Immediate action needed - talk to teachers, get tutoring, and reassess your study habits."
            confidence = "High"

        return ScoreResponse(
            score=score,
            label=label,
            message=message,
            confidence=confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(feedback_request: FeedbackRequest):
    """
    Submit feedback on a prediction to improve the model via reinforcement learning

    Feedback format:
    - "true": The prediction was correct (positive reward)
    - "higher": The score should be higher/more cooked (negative reward, learn to increase)
    - "lower": The score should be lower/less cooked (negative reward, learn to decrease)

    The RL model learns immediately from each feedback using Q-learning.
    """
    if not model.is_trained:
        raise HTTPException(
            status_code=400,
            detail="Model not trained yet. Call POST /train first."
        )

    try:
        # Apply feedback to RL model (immediate online learning)
        model.apply_feedback(
            features=feedback_request.features,
            predicted_score=feedback_request.predicted_score,
            feedback=feedback_request.feedback
        )

        # Save updated model (includes RL Q-table)
        model.save_model()

        # Get current stats
        stats = model.get_stats()

        return FeedbackResponse(
            message=f"Feedback '{feedback_request.feedback}' applied! Model learned from this interaction.",
            feedback_applied=True,
            current_accuracy=stats['accuracy'],
            total_feedback_count=stats['total_feedback'],
            rl_stats={
                "avg_reward": stats['avg_rl_reward'],
                "q_table_size": stats['q_table_size'],
                "rl_episodes": stats['rl_episodes']
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback processing error: {str(e)}")




@app.get("/stats")
def get_model_stats():
    """Get model performance statistics and metadata"""
    stats = model.get_stats()

    return {
        "model_stats": stats,
        "base_model_type": "Gradient Boosting Regressor",
        "rl_layer": "Q-Learning Adjustment Layer",
        "learning_method": "Online Reinforcement Learning",
        "description": "Base model + RL layer that learns from each feedback in real-time",
        "is_trained": model.is_trained,
        "feedback_count": len(model.feedback_history)
    }


@app.get("/rl-q-table")
def get_rl_q_table():
    """
    Get the Q-table from the RL adjustment layer

    Shows learned Q-values for state-action pairs.
    State: predicted score
    Action: adjustment (-2, -1, 0, +1, +2)
    """
    if not model.is_trained:
        raise HTTPException(
            status_code=400,
            detail="Model not trained yet. Call POST /train first."
        )

    try:
        q_table_dict = {}
        for state, actions in model.rl_layer.q_table.items():
            q_table_dict[state] = dict(actions)

        return {
            "q_table": q_table_dict,
            "description": "Q-values for each state-action pair",
            "total_states": len(q_table_dict),
            "actions": model.rl_layer.actions,
            "learning_rate": model.rl_layer.learning_rate,
            "discount_factor": model.rl_layer.discount_factor,
            "epsilon": model.rl_layer.epsilon
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting Q-table: {str(e)}")


@app.get("/average-stats")
def get_average_stats():
    """
    Get average cooked score and average student parameters from the training dataset

    Returns:
    - average_cooked_score: Mean score when running the model on all students
    - average_person_params: Mean values for all student features
    - sample_size: Number of students in the dataset
    """
    if not model.is_trained:
        raise HTTPException(
            status_code=400,
            detail="Model not trained yet. Call POST /train first."
        )

    if model.training_data is None:
        raise HTTPException(
            status_code=500,
            detail="Training data not available"
        )

    try:
        # Get the training data
        df = model.training_data.copy()

        # Calculate average parameters for numeric features
        numeric_features = [
            'age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures',
            'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences', 'G1', 'G2'
        ]

        average_params = {}
        for feature in numeric_features:
            if feature in df.columns:
                average_params[feature] = float(df[feature].mean())

        # For yes/no categorical features, calculate percentage and mode
        yesno_features = [
            'schoolsup', 'famsup', 'paid', 'activities', 'nursery',
            'higher', 'internet', 'romantic'
        ]
        for feature in yesno_features:
            if feature in df.columns:
                # Calculate percentage of "yes"
                yes_count = (df[feature] == 'yes').sum()
                average_params[f"{feature}_yes_percentage"] = float(yes_count / len(df) * 100)
                # Get mode (most common value)
                mode_val = df[feature].mode()
                average_params[feature] = mode_val[0] if len(mode_val) > 0 else None

        # For other categorical features, get mode
        other_categorical = ['sex', 'address', 'famsize', 'Pstatus', 'Mjob', 'Fjob']
        for feature in other_categorical:
            if feature in df.columns:
                mode_val = df[feature].mode()
                average_params[feature] = mode_val[0] if len(mode_val) > 0 else None

        # Calculate average cooked score by running model on all students
        predictions = []
        for idx, row in df.iterrows():
            # Build feature dict for each student
            student_features = {}
            for feature in model.feature_names:
                if feature in row:
                    student_features[feature] = row[feature]

            # Predict score
            try:
                score = model.predict_score(student_features)
                predictions.append(score)
            except Exception as e:
                # Skip if prediction fails for this student
                continue

        average_cooked_score = float(np.mean(predictions)) if predictions else None
        median_cooked_score = float(np.median(predictions)) if predictions else None

        # Score distribution
        score_distribution = {}
        if predictions:
            for score in range(1, 11):
                score_distribution[score] = int(sum(1 for s in predictions if s == score))

        return {
            "average_cooked_score": average_cooked_score,
            "median_cooked_score": median_cooked_score,
            "score_distribution": score_distribution,
            "average_person_params": average_params,
            "sample_size": len(df),
            "successful_predictions": len(predictions)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating averages: {str(e)}")


@app.post("/reset-model")
def reset_model():
    """Reset model to untrained state (useful for testing)"""
    global model
    model = AmICookedRLModel()
    model.save_model()
    return {"message": "RL Model reset to untrained state. Call POST /train to train."}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
