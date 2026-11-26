#!/usr/bin/env python3
"""Start the local StepByStep server and open the home page."""
from pathlib import Path
import subprocess
import sys
import time
import webbrowser

ROOT = Path(__file__).resolve().parent
URL = "http://127.0.0.1:5000"


def main():
    process = subprocess.Popen([sys.executable, str(ROOT / "app.py")], cwd=ROOT)
    try:
        time.sleep(1)
        if process.poll() is not None:
            raise RuntimeError("Сервер завершился при запуске. Проверьте Flask и порт 5000.")
        print(f"StepByStep доступен: {URL}")
        webbrowser.open(URL)
        process.wait()
    except KeyboardInterrupt:
        print("\nОстанавливаю сервер…")
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == "__main__":
    main()
