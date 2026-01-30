import subprocess
import sys

print("Manual Answer Checker")
print("=" * 50)
print("Enter your answer in ALL UPPERCASE")
print("Type 'quit' to exit\n")

while True:
    answer = input("Enter your answer: ").strip().upper()
    
    if answer.lower() == 'quit':
        print("Exiting...")
        break
    
    if not answer:
        print("Please enter an answer.\n")
        continue
    
    print(f"\nTesting: {answer}")
    result = subprocess.run(
        [sys.executable, "check_answer.py", answer],
        capture_output=True,
        text=True
    )
    print(result.stdout.strip())
    
    if result.returncode == 0:
        print(f"\n🎉 ✅ CORRECT ANSWER: {answer}")
        print("\nThis is the answer to submit!")
        break
    else:
        print("❌ Incorrect. Try again.\n")
