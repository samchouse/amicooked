# AmICooked ML Backend API

A **machine learning** API using **Gradient Boosting** and **Active Learning** to predict student performance scores (1-5) and continuously improve through user feedback.

## Overview

### AmICooked Score (1-5)
- **1**: Chilling (doing great - predicted exam score 90+)
- **2**: Pretty Good (on track - 80-89)
- **3**: Medium (room for improvement - 70-79)
- **4**: Concerning (need to step up - 60-69)
- **5**: Cooked (urgent attention needed - <60)

### Machine Learning Approach

**Base Model**: Gradient Boosting Regressor (scikit-learn)
- Trained on 6,607 student performance samples (90/10 train/test split)
- 19 input features (attendance, study hours, motivation, etc.)
- **Test R² Score: 0.635** (explains 63.5% of variance)
- **Training samples: 5,946** | Test samples: 661

**Active Learning**: User feedback is incorporated as new training data
- When users provide corrections, they become labeled samples
- Model retrains periodically with weighted feedback (5x weight)
- Continuously improves accuracy over time

## Quick Start

### 1. Start the Server

```bash
uv run api/ml_server.py
```

Server runs at `http://localhost:8000`

### 2. Train the Model (First Time Only)

```bash
curl -X POST "http://localhost:8000/train"
```

This downloads the dataset and trains the initial model (~10 seconds).

### 3. Make Predictions

```python
import requests

response = requests.post("http://localhost:8000/predict", json={
    "hours_studied": 20,
    "attendance": 85,
    "motivation_level": "Medium",
    "previous_scores": 75
})

print(response.json())
# {"score": 3, "label": "Medium - Room for improvement", ...}
```

## API Endpoints

### POST `/train` - Initial Training

Train the model on the dataset (call once at startup).

**Response:**
```json
{
  "success": true,
  "message": "Model trained successfully on dataset",
  "details": {
    "train_score": 0.7492,
    "test_score": 0.6347,
    "feature_importance": [...]
  }
}
```

### POST `/predict` - Get AmICooked Score

Predict score based on student features.

**Request:**
```json
{
  "hours_studied": 20,
  "attendance": 85,
  "sleep_hours": 7,
  "previous_scores": 75,
  "tutoring_sessions": 2,
  "motivation_level": "Medium",
  "parental_involvement": "High"
  // ... any combination of features
}
```

**Response:**
```json
{
  "score": 3,
  "label": "Medium - Room for improvement",
  "message": "You're doing okay, but there's room for improvement...",
  "confidence": "Medium"
}
```

**All Available Features:**

Numeric:
- `hours_studied` (0-50): Hours studied per week
- `attendance` (0-100): Attendance percentage
- `sleep_hours` (0-12): Average sleep hours per night
- `previous_scores` (0-100): Previous exam scores
- `tutoring_sessions` (0-20): Tutoring sessions per month
- `physical_activity` (0-10): Hours of physical activity per week

Boolean:
- `internet_access`: Has internet access
- `extracurricular_activities`: Participates in activities
- `learning_disabilities`: Has learning disabilities

Categorical:
- `motivation_level`: "Low", "Medium", "High"
- `parental_involvement`: "Low", "Medium", "High"
- `access_to_resources`: "Low", "Medium", "High"
- `teacher_quality`: "Low", "Medium", "High"
- `school_type`: "Public", "Private"
- `peer_influence`: "Positive", "Neutral", "Negative"
- `distance_from_home`: "Near", "Moderate", "Far"
- `parental_education_level`: "High School", "College", "Postgraduate"
- `family_income`: "Low", "Medium", "High"
- `gender`: "Male", "Female"

**Note**: All features are optional. The model uses training data means for missing values.

### POST `/feedback` - Submit User Feedback

Provide feedback to improve the model via active learning.

**Request:**
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
- `"correct"`: Prediction was accurate
- `"too_high"`: Score was too high (student doing better)
- `"too_low"`: Score was too low (student doing worse)

**Response:**
```json
{
  "message": "Feedback received and stored successfully",
  "feedback_stored": true,
  "current_accuracy": 0.85,
  "total_feedback_count": 42,
  "will_retrain_soon": true
}
```

### POST `/retrain` - Retrain with Feedback

Manually trigger retraining with accumulated feedback.

**Query Parameters:**
- `min_feedback` (default: 10): Minimum feedback samples required

**Request:**
```bash
curl -X POST "http://localhost:8000/retrain?min_feedback=10"
```

**Response:**
```json
{
  "success": true,
  "message": "Model retrained successfully with user feedback",
  "details": {
    "retrained": true,
    "feedback_score": 0.92,
    "old_score": 0.61,
    "improvement": 0.31,
    "samples_used": 6657
  }
}
```

### GET `/stats` - Model Statistics

Get current model performance metrics.

**Response:**
```json
{
  "model_stats": {
    "total_feedback": 42,
    "accuracy": 0.85,
    "total_correct": 36,
    "total_incorrect": 6,
    "is_trained": true,
    "initial_score": 0.6079,
    "current_score": 0.7234,
    "improvement": 0.1155
  },
  "model_type": "Gradient Boosting Regressor",
  "learning_method": "Active Learning with User Feedback",
  "is_trained": true,
  "feedback_count": 42
}
```

