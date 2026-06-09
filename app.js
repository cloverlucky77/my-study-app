let currentCategoryId = null;
let saveTimeout = null;
let allMemos = [];

// 로컬 스토리지 데이터 초기화 함수
function getStorage(key, defaultVal) { return JSON.parse(localStorage.getItem(key)) || defaultVal; }
function setStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// 로그인 체크
function checkLogin() {
    const pw = document.getElementById('login-password').value;
    if (pw === 'admin1234') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'flex';
        loadCategories();
    } else { alert('비밀번호가 틀렸습니다!'); }
}

function loadCategories() {
    const categories = getStorage('categories', [
        { id: "1", name: "📐 수학", order: 1 },
        { id: "2", name: "🔤 영어", order: 2 }
    ]);
    const notes = getStorage('notes', []);
    categories.sort((a, b) => a.order - b.order);

    const mapped = categories.map(cat => {
        const count = notes.filter(n => n.categoryId === cat.id).length;
        return { ...cat, count };
    });
    renderCategories(mapped);
}

function renderCategories(categories) {
    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.draggable = true;
        li.dataset.id = cat.id;
        li.innerHTML = `
            <span style="flex:1; cursor:pointer;" onclick="selectCategory('${cat.id}', '${cat.name}')">
                ${cat.name} <span class="badge">${cat.count || 0}</span>
            </span>
            <button class="btn-del" onclick="deleteCategory('${cat.id}')">🗑️</button>
        `;
        li.addEventListener('dragstart', () => li.classList.add('dragging'));
        li.addEventListener('dragend', () => { li.classList.remove('dragging'); saveCategoryOrder(); });
        categoryList.appendChild(li);
    });
}

// 드래그앤드롭 위치 계산
document.getElementById('category-list').addEventListener('dragover', e => {
    e.preventDefault();
    const list = document.getElementById('category-list');
    const dragging = document.querySelector('.dragging');
    const afterElement = [...list.querySelectorAll('.category-item:not(.dragging)')].reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
    if (afterElement == null) list.appendChild(dragging);
    else list.insertBefore(dragging, afterElement);
});

function saveCategoryOrder() {
    const orders = [...document.querySelectorAll('.category-item')].map((item, idx) => {
        return { id: item.dataset.id, name: item.querySelector('span').textContent.split(' ')[0], order: idx + 1 };
    });
    setStorage('categories', orders);
}

function addCategory() {
    const name = prompt('새 과목 입력:');
    if (!name || !name.trim()) return;
    const categories = getStorage('categories', []);
    categories.push({ id: Date.now().toString(), name: name.trim(), order: categories.length + 1 });
    setStorage('categories', categories);
    loadCategories();
}

function deleteCategory(id) {
    if (!confirm('과목과 관련 메모를 모두 삭제하시겠습니까?')) return;
    let categories = getStorage('categories', []);
    categories = categories.filter(c => c.id !== id);
    setStorage('categories', categories);

    let notes = getStorage('notes', []);
    notes = notes.filter(n => n.categoryId !== id);
    setStorage('notes', notes);

    loadCategories();
}

function selectCategory(id, name) {
    currentCategoryId = id;
    document.getElementById('current-subject-title').textContent = name.split(' ')[0];
    document.getElementById('search-input').disabled = false;
    document.getElementById('write-box').style.display = 'flex';
    
    const notes = getStorage('notes', []);
    allMemos = notes.filter(n => n.categoryId === id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    displayMemos(allMemos);
}

function displayMemos(memos) {
    const container = document.getElementById('memo-list-container');
    container.innerHTML = '';
    memos.forEach(memo => {
        const card = document.createElement('div');
        card.className = 'memo-card';
        card.innerHTML = `
            <textarea oninput="autoSaveMemo('${memo.id}', this)">${memo.content}</textarea>
            <div class="memo-footer">
                <span>📅 ${new Date(memo.createdAt).toLocaleString()}</span>
                <button class="btn-card-del" onclick="deleteMemo('${memo.id}')">삭제</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function createNewMemo() {
    const textarea = document.getElementById('new-memo-textarea');
    if (!textarea.value.trim()) return;
    
    const notes = getStorage('notes', []);
    notes.push({ id: Date.now().toString(), categoryId: currentCategoryId, content: textarea.value.trim(), createdAt: new Date() });
    setStorage('notes', notes);

    textarea.value = '';
    selectCategory(currentCategoryId, document.getElementById('current-subject-title').textContent);
    loadCategories();
}

function autoSaveMemo(id, element) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        const notes = getStorage('notes', []);
        const index = notes.findIndex(n => n.id === id);
        if (index > -1) {
            notes[index].content = element.value;
            setStorage('notes', notes);
        }
    }, 500);
}

function deleteMemo(id) {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    let notes = getStorage('notes', []);
    notes = notes.filter(n => n.id !== id);
    setStorage('notes', notes);
    selectCategory(currentCategoryId, document.getElementById('current-subject-title').textContent);
    loadCategories();
}

function filterMemos() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = allMemos.filter(m => m.content.toLowerCase().includes(query));
    displayMemos(filtered);
}