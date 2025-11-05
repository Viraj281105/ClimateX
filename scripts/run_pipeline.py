import subprocess
import sys
import os
import time
from datetime import datetime

# --- Utility for Colored Output ---
try:
    from colorama import init, Fore, Style
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "colorama"])
    from colorama import init, Fore, Style

init(autoreset=True)

# --- Configuration ---
SCRIPTS = [
    "collect_posts.py",
    "preprocess_posts.py",
    "discover_new_topics.py"
]

LOG_FILE = f"pipeline_log_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.txt"

# --- Start Pipeline ---
print(f"\n{Fore.CYAN} Starting ClimateX Automated AI Pipeline...\n")
start_time = time.time()

# --- Data Trackers ---
summary = {
    "success": [],
    "errors": [],
    "topics_found": 0,
    "posts_processed": 0,
    "topics_merged": 0
}

# --- Function to Run Scripts ---
def run_script(script):
    print(f"{Fore.YELLOW} Running {script}...")
    start = time.time()

    result = subprocess.run(
        [sys.executable, script],
        capture_output=True,
        text=True
    )

    duration = time.time() - start

    with open(LOG_FILE, "a", encoding="utf-8") as log:
        log.write(f"\n--- {script} started at {datetime.now()} ---\n")
        log.write(result.stdout)
        if result.stderr:
            log.write("\n Errors:\n" + result.stderr)

    if result.returncode == 0 and not result.stderr:
        print(f"{Fore.GREEN} {script} finished in {duration:.2f}s.\n")
        summary["success"].append(script)
    else:
        print(f"{Fore.RED} {script} had errors (check log). Duration: {duration:.2f}s.\n")
        summary["errors"].append(script)

# --- Execute Each Script Sequentially ---
for script in SCRIPTS:
    run_script(script)

# --- Auto-Merge Step ---
print(f"{Fore.YELLOW} Running auto_merge_topics.py ...")
if os.path.exists("logs"):
    result = subprocess.run(
        [sys.executable, "auto_merge_topics.py"],
        capture_output=True,
        text=True
    )

    with open(LOG_FILE, "a", encoding="utf-8") as log:
        log.write("\n--- auto_merge_topics.py ---\n")
        log.write(result.stdout)
        if result.stderr:
            log.write("\n Errors:\n" + result.stderr)

    # Extract topics merged from stdout
    if "Successfully merged" in result.stdout:
        try:
            count = int(
                [x for x in result.stdout.split("\n") if "Successfully merged" in x][0]
                .split("merged")[1]
                .split("new")[0]
                .strip()
            )
            summary["topics_merged"] = count
        except Exception:
            pass

    print(f"{Fore.GREEN} Auto-merge complete. collect_posts.py updated.\n")
else:
    print(f"{Fore.YELLOW} Skipping auto_merge_topics.py (no logs folder found). Run discover_new_topics.py at least once.\n")

# --- Runtime Summary ---
end_time = time.time()
total_time = end_time - start_time

print(f"{Fore.CYAN}{'-'*60}")
print(f"{Fore.CYAN} ClimateX AI Pipeline Summary ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
print(f"{'-'*60}")

print(f"{Fore.GREEN} Scripts succeeded: {len(summary['success'])}")
for s in summary["success"]:
    print(f"   - {s}")

if summary["errors"]:
    print(f"{Fore.RED} Scripts with errors: {len(summary['errors'])}")
    for s in summary["errors"]:
        print(f"   - {s}")
else:
    print(f"{Fore.GREEN}No script errors detected.")

if summary["topics_merged"]:
    print(f"{Fore.CYAN} Topics merged into dataset: {summary['topics_merged']}")

print(f"{Fore.CYAN} Total runtime: {total_time:.2f} seconds")
print(f"{Fore.CYAN} Log file saved as: {LOG_FILE}")
print(f"{Fore.CYAN}{'-'*60}\n")
