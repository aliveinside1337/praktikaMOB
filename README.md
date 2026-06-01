# Contact Manager API

## Описание
Мобильное веб-приложение для управления контактами с поиском, группировкой и избранным.

## Технологии
*   **Backend**: FastAPI (Python)
*   **Database**: SQLite (SQLAlchemy)
*   **Frontend**: HTML, CSS (Tailwind), JavaScript

## Установка и запуск
1. `pip install fastapi uvicorn sqlalchemy jinja2 python-multipart`
2. `uvicorn main:app --reload`
3. Открыть в браузере `http://127.0.0.1:8000/`

## Основные функции
*   Добавление/редактирование/удаление контактов
*   Поиск по имени и телефону
*   Фильтрация по категориям (Семья, Друзья, Работа)
*   Работа в оффлайн-режиме с базой SQLite
