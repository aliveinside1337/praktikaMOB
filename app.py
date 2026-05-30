from flask import Flask, render_template, request, redirect, url_for
import json
import os

app = Flask(__name__)
DATA_FILE = 'contacts.json'


def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except:
            return []


def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


# ГЛАВНЫЙ ЭКРАН (СПИСОК)
@app.route('/')
@app.route('/contacts')
def contacts_list():
    contacts = load_data()
    selected_cat = request.args.get('cat', 'Все')

    # Фильтрация по категории
    if selected_cat != 'Все':
        contacts = [c for c in contacts if c.get('category') == selected_cat]

    contacts = sorted(contacts, key=lambda x: x['name'].upper())

    # Группировка по буквам
    grouped = {}
    for c in contacts:
        first_letter = c['name'][0].upper()
        if first_letter not in grouped:
            grouped[first_letter] = []
        grouped[first_letter].append(c)

    return render_template('contacts.html', grouped=grouped, active_cat=selected_cat)


# ЭКРАН ПОИСКА
@app.route('/search')
def search():
    query = request.args.get('q', '').lower()
    selected_cat = request.args.get('cat', 'Все')
    contacts = load_data()

    results = contacts
    # Сначала фильтруем по поисковому запросу
    if query:
        results = [c for c in results if query in c['name'].lower() or query in c['phone']]

    # Потом фильтруем по выбранной категории
    if selected_cat != 'Все':
        results = [c for c in results if c.get('category') == selected_cat]

    return render_template('search.html', results=results, query=query, active_cat=selected_cat, total=len(results))


# ЭКРАН ДОБАВЛЕНИЯ И РЕДАКТИРОВАНИЯ
@app.route('/edit/<int:cid>', methods=['GET', 'POST'])
@app.route('/add', methods=['GET', 'POST'])
def edit_contact(cid=None):
    contacts = load_data()
    contact = next((c for c in contacts if c['id'] == cid), None)

    if request.method == 'POST':
        data = {
            "id": cid if cid else (max([c['id'] for c in contacts]) + 1 if contacts else 1),
            "name": request.form['name'],
            "phone": request.form['phone'],
            "email": request.form['email'],
            "address": request.form['address'],
            "category": request.form['category'],
            "is_favorite": 'is_favorite' in request.form
        }
        if contact:
            # Обновляем
            for i, c in enumerate(contacts):
                if c['id'] == cid:
                    contacts[i] = data
        else:
            # Добавляем новый
            contacts.append(data)

        save_data(contacts)
        return redirect(url_for('contacts_list'))

    return render_template('form.html', contact=contact)


if __name__ == '__main__':
    app.run(debug=True)