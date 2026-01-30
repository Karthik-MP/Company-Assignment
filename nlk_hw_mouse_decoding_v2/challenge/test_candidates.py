import csv
import matplotlib.pyplot as plt
import json
import os

# Read tested values if file exists
TESTED_FILE = 'tested_answers.json'
tested_answers = set()
if os.path.exists(TESTED_FILE):
    with open(TESTED_FILE, 'r') as f:
        tested_answers = set(json.load(f))
    print(f"Loaded {len(tested_answers)} previously tested answers")
    print(f"Already tested: {sorted(tested_answers)}")
else:
    print("No previous tests found")

# Read the CSV file and analyze
velocities_x = []
velocities_y_original = []
with open('mouse_velocities.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        vx = float(row['velocity_x'])
        vy_orig = float(row['velocity_y'])
        velocities_x.append(vx)
        velocities_y_original.append(vy_orig)

# Generate candidate words based on common patterns
possible_keywords = [
    f"{m}{o1}NK{E}{Y}{sep}{m2}{o4}N{o2}P{o3}N{G}"
    for m in ["M"]
    for m2 in ["M", "A"]
    for o1 in ["D", "0", "O"]
    for Y in ["Y",]
    for E in ["E", "8","B","{","€"]
    for sep in ["_", "-", "—","¯"]
    for o2 in ["D","0", "O"]
    for o3 in ["I", "D", "0", "O", "|"]
    for o4 in ["I", "1", "[]", "][", "[", "0", "O", "!","Z"]
    for G in ["G", "Q", "0", "O", "6", "&", "Ø"]
]

# Filter out already tested
new_candidates = [c for c in possible_keywords if c not in tested_answers]

print(f"\nNew candidates to test: {len(new_candidates)}")
print(f"Candidates: {new_candidates[:20]}...")

# Save function
def save_tested(answer):
    tested_answers.add(answer)
    with open(TESTED_FILE, 'w') as f:
        json.dump(sorted(list(tested_answers)), f, indent=2)

# Try candidates one by one
import subprocess
import sys

for candidate in new_candidates[:10]:  # Test 10 at a time
    print(f"\nTesting: {candidate}")
    result = subprocess.run(
        [sys.executable, 'check_answer.py', candidate],
        capture_output=True,
        text=True
    )
    print(result)
    save_tested(candidate)
    print(result)
    if result.stdout != 'False\n':
        print(f"\n{'='*60}")
        print(f"SUCCESS! The answer is: {candidate}")
        print(f"{'='*60}")
        break
    else:
        print(f"  ✗ Not {candidate}")

print(f"\nTotal tested so far: {len(tested_answers)}")
