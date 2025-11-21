import os
import json
import re
from datetime import datetime
import shutil

# ============================================================
# CONFIG
# ============================================================
COLLECT_FILE = "collect_posts.py"
LOGS_DIR = "logs"
BACKUP_DIR = "backups"

os.makedirs(BACKUP_DIR, exist_ok=True)


# ============================================================
# HELPERS
# ============================================================
def get_latest_log():
    """Return the latest topics_*.json or new_topics_*.json file."""
    if not os.path.exists(LOGS_DIR):
        print("No logs directory found.")
        return None

    files = [
        f for f in os.listdir(LOGS_DIR)
        if (f.startswith("topics_") or f.startswith("new_topics_"))
        and f.endswith(".json")
    ]

    if not files:
        print("No topic logs found. Nothing to merge.")
        return None

    latest = max(files, key=lambda f: os.path.getmtime(os.path.join(LOGS_DIR, f)))
    return os.path.join(LOGS_DIR, latest)


def backup_collect_file():
    """Create a timestamped backup of collect_posts.py."""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_path = os.path.join(BACKUP_DIR, f"collect_posts_backup_{timestamp}.py")

    shutil.copy2(COLLECT_FILE, backup_path)
    print("Backup created at:", backup_path)


def extract_current_topics(text: str):
    """
    Extract topics list from collect_posts.py.
    Handles:
        topics = [
        TOPICS = [
    """

    pattern = re.compile(
        r"(topics\s*=\s*\[)(.*?)(\])",
        re.IGNORECASE | re.DOTALL
    )

    match = pattern.search(text)
    if not match:
        print("ERROR: Could not find topics list in collect_posts.py")
        return None, None, None

    prefix = match.group(1)
    list_body = match.group(2)
    suffix = match.group(3)

    # Extract all quoted strings
    found = re.findall(r'"(.*?)"', list_body, flags=re.DOTALL)

    return found, prefix, suffix


def merge_topics(existing, new):
    """Merge new topics case-insensitively while preserving text."""
    mapping = {t.lower(): t for t in existing}

    for t in new:
        t_low = t.lower()
        if t_low not in mapping:
            mapping[t_low] = t

    merged = list(mapping.values())
    merged.sort(key=lambda x: x.lower())
    return merged


def update_collect_file(new_topics):
    """Merge discovered topics into collect_posts.py."""
    with open(COLLECT_FILE, "r", encoding="utf-8") as f:
        original = f.read()

    current, prefix, suffix = extract_current_topics(original)
    if current is None:
        return

    merged = merge_topics(current, new_topics)

    # Format updated list
    formatted_topics = ",\n    ".join(f'"{t}"' for t in merged)
    replacement = f"{prefix}\n    {formatted_topics}\n{suffix}"

    updated = re.sub(
        r"(topics\s*=\s*\[)(.*?)(\])",
        replacement,
        original,
        flags=re.IGNORECASE | re.DOTALL
    )

    with open(COLLECT_FILE, "w", encoding="utf-8") as f:
        f.write(updated)

    print("Merge complete. New topics added:", len(new_topics))
    print("Total topics now:", len(merged))


# ============================================================
# MAIN
# ============================================================
def main():
    print("\nStarting topic auto-merge...\n")

    log_file = get_latest_log()
    if not log_file:
        return

    with open(log_file, "r", encoding="utf-8") as f:
        new_topics = json.load(f)

    if not new_topics:
        print("Log file contains no topics.")
        return

    backup_collect_file()
    update_collect_file(new_topics)

    print("\nAuto-merge finished.\n")


if __name__ == "__main__":
    main()
