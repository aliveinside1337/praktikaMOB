import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# backend/main.py -> project root is one folder above backend
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = BASE_DIR / "contactbook.db"

# Важно: чтобы FastAPI не падал, если папку static забыли создать
STATIC_DIR.mkdir(parents=True, exist_ok=True)


def ensure_static_index() -> Path:
    """Возвращает существующий index.html. Если его нет — создает static/index.html."""
    root_index = BASE_DIR / "index.html"
    static_index = STATIC_DIR / "index.html"

    if root_index.exists():
        return root_index
    if static_index.exists():
        return static_index

    # Fallback, чтобы вместо Internal Server Error всегда открывалась страница
    static_index.write_text(
        """<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ContactBook</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div id="phone" class="phone">
    <div style="padding:24px;font-family:Arial,sans-serif">
      <h1>ContactBook</h1>
      <p>Не найден полноценный index.html. Проверьте, что файлы лежат так:</p>
      <pre>static/index.html
static/app.js
static/style.css
backend/main.py</pre>
    </div>
  </div>
  <script src="/static/app.js"></script>
</body>
</html>
""",
        encoding="utf-8",
    )
    return static_index


app = FastAPI(title="ContactBook")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


INITIAL_CONTACTS = [
    {"id": 1, "name": "Алексей Морозов", "phone": "+7 (950) 678-90-12", "email": "alex.morozov@mail.ru", "address": "Нижний Новгород, пл. Минина, 2", "category": "Другое", "favorite": True},
    {"id": 2, "name": "Анна Смирнова", "phone": "+7 (900) 123-45-67", "email": "anna.smirnova@mail.ru", "address": "Москва, ул. Тверская, 10", "category": "Друзья", "favorite": False},
    {"id": 3, "name": "Дмитрий Новиков", "phone": "+7 (930) 456-78-90", "email": "d.novikov@mail.ru", "address": "Казань, ул. Баумана, 5", "category": "Работа", "favorite": False},
    {"id": 4, "name": "Екатерина Волкова", "phone": "+7 (940) 567-89-01", "email": "katya.volkova@mail.ru", "address": "Санкт-Петербург, Невский пр., 12", "category": "Друзья", "favorite": False},
    {"id": 5, "name": "Иван Петров", "phone": "+7 (910) 234-56-78", "email": "ivan.petrov@mail.ru", "address": "Пермь, ул. Ленина, 7", "category": "Работа", "favorite": False},
    {"id": 6, "name": "Мария Козлова", "phone": "+7 (920) 345-67-89", "email": "maria.kozlova@mail.ru", "address": "Самара, ул. Молодежная, 4", "category": "Семья", "favorite": True},
    {"id": 7, "name": "Ольга Соколова", "phone": "+7 (960) 789-01-23", "email": "olga.sokolova@mail.ru", "address": "Воронеж, ул. Кирова, 3", "category": "Семья", "favorite": True},
    {"id": 8, "name": "Сергей Орлов", "phone": "+7 (980) 111-22-33", "email": "sergey.orlov@mail.ru", "address": "Екатеринбург, пр. Мира, 22", "category": "Работа", "favorite": False},
]


class ContactIn(BaseModel):
    name: str
    phone: str
    email: str = ""
    address: str = ""
    category: str = "Другое"
    favorite: bool = False


class SettingsIn(BaseModel):
    data: Dict[str, Any]


class ProfileIn(BaseModel):
    name: str = "Иван Иванов"
    phone: str = "+7 (999) 123-45-67"
    username: str = "ivan_ivan_dev"


def model_to_dict(model):
    # совместимость с pydantic v1 и v2
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_contact(row: sqlite3.Row) -> Dict[str, Any]:
    item = dict(row)
    item["favorite"] = bool(item.get("favorite"))
    return item


