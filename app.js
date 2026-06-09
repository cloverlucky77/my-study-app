const firebaseConfig = {
    apiKey: "AIzaSyC1cf1kMJlsYHz7O-YPNDc-4MKpGL_fM3s",
    authDomain: "my-workspace-app-7163f.firebaseapp.com",
    databaseURL: "https://my-workspace-app-7163f-default-rtdb.firebaseio.com",
    projectId: "my-workspace-app-7163f",
    storageBucket: "my-workspace-app-7163f.firebasestorage.app",
    messagingSenderId: "119886197584",
    appId: "1:119886197584:web:53abc2966f016f9143f255"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {

    // --- 🧭 사이드바 제어 및 시계 시스템 ---
    const menuItems = document.querySelectorAll('.menu-item');
    const contentViews = document.querySelectorAll('.content-view');
    const sidebarSubFolders = document.getElementById('sidebar-sub-folders');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            contentViews.forEach(view => {
                if (view.id === targetId) view.classList.remove('hidden');
                else view.classList.add('hidden');
            });
            if (item.id !== 'menu-btn-math') sidebarSubFolders.classList.add('hidden');
            else sidebarSubFolders.classList.remove('hidden');
        });
    });

    const clockDisplay = document.getElementById('live-clock');
    setInterval(() => { clockDisplay.textContent = new Date().toTimeString().split(' ')[0]; }, 1000);
    const getTodayDateString = () => new Date().toISOString().split('T')[0];


    // --- 🗂️ 1. 일반 메모장 분류 보관함 ---
    const folderExplorerZone = document.getElementById('folder-explorer-zone');
    const memoEditorZone = document.getElementById('memo-editor-zone');
    const folderGridContainer = document.getElementById('folder-grid-container');
    const createFolderBtn = document.getElementById('create-folder-btn');
    const backToFoldersBtn = document.getElementById('back-to-folders-btn');
    const currentFolderTitle = document.getElementById('current-folder-title');
    const memoTitleInput = document.getElementById('memo-title-input');
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const savedMemosContainer = document.getElementById('saved-memos-container');

    let activeFolderName = null; 
    let editingMemoId = null;

    db.ref('workspace/folders').on('value', (snapshot) => {
        const foldersData = snapshot.val() || {};
        renderFolderDashboard(foldersData);
        if (activeFolderName) {
            if (!foldersData[activeFolderName]) { exitFolderScope(); } 
            else { renderFolderMemos(foldersData[activeFolderName].memos || {}); }
        }
    });

    function renderFolderDashboard(foldersData) {
        folderGridContainer.innerHTML = '';
        Object.keys(foldersData).forEach(folderName => {
            const count = Object.keys(foldersData[folderName].memos || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.innerHTML = `
                <button class="btn-folder-delete-absolute" onclick="deleteEntireFolder(event, '${folderName}')"><i class="fa-regular fa-trash-can"></i></button>
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folderName}</div>
                <div class="folder-memo-count">${count}개 보관됨</div>
            `;
            card.addEventListener('click', () => enterFolderScope(folderName));
            folderGridContainer.appendChild(card);
        });
    }

    createFolderBtn.addEventListener('click', () => {
        const name = prompt('새 메모 분류명을 입력하세요:');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
        if (cleaned) db.ref('workspace/folders/' + cleaned).set({ createdAt: Date.now(), memos: {} });
    });

    window.deleteEntireFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 분류의 내부 모든 메모가 통째로 삭제됩니다.`)) {
            db.ref('workspace/folders/' + folderName).remove();
        }
    };

    function enterFolderScope(folderName) {
        activeFolderName = folderName; resetEditor();
        folderExplorerZone.classList.add('hidden'); memoEditorZone.classList.remove('hidden');
        currentFolderTitle.innerHTML = `<i class="fa-regular fa-folder-open"></i> ${activeFolderName}`;
    }
    backToFoldersBtn.addEventListener('click', exitFolderScope);
    function exitFolderScope() { activeFolderName = null; memoEditorZone.classList.add('hidden'); folderExplorerZone.classList.remove('hidden'); }

    function renderFolderMemos(memosObj) {
        savedMemosContainer.innerHTML = '';
        const list = Object.keys(memosObj).map(id => ({ id, ...memosObj[id] }));
        if(list.length === 0){ savedMemosContainer.innerHTML = `<div style="color:#71717a; font-size:0.8rem; text-align:center;">기록이 없습니다.</div>`; return; }
        list.forEach(memo => {
            const card = document.createElement('div');
            card.className = 'item-row';
            card.innerHTML = `
                <span class="item-text" onclick="loadMemoData('${memo.id}')">📂 ${memo.title}</span>
                <button class="compact-del-btn" onclick="deleteMemoData(event, '${memo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            savedMemosContainer.appendChild(card);
        });
    }

    window.loadMemoData = (id) => {
        db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) { memoTitleInput.value = data.title; memoTextarea.value = data.content; editingMemoId = id; document.getElementById('save-status').textContent = "수정 모드"; }
        });
    };
    window.deleteMemoData = (event, id) => { event.stopPropagation(); db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).remove(); if(editingMemoId===id) resetEditor(); };
    function resetEditor() { memoTitleInput.value = ''; memoTextarea.value = ''; editingMemoId = null; document.getElementById('save-status').textContent = "새 메모"; }
    saveMemoBtn.addEventListener('click', () => {
        const text = memoTextarea.value.trim(); if (!text) return;
        const payload = { title: memoTitleInput.value.trim() || text.substring(0,10), content: text, date: getTodayDateString() };
        if (editingMemoId) db.ref(`workspace/folders/${activeFolderName}/memos/${editingMemoId}`).update(payload);
        else db.ref(`workspace/folders/${activeFolderName}/memos`).push(payload);
        resetEditor();
    });
    document.getElementById('clear-memo-btn').addEventListener('click', resetEditor);


    // --- 📚 2. 과목별 & 자율 유형별 오답노트 보관 및 드래그 앤 드롭 엔진 ---
    const mathExplorerZone = document.getElementById('math-explorer-zone');
    const mathEditorZone = document.getElementById('math-editor-zone');
    const mathFolderGrid = document.getElementById('math-folder-grid');
    const mathCreateFolderBtn = document.getElementById('math-create-folder-btn');
    const mathBackBtn = document.getElementById('math-back-btn');
    const mathCurrentFolderTitle = document.getElementById('math-current-folder-title');
    
    const mathProbTitle = document.getElementById('math-prob-title');
    const mathProbType = document.getElementById('math-prob-type');
    const mathProbWrong = document.getElementById('math-prob-wrong');
    const mathProbApproach = document.getElementById('math-prob-approach');
    const mathProbSolution = document.getElementById('math-prob-solution');
    
    const mathSaveBtn = document.getElementById('math-save-btn');
    const mathClearBtn = document.getElementById('math-clear-btn');
    const mathSaveStatus = document.getElementById('math-save-status');
    const mathSavedList = document.getElementById('math-saved-list');
    
    const filterTypeSelect = document.getElementById('math-filter-type-select');
    const btnToggleSort = document.getElementById('btn-toggle-sort');

    // 모달 관련 요소
    const btnManageTypes = document.getElementById('btn-manage-types');
    const typeModal = document.getElementById('type-modal');
    const closeTypeModal = document.getElementById('close-type-modal');
    const newTypeInput = document.getElementById('new-type-input');
    const btnAddType = document.getElementById('btn-add-type');
    const customTypeList = document.getElementById('custom-type-list');

    let activeMathFolder = null;
    let editingMathId = null;
    let currentSortMode = 'latest'; 

    // 파이어베이스 실시간 데이터 연동 감시 모듈
    db.ref('workspace/mathNotebooks').on('value', (snapshot) => {
        const mathData = snapshot.val() || {};
        renderMathDashboard(mathData);
        renderSidebarSubFolders(mathData); 

        if (activeMathFolder) {
            if (!mathData[activeMathFolder]) { 
                exitMathFolder(); 
            } else { 
                renderTypeDropdowns(mathData[activeMathFolder].customTypes || {});
                renderMathItems(mathData[activeMathFolder].problems || {}); 
                renderModalTypeList(mathData[activeMathFolder].customTypes || {});
            }
        }
    });

    // 🌟 [UI 개선] 마우스 클릭/손가락 터치로 끌어서 순서를 바꾸는 드래그 앤 드롭 구현
    function renderMathDashboard(mathData) {
        mathFolderGrid.innerHTML = '';
        const sorted = Object.keys(mathData).map(name => ({
            name, ...mathData[name], order: mathData[name].order !== undefined ? mathData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        if(sorted.length === 0) {
            mathFolderGrid.innerHTML = `<div style="grid-column:1/-1; font-size:0.85rem; color:#71717a; text-align:center; padding:35px;">폴더가 비어있습니다. 과목을 추가해 주세요!</div>`;
            return;
        }

        sorted.forEach(folder => {
            const count = Object.keys(folder.problems || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.setAttribute('draggable', 'true'); // 드래그 가능하게 설정
            card.dataset.id = folder.name;
            card.innerHTML = `
                <button class="btn-folder-delete-absolute" onclick="deleteMathFolder(event, '${folder.name}')"><i class="fa-regular fa-trash-can"></i></button>
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-memo-count">${count}문항 보관</div>
            `;
            
            // 일반 터치/클릭 시 진입 처리
            card.addEventListener('click', (e) => {
                if(e.target.closest('.btn-folder-delete-absolute')) return;
                enterMathFolder(folder.name);
            });

            // HTML5 드래그 이벤트 바인딩
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                saveNewFolderOrder(); // 드래그가 끝나면 바뀐 순서를 파이어베이스에 한 번에 세팅
            });

            mathFolderGrid.appendChild(card);
        });
    }

    // 드래그 레이아웃 위치 가이드라인 계산용 연산자
    mathFolderGrid.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(mathFolderGrid, e.clientX, e.clientY);
        const draggingCard = document.querySelector('.folder-card.dragging');
        if (afterElement == null) {
            mathFolderGrid.appendChild(draggingCard);
        } else {
            mathFolderGrid.insertBefore(draggingCard, afterElement);
        }
    });

    function getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.folder-card:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offsetX = x - box.left - box.width / 2;
            const offsetY = y - box.top - box.height / 2;
            const distance = Math.sqrt(offsetX*offsetX + offsetY*offsetY); // 거리 계산
            if (distance < closest.distance) {
                return { distance: distance, element: child };
            } else {
                return closest;
            }
        }, { distance: Infinity }).element;
    }

    function saveNewFolderOrder() {
        const cards = [...mathFolderGrid.querySelectorAll('.folder-card')];
        const updates = {};
        cards.forEach((card, index) => {
            const folderName = card.dataset.id;
            updates[`workspace/mathNotebooks/${folderName}/order`] = index;
        });
        db.ref().update(updates);
    }

    function renderSidebarSubFolders(mathData) {
        sidebarSubFolders.innerHTML = '';
        const sorted = Object.keys(mathData).map(name => ({
            name, order: mathData[name].order !== undefined ? mathData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        sorted.forEach(folder => {
            const btn = document.createElement('button');
            btn.className = 'sub-menu-item';
            btn.innerHTML = `<i class="fa-solid fa-square-root-variable"></i> ${folder.name}`;
            btn.addEventListener('click', () => {
                menuItems.forEach(b => b.classList.remove('active'));
                document.getElementById('menu-btn-math').classList.add('active');
                contentViews.forEach(v => v.id === 'view-math' ? v.classList.remove('hidden') : v.classList.add('hidden'));
                sidebarSubFolders.classList.remove('hidden');
                enterMathFolder(folder.name);
            });
            sidebarSubFolders.appendChild(btn);
        });
    }

    mathCreateFolderBtn.addEventListener('click', () => {
        const name = prompt('새 과목 오답노트 폴더 이름을 기입하세요 (예: 수학I):');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
        if (!cleaned) return;
        
        // 폴더 생성 시 기본 유형 3가지 자동 제공
        db.ref('workspace/mathNotebooks/' + cleaned).set({ 
            createdAt: Date.now(), 
            order: 999, 
            problems: {},
            customTypes: {
                "기본단원": true
            }
        });
    });

    window.deleteMathFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 폴더와 내부 모든 데이터가 원격버전에서 통째로 날아갑니다. 지울까요?`)) {
            db.ref('workspace/mathNotebooks/' + folderName).remove();
        }
    };

    function enterMathFolder(folderName) {
        activeMathFolder = folderName;
        resetMathEditor();
        mathExplorerZone.classList.add('hidden');
        mathEditorZone.classList.remove('hidden');
        mathCurrentFolderTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${activeMathFolder}`;
        filterTypeSelect.value = "ALL"; 
        
        db.ref(`workspace/mathNotebooks/${folderName}`).once('value', (snapshot) => {
            const val = snapshot.val() || {};
            renderTypeDropdowns(val.customTypes || {});
            renderMathItems(val.problems || {});
        });
    }
    mathBackBtn.addEventListener('click', exitMathFolder);
    function exitMathFolder() { activeMathFolder = null; mathEditorZone.classList.add('hidden'); mathExplorerZone.classList.remove('hidden'); }

    // 🌟 [유형 자율화의 핵심] 등록된 맞춤 단원에 의거해 선택창 동적 세팅
    function renderTypeDropdowns(typesObj) {
        const currentFilterValue = filterTypeSelect.value;
        const currentProbTypeValue = mathProbType.value;

        // 1. 좌측 상단 필터용 드롭다운
        filterTypeSelect.innerHTML = '<option value="ALL">전체 유형 보기</option>';
        // 2. 우측 작성 서식용 드롭다운
        mathProbType.innerHTML = '';

        const keys = Object.keys(typesObj);
        if(keys.length === 0) {
            // 기본값 보장
            keys.push("미분류");
        }

        keys.forEach(type => {
            filterTypeSelect.innerHTML += `<option value="${type}">${type}</option>`;
            mathProbType.innerHTML += `<option value="${type}">${type}</option>`;
        });

        // 사용자가 선택하던 값 상태 보존 복원
        if ([...filterTypeSelect.options].some(o => o.value === currentFilterValue)) {
            filterTypeSelect.value = currentFilterValue;
        }
        if ([...mathProbType.options].some(o => o.value === currentProbTypeValue)) {
            mathProbType.value = currentProbTypeValue;
        }
    }

    // 필터 연동 기능들
    filterTypeSelect.addEventListener('change', () => {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snapshot) => { renderMathItems(snapshot.val() || {}); });
    });
    btnToggleSort.addEventListener('click', () => {
        currentSortMode = (currentSortMode === 'latest') ? 'alpha' : 'latest';
        btnToggleSort.innerHTML = currentSortMode === 'latest' ? `<i class="fa-solid fa-arrow-down-9-1"></i> 최신순` : `<i class="fa-solid fa-arrow-down-a-z"></i> 이름순`;
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snapshot) => { renderMathItems(snapshot.val() || {}); });
    });

    // 문항 목록 화면 갱신
    function renderMathItems(probsObj) {
        mathSavedList.innerHTML = '';
        let list = Object.keys(probsObj).map(id => ({ id, ...probsObj[id] }));
        
        const selectedFilter = filterTypeSelect.value;
        if (selectedFilter !== "ALL") {
            list = list.filter(p => p.type === selectedFilter);
        }

        if (list.length === 0) {
            mathSavedList.innerHTML = `<div style="font-size:0.78rem; color:#71717a; text-align:center; padding:20px 0;">이 유형으로 등록된 문제가 없습니다.</div>`;
            return;
        }

        if (currentSortMode === 'latest') list.sort((a, b) => b.timestamp - a.timestamp);
        else list.sort((a, b) => a.title.localeCompare(b.title));

        list.forEach(p => {
            const card = document.createElement('div');
            card.className = `notebook-item-card ${editingMathId === p.id ? 'active-item' : ''}`;
            card.innerHTML = `
                <div class="notebook-card-main" onclick="loadMathData('${p.id}')">
                    <span class="notebook-card-badge">${p.type || '미분류'}</span>
                    <span class="notebook-card-title">${p.title}</span>
                </div>
                <button class="compact-del-btn" onclick="deleteMathData(event, '${p.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            mathSavedList.appendChild(card);
        });
    }

    // 터치 시 에디터 로드
    window.loadMathData = (id) => {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                editingMathId = id;
                mathProbTitle.value = data.title;
                mathProbType.value = data.type || '미분류';
                mathProbWrong.value = data.wrong || '';
                mathProbApproach.value = data.approach || '';
                mathProbSolution.value = data.solution || '';
                
                mathSaveStatus.textContent = "📝 기존 기록 수정/조회 모드";
                mathSaveStatus.style.color = "#34d399";

                db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snap) => { renderMathItems(snap.val() || {}); });
            }
        });
    };

    window.deleteMathData = (event, id) => {
        event.stopPropagation();
        if(confirm("이 문항 기록을 지울까요?")) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).remove();
            if (editingMathId === id) resetMathEditor();
        }
    };

    function resetMathEditor() {
        editingMathId = null;
        mathProbTitle.value = '';
        mathProbWrong.value = '';
        mathProbApproach.value = '';
        mathProbSolution.value = '';
        mathSaveStatus.textContent = "✨ 새 문항 등록 모드";
        mathSaveStatus.style.color = "#71717a";
        if(activeMathFolder) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snap) => { renderMathItems(snap.val() || {}); });
        }
    }

    mathSaveBtn.addEventListener('click', () => {
        const title = mathProbTitle.value.trim();
        const solution = mathProbSolution.value.trim();
        if (!title) return alert('문제 제목을 적어주세요.');

        const payload = {
            title: title,
            type: mathProbType.value || '미분류',
            wrong: mathProbWrong.value.trim(),
            approach: mathProbApproach.value.trim(),
            solution: solution,
            timestamp: Date.now()
        };

        if (editingMathId) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${editingMathId}`).update(payload);
        } else {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).push(payload);
        }
        resetMathEditor();
    });

    mathClearBtn.addEventListener('click', resetMathEditor);


    // 🌟 [유형 관리 시스템 팝업 기능 바인딩]
    btnManageTypes.addEventListener('click', () => {
        typeModal.classList.remove('hidden');
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes`).once('value', (snap) => {
            renderModalTypeList(snap.val() || {});
        });
    });
    closeTypeModal.addEventListener('click', () => typeModal.classList.add('hidden'));

    // 유형 추가
    btnAddType.addEventListener('click', () => {
        const typeName = newTypeInput.value.trim().replace(/[.#$\[\]]/g, "");
        if(!typeName) return;
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${typeName}`).set(true);
        newTypeInput.value = '';
    });

    function renderModalTypeList(typesObj) {
        customTypeList.innerHTML = '';
        const keys = Object.keys(typesObj);
        if(keys.length === 0) {
            customTypeList.innerHTML = `<div style="font-size:0.75rem; color:#71717a;">추가된 유형 단원이 없습니다.</div>`;
            return;
        }
        keys.forEach(type => {
            const div = document.createElement('div');
            div.className = 'type-manage-item';
            div.innerHTML = `
                <span>🏷️ ${type}</span>
                <button class="compact-del-btn" onclick="deleteCustomType('${type}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            customTypeList.appendChild(div);
        });
    }

    window.deleteCustomType = (type) => {
        if(confirm(`[${type}] 유형 태그를 삭제하시겠습니까? (이 유형으로 지정된 기존 문제의 텍스트 내용은 유지됩니다)`)) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${type}`).remove();
        }
    };


    // --- 📅 3. 오늘의 플래너 클라우드 엔진 ---
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    db.ref('workspace/todos').on('value', (snapshot) => { renderTodoList(snapshot.val() || {}); });

    function renderTodoList(todosObj) {
        todoList.innerHTML = '';
        const todayStr = getTodayDateString();
        const list = Object.keys(todosObj).map(id => ({ id, ...todosObj[id] })).filter(t => t.date === todayStr);
        todoStats.textContent = `${list.filter(t => t.completed).length} / ${list.length} 완료`;

        list.forEach(todo => {
            const li = document.createElement('li');
            li.className = `item-row ${todo.completed ? 'done' : ''}`;
            li.innerHTML = `
                <div class="item-left">
                    <span class="time-tag">${todo.time}</span>
                    <span class="item-text" onclick="toggleTodoCloud('${todo.id}', ${todo.completed})">${todo.text}</span>
                </div>
                <button class="compact-del-btn" onclick="deleteTodoCloud('${todo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(li);
        });
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        db.ref('workspace/todos').push({ date: getTodayDateString(), time: todoTimeInput.value.trim(), text: todoInput.value.trim(), completed: false });
        todoInput.value = ''; todoTimeInput.value = '';
    });
    window.toggleTodoCloud = (id, cur) => db.ref(`workspace/todos/${id}`).update({ completed: !cur });
    window.deleteTodoCloud = (id) => db.ref(`workspace/todos/${id}`).remove();


    // --- 🎯 4. 디데이 카운트다운 클라우드 엔진 ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    db.ref('workspace/ddays').on('value', (snapshot) => { renderDDayList(snapshot.val() || {}); });

    function renderDDayList(ddaysObj) {
        ddayContainer.innerHTML = '';
        const today = new Date(); today.setHours(0,0,0,0);
        Object.keys(ddaysObj).forEach(id => {
            const item = ddaysObj[id];
            const target = new Date(item.date); target.setHours(0,0,0,0);
            const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            let displayD = days === 0 ? 'D-Day' : (days > 0 ? `D-${days}` : `D+${Math.abs(days)}`);

            const div = document.createElement('div');
            div.className = 'dday-card';
            div.innerHTML = `
                <div class="dday-info"><span class="dday-name">${item.title}</span><span class="dday-date-text">목표일: ${item.date}</span></div>
                <div class="dday-right-zone"><span class="dday-number">${displayD}</span><button class="compact-del-btn" onclick="deleteDDayCloud('${id}')"><i class="fa-regular fa-trash-can"></i></button></div>
            `;
            ddayContainer.appendChild(div);
        });
    }

    ddayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        db.ref('workspace/ddays').push({ title: ddayTitle.value.trim(), date: ddayDate.value });
        ddayForm.reset();
    });
    window.deleteDDayCloud = (id) => db.ref(`workspace/ddays/${id}`).remove();

});
