const CAT = {
  'Семья': {key:'family', color:'#ff3f72', icon:'👨‍👩‍👧‍👦'},
  'Друзья': {key:'friends', color:'#8a4dff', icon:'👥'},
  'Работа': {key:'work', color:'#00a6ff', icon:'🏢'},
  'Другое': {key:'other', color:'#ff9f1c', icon:'🎫'}
};
const initialContacts = [
 {id:1,name:'Алексей Морозов',phone:'+7 (950) 678-90-12',email:'alex.morozov@mail.ru',address:'Нижний Новгород, пл. Минина, 2',category:'Другое',favorite:true,createdAt:'2026-01-03'},
 {id:2,name:'Анна Смирнова',phone:'+7 (900) 123-45-67',email:'anna.smirnova@mail.ru',address:'Москва, ул. Тверская, 10',category:'Друзья',favorite:false,createdAt:'2026-01-05'},
 {id:3,name:'Дмитрий Новиков',phone:'+7 (930) 456-78-90',email:'d.novikov@mail.ru',address:'Казань, ул. Баумана, 5',category:'Работа',favorite:false,createdAt:'2026-01-10'},
 {id:4,name:'Екатерина Волкова',phone:'+7 (940) 567-89-01',email:'katya.volkova@mail.ru',address:'Санкт-Петербург, Невский пр., 12',category:'Друзья',favorite:false,createdAt:'2026-01-12'},
 {id:5,name:'Иван Петров',phone:'+7 (910) 234-56-78',email:'ivan.petrov@mail.ru',address:'Пермь, ул. Ленина, 7',category:'Работа',favorite:false,createdAt:'2026-01-16'},
 {id:6,name:'Мария Козлова',phone:'+7 (920) 345-67-89',email:'maria.kozlova@mail.ru',address:'Самара, ул. Молодежная, 4',category:'Семья',favorite:true,createdAt:'2026-01-20'},
 {id:7,name:'Ольга Соколова',phone:'+7 (960) 789-01-23',email:'olga.sokolova@mail.ru',address:'Воронеж, ул. Кирова, 3',category:'Семья',favorite:true,createdAt:'2026-01-21'},
 {id:8,name:'Сергей Орлов',phone:'+7 (980) 111-22-33',email:'sergey.orlov@mail.ru',address:'Екатеринбург, пр. Мира, 22',category:'Работа',favorite:false,createdAt:'2026-02-01'}
];

