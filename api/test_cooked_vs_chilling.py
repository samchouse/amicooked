"""
Test the AmICooked ML API with two contrasting student profiles:
1. Cooked Student - stressed, struggling, poor performance
2. Chilling Student - relaxed, doing well, good performance
"""

import requests
import json

API_URL = "http://localhost:8000"

# COOKED STUDENT PROFILE
# - Low grades (G1=8, G2=9)
# - High absences (30 days!)
# - Past failures (2)
# - Low study time (1 = minimal)
# - High going out (5 = all the time)
# - High alcohol consumption (workday=4, weekend=5)
# - No support systems
# - Poor health (2)
cooked_student = {
    "sex": "M",
    "age": 18,
    "address": "R",  # Rural
    "famsize": "LE3",
    "Pstatus": "A",  # Parents apart
    "Medu": 1,  # Mom low education
    "Fedu": 1,  # Dad low education
    "Mjob": "other",
    "Fjob": "other",
    "traveltime": 4,  # Long commute
    "studytime": 1,  # Minimal study
    "failures": 2,  # Failed 2 classes
    "schoolsup": "no",  # No extra help
    "famsup": "no",  # No family support
    "paid": "no",  # No tutoring
    "activities": "no",  # No activities
    "nursery": "no",
    "higher": "no",  # Doesn't want higher ed
    "internet": "no",  # No internet
    "romantic": "yes",  # In relationship
    "famrel": 2,  # Poor family relations
    "freetime": 5,  # Lots of free time
    "goout": 5,  # Always going out
    "Dalc": 4,  # High workday alcohol
    "Walc": 5,  # Very high weekend alcohol
    "health": 2,  # Poor health
    "absences": 30,  # Missed a lot of school
    "G1": 8,  # Low first period grade
    "G2": 9   # Low second period grade
}

# CHILLING STUDENT PROFILE
# - High grades (G1=18, G2=18)
# - Low absences (2)
# - No failures
# - High study time (4 = very high)
# - Low going out (1 = rarely)
# - Low alcohol consumption
# - All support systems
# - Great health
chilling_student = {
    "sex": "F",
    "age": 16,
    "address": "U",  # Urban
    "famsize": "GT3",
    "Pstatus": "T",  # Parents together
    "Medu": 4,  # Mom high education
    "Fedu": 4,  # Dad high education
    "Mjob": "teacher",
    "Fjob": "teacher",
    "traveltime": 1,  # Short commute
    "studytime": 4,  # Studies a lot
    "failures": 0,  # No failures
    "schoolsup": "yes",  # Extra help
    "famsup": "yes",  # Family support
    "paid": "yes",  # Has tutoring
    "activities": "yes",  # Extra activities
    "nursery": "yes",
    "higher": "yes",  # Wants higher ed
    "internet": "yes",  # Has internet
    "romantic": "no",  # Single
    "famrel": 5,  # Great family relations
    "freetime": 2,  # Limited free time
    "goout": 1,  # Rarely goes out
    "Dalc": 1,  # No workday alcohol
    "Walc": 1,  # No weekend alcohol
    "health": 5,  # Excellent health
    "absences": 2,  # Almost perfect attendance
    "G1": 18,  # High first period grade
    "G2": 18   # High second period grade
}


def predict_student(profile, name):
    """Send a student profile to the API and print results"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"{'='*60}")

    response = requests.post(f"{API_URL}/predict", json=profile)

    if response.status_code == 200:
        result = response.json()
        print(f"✓ Score: {result['score']}/10")
        print(f"✓ Label: {result['label']}")
        print(f"✓ Message: {result['message']}")
        print(f"✓ Confidence: {result['confidence']}")
        return result
    else:
        print(f"✗ Error: {response.status_code}")
        print(f"✗ Details: {response.text}")
        return None


def print_comparison(cooked_result, chilling_result):
    """Print a comparison of the two results"""
    print(f"\n{'='*60}")
    print("COMPARISON")
    print(f"{'='*60}")

    if cooked_result and chilling_result:
        score_diff = cooked_result['score'] - chilling_result['score']
        print(f"Cooked Student Score:    {cooked_result['score']}/10 ({cooked_result['label']})")
        print(f"Chilling Student Score:  {chilling_result['score']}/10 ({chilling_result['label']})")
        print(f"\nScore Difference: {score_diff} points")
        print(f"(Positive = Cooked student scored higher/worse)")


def main():
    print("Testing AmICooked ML API: Cooked vs Chilling Students")
    print("=" * 60)

    # Test cooked student
    cooked_result = predict_student(cooked_student, "COOKED STUDENT 🔥")

    # Test chilling student
    chilling_result = predict_student(chilling_student, "CHILLING STUDENT ❄️")

    # Print comparison
    print_comparison(cooked_result, chilling_result)

    print(f"\n{'='*60}")
    print("Test complete!")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
