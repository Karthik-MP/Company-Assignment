import os
import sys
import json
import threading
from hashlib import sha256
from math import ceil

EXPECTED_HASH = "8acb1410c5af0ff76da758b9a0178c8efe34ba3f9d80417c849b3f3911799586"
SALT = "d248fac4a4e8a0460e2b3f87ba6ee455"

TESTED_FILE = "tested_answers.json"
tested_answers = set()
tested_answers_1 = set()

NUM_THREADS = 16
SAVE_EVERY = 100000  # save to file every 1000 new tested answers

lock = threading.Lock()
found_event = threading.Event()
found_answer = None
tested_count = 0  # total newly-tested answers in this run (for periodic save)


def load_tested_answers():
    global tested_answers
    if os.path.exists(TESTED_FILE):
        with open(TESTED_FILE, "r") as f:
            tested_answers = set(json.load(f))
        print(f"Loaded {len(tested_answers)} previously tested answers")
    else:
        print("No previous tests found")


def save_tested_answers():
    """Save tested_answers to disk (thread-safe)."""
    # Call this only while holding lock
    with open(TESTED_FILE + "_1", "w") as f:
        json.dump(sorted(tested_answers_1), f, indent=2)
    print(f"Saved {len(tested_answers_1)} tested answers to {TESTED_FILE}")


def generate_candidates():
    """Generate all possible candidates, excluding those already tested."""
    candidates = [
        keyword
        for m in ["M", "K", "N", "O", "B", "V", "A", "W"]
        for m2 in ["M", "K", "N", "O", "B", "V", "A", "W"]
        for o1 in ["I", "D", "[]", "[", "T", "0", "O"]
        for Y in ["Y", "V", "N", "M", "R", "K"]
        for E in ["E", "8", "B"]
        for sep in ["_", "-", "—"]
        for o2 in ["I", "D", "[]", "[", "T", "0", "O", "7"]
        for o3 in ["I", "D", "[]", "[", "T", "0", "O"]
        for o4 in ["I", "D", "[]", "][", "[", "T", "0", "O"]
        for G in ["G", "Q", "0", "O", "D", "&", "6"]
        if (keyword := f"{m}{o1}NK{E}{Y}{sep}{m2}{o4}N{o2}P{o3}N{G}")
        not in tested_answers
    ]
    print(f"Total candidates to test this run: {len(candidates)}")
    return candidates


def worker(candidates_slice, thread_id):
    """Worker thread: tests a slice of candidates."""
    global tested_count, found_answer

    for answer in candidates_slice:
        # Stop if another thread already found the answer
        if found_event.is_set():
            break

        hash_result = sha256((answer + SALT).encode()).hexdigest()

        with lock:
            # Skip if this candidate is already in the set (from previous runs or another thread)
            if answer in tested_answers:
                continue

            tested_answers_1.add(answer)
            tested_count += 1

            # Periodic save every SAVE_EVERY newly tested answers
            if tested_count % SAVE_EVERY == 0:
                save_tested_answers()

        # Check for match (outside lock to keep lock small)
        if hash_result == EXPECTED_HASH:
            with lock:
                if not found_event.is_set():  # double-check to avoid races
                    found_answer = answer
                    print("Match found!")
                    print(f"Answer: {answer}")
                    found_event.set()
            break  # this thread can stop


def main():
    global found_answer

    load_tested_answers()
    candidates = generate_candidates()

    if not candidates:
        print("No new candidates to test.")
        sys.exit(1)

    # Split candidates into NUM_THREADS chunks
    chunk_size = ceil(len(candidates) / NUM_THREADS)
    threads = []

    for i in range(NUM_THREADS):
        start = i * chunk_size
        end = min(start + chunk_size, len(candidates))
        if start >= len(candidates):
            break
        t = threading.Thread(
            target=worker,
            args=(candidates[start:end], i),
            daemon=False,  # make them non-daemon so we can join
        )
        threads.append(t)

    print(f"Starting {len(threads)} threads...")
    for t in threads:
        t.start()

    for t in threads:
        t.join()

    # Final save (ensure everything is persisted)
    with lock:
        save_tested_answers()

    if found_answer is not None:
        print(f"Final answer: {found_answer}")
        sys.exit(0)
    else:
        print("No match found in this batch.")
        sys.exit(1)


if __name__ == "__main__":
    main()