const API_BASE = location.protocol === 'http:' || location.protocol === 'https:' ? '' : null;
async function syncFromApi(){
  if(!API_BASE) return;
  try{
    const r = await fetch('/api/contacts');
    if(!r.ok) return;
    const list = await r.json();
    if(Array.isArray(list) && list.length){ saveContacts(list); render(); }
  }catch(e){}
}
async function apiSaveContact(data, id=null){
  if(!API_BASE) return;
  try{
    await fetch(id ? `/api/contacts/${id}` : '/api/contacts', {
      method: id ? 'PUT' : 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    syncFromApi();
  }catch(e){}
}
async function apiDeleteContact(id){
  if(!API_BASE) return;
  try{ await fetch(`/api/contacts/${id}`, {method:'DELETE'}); }catch(e){}
}

let state = { route:'home', filter:'Все', onlyFavorites:false, searchFilter:'Все', query:'', category:'Семья', formMode:'new', editId:null, formCategory:'Работа' };
function load(){
  const saved = localStorage.getItem('contactbook.contacts');
  if(!saved) localStorage.setItem('contactbook.contacts', JSON.stringify(initialContacts));
  return JSON.parse(localStorage.getItem('contactbook.contacts'));
}
function saveContacts(list){ localStorage.setItem('contactbook.contacts', JSON.stringify(list)); }
function contacts(){ return load(); }
function initials(n){ return n.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || '?'; }
function avatarClass(n){ const m=['bg-violet','bg-green','bg-cyan','bg-pink','bg-blue','bg-brown','bg-red','bg-orange','bg-teal','bg-indigo','bg-lime','bg-rose','bg-slate','bg-gold']; let s=0; for(const ch of n)s+=ch.charCodeAt(0); return m[s%m.length]; }
function avatarColor(n){ return {'bg-violet':'#7b77f1','bg-green':'#31c665','bg-cyan':'#12c7bc','bg-pink':'#ef518e','bg-blue':'#6574f4','bg-brown':'#bd8158','bg-red':'#ff5a66','bg-orange':'#ff9f1c','bg-teal':'#17bebb','bg-indigo':'#5267df','bg-lime':'#88c43d','bg-rose':'#d94f91','bg-slate':'#607d8b','bg-gold':'#d6a21e'}[avatarClass(n)] || '#4a8ef7'; }
function counts(){ const cs=contacts(); return ['Семья','Друзья','Работа','Другое'].reduce((a,c)=>(a[c]=cs.filter(x=>x.category===c).length,a),{}); }
function toast(t){ const el=document.getElementById('toast'); el.textContent=t; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1600); }
function setRoute(r, extra={}){ Object.assign(state, extra); state.route=r; render(); }
function nav(active){
  const items=[['home','🏠','Главная'],['contacts','👥','Контакты'],['search','🔍','Поиск'],['categories','🗂️','Категории'],['data','📦','Данные']];
  const host=document.getElementById('global-nav');
  if(host) host.innerHTML = `<nav class="bottom-nav">${items.map(i=>`<button class="nav-btn ${active===i[0]?'active':''}" onclick="setRoute('${i[0]}')"><span class="nav-ico">${i[1]}</span><span>${i[2]}</span></button>`).join('')}</nav>`;
  return '';
}
function hero(title, sub, type){ return `<div class="hero ${type==='cat'?'cat-hero':''}"><button class="gear" onclick="setRoute('settings')">⚙️</button><h1 style="margin-top:${type?'28px':'0'}">${title}</h1><p>${sub}</p>${type==='data'?'<div class="box-icon"></div>':'<div class="big-folder"></div>'}</div>`; }
function renderHome(){ const cs=contacts(), c=counts(), fav=cs.filter(x=>x.favorite).sort((a,b)=>Number(b.id||0)-Number(a.id||0)).slice(0,3); const max=cs.length||1;
 document.getElementById('home').innerHTML=`
 <div class="hero"><button class="gear" onclick="setRoute('settings')">⚙️</button><h4>Добро пожаловать!</h4><h1>ContactBook</h1><p>Ваша личная адресная книга</p>
 <div class="stats"><button class="stat" onclick="setRoute('contacts',{filter:'Все',onlyFavorites:false,query:''})"><span class="ico">👥</span><span class="num">${cs.length}</span><span class="lbl">Всего</span></button><button class="stat" onclick="setRoute('contacts',{filter:'Все',onlyFavorites:true,query:''})"><span class="ico">⭐</span><span class="num">${cs.filter(x=>x.favorite).length}</span><span class="lbl">Избранные</span></button><button class="stat" onclick="setRoute('categories')"><span class="ico">📁</span><span class="num">4</span><span class="lbl">Категории</span></button></div></div>
 <div class="content"><h3 class="section-title">Быстрые действия</h3><div class="quick-grid"><button class="quick add" onclick="openNew('Работа')"><span class="qico">➕</span><span>Добавить контакт</span></button><button class="quick all" onclick="setRoute('contacts',{filter:'Все',onlyFavorites:false,query:''})"><span class="qico">📋</span><span>Все контакты</span></button><button class="quick cats" onclick="setRoute('categories')"><span class="qico">📁</span><span>По категориям</span></button><button class="quick data" onclick="setRoute('data')"><span class="qico">📥</span><span>Импорт/Экспорт</span></button></div>
 <h3 class="section-title" style="margin-top:18px">По категориям</h3><div class="category-progress">${['Семья','Друзья','Работа','Другое'].map(k=>`<div class="prog-row"><span>${k}</span><div class="bar"><div class="fill" style="width:${c[k]/max*100}%;background:${CAT[k].color}"></div></div><span>${c[k]} / ${Math.round(c[k]/max*100)}%</span></div>`).join('')}</div>
 <div class="fav-head"><h3 class="section-title" style="margin:0">⭐Избранные</h3><a onclick="setRoute('contacts',{filter:'Все',onlyFavorites:true,query:''})">Все</a></div><div class="fav-list">${fav.map(x=>`<div class="fav-person"><div class="avatar ${avatarClass(x.name)}">${initials(x.name)}</div><div>${x.name.split(' ')[0]}</div></div>`).join('')}</div></div>${nav('home')}`;
}
function contactCard(x){return `<div class="contact-card" onclick="openEdit(${x.id})"><div class="avatar ${avatarClass(x.name)}">${initials(x.name)}</div><div class="c-info"><div class="c-name">${x.name}${x.favorite?' ⭐':''}</div><div class="c-phone">${x.phone}</div></div><span class="cat-badge badge-${CAT[x.category].key}">${x.category}</span><span class="dots">•••</span></div>`}
function getFilteredContacts(){
 const q=(state.query||'').toLowerCase();
 return contacts()
   .filter(x=>!state.onlyFavorites || x.favorite)
   .filter(x=>state.filter==='Все'||x.category===state.filter)
   .filter(x=>!q || [x.name,x.phone,x.email,x.address].some(v=>String(v||'').toLowerCase().includes(q)))
   .sort((a,b)=>a.name.localeCompare(b.name,'ru'));
}
function renderContactList(){
 const host=document.getElementById('contacts-list'); if(!host) return;
 const list=getFilteredContacts(); let groups={}; list.forEach(x=>{let l=x.name[0].toUpperCase(); (groups[l]??=[]).push(x)});
 host.innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([l,arr])=>`<div class="letter">${l}</div>${arr.map(contactCard).join('')}`).join('') : `<div class="no-results">${state.onlyFavorites?'Избранные контакты не найдены':'Контакты не найдены'}</div>`;
}
function handleContactsInput(el){ state.query=el.value; renderContactList(); }
function renderContacts(){
 state.query=''; document.getElementById('contacts').innerHTML=`<div class="main-head"><h2>${state.onlyFavorites?'⭐ Избранные':'Контакты'}</h2><button class="plus" onclick="openNew('Работа')">+</button></div>${state.onlyFavorites?'<div class="fav-mode-note"><span>Показаны только избранные</span><button onclick="state.onlyFavorites=false;state.filter=\'Все\';renderContacts()">Все контакты</button></div>':''}<div class="chips contacts-chips">${['Все','Семья','Друзья','Работа','Другое'].map(c=>`<button class="chip ${state.filter===c?'active':''}" onclick="state.filter='${c}';renderContacts()">${c}</button>`).join('')}</div><div id="contacts-list"></div>${nav('contacts')}`;
 renderContactList();
}
function renderCategories(){ const cs=contacts(), c=counts(), selected=state.category||'Семья', list=cs.filter(x=>x.category===selected), meta=CAT[selected];
 document.getElementById('categories').innerHTML=`${hero('Категории',`${cs.length} контактов - 4 категории`,'cat')}<div class="content"><div class="cat-grid">${['Семья','Друзья','Работа','Другое'].map(k=>`<button onclick="state.category='${k}';renderCategories()" class="cat-tile ${CAT[k].key} ${selected===k?'active':'muted'}"><span class="emoji">${CAT[k].icon}</span><span class="count">${c[k]}</span><span class="label">${k}</span></button>`).join('')}</div><div class="chosen-title">${meta.icon} <span style="color:${meta.color}">${selected}</span> (${list.length})</div><div class="category-contact-list">${list.map(x=>`<div class="mini-contact" onclick="openEdit(${x.id})"><div class="avatar ${avatarClass(x.name)}">${initials(x.name)}</div><div class="c-info"><div class="c-name">${x.name}${x.favorite?' ⭐':''}</div><div class="c-phone">${x.phone}</div></div></div>`).join('') || '<div style="font-size:12px;font-weight:800;padding:8px;color:#8f96a3">Нет контактов</div>'}</div><div class="ribbon" style="color:${meta.color};background:linear-gradient(90deg, ${meta.color}55, ${meta.color}22)"><span>${meta.icon} ${selected}</span><span>${list.length}</span></div><div class="mini-chips">${list.map(x=>`<div class="mini-card"><div class="avatar ${avatarClass(x.name)}">${initials(x.name)}</div>${x.name.split(' ')[0]}</div>`).join('')}</div></div>${nav('categories')}`;
}
function renderData(){ const cs=contacts(), c=counts();
 document.getElementById('data').innerHTML=`${hero('Импорт/Экспорт','Управление данными контактов','data')}<div class="content"><div class="data-stat"><div class="big">${cs.length}</div><div class="desc">Контактов в адресной строке</div><div class="tiny">👨‍👩‍👧‍👦 Семья: ${c['Семья']} &nbsp;&nbsp; 👥 Друзья: ${c['Друзья']} &nbsp;&nbsp; 💼 Работа:${c['Работа']}</div></div><div class="data-section">📤 &nbsp;Экспорт данных</div><button class="action-row json" onclick="exportData('json')"><span class="row-ico">📄</span><div><div class="title">Экспорт в JSON</div><div class="sub">для резервного копирования и переноса</div></div></button><button class="action-row csv" onclick="exportData('csv')"><span class="row-ico">📊</span><div><div class="title">Экспорт в CSV</div><div class="sub">для Excel и таблиц</div></div></button><button class="action-row vcard" onclick="exportData('vcf')"><span class="row-ico">📱</span><div><div class="title">Экспорт в vCard</div><div class="sub">для импорта в телефон</div></div></button><div class="data-section" style="margin-top:19px">📥 &nbsp;Импорт данных</div><button class="action-row import" onclick="document.getElementById('file').click()"><span class="row-ico">🗂️</span><div><div class="title">Выбрать JSON файл</div><div class="sub">импорт контактов из резервной копии</div></div></button><input id="file" class="hidden-file" type="file" accept="application/json" onchange="importFile(this)"></div>${nav('data')}`;
}
function openNew(cat){ state.formMode='new'; state.editId=null; state.formCategory=cat||'Работа'; setRoute('form'); }
function openEdit(id){ state.formMode='edit'; state.editId=id; const x=contacts().find(c=>c.id===id); state.formCategory=x?.category||'Другое'; setRoute('form'); }
function renderForm(){ const edit=state.formMode==='edit', x=edit?contacts().find(c=>c.id===state.editId):null; const v=x||{name:'',phone:'',email:'',address:'',favorite:true,category:state.formCategory};
 document.getElementById('form').innerHTML=`<div class="header"><button class="back" onclick="setRoute('${edit?'contacts':'home'}')">←</button><h2>${edit?'Редактировать':'Новый контакт'}</h2><button class="save" onclick="saveForm()">Сохранить</button></div><div class="form-body"><div class="avatar-big" style="${edit?`background:${avatarColor(v.name)}`:''}">${edit?initials(v.name):'?'}<button class="camera">📷</button></div><div class="field-label">Имя <span class="req">*</span></div><input id="f-name" class="input" value="${escapeHtml(v.name)}" placeholder="Иван Иванов"><div class="field-label">📞 Телефон <span class="req">*</span></div><input id="f-phone" class="input" value="${escapeHtml(v.phone)}" placeholder="+7 (999) 000-00-00"><div class="field-label">✉ Email</div><input id="f-email" class="input" value="${escapeHtml(v.email)}" placeholder="example@mail.ru"><div class="field-label">📍 Адрес</div><textarea id="f-address" class="input textarea" placeholder="Город, улица, дом...">${escapeHtml(v.address)}</textarea><div class="field-label">🗂 Категория</div><div class="cat-buttons">${['Семья','Друзья','Работа','Другое'].map(k=>`<button class="cat-btn ${CAT[k].key} ${state.formCategory===k?'active':''}" onclick="state.formCategory='${k}';renderForm()">${k}</button>`).join('')}</div><div class="fav-toggle-box"><div class="txt"><div class="top">⭐ Избранный</div><div class="bottom">Добавить в избранное</div></div><button id="f-fav" data-on="${v.favorite?'1':'0'}" class="switch ${v.favorite?'on':''}" onclick="this.dataset.on=this.dataset.on==='1'?'0':'1';this.classList.toggle('on')"></button></div>${edit?'<button class="danger" onclick="deleteContact()">Удалить контакт</button>':''}</div>`;
}
function escapeHtml(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function saveForm(){ const name=document.getElementById('f-name').value.trim(), phone=document.getElementById('f-phone').value.trim(); if(!name||!phone){toast('Заполните имя и телефон');return} let list=contacts(); const data={name,phone,email:document.getElementById('f-email').value.trim(),address:document.getElementById('f-address').value.trim(),category:state.formCategory,favorite:document.getElementById('f-fav').dataset.on==='1',updatedAt:new Date().toISOString()}; if(state.formMode==='edit'){list=list.map(x=>x.id===state.editId?{...x,...data}:x);apiSaveContact(data,state.editId);toast('Контакт сохранён')}else{data.id=Math.max(0,...list.map(x=>x.id))+1;data.createdAt=new Date().toISOString();list.push(data);apiSaveContact(data);toast('Контакт добавлен')} saveContacts(list); setTimeout(()=>setRoute('contacts'),250); }
function deleteContact(){ if(confirm('Удалить контакт?')){ apiDeleteContact(state.editId); saveContacts(contacts().filter(x=>x.id!==state.editId)); setRoute('contacts'); }}
function renderSearchResults(){
 const host=document.getElementById('search-dynamic'); if(!host) return;
 let has=state.query.trim().length>0; const q=state.query.toLowerCase();
 let list=contacts().filter(x=>state.searchFilter==='Все'||x.category===state.searchFilter).filter(x=>[x.name,x.phone,x.email,x.address].some(v=>String(v||'').toLowerCase().includes(q)));
 host.innerHTML = has ? `<div class="search-results">${list.map(contactCard).join('')||'<div class="no-results">Ничего не найдено</div>'}</div>` : `<div class="search-empty"><div class="big-search">🔎</div><h3>Начните поиск</h3><p>Введите имя, телефон, email или адрес</p><div>Всего контактов: 6</div></div>`;
}
function handleSearchInput(el){ state.query=el.value; renderSearchResults(); }
function renderSearch(){
 document.getElementById('search').innerHTML=`<div class="main-head"><h2>🔍 Поиск</h2></div><label class="searchbar">🔍<input placeholder="Поиск по имени, телефону, email..." value="${escapeHtml(state.query)}" oninput="handleSearchInput(this)"></label><div class="chips">${['Все','Семья','Друзья','Работа','Другое'].map(c=>`<button class="chip ${state.searchFilter===c?'active':''}" onclick="state.searchFilter='${c}';renderSearch()">${c}</button>`).join('')}</div><div id="search-dynamic"></div>${nav('search')}`;
 renderSearchResults();
}
function renderSettings(){
 const old=document.querySelector('.phone'); old.classList.add('settings-page');
 document.getElementById('settings').innerHTML=`
  <div class="header"><button class="back" onclick="document.querySelector('.phone').classList.remove('settings-page');setRoute('home')">←</button><h2>Настройки</h2></div>
  <div class="settings-body simple-settings">
    <div class="settings-card profile-simple">
      <div class="mini-avatar">ИИ</div>
      <div class="s-text"><div class="s-main">Иван Иванов</div><div class="s-sub">+7 (999) 123-45-67</div></div>
    </div>

    <div class="settings-section">Основное</div>
    <div class="settings-card"><div class="icon">🔔</div><div class="s-text"><div class="s-main">Уведомления</div><div class="s-sub">Показывать системные уведомления</div></div><button class="switch on" onclick="this.classList.toggle('on')"></button></div>
    <div class="settings-card"><div class="icon">🌐</div><div class="s-text"><div class="s-main">Язык</div><div class="s-sub">Язык интерфейса приложения</div></div><span class="value">Русский</span></div>
    <div class="settings-card" onclick="toast('Дубликаты не найдены')"><div class="icon">👥</div><div class="s-text"><div class="s-main">Проверить дубликаты</div><div class="s-sub">Быстрая проверка контактов</div></div><div class="arrow">→</div></div>
  </div>`;
}
function render(){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); if(state.route!=='settings') document.querySelector('.phone').classList.remove('settings-page'); const gh=document.getElementById('global-nav'); if(gh && (state.route==='form'||state.route==='settings')) gh.innerHTML=''; document.getElementById(state.route).classList.add('active'); if(state.route==='home')renderHome(); if(state.route==='contacts')renderContacts(); if(state.route==='categories')renderCategories(); if(state.route==='data')renderData(); if(state.route==='form')renderForm(); if(state.route==='search')renderSearch(); if(state.route==='settings')renderSettings(); }
function download(name, text, type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
function downloadBytes(name, bytes, type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([bytes],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
function encodeWindows1251(str){
  const map = {'Ё':0xA8,'ё':0xB8,'№':0xB9,'«':0xAB,'»':0xBB,'–':0x96,'—':0x97,'’':0x92,'“':0x93,'”':0x94,'…':0x85};
  const bytes=[];
  for(const ch of str){
    const code=ch.charCodeAt(0);
    if(code < 128) bytes.push(code);
    else if(ch in map) bytes.push(map[ch]);
    else if(code >= 0x0410 && code <= 0x044F) bytes.push(code - 0x0410 + 0xC0);
    else bytes.push(0x3F);
  }
  return new Uint8Array(bytes);
}
function exportData(fmt){ const list=contacts(); if(fmt==='json') download('contacts.json',JSON.stringify(list,null,2),'application/json'); if(fmt==='csv'){
    const rows=[['id','name','phone','email','address','category','favorite'],...list.map(x=>[x.id,x.name,x.phone,x.email,x.address,x.category,x.favorite])];
    // Для русского Excel надежнее Windows-1251 + разделитель ;
    const csv='sep=;\r\n'+rows.map(r=>r.map(v=>'"'+String(v ?? '').replaceAll('"','""')+'"').join(';')).join('\r\n');
    downloadBytes('contacts.csv', encodeWindows1251(csv), 'text/csv;charset=windows-1251');
  } if(fmt==='vcf'){ download('contacts.vcf',list.map(x=>`BEGIN:VCARD\nVERSION:3.0\nFN:${x.name}\nTEL:${x.phone}\nEMAIL:${x.email}\nADR:${x.address}\nEND:VCARD`).join('\n'),'text/vcard'); } toast('Файл экспортирован'); }
function importFile(inp){ const file=inp.files[0]; if(!file)return; const r=new FileReader(); r.onload=()=>{ try{ const arr=JSON.parse(r.result); if(!Array.isArray(arr))throw new Error(); const base=contacts(); let max=Math.max(0,...base.map(x=>x.id)); const normalized=arr.map(x=>({...x,id:x.id||++max,category:CAT[x.category]?x.category:'Другое',favorite:!!x.favorite})); saveContacts(normalized); toast('Контакты импортированы'); renderData(); }catch(e){toast('Ошибка JSON файла')} }; r.readAsText(file); }
render();
syncFromApi();
