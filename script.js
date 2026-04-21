let mode = localStorage.getItem('mode') || 'bureau';
let favs = JSON.parse(localStorage.getItem('favs') || '[]');
let clics = JSON.parse(localStorage.getItem('clics') || '{}');
let customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
let activeFilters = JSON.parse(localStorage.getItem('activeFilters') || '{}');
let favOnly = localStorage.getItem('favOnly') === 'true';

window.onload = () => { 
    renderCustomTools();
    initUI(); 
    setMode(mode); 
    document.getElementById('mainGrid').style.visibility = "visible";
};

function initUI() {
    document.querySelectorAll('.btn-3d[data-id]').forEach(btn => {
        const id = btn.dataset.id;
        btn.querySelector('.count-badge').innerText = clics[id] || 0;
        btn.querySelector('.btn-star').classList.toggle('active', favs.includes(id));
    });
    sortGrid();
}

function setMode(m) {
    mode = m;
    localStorage.setItem('mode', m);
    document.querySelectorAll('.config-btn').forEach(b => b.classList.remove('active'));
    const btnId = 'btn' + m.charAt(0).toUpperCase() + m.slice(1);
    if(document.getElementById(btnId)) document.getElementById(btnId).classList.add('active');
    
    const filtersGroup = document.getElementById('filtersGroup');
    if (m === 'bureau') {
        filtersGroup.innerHTML = `
            <label class="tag-label"><input type="checkbox" onchange="toggleTag('admin')" ${activeFilters['admin']?'checked':''}> 💼 ADMIN</label>
            <label class="tag-label"><input type="checkbox" onchange="toggleTag('compta')" ${activeFilters['compta']?'checked':''}> 📂 COMPTA</label>
            <label class="tag-label"><input type="checkbox" onchange="toggleTag('recherche')" ${activeFilters['recherche']?'checked':''}> 🔍 RECHERCHE</label>
        `;
    } else if (m === 'creative') {
        filtersGroup.innerHTML = `
            <label class="tag-label"><input type="checkbox" onchange="toggleTag('video')" ${activeFilters['video']?'checked':''}> 🎬 VIDÉO</label>
            <label class="tag-label"><input type="checkbox" onchange="toggleTag('texte')" ${activeFilters['texte']?'checked':''}> ✍️ TEXTE</label>
            <label class="tag-label"><input type="checkbox" onchange="toggleTag('radio')" ${activeFilters['radio']?'checked':''}> 📻 RADIO</label>
        `;
    } else {
        filtersGroup.innerHTML = `<span style="font-size:10px; opacity:0.5">Tes liens personnalisés</span>`;
    }
    document.getElementById('btnAddPerso').classList.toggle('hidden', m !== 'perso');
    applyFilters();
}

function handleTool(btn) {
    const id = btn.dataset.id;
    if (event.target.closest('.btn-star')) {
        favs.includes(id) ? favs = favs.filter(f => f !== id) : favs.push(id);
        localStorage.setItem('favs', JSON.stringify(favs));
        btn.querySelector('.btn-star').classList.toggle('active');
        applyFilters();
        return;
    }
    clics[id] = (clics[id] || 0) + 1;
    localStorage.setItem('clics', JSON.stringify(clics));
    btn.querySelector('.count-badge').innerText = clics[id];
    sortGrid();
    if (btn.dataset.url) window.open(btn.dataset.url, id); 
}

function openIframe(id, btn) {
    if (event.target.closest('.btn-star')) { handleTool(btn); return; }
    document.getElementById(id).style.display = 'block';
    clics[btn.dataset.id] = (clics[btn.dataset.id] || 0) + 1;
    localStorage.setItem('clics', JSON.stringify(clics));
    btn.querySelector('.count-badge').innerText = clics[btn.dataset.id];
    sortGrid();
}

function closeIframe(id) { document.getElementById(id).style.display = 'none'; }
function openTool(id) { document.getElementById(id).style.display = 'flex'; }
function closeTool(id) { document.getElementById(id).style.display = 'none'; }

function sortGrid() {
    const grid = document.getElementById('mainGrid');
    const btns = Array.from(grid.querySelectorAll('.btn-3d[data-id]'));
    btns.sort((a, b) => (clics[b.dataset.id] || 0) - (clics[a.dataset.id] || 0));
    btns.forEach(b => grid.appendChild(b));
    grid.appendChild(document.getElementById('btnAddPerso'));
}

function toggleTag(t) {
    activeFilters[t] = !activeFilters[t];
    localStorage.setItem('activeFilters', JSON.stringify(activeFilters));
    applyFilters();
}

function toggleFavFilter() {
    favOnly = !favOnly;
    localStorage.setItem('favOnly', favOnly);
    document.getElementById('favFilterMain').innerText = favOnly ? '★' : '☆';
    applyFilters();
}

function applyFilters() {
    const selectedTags = Object.keys(activeFilters).filter(k => activeFilters[k]);
    document.querySelectorAll('.btn-3d[data-id]').forEach(btn => {
        const bMain = btn.dataset.main || 'custom';
        const bTags = btn.dataset.tags || '';
        let show = (mode === bMain || (mode === 'perso' && bMain === 'custom'));
        if (selectedTags.length > 0 && !selectedTags.some(t => bTags.includes(t))) show = false;
        if (favOnly && !favs.includes(btn.dataset.id)) show = false;
        btn.classList.toggle('hidden', !show);
    });
}

function addNewTool() {
    let t = document.getElementById('newTitle').value, u = document.getElementById('newUrl').value;
    let i = document.getElementById('newIcon').value || '🔗';
    let c = document.getElementById('newColor').value || 'btn-purple';
    if(!t || !u) return;
    u = u.startsWith('http') ? u : 'https://' + u;
    customTools.push({ id: 'c-'+Date.now(), title: t, url: u, tags: 'custom', icon: i, color: c });
    localStorage.setItem('customTools', JSON.stringify(customTools));
    location.reload();
}

function renderCustomTools() {
    customTools.forEach(t => {
        const b = document.createElement('button'); 
        b.className = 'btn-3d ' + (t.color || 'btn-purple');
        b.dataset.id = t.id; b.dataset.tags = t.tags; b.dataset.url = t.url; b.dataset.main = 'perso';
        b.onclick = () => handleTool(b);
        b.innerHTML = `
            <div class="btn-del" onclick="deleteTool('${t.id}')">🗑️</div>
            <div class="btn-star">★</div>
            <div class="favicon-badge">${t.icon || '🔗'}</div>
            <div>${t.title}</div>
            <div class="count-badge">0</div>`;
        document.getElementById('mainGrid').insertBefore(b, document.getElementById('btnAddPerso'));
    });
}

function deleteTool(id) {
    if(confirm("Supprimer ?")) {
        customTools = customTools.filter(t => t.id !== id);
        localStorage.setItem('customTools', JSON.stringify(customTools)); 
        location.reload(); 
    }
}

function resetFilters() { if(confirm("Tout réinitialiser ?")) { localStorage.clear(); location.reload(); } }