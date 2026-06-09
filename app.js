// ==========================================
// 🔥 파이어베이스 원격 데이터베이스 연결 설정
// ==========================================
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


    // --- 🗂️ 1. 일반 메모장 엔진 (동기화 초기화 수정 완료) ---
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
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folderName}</div>
                <div class="folder-memo-count">${count}개 보관됨</div>
                <div class="folder-action-bar">
                    <button class="btn-folder-action del" onclick="deleteEntireFolder(event, '${folderName}')"><i class="fa-regular fa-trash-can"></i> 삭제</button>
                </div>
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
        if (confirm(`[${folderName}] 분류를 삭제하면 내부 메모도 전부 영구 삭제됩니다. 진행할까요?`)) {
            db.ref('workspace/folders/' + folderName).remove();
        }
    };

    function enterFolderScope(folderName) {
        activeFolderName = folderName;
        resetEditor();
        folderExplorerZone.classList.add('hidden');
        memoEditorZone.classList.remove('hidden');
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


    // --- 📚 2. 과목별 & 유형별 오답노트 보관 시스템 (완벽 버그 수정 및 2단 분할 개편) ---
    const mathExplorerZone = document.getElementById('math-explorer-zone');
    const mathEditorZone = document.getElementById('math-editor-zone');
    const mathFolderGrid = document.getElementById('math-folder-grid');
    const mathCreateFolderBtn = document.getElementById('math-create-folder-btn');
    const mathBackBtn = document.getElementById('math-back-btn');
    const mathCurrentFolderTitle = document.getElementById('math-current-folder-title');
    
    // 입력 서식 컴포넌트들
    const mathProbTitle = document.getElementById('math-prob-title');
    const mathProbType = document.getElementById('math-prob-type');
    const mathProbWrong = document.getElementById('math-prob-wrong');
    const mathProbApproach = document.getElementById('math-prob-approach');
    const mathProbSolution = document.getElementById('math-prob-solution');
    
    const mathSaveBtn = document.getElementById('math-save-btn');
    const mathClearBtn = document.getElementById('math-clear-btn');
    const mathSaveStatus = document.getElementById('math-save-status');
    const mathSavedList = document.getElementById('math-saved-list');
    
    // 필터 변수들
    const filterTypeSelect = document.getElementById('math-filter-type-select');
    const btnToggleSort = document.getElementById('btn-toggle-sort');

    let activeMathFolder = null;
    let editingMathId = null;
    let currentSortMode = 'latest'; 

    // 데이터 감시 메인 엔진
    db.ref('workspace/mathNotebooks').on('value', (snapshot) => {
        const mathData = snapshot.val() || {};
        renderMathDashboard(mathData);
        renderSidebarSubFolders(mathData); 

        if (activeMathFolder) {
            // 💡 [치명적 버그 수정] 만약 현재 진입한 폴더 자체가 데이터 상에서 날아갔다면 즉시 목록으로 튕겨냅니다.
            if (!mathData[activeMathFolder]) { 
                exitMathFolder(); 
            } else { 
                renderMathItems(mathData[activeMathFolder].problems || {}); 
            }
        }
    });

    function renderMathDashboard(mathData) {
        mathFolderGrid.innerHTML = '';
        const sorted = Object.keys(mathData).map(name => ({
            name, ...mathData[name], order: mathData[name].order || 0
        })).sort((a,b) => a.order - b.order);

        if(sorted.length === 0) {
            mathFolderGrid.innerHTML = `<div style="grid-column:1/-1; font-size:0.85rem; color:#71717a; text-align:center; padding:35px;">폴더가 비어있습니다. 과목을 추가해 주세요!</div>`;
            return;
        }

        sorted.forEach(folder => {
            const count = Object.keys(folder.problems || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.innerHTML = `
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-memo-count">${count}문항 보관</div>
                <div class="folder-action-bar">
                    <button class="btn-folder-action" onclick="moveMathOrder(event, '${folder.name}', -1)"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="btn-folder-action" onclick="moveMathOrder(event, '${folder.name}', 1)"><i class="fa-solid fa-chevron-down"></i></button>
                    <button class="btn-folder-action del" onclick="deleteMathFolder(event, '${folder.name}')"><i class="fa-regular fa-trash-can"></i> 삭제</button>
                </div>
            `;
            card.addEventListener('click', () => enterMathFolder(folder.name));
            mathFolderGrid.appendChild(card);
        });
    }

    function renderSidebarSubFolders(mathData) {
        sidebarSubFolders.innerHTML = '';
        Object.keys(mathData).forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'sub-menu-item';
            btn.innerHTML = `<i class="fa-solid fa-square-root-variable"></i> ${name}`;
            btn.addEventListener('click', () => {
                menuItems.forEach(b => b.classList.remove('active'));
                document.getElementById('menu-btn-math').classList.add('active');
                contentViews.forEach(v => v.id === 'view-math' ? v.classList.remove('hidden') : v.classList.add('hidden'));
                sidebarSubFolders.classList.remove('hidden');
                enterMathFolder(name);
            });
            sidebarSubFolders.appendChild(btn);
        });
    }

    mathCreateFolderBtn.addEventListener('click', () => {
        const name = prompt('새 과목 오답노트 폴더 이름을 기입하세요:');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
        if (!cleaned) return;
        db.ref('workspace/mathNotebooks/' + cleaned).set({ createdAt: Date.now(), order: 99, problems: {} });
    });

    // 💡 [치명적 버그 수정] 이제 하부 문항 데이터 노드까지 원천 통삭제 처리하여 찌꺼기가 남지 않습니다.
    window.deleteMathFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 폴더와 내부의 수많은 문제 기록이 통째로 원격 서버에서 삭제됩니다. 진행할까요?`)) {
            db.ref('workspace/mathNotebooks/' + folderName).remove();
        }
    };

    window.moveMathOrder = (event, folderName, dir) => {
        event.stopPropagation();
        db.ref('workspace/mathNotebooks').once('value', (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.keys(data).map(n => ({ name: n, order: data[n].order || 0 })).sort((a,b)=>a.order-b.order);
            const idx = list.findIndex(f => f.name === folderName);
            if (idx === -1) return;
            const targetIdx = idx + dir;
            if (targetIdx < 0 || targetIdx >= list.length) return;
            const temp = list[idx]; list[idx] = list[targetIdx]; list[targetIdx] = temp;
            const updates = {};
            list.forEach((f, i) => { updates[`workspace/mathNotebooks/${f.name}/order`] = i; });
            db.ref().update(updates);
        });
    };

    function enterMathFolder(folderName) {
        activeMathFolder = folderName;
        resetMathEditor();
        mathExplorerZone.classList.add('hidden');
        mathEditorZone.classList.remove('hidden');
        mathCurrentFolderTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${activeMathFolder}`;
        filterTypeSelect.value = "ALL"; // 진입 시 필터링 초기화
        db.ref(`workspace/mathNotebooks/${folderName}/problems`).once('value', (snapshot) => {
            renderMathItems(snapshot.val() || {});
        });
    }
    mathBackBtn.addEventListener('click', exitMathFolder);
    function exitMathFolder() { activeMathFolder = null; mathEditorZone.classList.add('hidden'); mathExplorerZone.classList.remove('hidden'); }

    // 필터 조건 변경 및 정렬 클릭 시 실시간 리렌더링 트리거 반영
    filterTypeSelect.addEventListener('change', () => {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snapshot) => { renderMathItems(snapshot.val() || {}); });
    });
    btnToggleSort.addEventListener('click', () => {
        currentSortMode = (currentSortMode === 'latest') ? 'alpha' : 'latest';
        btnToggleSort.innerHTML = currentSortMode === 'latest' ? `<i class="fa-solid fa-arrow-down-9-1"></i> 최신순` : `<i class="fa-solid fa-arrow-down-a-z"></i> 이름순`;
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snapshot) => { renderMathItems(snapshot.val() || {}); });
    });

    // 💡 [유형별 정리 핵심] 문항 목록 렌더링 함수
    function renderMathItems(probsObj) {
        mathSavedList.innerHTML = '';
        let list = Object.keys(probsObj).map(id => ({ id, ...probsObj[id] }));
        
        // 1. 유형 필터링 처리
        const selectedFilter = filterTypeSelect.value;
        if (selectedFilter !== "ALL") {
            list = list.filter(p => p.type === selectedFilter);
        }

        if (list.length === 0) {
            mathSavedList.innerHTML = `<div style="font-size:0.78rem; color:#71717a; text-align:center; padding:20px 0;">해당되는 문제가 없습니다.</div>`;
            return;
        }

        // 2. 시간/이름 정렬 처리
        if (currentSortMode === 'latest') list.sort((a, b) => b.timestamp - a.timestamp);
        else list.sort((a, b) => a.title.localeCompare(b.title));

        // 3. 카드 출력
        list.forEach(p => {
            const card = document.createElement('div');
            // 현재 에디터에 로드되어 수정 중인 아이템이면 테두리 강조 클래스 부여
            card.className = `notebook-item-card ${editingMathId === p.id ? 'active-item' : ''}`;
            card.innerHTML = `
                <div class="notebook-card-main" onclick="loadMathData('${p.id}')">
                    <span class="notebook-card-badge">${p.type || '기타'}</span>
                    <span class="notebook-card-title">${p.title}</span>
                </div>
                <button class="compact-del-btn" onclick="deleteMathData(event, '${p.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            mathSavedList.appendChild(card);
        });
    }

    // 💡 꺼내 쓰기 기능: 기록 카드 터치 시 입력창에 통째로 로드(Load)
    window.loadMathData = (id) => {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                editingMathId = id;
                mathProbTitle.value = data.title;
                mathProbType.value = data.type || '기타';
                mathProbWrong.value = data.wrong || '';
                mathProbApproach.value = data.approach || '';
                mathProbSolution.value = data.solution || '';
                
                mathSaveStatus.textContent = "📝 기존 기록 수정/조회 모드";
                mathSaveStatus.style.color = "#34d399";

                // 리스트에 실시간 포커스 동기화를 위해 재출력
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
        mathProbType.value = '기타';
        mathProbWrong.value = '';
        mathProbApproach.value = '';
        mathProbSolution.value = '';
        mathSaveStatus.textContent = "✨ 새 문항 등록 모드";
        mathSaveStatus.style.color = "#71717a";
        if(activeMathFolder) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snap) => { renderMathItems(snap.val() || {}); });
        }
    }

    // 저장 및 수정 마스터 핸들러
    mathSaveBtn.addEventListener('click', () => {
        const title = mathProbTitle.value.trim();
        const solution = mathProbSolution.value.trim();
        if (!title) return alert('문제 제목을 적어주세요.');

        const payload = {
            title: title,
            type: mathProbType.value,
            wrong: mathProbWrong.value.trim(),
            approach: mathProbApproach.value.trim(),
            solution: solution,
            timestamp: Date.now()
        };

        if (editingMathId) {
            // 기존 문서에 정확히 덮어쓰기 업데이트
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${editingMathId}`).update(payload);
        } else {
            // 신규 자동 고유키 문서 생성
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).push(payload);
        }
        resetMathEditor();
    });

    mathClearBtn.addEventListener('click', resetMathEditor);


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
