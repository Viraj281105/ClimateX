import subprocess
import sys
from datetime import datetime
import os

# --- Configuration ---
SCRIPTS = [
    "collect_posts.py",
    "preprocess_posts.py",
    "discover_new_topics.py"
]

LOG_FILE = f"pipeline_log_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.txt"

print("\n🚀 Starting ClimateX Automated Pipeline...\n")

with open(LOG_FILE, "w", encoding="utf-8") as log:
    for script in SCRIPTS:
        print(f"▶️ Running {script}...")
        log.write(f"\n--- {script} started at {datetime.now()} ---\n")

        try:
            result = subprocess.run(
                [sys.executable, script],
                capture_output=True,
                text=True
            )
            log.write(result.stdout)
            if result.stderr:
                log.write("\n⚠️ Errors:\n" + result.stderr)
            print(f"✅ {script} finished.\n")
        except Exception as e:
            error_msg = f"❌ Error running {script}: {e}\n"
            print(error_msg)
            log.write(error_msg)

# --- 4️⃣ Run Auto-Merge (only if logs folder exists) ---
if os.path.exists("logs"):
    print("▶️ Running auto_merge_topics.py ...")
    subprocess.run([sys.executable, "auto_merge_topics.py"])
    print("✅ Auto-merge complete. collect_posts.py updated.\n")
else:
    print("⚠️ Skipping auto_merge_topics.py (no logs folder found). Run discover_new_topics.py at least once.\n")

print("🌿 All scripts executed. Check MongoDB and logs for details.")
print(f"🧾 Pipeline log saved as: {LOG_FILE}")