### GET `/feature-importance` - Feature Importance

See which features matter most for predictions.

**Response:**
```json
{
  "feature_importance": [
    {"feature": "attendance", "importance": 0.3615},
    {"feature": "hours_studied", "importance": 0.2803},
    {"feature": "previous_scores", "importance": 0.0960},
    ...
  ],
  "description": "Features sorted by importance..."
}
```

**Top 5 Most Important Features:**
1. **Attendance** (37.1%) - Most predictive of performance
2. **Hours Studied** (27.7%) - Second most important
3. **Previous Scores** (8.7%) - Historical performance matters
4. **Access to Resources** (4.8%) - Learning materials availability
5. **Tutoring Sessions** (4.5%) - Extra academic support

### POST `/reset-model` - Reset Model

Reset to untrained state (for testing).

## How Active Learning Works

### 1. Initial Training
- Model trains on 6,607 historical student records
- Learns patterns between features and exam scores
- Achieves ~61% R² score on test set

### 2. User Feedback Collection
- Users review predictions and provide corrections
- Feedback is stored with inferred "actual" scores:
  - `correct` → actual = predicted
  - `too_high` → actual = predicted - 1
  - `too_low` → actual = predicted + 1

### 3. Retraining
- After 10+ feedback samples, model can retrain
- Combines original dataset + weighted feedback (5x)
- Model learns from real-world corrections
- Improves accuracy on similar future cases

### 4. Continuous Improvement
- More feedback → better predictions
- Model adapts to your specific use case
- Performance tracked via `/stats` endpoint

## Example Test Results

From `test_ml_api.py`:

```
Prediction Comparison:
  Struggling Student: Score 5/5 - Cooked - Urgent attention needed
  Average Student:    Score 4/5 - Concerning - Need to step up
  Excellent Student:  Score 2/5 - Pretty Good - On track
```

**Struggling Student Profile:**
- Hours studied: 10, Attendance: 60%, Sleep: 5hrs
- Motivation: Low, Parental involvement: Low
- Previous scores: 55
- **Prediction: 5 (Cooked)** ✓

**Excellent Student Profile:**
- Hours studied: 30, Attendance: 98%, Sleep: 8hrs
- Motivation: High, Parental involvement: High
- Previous scores: 92
- **Prediction: 2 (Pretty Good)** ✓

## Testing

Run comprehensive test suite:
```bash
uv run api/test_ml_api.py
```

Tests include:
- Initial training
- Feature importance analysis
- Predictions on different student profiles
- Feedback mechanism
- Statistics tracking

## Architecture

### Files
- `ml_server.py`: FastAPI application
- `ml_model.py`: ML model with active learning
- `test_ml_api.py`: Comprehensive test suite
- `ml_model.pkl`: Persisted model (created after training)

### Key Technologies
- **FastAPI**: Modern Python web framework
- **scikit-learn**: Machine learning library
- **Gradient Boosting**: Ensemble learning method
- **Active Learning**: User feedback incorporation
- **pandas/numpy**: Data processing

### Model Details

**Algorithm**: Gradient Boosting Regressor
- 100 estimators (trees)
- Learning rate: 0.1
- Max depth: 5
- Subsample: 0.8

**Preprocessing**:
- Categorical features: Label encoded
- Missing values: Filled with training data means
- Target transformation: Exam scores (0-100) → AmICooked (1-5)

## Performance Metrics

**Initial Training (90/10 Split):**
- Train R² Score: 0.7492
- Test R² Score: 0.6347
- Training samples: 5,946
- Test samples: 661
- Overfitting margin: 0.1144 (11.4%)

**After Active Learning:**
- Feedback accuracy improves over time
- Model adapts to correction patterns
- Performance tracked via `/stats`

## Integration with Frontend

Your frontend form should:
1. Collect student features (any subset is fine)
2. POST to `/predict` to get AmICooked score
3. Display score and message to user
4. Allow user to provide feedback (correct/too_high/too_low)
5. POST feedback to `/feedback` endpoint
6. Optionally show stats from `/stats` endpoint

**Minimal Example:**
```javascript
// Get prediction
const response = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    hours_studied: 20,
    attendance: 85,
    motivation_level: "Medium"
  })
});
const {score, label, message} = await response.json();

// Submit feedback
await fetch('http://localhost:8000/feedback', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    features: {hours_studied: 20, attendance: 85, motivation_level: "Medium"},
    predicted_score: score,
    is_correct: false,
    feedback_type: "too_high"
  })
});
```

## Why This Approach is Better

**vs. Simple Rule-Based:**
- Learns complex patterns from real data
- Discovers non-obvious feature interactions
- Data-driven rather than hand-coded rules

**vs. Static ML Model:**
- Active learning continuously improves
- Adapts to your specific use case
- User feedback makes it smarter over time

**vs. Manual Q-Learning:**
- Leverages proven sklearn algorithms
- Better performance out of the box
- Easier to debug and maintain
- Feature importance analysis included

## Next Steps

1. ✅ Model is trained and working
2. ✅ Active learning mechanism ready
3. ✅ All endpoints tested
4. 🔄 Integrate with your frontend form
5. 🔄 Collect user feedback
6. 🔄 Watch model improve over time!

## API Documentation

Interactive docs available when server is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
