"""Запуск проекта.

Если установлены зависимости из requirements.txt, стартует FastAPI backend.
Если uvicorn/FastAPI не установлены, будет запущен простой static-сервер,
чтобы index.html точно открывался и приложение работало через localStorage.
"""
from pathlib import Path

PORT = 8000

try:
    import uvicorn
except ModuleNotFoundError:
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

    ROOT = Path(__file__).resolve().parent

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

    if __name__ == "__main__":
        print(f"ContactBook static server: http://127.0.0.1:{PORT}/index.html")
        ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
else:
    if __name__ == "__main__":
        print(f"ContactBook FastAPI server: http://127.0.0.1:{PORT}/")
        uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=False)
