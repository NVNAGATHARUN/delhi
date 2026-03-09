"""
Full Demo Launcher Script
─────────────────────────
This script starts the backend (FastAPI), then triggers demo mode via HTTP.

Steps:
  1. Starts the FastAPI backend on port 8000
  2. Waits for the server to be healthy
  3. Sends a POST request to /demo/start to begin the demo sequence
  4. Prints progress to the console
"""
import subprocess
import time
import sys
import os

# Adjust path to find backend
BACKEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'backend', 'src')
BACKEND_PROC = None

def start_backend():
    global BACKEND_PROC
    print("🚀 Starting FastAPI backend...")
    BACKEND_PROC = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=BACKEND_DIR
    )
    return BACKEND_PROC

def wait_for_server(url="http://localhost:8000", retries=10, delay=2):
    import urllib.request
    print(f"⏳ Waiting for backend at {url}...")
    for i in range(retries):
        try:
            urllib.request.urlopen(url, timeout=3)
            print("✅ Backend is live!")
            return True
        except Exception:
            time.sleep(delay)
    return False

def trigger_demo():
    import urllib.request, urllib.parse
    print("\n🎬 Triggering Demo Mode...")
    req = urllib.request.Request(
        "http://localhost:8000/demo/start",
        data=b"",
        method="POST"
    )
    try:
        res = urllib.request.urlopen(req, timeout=5)
        print(f"✅ Demo started: {res.read().decode()}")
    except Exception as e:
        print(f"❌ Could not trigger demo: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("  Quantum-Enhanced Smart Traffic Optimization System")
    print("           Full Demo Launcher v1.0")
    print("=" * 60)

    # 1. Start backend
    proc = start_backend()

    # 2. Wait for readiness
    if not wait_for_server():
        print("❌ Backend failed to start. Exiting.")
        proc.terminate()
        sys.exit(1)

    # 3. Trigger demo mode
    trigger_demo()

    print("\n📊 Open your browser at http://localhost:3000 to watch the demo.")
    print("   Press Ctrl+C to stop the demo.\n")

    print("🎭 Demo Scenes:")
    print("   [1] Normal low traffic         → Balanced signal optimization")
    print("   [2] N-S congestion builds      → Quantum shifts to NS Green phase")
    print("   [3] Quantum decongestion       → Lane queues cleared")
    print("   [4] 🚨 Ambulance detected!     → Emergency Green Corridor activated")
    print("   [5] Emergency cleared          → Returns to normal optimization\n")

    try:
        proc.wait()
    except KeyboardInterrupt:
        print("\n🛑 Demo terminated by user.")
        proc.terminate()
