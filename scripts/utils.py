import sys

def safe_print(msg):
    """Print safely even if the terminal can't handle emojis."""
    try:
        print(msg)
    except UnicodeEncodeError:
        # Replace unprintable characters
        encoded = msg.encode(sys.stdout.encoding, errors="replace")
        print(encoded.decode(sys.stdout.encoding))
