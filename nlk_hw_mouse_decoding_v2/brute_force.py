import subprocess
import sys
import itertools
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# -------------------------
# SETTINGS
# -------------------------

MAX_THREADS = 32       # You may increase if CPU allows
MAX_CHANGES = 9

base_patterns = [
    "MONKMRMPNOOZO",
    "MONKMRKNOENO",
    "MONKMRKNOPONO"
]

# Expanded confusion map
confusions = {
    "M": ["M", "N", "K", "W", "V"],
    "O": ["O", "D", "Q", "0", "C", "U", "/"],
    "N": ["N", "Z", "M", "H", "R", "P"],
    "K": ["K", "R", "X", "H", "Y", "C"],
    "E": ["R", "K", "E", "M", "F"],
    "R": ["R", "K", "P", "B"],
    "M/K": ["M", "K", "B", "F", "X"],
    "I": ["I", "1", "L", "|"],
    "N/Z": ["N", "Z", "M", "H", "R", "P"],
    "/O": ["O", "0", "D", "Q", "C"],
    "P": ["B", "8", "P", "R"],
    "O/": ["D", "O", "0", "Q"],
    "N/A": ["N", "A", "M", "R"],
    "G": ["G", "6", "C", "Q"],
}

tested = set()
tested_lock = threading.Lock()
stop_flag = threading.Event()


# ---------------------------------------------
# VARIATION GENERATOR
# ---------------------------------------------
def generate_variations(text, max_changes=3):
    variations = [text]

    for num_changes in range(1, max_changes + 1):
        for positions in itertools.combinations(range(len(text)), num_changes):
            char_options = []
            for pos in positions:
                char = text[pos]
                char_options.append(confusions.get(char, [char]))

            for combo in itertools.product(*char_options):
                variant = list(text)
                for i, pos in enumerate(positions):
                    variant[pos] = combo[i]
                yield "".join(variant)


# ---------------------------------------------
# TEST FUNCTION (RUNS IN THREADS)
# ---------------------------------------------
def test_pattern(pattern):
    if stop_flag.is_set():
        return None

    with tested_lock:
        if pattern in tested:
            return None
        tested.add(pattern)
        count = len(tested)
        if count % 100 == 0:
            print(f"✓ Tested {count} patterns so far... (Current: {pattern})")

    result = subprocess.run(
        [sys.executable, "challenge/check_answer.py", pattern],
        capture_output=True,
        text=True
    )

    if result.returncode == 0:
        stop_flag.set()
        return pattern, result.stdout.strip()

    return None


# ---------------------------------------------
# MAIN LOGIC
# ---------------------------------------------
def main():
    print("🚀 Starting brute force attack...")
    print("=" * 60)
    print("Configuration:")
    print(f"  • Max threads: {MAX_THREADS}")
    print(f"  • Max character changes: {MAX_CHANGES}")
    print(f"  • Base patterns: {len(base_patterns)}")
    print("=" * 60)

    # First test base patterns
    print("\n📋 Testing base patterns:")
    for p in base_patterns:
        print(f"  • {p}")
    print()

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:

        # Submit base patterns
        futures = {executor.submit(test_pattern, p): p for p in base_patterns}

        for future in as_completed(futures):
            res = future.result()
            if res:
                pattern, output = res
                print(f"\n🎉 ✅ CORRECT ANSWER FOUND: {pattern}")
                print(output)
                print(f"\n📊 Total patterns tested: {len(tested)}")
                return
            else:
                # Print that we tested this base pattern
                if futures[future] in base_patterns:
                    print(f"❌ {futures[future]}")

        # If none of the base matched → test variations
        print("\n🔄 Generating and testing variations (multithreaded)...")
        print("This may take a while. Progress updates every 100 tests.\n")

        variation_futures = []
        for base in base_patterns:
            print(f"📝 Generating variations for: {base}")
            for var in generate_variations(base, MAX_CHANGES):
                if stop_flag.is_set():
                    break
                variation_futures.append(executor.submit(test_pattern, var))
            if stop_flag.is_set():
                break
        
        print(f"✅ Queued {len(variation_futures)} variations for testing\n")

        # Wait for all variations to complete
        for future in as_completed(variation_futures):
            if stop_flag.is_set():
                print("\n🎉 Match found! Stopping remaining tests...")
                break
            res = future.result()
            if res:
                pattern, output = res
                print(f"\n🎉 ✅ CORRECT ANSWER FOUND: {pattern}")
                print(output)
                print(f"\n📊 Total patterns tested: {len(tested)}")
                return

    print(f"\n❌ No match found after testing {len(tested)} patterns.")
    print("\n💡 Suggestions:")
    print("  1. Double-check your base patterns against the plot")
    print("  2. Consider if some letters might be numbers (0 vs O, 1 vs I)")
    print("  3. Try increasing MAX_CHANGES if needed")
    print("  4. Look for letters that might be: I, L, T, J, V, U")


# ---------------------------------------------
if __name__ == "__main__":
    main()
