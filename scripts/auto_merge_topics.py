import os
import json
import re
from datetime import datetime

# --- Configuration ---
COLLECT_FILE = "collect_posts.py"
LOGS_DIR = "logs"
BACKUP_DIR = "backups"

os.makedirs(BACKUP_DIR, exist_ok=True)

def get_latest_log():
    """Find the latest new_topics_*.json file."""
    files = [f for f in os.listdir(LOGS_DIR) if f.startswith("new_topics_") and f.endswith(".json")]
    if not files:
        print(" No new topics log files found in 'logs/'")
        return None
    latest_file = max(files, key=lambda f: os.path.getmtime(os.path.join(LOGS_DIR, f)))
    return os.path.join(LOGS_DIR, latest_file)

def backup_collect_file():
    """Create a timestamped backup before modifying."""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_path = os.path.join(BACKUP_DIR, f"collect_posts_backup_{timestamp}.py")
    os.system(f'copy "{COLLECT_FILE}" "{backup_path}"')
    print(f" Backup created: {backup_path}")

def extract_current_topics(content: str):
    """Extract current topics list from collect_posts.py."""
    pattern = re.compile(r"TOPICS\s*=\s*\[(.*?)\]", re.DOTALL)
    match = pattern.search(content)
    if not match:
        print(" Could not find TOPICS list in collect_posts.py.")
        return []
    topics_block = match.group(1)
    topics = re.findall(r'"(.*?)"', topics_block)
    return topics

def merge_topics(existing, new):
    """Merge new topics safely (case-insensitive)."""
    merged = list({t.lower(): t for t in existing + new}.values())
    merged.sort()
    return merged

def update_collect_file(new_topics):
    """Read, merge, and rewrite collect_posts.py."""
    with open(COLLECT_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    existing_topics = extract_current_topics(content)
    if not existing_topics:
        print(" No existing topics found. Aborting merge.")
        return

    merged_topics = merge_topics(existing_topics, new_topics)

    # Replace the old list with the updated one
    new_list_str = ", ".join([f'"{t}"' for t in merged_topics])
    updated_content = re.sub(
        r"TOPICS\s*=\s*\[(.*?)\]",
        f"TOPICS = [{new_list_str}]",
        content,
        flags=re.DOTALL
    )

    with open(COLLECT_FILE, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"\n Successfully merged {len(new_topics)} new topics.")
    print(f" Total topics now: {len(merged_topics)}")

def main():
    print("\n Auto-Merging New Topics into collect_posts.py ...")

    latest_log = get_latest_log()
    if not latest_log:
        return

    with open(latest_log, "r", encoding="utf-8") as f:
        new_topics = json.load(f)

    if not new_topics:
        print(" Log file is empty — no topics to merge.")
        return

    backup_collect_file()
    update_collect_file(new_topics)

    print("\n Auto-merge complete! collect_posts.py is now updated with the latest discovered topics.\n")

if __name__ == "__main__":
    main()
