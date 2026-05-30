import os
import random
import uvicorn
from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import create_engine, Column, Integer, String, Boolean, or_
from sqlalchemy.orm import sessionmaker, Session, declarative_base

os.makedirs("templates", exist_ok=True)

engine = create_engine("sqlite:///./contacts.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, default="")
    address = Column(String, default="")
    category = Column(String, default="Работа")
    is_favorite = Column(Boolean, default=False)
    avatar_color = Column(String, default="bg-[#5D9CEC]")

Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    if db.query(Contact).count() == 0:
        db.add_all([
            Contact(name="Алексей Морозов", phone="+7 (950) 678-90-12", email="alex@mail.ru", address="Нижний Новгород", category="Другое", avatar_color="bg-[#5D9CEC]"),
            Contact(name="Анна Смирнова", phone="+7 (900) 123-45-67", category="Друзья", is_favorite=True, avatar_color="bg-[#2ECC71]"),
            Contact(name="Дмитрий Новиков", phone="+7 (930) 456-78-90", category="Работа", avatar_color="bg-[#4FC1E9]"),
            Contact(name="Екатерина Волкова", phone="+7 (940) 567-89-01", category="Друзья", avatar_color="bg-[#48CFAD]"),
            Contact(name="Иван Петров", phone="+7 (910) 234-56-78", category="Работа", avatar_color="bg-[#ED5565]"),
            Contact(name="Мария Козлова", phone="+7 (920) 345-67-89", category="Семья", is_favorite=True, avatar_color="bg-[#4A89DC]"),
        ])
        db.commit()
    db.close()

seed_db()

app = FastAPI()
templates = Jinja2Templates(directory="templates")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# === ВСЕ МАРШРУТЫ ===

@app.get("/", response_class=HTMLResponse)
async def contacts_list(request: Request, category: str = "Все", db: Session = Depends(get_db)):
    query = db.query(Contact)
    if category != "Все": query = query.filter(Contact.category == category)
    contacts = query.order_by(Contact.name).all()
    grouped = {}
    for c in contacts:
        letter = c.name[0].upper() if c.name else "#"
        if letter not in grouped: grouped[letter] = []
        grouped[letter].append(c)
    return templates.TemplateResponse(request=request, name="contacts.html", context={"grouped": grouped, "selected_category": category, "active_tab": "contacts"})

@app.get("/home", response_class=HTMLResponse)
async def home_page(request: Request):
    return templates.TemplateResponse(request=request, name="placeholder.html", context={"title": "Главная", "active_tab": "home"})

@app.get("/categories", response_class=HTMLResponse)
async def categories_page(request: Request):
    return templates.TemplateResponse(request=request, name="placeholder.html", context={"title": "Категории", "active_tab": "categories"})

@app.get("/data", response_class=HTMLResponse)
async def data_page(request: Request):
    return templates.TemplateResponse(request=request, name="placeholder.html", context={"title": "Данные", "active_tab": "data"})

@app.get("/search", response_class=HTMLResponse)
async def search_page(request: Request, q: str = "", db: Session = Depends(get_db)):
    results = db.query(Contact).filter(or_(Contact.name.contains(q), Contact.phone.contains(q))).all() if q else []
    return templates.TemplateResponse(request=request, name="search.html", context={"results": results, "query": q, "total": db.query(Contact).count(), "active_tab": "search"})

@app.get("/add", response_class=HTMLResponse)
async def add_page(request: Request):
    return templates.TemplateResponse(request=request, name="form.html", context={"contact": None, "active_tab": ""})

@app.get("/edit/{contact_id}", response_class=HTMLResponse)
async def edit_page(request: Request, contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    return templates.TemplateResponse(request=request, name="form.html", context={"contact": contact, "active_tab": ""})

@app.post("/save")
async def save(id: str = Form(None), name: str = Form(...), phone: str = Form(...), email: str = Form(""), address: str = Form(""), category: str = Form("Работа"), is_favorite: str = Form(None), db: Session = Depends(get_db)):
    fav = True if is_favorite == "on" else False
    if id and id != "":
        c = db.query(Contact).filter(Contact.id == int(id)).first()
        if c:
            c.name, c.phone, c.email, c.address, c.category, c.is_favorite = name, phone, email, address, category, fav
    else:
        colors = ["bg-[#5D9CEC]", "bg-[#2ECC71]", "bg-[#4FC1E9]", "bg-[#48CFAD]", "bg-[#ED5565]", "bg-[#4A89DC]"]
        db.add(Contact(name=name, phone=phone, email=email, address=address, category=category, is_favorite=fav, avatar_color=random.choice(colors)))
    db.commit()
    return RedirectResponse(url="/", status_code=303)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)