def init_db() -> None:
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT DEFAULT '',
                address TEXT DEFAULT '',
                category TEXT NOT NULL DEFAULT 'Другое',
                favorite INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                data TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                username TEXT NOT NULL
            )
            """
        )

        count = conn.execute("SELECT COUNT(*) AS n FROM contacts").fetchone()["n"]
        if count == 0:
            for c in INITIAL_CONTACTS:
                conn.execute(
                    """
                    INSERT INTO contacts (id, name, phone, email, address, category, favorite)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (c["id"], c["name"], c["phone"], c["email"], c["address"], c["category"], int(c["favorite"])),
                )

        conn.execute(
            "INSERT OR IGNORE INTO settings (id, data) VALUES (1, ?)",
            (json.dumps({"notifications": True, "language": "Русский"}, ensure_ascii=False),),
        )
        conn.execute(
            """
            INSERT OR IGNORE INTO profile (id, name, phone, username)
            VALUES (1, 'Иван Иванов', '+7 (999) 123-45-67', 'ivan_ivan_dev')
            """
        )


@app.on_event("startup")
def startup() -> None:
    ensure_static_index()
    init_db()


def serve_index():
    try:
        path = ensure_static_index()
        return FileResponse(str(path))
    except Exception as exc:
        # На всякий случай вместо 500 показываем понятную ошибку
        return HTMLResponse(
            f"<h1>ContactBook</h1><p>Ошибка загрузки index.html:</p><pre>{exc}</pre>",
            status_code=200,
        )


@app.get("/")
def root():
    return serve_index()


@app.get("/index.html")
def index():
    return serve_index()


@app.get("/api/contacts")
def get_contacts() -> List[Dict[str, Any]]:
    with db() as conn:
        rows = conn.execute("SELECT * FROM contacts ORDER BY name COLLATE NOCASE").fetchall()
    return [row_to_contact(r) for r in rows]


@app.post("/api/contacts")
def create_contact(contact: ContactIn) -> Dict[str, Any]:
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO contacts (name, phone, email, address, category, favorite) VALUES (?, ?, ?, ?, ?, ?)",
            (contact.name, contact.phone, contact.email, contact.address, contact.category, int(contact.favorite)),
        )
        row = conn.execute("SELECT * FROM contacts WHERE id = ?", (cur.lastrowid,)).fetchone()
    return row_to_contact(row)


@app.put("/api/contacts/{contact_id}")
def update_contact(contact_id: int, contact: ContactIn) -> Dict[str, Any]:
    with db() as conn:
        exists = conn.execute("SELECT id FROM contacts WHERE id = ?", (contact_id,)).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="Contact not found")
        conn.execute(
            """
            UPDATE contacts
            SET name = ?, phone = ?, email = ?, address = ?, category = ?, favorite = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (contact.name, contact.phone, contact.email, contact.address, contact.category, int(contact.favorite), contact_id),
        )
        row = conn.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,)).fetchone()
    return row_to_contact(row)


@app.delete("/api/contacts/{contact_id}")
def delete_contact(contact_id: int) -> Dict[str, bool]:
    with db() as conn:
        cur = conn.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
    return {"ok": True}


@app.get("/api/settings")
def get_settings() -> Dict[str, Any]:
    with db() as conn:
        row = conn.execute("SELECT data FROM settings WHERE id = 1").fetchone()
    return json.loads(row["data"])


@app.put("/api/settings")
def update_settings(settings: SettingsIn) -> Dict[str, Any]:
    with db() as conn:
        conn.execute(
            "UPDATE settings SET data = ? WHERE id = 1",
            (json.dumps(settings.data, ensure_ascii=False),),
        )
    return settings.data


@app.get("/api/profile")
def get_profile() -> Dict[str, Any]:
    with db() as conn:
        row = conn.execute("SELECT name, phone, username FROM profile WHERE id = 1").fetchone()
    return dict(row)


@app.put("/api/profile")
def update_profile(profile: ProfileIn) -> Dict[str, Any]:
    with db() as conn:
        conn.execute(
            "UPDATE profile SET name = ?, phone = ?, username = ? WHERE id = 1",
            (profile.name, profile.phone, profile.username),
        )
    return model_to_dict(profile)
