# AmICooked Backend API

A reinforcement learning-based API that predicts student performance scores (1-5) and improves over time through user feedback.

## Overview

The AmICooked model outputs a score from 1-5:
- **1**: Chilling (doing great)
- **2**: Pretty Good (on track)
- **3**: Medium (room for improvement)
- **4**: Concerning (need to step up)
- **5**: Cooked (urgent attention needed)

The model uses **Q-learning style reinforcement learning** to continuously improve based on user feedback.

## Quick Start

### Start the Server

```bash
uv run api/server.py
```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### 1. GET `/` - Health Check

Check if the API is running.

**Response:**
```json
{
  "message": "AmICooked API is running",
  "version": "1.0.0",
  "endpoints": ["/predict", "/feedback", "/stats"]
}
```

### 2. POST `/predict` - Get AmICooked Score

Predict the AmICooked score based on student features.

**Request Body:**
```json
{
  "hours_studied": 20,
  "attendance": 85,
  "sleep_hours": 7,
  "previous_scores": 75,
  "tutoring_sessions": 2,
  "physical_activity": 3,
  "internet_access": true,
  "extracurricular_activities": true,
  "learning_disabilities": false,
  "motivation_level": "Medium",
  "parental_involvement": "High",
  "access_to_resources": "Medium",
  "teacher_quality": "High",
  "school_type": "Public",
  "peer_influence": "Positive",
  "distance_from_home": "Near",
  "parental_education_level": "College"
}
```

**Response:**
```json
{
  "score": 2,
  "label": "Pretty Good - On track",
  "message": "You're on a good track. Stay consistent with your efforts."
}
```

**Available Feature Options:**

Numeric features:
- `hours_studied` (0-50)
- `attendance` (0-100)
- `sleep_hours` (0-12)
- `previous_scores` (0-100)
- `tutoring_sessions` (0-20)
- `physical_activity` (0-10)

Boolean features:
- `internet_access`
- `extracurricular_activities`
- `learning_disabilities`

Categorical features:
- `motivation_level`: "Low", "Medium", "High"
- `parental_involvement`: "Low", "Medium", "High"
- `access_to_resources`: "Low", "Medium", "High"
- `teacher_quality`: "Low", "Medium", "High"
- `school_type`: "Public", "Private"
- `peer_influence`: "Positive", "Neutral", "Negative"
- `distance_from_home`: "Near", "Moderate", "Far"
- `parental_education_level`: "High School", "College", "Postgraduate"

**Note:** All features are optional. Provide only the features you have data for.

### 3. POST `/feedback` - Submit Feedback

Provide feedback on a prediction to train the model via reinforcement learning.

**Request Body:**
```json
{
  "features": {
    "hours_studied": 20,
    "attendance": 85,
    "motivation_level": "Medium"
  },
  "predicted_score": 3,
  "is_correct": false,
  "feedback_type": "too_high"
}
```

**Feedback Types:**
- `"correct"`: The prediction was accurate
- `"too_high"`: The predicted score was too high (student is doing better)
- `"too_low"`: The predicted score was too low (student is doing worse)

**Response:**
```json
{
  "message": "Feedback received and model updated successfully",
  "model_updated": true,
  "current_accuracy": 0.85,
  "total_feedback_count": 42
}
```

### 4. GET `/stats` - Model Statistics

Get current model performance statistics.

**Response:**
```json
{
  "model_stats": {
    "total_feedback": 42,
    "accuracy": 0.85,
    "total_correct": 36,
    "total_incorrect": 6
  },
  "weights_sample": {
    "hours_studied": -0.1823,
    "attendance": -0.1456,
    "sleep_hours": -0.1123,
    "previous_scores": -0.2234,
    "tutoring_sessions": -0.0912
  },
  "total_weights": 15
}
```

### 5. POST `/reset-model` - Reset Model

Reset the model to initial state (useful for testing).

**Response:**
```json
{
  "message": "Model reset to initial state"
}
```

## How the Reinforcement Learning Works

### Initial Model
The model starts with pre-defined feature weights based on common sense:
- Positive factors (reduce "cooked" score): study hours, attendance, sleep, motivation
- Negative factors (increase "cooked" score): learning disabilities, distance from home

### Learning Process
1. User receives a prediction
2. User provides feedback:
   - If **correct**: Model receives positive reinforcement (small weight adjustment)
   - If **too_high**: Model adjusts weights to predict lower scores in similar situations
   - If **too_low**: Model adjusts weights to predict higher scores in similar situations
3. Model updates its internal weights using Q-learning style updates
4. Updated weights are persisted to disk (`api/model_weights.pkl`)

### Learning Rate
- Default learning rate: 0.1
- Correct predictions: 0.02 adjustment (reinforcement)
- Incorrect predictions: Full learning rate adjustment (correction)

## Model Persistence

The model automatically saves to `api/model_weights.pkl` after each feedback submission. This file stores:
- Feature weights
- Feedback history
- Learning parameters

The model automatically loads from this file on startup.

## Testing

Run the test suite:
```bash
uv run api/test_api.py
```

## Example Usage

### Python
```python
import requests

# Get prediction
response = requests.post("http://localhost:8000/predict", json={
    "hours_studied": 15,
    "attendance": 70,
    "motivation_level": "Low"
})
result = response.json()
print(f"Score: {result['score']} - {result['label']}")

# Submit feedback
requests.post("http://localhost:8000/feedback", json={
    "features": {"hours_studied": 15, "attendance": 70, "motivation_level": "Low"},
    "predicted_score": result['score'],
    "is_correct": False,
    "feedback_type": "too_high"
})
```

### cURL
```bash
# Get prediction
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"hours_studied": 20, "attendance": 85, "motivation_level": "Medium"}'

# Submit feedback
curl -X POST "http://localhost:8000/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "features": {"hours_studied": 20, "attendance": 85},
    "predicted_score": 3,
    "is_correct": false,
    "feedback_type": "too_high"
  }'
```

## Architecture

### Files
- `server.py`: FastAPI application with endpoints
- `model.py`: AmICookedModel class with RL logic
- `test_api.py`: Test suite
- `model_weights.pkl`: Persisted model weights (created after first feedback)

### Key Classes
- `AmICookedModel`: Main RL model with prediction and learning
- `StudentFeatures`: Pydantic model for input validation
- `FeedbackData`: Stores feedback for learning

## Dataset

Based on the Student Performance Factors dataset with 20 features:
- Hours Studied, Attendance, Sleep Hours, Previous Scores
- Motivation Level, Parental Involvement, Teacher Quality
- And more...

See `explore_dataset.py` for full dataset exploration.
