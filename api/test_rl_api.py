"""
Test the RL-enhanced AmICooked API with feedback learning
"""
import requests
import json

BASE_URL = "http://localhost:8000"


def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))


def main():
    print("Testing AmICooked RL API")
    print("="*60)

    # 1. Check API health
    response = requests.get(f"{BASE_URL}/")
    print_response("1. API Health Check", response)

    # 2. Train the model
    response = requests.post(f"{BASE_URL}/train")
    print_response("2. Initial Training", response)

    # 3. Make a prediction
    student_features = {
        "studytime": 2,
        "absences": 10,
        "failures": 1,
        "G1": 10,
        "G2": 11,
        "higher": "yes",
        "internet": "yes",
        "goout": 4,
        "Dalc": 2,
        "Walc": 3
    }

    response = requests.post(f"{BASE_URL}/predict", json=student_features)
    print_response("3. Initial Prediction", response)
    predicted_score = response.json()['score']

    # 4. Check stats before feedback
    response = requests.get(f"{BASE_URL}/stats")
    print_response("4. Stats Before Feedback", response)

    # 5. Submit feedback: "higher" (student is more cooked than predicted)
    print("\n" + "="*60)
    print("SUBMITTING FEEDBACK: 'higher' (student is more cooked)")
    print("="*60)

    feedback_request = {
        "features": student_features,
        "predicted_score": predicted_score,
        "feedback": "higher"
    }

    response = requests.post(f"{BASE_URL}/feedback", json=feedback_request)
    print_response("5. Submit Feedback (higher)", response)

    # 6. Make same prediction again (should be adjusted higher now)
    response = requests.post(f"{BASE_URL}/predict", json=student_features)
    print_response("6. Prediction After 'higher' Feedback", response)
    new_score = response.json()['score']

    print(f"\n📊 Score changed from {predicted_score} to {new_score}")

    # 7. Check Q-table
    response = requests.get(f"{BASE_URL}/rl-q-table")
    print_response("7. RL Q-Table (Learned Values)", response)

    # 8. Test different feedback scenarios
    print("\n" + "="*60)
    print("TESTING DIFFERENT FEEDBACK SCENARIOS")
    print("="*60)

    # Scenario: Good student
    good_student = {
        "studytime": 4,
        "failures": 0,
        "G1": 18,
        "G2": 19,
        "absences": 2,
        "higher": "yes"
    }

    response = requests.post(f"{BASE_URL}/predict", json=good_student)
    good_score = response.json()['score']
    print(f"\n👍 Good student predicted score: {good_score}")

    # Give "true" feedback (correct prediction)
    feedback = {
        "features": good_student,
        "predicted_score": good_score,
        "feedback": "true"
    }
    response = requests.post(f"{BASE_URL}/feedback", json=feedback)
    print(f"✅ Feedback: 'true' - {response.json()['message']}")

    # Scenario: Struggling student
    struggling_student = {
        "studytime": 1,
        "failures": 3,
        "G1": 6,
        "G2": 7,
        "absences": 20,
        "higher": "no"
    }

    response = requests.post(f"{BASE_URL}/predict", json=struggling_student)
    struggling_score = response.json()['score']
    print(f"\n😰 Struggling student predicted score: {struggling_score}")

    # Give "lower" feedback (student is less cooked than predicted)
    feedback = {
        "features": struggling_student,
        "predicted_score": struggling_score,
        "feedback": "lower"
    }
    response = requests.post(f"{BASE_URL}/feedback", json=feedback)
    print(f"📉 Feedback: 'lower' - {response.json()['message']}")

    # 9. Final stats
    response = requests.get(f"{BASE_URL}/stats")
    print_response("9. Final Stats After All Feedback", response)

    print("\n" + "="*60)
    print("✅ REINFORCEMENT LEARNING TEST COMPLETE!")
    print("="*60)
    print("\nKey Features:")
    print("- Base ML model provides initial predictions")
    print("- RL layer learns from feedback in real-time")
    print("- Q-learning adjusts predictions based on user feedback")
    print("- Feedback: 'true', 'higher', or 'lower'")
    print("- Model improves with each interaction")


if __name__ == "__main__":
    main()
