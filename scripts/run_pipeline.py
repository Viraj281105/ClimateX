# run_pipeline.py
"""
Orchestrator for the ClimateX ingestion pipeline.
Runs (in order):
 - collect_posts.py
 - preprocess_posts.py
 - sentiment_inference_light.py
 - sentiment_inference_bert.py
 - discover_new_topics.py
 - auto_merge_topics.py  (if logs exist)

Place this script in the same folder as other scripts and run:
  python run_pipeline.py
"""

import subprocess
import sys
import os
import time
from datetime import datetime

# color output (install colorama if not present)
try:
    from colorama import init, Fore
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "colorama"], check=True)
    from colorama import init, Fore

init(autoreset=True)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

SCRIPTS = [
    "collect_posts.py",
    "preprocess_posts.py",
    "sentiment_inference_light.py",
    "sentiment_inference_bert.py",
    "discover_new_topics.py"
]

LOG_FILE = os.path.join(SCRIPT_DIR, f"pipeline_log_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.txt")

summary = {
    "success": [],
    "errors": [],
    "posts_processed": 0,
    "topics_found": 0,
    "topics_merged": 0
}

def run_script(script):
    print(f"{Fore.YELLOW} ▶ Running {script}")
    start = time.time()
    proc = subprocess.run(
        [sys.executable, script],
        capture_output=True,
        text=True,
        cwd=SCRIPT_DIR
    )
    elapsed = time.time() - start

    # write stdout/stderr to log
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"\n--- {script} started at {datetime.now()} ---\n")
        f.write(proc.stdout)
        if proc.stderr:
            f.write("\n--- STDERR ---\n")
            f.write(proc.stderr)

    # parse outputs for quick metrics (best-effort)
    out = proc.stdout + "\n" + proc.stderr
    if "Successfully cleaned and updated" in out:
        try:
            # e.g., "Successfully cleaned and updated 123 multilingual posts."
            part = out.split("Successfully cleaned and updated",1)[1]
            count = int(part.split("posts",1)[0].strip())
            summary["posts_processed"] += count
        except Exception:
            pass
    if "Unique AI-discovered topics" in out or "Unique AI-discovered topics:" in out:
        # best-effort count lines starting with '- '
        try:
            lines = [l.strip() for l in out.splitlines() if l.strip().startswith("- ")]
            summary["topics_found"] += len(lines)
        except Exception:
            pass

    if proc.returncode == 0:
        print(f"{Fore.GREEN} ✔ {script} finished in {elapsed:.1f}s")
        summary["success"].append(script)
    else:
        print(f"{Fore.RED} ✖ {script} failed in {elapsed:.1f}s (see log)")
        summary["errors"].append(script)

for s in SCRIPTS:
    run_script(s)

# Finally run auto_merge_topics.py if logs/ exist
auto_merge = os.path.join(SCRIPT_DIR, "auto_merge_topics.py")
if os.path.exists(os.path.join(SCRIPT_DIR, "logs")) and os.path.exists(auto_merge):
    print(f"{Fore.YELLOW} ▶ Running auto_merge_topics.py")
    proc = subprocess.run([sys.executable, "auto_merge_topics.py"], capture_output=True, text=True, cwd=SCRIPT_DIR)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write("\n--- auto_merge_topics.py ---\n")
        f.write(proc.stdout)
        if proc.stderr:
            f.write("\n--- STDERR ---\n")
            f.write(proc.stderr)

    if proc.returncode == 0:
        print(f"{Fore.GREEN} ✔ auto_merge_topics.py finished")
        # try to get merged count
        if "Successfully merged" in proc.stdout:
            try:
                merged = int(proc.stdout.split("Successfully merged")[1].split("new topics")[0].strip())
                summary["topics_merged"] = merged
            except Exception:
                pass
    else:
        print(f"{Fore.RED} ✖ auto_merge_topics.py failed (see log)")

# Summary
print("\n" + "-"*60)
print("Pipeline summary:")
print(f"  scripts succeeded: {len(summary['success'])}")
print(f"  scripts failed: {len(summary['errors'])}")
print(f"  posts cleaned (approx): {summary['posts_processed']}")
print(f"  new topics discovered (approx): {summary['topics_found']}")
print(f"  topics merged (approx): {summary['topics_merged']}")
print(f"Log saved to: {LOG_FILE}")
print("-"*60 + "\n")
