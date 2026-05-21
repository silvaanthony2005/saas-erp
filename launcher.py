import os
import sys
import time
import signal
import threading
import subprocess
import webbrowser
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

BACKEND_PORT = 8000
FRONTEND_PORT = 3000
BACKEND_URL = f"http://127.0.0.1:{BACKEND_PORT}"
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"

BACKEND_DIR = Path(__file__).parent / "backend"
FRONTEND_DIR = Path(__file__).parent / "frontend"

processes = []


def log(msg: str):
    print(f"[launcher] {msg}", flush=True)


def wait_for_server(url: str, timeout: int = 60, label: str = "server"):
    log(f"Esperando {label} en {url} ...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = Request(url, method="HEAD")
            urlopen(req, timeout=3)
            log(f"{label} listo ({int(time.time() - start)}s)")
            return True
        except URLError:
            time.sleep(1)
    log(f"ERROR: {label} no respondió tras {timeout}s")
    return False


def start_backend():
    log("Iniciando backend FastAPI ...")
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(BACKEND_PORT)],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    processes.append(proc)

    def _pipe():
        for line in iter(proc.stdout.readline, ""):
            print(f"[backend] {line}", end="", flush=True)

    threading.Thread(target=_pipe, daemon=True).start()
    return proc


def start_frontend():
    log("Iniciando frontend Next.js ...")
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    proc = subprocess.Popen(
        [npm, "run", "dev", "--", "-p", str(FRONTEND_PORT)],
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    processes.append(proc)

    def _pipe():
        for line in iter(proc.stdout.readline, ""):
            print(f"[frontend] {line}", end="", flush=True)

    threading.Thread(target=_pipe, daemon=True).start()
    return proc

def cleanup():
    log("Deteniendo servidores ...")
    for proc in processes:
        if proc.poll() is None:
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                               capture_output=True)
            else:
                proc.terminate()
    log("Servidores detenidos.")


def main():
    signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))

    backend_proc = start_backend()
    frontend_proc = start_frontend()

    backend_ok = wait_for_server(f"{BACKEND_URL}/", label="backend")
    frontend_ok = wait_for_server(FRONTEND_URL, label="frontend")

    if not (backend_ok and frontend_ok):
        log("ERROR: No se pudieron iniciar todos los servidores")
        cleanup()
        sys.exit(1)

    log("Ambos servidores activos. Presiona Ctrl+C para detener.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()


if __name__ == "__main__":
    main()
