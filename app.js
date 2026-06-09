/* Ultimate Cloud Workspace JS - Integrated Core Script */
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
    let currentViewDate = new Date(); // 캘린더 연월 조절 기준 변수
    let selectedFullDate = getTodayDateString(); // 선택된 포커스 날짜 (기본값: 오늘)

    // --- 🧭 1. 시스템 공통 UI & 사이드바 엔진 ---
    const mainSidebar = document.getElementById('main-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    const btnOpenSidebar = document.getElementById('btn-open-sidebar');
    const outsideToggleButtons = document.querySelectorAll('.sidebar-toggle-outside');
    const menuItems = document.querySelectorAll('.menu-item');
    const contentViews = document.querySelectorAll('.content-view');
    const sidebarSubFolders = document.getElementById('sidebar-sub-folders');
    const sidebarMemoFolders = document.getElementById('sidebar-memo-folders');

    function hideSidebar() {
        mainSidebar.classList.add('collapsed');
        outsideToggleButtons.forEach(btn => btn.classList.remove('hidden'));
    }
    function showSidebar() {
        mainSidebar.classList.remove('collapsed');
        outsideToggleButtons.forEach(btn => btn.classList.add('hidden'));
    }
    if(btnCloseSidebar) btnCloseSidebar.addEventListener('click', hideSidebar);
    if(btnOpenSidebar) btnOpenSidebar.addEventListener('click', showSidebar);
    document.querySelectorAll('.aria-toggle-sidebar').forEach(btn => {
        btn.addEventListener('click', showSidebar);
    });

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            
            contentViews.forEach(view => {
                if (view.id === targetId) view.classList.remove('hidden');
                else view.classList.add('hidden');
            });
            
            if (item.id === 'menu-btn-math') {
                sidebarSubFolders.classList.remove('hidden');
                sidebarMemoFolders.classList.add('hidden');
            } else if (item.id === 'menu-btn-memo') {
                sidebarMemoFolders.classList.remove('hidden');
                sidebarSubFolders.classList.add('hidden');
            } else {
                sidebarSubFolders.classList.add('hidden');
                sidebarMemoFolders.classList.add('hidden');
            }
        });
    });

    // 라이브 디지털시계 구동
    const clockDisplay = document.getElementById('live-clock');
    if(clockDisplay) {
        setInterval(() => { clockDisplay.textContent = new Date().toTimeString().split(' ')[0]; }, 1000);
    }

    // --- 📅 2. 풀 사이즈 달력 및 일정 통합 엔진 ---
    const calendarDays = document.getElementById('calendar-days');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const selectedDateLabel = document.getElementById('selected-date-label');
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    function renderCalendar() {
        if(!calendarDays) return;
        calendarDays.innerHTML = '';
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        
        if(calendarMonthYear) {
            calendarMonthYear.textContent = `${year}년 ${month + 1}월`;
        }
        
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        
        // 요일 헤더 바인딩
        ['일','월','화','수','목','금','토'].forEach(d => {
            const div = document.createElement('div');
            div.className = 'cal-day-label';
            div.textContent = d;
            calendarDays.appendChild(div);
        });

        // 시작 달 공백 처리
        for(let i=0; i<firstDay; i++) calendarDays.appendChild(document.createElement('div'));

        // 날짜 타일 바인딩 및 클릭 핸들러
        for(let i=1; i<=lastDate; i++) {
            const dateDiv = document.createElement('div');
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            dateDiv.className = 'cal-date';
            if(dateStr === getTodayDateString()) dateDiv.classList.add('today');
            if(dateStr === selectedFullDate) dateDiv.classList.add('selected');
            dateDiv.textContent = i;
            
            dateDiv.onclick = () => {
                selectedFullDate = dateStr;
                if(selectedDateLabel) {
                    selectedDateLabel.textContent = `${month+1}월 ${i}일 일정 관리`;
                }
                renderCalendar();
                fetchDailyIntegratedData();
            };
            calendarDays.appendChild(dateDiv);
        }
    }

    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    if(prevMonthBtn) prevMonthBtn.onclick = () => { currentViewDate.setMonth(currentViewDate.getMonth()-1); renderCalendar(); };
    if(nextMonthBtn) nextMonthBtn.onclick = () => { currentViewDate.setMonth(currentViewDate.getMonth()+1); renderCalendar(); };

    function fetchDailyIntegratedData() {
        // 지정된 날짜 전용 할 일 실시간 필터링
        db.ref('workspace/todos').on('value', (snapshot) => {
            const todos = snapshot.val() || {};
            const list = Object.keys(todos).map(id => ({id, ...todos[id]})).filter(t => t.date === selectedFullDate);
            renderTodoListData(list);
        });
        
        // 디데이 컴포넌트 실시간 동기화
        db.ref('workspace/ddays').on('value', (snapshot) => {
            renderDDayListData(snapshot.val() || {});
        });
    }

    function renderTodoListData(filteredList) {
        if(!todoList) return;
        todoList.innerHTML = '';
        if(todoStats) {
            const doneCount = filteredList.filter(t => t.completed).length;
            todoStats.textContent = `${doneCount} / ${filteredList.length} 완료`;
        }
        if(filteredList.length === 0) {
            todoList.innerHTML = `<li style="color:#71717a; font-size:0.8rem; text-align:center; padding:10px;">등록된 일정이 없습니다.</li>`;
            return;
        }
        filteredList.forEach(todo => {
            const li = document.createElement('li');
            li.className = `item-row ${todo.completed ? 'done' : ''}`;
            li.innerHTML = `
                <div class="item-left">
                    <span class="time-tag">${todo.time || '종일'}</span>
                    <span class="item-text" onclick="toggleTodoState('${todo.id}', ${todo.completed})">${todo.text}</span>
                </div>
                <button class="compact-del-btn" onclick="deleteTodoState('${todo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(li);
        });
    }

    if(todoForm) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const timeVal = todoTimeInput.value.trim();
            const textVal = todoInput.value.trim();
            db.ref('workspace/todos').push({
                date: selectedFullDate,
                time: timeVal || '기한없음',
                text: textVal,
                completed: false
            });
            todoInput.value = '';
            todoTimeInput.value = '';
        });
    }

    window.toggleTodoState = (id, curStatus) => db.ref(`workspace/todos/${id}`).update({ completed: !curStatus });
    window.deleteTodoState = (id) => db.ref(`workspace/todos/${id}`).remove();

    // 디데이 처리 모듈
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    function renderDDayListData(ddaysObj) {
        if(!ddayContainer) return;
        ddayContainer.innerHTML = '';
        const now = new Date();
        const todayTimestamp = Date.parse(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`);

        const ddayKeys = Object.keys(ddaysObj);
        if(ddayKeys.length === 0) {
            ddayContainer.innerHTML = `<div style="color:#71717a; font-size:0.8rem; text-align:center; padding:10px;">지정된 디데이가 없습니다.</div>`;
            return;
        }

        ddayKeys.forEach(id => {
            const item = ddaysObj[id];
            const targetTimestamp = Date.parse(item.date);
            if (isNaN(targetTimestamp)) return;

            const diffMs = targetTimestamp - todayTimestamp;
            const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            let displayD = '';
            let isUrgent = false;

            if (days === 0) { displayD = 'D-DAY'; isUrgent = true; }
            else if (days > 0) { displayD = `D-${days}`; if(days <= 3) isUrgent = true; }
            else { displayD = `D+${Math.abs(days)}`; }

            const div = document.createElement('div');
            div.className = `dday-card ${isUrgent ? 'urgent' : ''}`;
            div.innerHTML = `
                <div class="dday-info">
                    <span class="dday-name">${item.title}</span>
                    <span class="dday-date-text">목표일: ${item.date}</span>
                </div>
                <div class="dday-right-zone">
                    <span class="dday-number">${displayD}</span>
                    <button class="compact-del-btn" onclick="deleteDDayCloud('${id}')"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;
            ddayContainer.appendChild(div);
        });
    }

    if(ddayForm) {
        ddayForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!ddayDate.value) return alert('날짜를 정확히 선택해주세요.');
            db.ref('workspace/ddays').push({ title: ddayTitle.value.trim(), date: ddayDate.value });
            ddayForm.reset();
        });
    }
    window.deleteDDayCloud = (id) => db.ref(`workspace/ddays/${id}`).remove();


    // --- 📝 3. 고정 단일 메모장 & 폴더 분류 보관함 시스템 ---
    const pinnedTextarea = document.getElementById('pinned-memo-textarea');
    const pinnedStatus = document.getElementById('pinned-save-status');
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

    // 3-1) 단일 고정 메모장 실시간 동기화 (Debounce 설계)
    if(pinnedTextarea) {
        db.ref('workspace/pinnedMemo').on('value', (snap) => {
            const val = snap.val();
            if (val !== null && document.activeElement !== pinnedTextarea) {
                pinnedTextarea.value = val;
            }
        });
        let saveTimeout;
        pinnedTextarea.oninput = () => {
            if(pinnedStatus) pinnedStatus.textContent = "입력 중...";
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                db.ref('workspace/pinnedMemo').set(pinnedTextarea.value);
                if(pinnedStatus) pinnedStatus.textContent = "저장됨";
            }, 600);
        };
    }

    // 3-2) 분류 보관함 메인 대시보드 처리
    db.ref('workspace/folders').on('value', (snapshot) => {
        const foldersData = snapshot.val() || {};
        renderFolderDashboard(foldersData);
        renderSidebarMemoFolders(foldersData);
        if (activeFolderName) {
            if (!foldersData[activeFolderName]) { exitFolderScope(); } 
            else { renderFolderMemos(foldersData[activeFolderName].memos || {}); }
        }
    });

    function renderFolderDashboard(foldersData) {
        if(!folderGridContainer) return;
        folderGridContainer.innerHTML = '';
        const sorted = Object.keys(foldersData).map(name => ({
            name, ...foldersData[name], order: foldersData[name].order !== undefined ? foldersData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        sorted.forEach(folder => {
            const count = Object.keys(folder.memos || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.setAttribute('draggable', 'true');
            card.dataset.id = folder.name;
            card.innerHTML = `
                <button class="btn-folder-delete-absolute" onclick="deleteEntireFolder(event, '${folder.name}')"><i class="fa-regular fa-trash-can"></i></button>
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-memo-count">${count}개 문서</div>
            `;
            card.addEventListener('click', (e) => {
                if(e.target.closest('.btn-folder-delete-absolute')) return;
                enterFolderScope(folder.name);
            });
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                saveNewMemoFolderOrder();
            });
            folderGridContainer.appendChild(card);
        });
    }

    if(folderGridContainer) {
        folderGridContainer.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(folderGridContainer, '.folder-card', e.clientX, e.clientY);
            const draggingCard = document.querySelector('#folder-grid-container .folder-card.dragging');
            if(!draggingCard) return;
            if (afterElement == null) folderGridContainer.appendChild(draggingCard);
            else folderGridContainer.insertBefore(draggingCard, afterElement);
        });
    }

    function saveNewMemoFolderOrder() {
        const cards = [...folderGridContainer.querySelectorAll('.folder-card')];
        const updates = {};
        cards.forEach((card, index) => { updates[`workspace/folders/${card.dataset.id}/order`] = index; });
        db.ref().update(updates);
    }

    function renderSidebarMemoFolders(foldersData) {
        if(!sidebarMemoFolders) return;
        sidebarMemoFolders.innerHTML = '';
        const sorted = Object.keys(foldersData).map(name => ({
            name, order: foldersData[name].order !== undefined ? foldersData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        sorted.forEach(folder => {
            const btn = document.createElement('button');
            btn.className = 'sub-menu-item';
            btn.innerHTML = `<i class="fa-regular fa-folder"></i> ${folder.name}`;
            btn.addEventListener('click', () => {
                menuItems.forEach(b => b.classList.remove('active'));
                document.getElementById('menu-btn-memo').classList.add('active');
                contentViews.forEach(v => v.id === 'view-memo' ? v.classList.remove('hidden') : v.classList.add('hidden'));
                sidebarMemoFolders.classList.remove('hidden');
                enterFolderScope(folder.name);
            });
            sidebarMemoFolders.appendChild(btn);
        });
    }

    if(createFolderBtn) {
        createFolderBtn.addEventListener('click', () => {
            const name = prompt('새 분류 보관함 이름 입력:');
            if (!name) return;
            const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
            if (cleaned) db.ref('workspace/folders/' + cleaned).set({ createdAt: Date.now(), order: 999, memos: {} });
        });
    }

    window.deleteEntireFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 분류함 내부의 메모 파일이 전부 삭제됩니다.`)) {
            db.ref('workspace/folders/' + folderName).remove();
        }
    };

    function enterFolderScope(folderName) {
        activeFolderName = folderName; resetMemoEditor();
        if(folderExplorerZone) folderExplorerZone.classList.add('hidden');
        if(memoEditorZone) memoEditorZone.classList.remove('hidden');
        if(currentFolderTitle) currentFolderTitle.innerHTML = `<i class="fa-regular fa-folder-open"></i> ${activeFolderName}`;
    }
    if(backToFoldersBtn) backToFoldersBtn.addEventListener('click', exitFolderScope);
    function exitFolderScope() { activeFolderName = null; if(memoEditorZone) memoEditorZone.classList.add('hidden'); if(folderExplorerZone) folderExplorerZone.classList.remove('hidden'); }

    function renderFolderMemos(memosObj) {
        if(!savedMemosContainer) return;
        savedMemosContainer.innerHTML = '';
        const list = Object.keys(memosObj).map(id => ({ id, ...memosObj[id] }));
        if(list.length === 0){ savedMemosContainer.innerHTML = `<div style="color:#71717a; font-size:0.8rem; text-align:center;">보관함이 비어있습니다.</div>`; return; }
        list.forEach(memo => {
            const card = document.createElement('div');
            card.className = 'item-row';
            card.innerHTML = `
                <span class="item-text" onclick="loadMemoData('${memo.id}')">📄 ${memo.title}</span>
                <button class="compact-del-btn" onclick="deleteMemoData(event, '${memo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            savedMemosContainer.appendChild(card);
        });
    }

    window.loadMemoData = (id) => {
        db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) { memoTitleInput.value = data.title; memoTextarea.value = data.content; editingMemoId = id; }
        });
    };
    window.deleteMemoData = (event, id) => { event.stopPropagation(); db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).remove(); if(editingMemoId===id) resetMemoEditor(); };
    function resetMemoEditor() { memoTitleInput.value = ''; memoTextarea.value = ''; editingMemoId = null; }
    
    if(saveMemoBtn) {
        saveMemoBtn.addEventListener('click', () => {
            const text = memoTextarea.value.trim(); if (!text) return;
            const payload = { title: memoTitleInput.value.trim() || text.substring(0,12), content: text, date: getTodayDateString() };
            if (editingMemoId) db.ref(`workspace/folders/${activeFolderName}/memos/${editingMemoId}`).update(payload);
            else db.ref(`workspace/folders/${activeFolderName}/memos`).push(payload);
            resetMemoEditor();
        });
    }


    // --- 📚 4. 과목별 및 문제 유형별 오답노트 시스템 ---
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
    const mathSavedList = document.getElementById('math-saved-list');
    const filterTypeSelect = document.getElementById('math-filter-type-select');
    const btnManageTypes = document.getElementById('btn-manage-types');
    const typeModal = document.getElementById('type-modal');
    const closeTypeModal = document.getElementById('close-type-modal');
    const newTypeInput = document.getElementById('new-type-input');
    const btnAddType = document.getElementById('btn-add-type');
    const customTypeList = document.getElementById('custom-type-list');

    let activeMathFolder = null;
    let editingMathId = null;

    db.ref('workspace/mathNotebooks').on('value', (snapshot) => {
        const mathData = snapshot.val() || {};
        renderMathDashboard(mathData);
        renderSidebarSubFolders(mathData); 

        if (activeMathFolder) {
            if (!mathData[activeMathFolder]) { 
                exitMathFolder(); 
            } else { 
                const typesObj = mathData[activeMathFolder].customTypes || {};
                renderTypeDropdowns(typesObj);
                renderMathItems(mathData[activeMathFolder].problems || {}); 
                renderModalTypeList(typesObj);
            }
        }
    });

    function renderMathDashboard(mathData) {
        if(!mathFolderGrid) return;
        mathFolderGrid.innerHTML = '';
        const sorted = Object.keys(mathData).map(name => ({
            name, ...mathData[name], order: mathData[name].order !== undefined ? mathData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        sorted.forEach(folder => {
            const count = Object.keys(folder.problems || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.setAttribute('draggable', 'true');
            card.dataset.id = folder.name;
            card.innerHTML = `
                <button class="btn-folder-delete-absolute" onclick="deleteMathFolder(event, '${folder.name}')"><i class="fa-regular fa-trash-can"></i></button>
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-memo-count">${count}개 문항</div>
            `;
            card.addEventListener('click', (e) => {
                if(e.target.closest('.btn-folder-delete-absolute')) return;
                enterMathFolder(folder.name);
            });
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                saveNewFolderOrder();
            });
            mathFolderGrid.appendChild(card);
        });
    }

    if(mathFolderGrid) {
        mathFolderGrid.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(mathFolderGrid, '.folder-card', e.clientX, e.clientY);
            const draggingCard = document.querySelector('#math-folder-grid .folder-card.dragging');
            if(!draggingCard) return;
            if (afterElement == null) mathFolderGrid.appendChild(draggingCard);
            else mathFolderGrid.insertBefore(draggingCard, afterElement);
        });
    }

    function saveNewFolderOrder() {
        const cards = [...mathFolderGrid.querySelectorAll('.folder-card')];
        const updates = {};
        cards.forEach((card, index) => { updates[`workspace/mathNotebooks/${card.dataset.id}/order`] = index; });
        db.ref().update(updates);
    }

    function renderSidebarSubFolders(mathData) {
        if(!sidebarSubFolders) return;
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

    if(mathCreateFolderBtn) {
        mathCreateFolderBtn.addEventListener('click', () => {
            const name = prompt('새 과목 오답노트 이름:');
            if (!name) return;
            const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
            if (cleaned) {
                db.ref('workspace/mathNotebooks/' + cleaned).set({ 
                    createdAt: Date.now(), order: 999, problems: {}, 
                    customTypes: { "기본개념": { order: 0 }, "응용심화": { order: 1 } }
                });
            }
        });
    }

    window.deleteMathFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 과목 내부 기록이 모두 삭제됩니다.`)) {
            db.ref('workspace/mathNotebooks/' + folderName).remove();
        }
    };

    function enterMathFolder(folderName) {
        activeMathFolder = folderName; resetMathNotebookEditor();
        if(mathExplorerZone) mathExplorerZone.classList.add('hidden');
        if(mathEditorZone) mathEditorZone.classList.remove('hidden');
        if(mathCurrentFolderTitle) mathCurrentFolderTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${activeMathFolder}`;
        if(filterTypeSelect) filterTypeSelect.value = "ALL";
    }
    if(mathBackBtn) mathBackBtn.addEventListener('click', exitMathFolder);
    function exitMathFolder() { activeMathFolder = null; if(mathEditorZone) mathEditorZone.classList.add('hidden'); if(mathExplorerZone) mathExplorerZone.classList.remove('hidden'); }

    function renderTypeDropdowns(typesObj) {
        if(!filterTypeSelect || !mathProbType) return;
        const prevFilter = filterTypeSelect.value;
        const prevFormType = mathProbType.value;

        filterTypeSelect.innerHTML = '<option value="ALL">전체 유형</option>';
        mathProbType.innerHTML = '';

        const sortedTypes = Object.keys(typesObj).map(key => {
            const val = typesObj[key];
            return { name: key, order: (val && val.order !== undefined) ? val.order : 999 };
        }).sort((a, b) => a.order - b.order);

        if(sortedTypes.length === 0) sortedTypes.push({ name: "미분류", order: 0 });

        sortedTypes.forEach(t => {
            filterTypeSelect.innerHTML += `<option value="${t.name}">${t.name}</option>`;
            mathProbType.innerHTML += `<option value="${t.name}">${t.name}</option>`;
        });

        if ([...filterTypeSelect.options].some(o => o.value === prevFilter)) filterTypeSelect.value = prevFilter;
        if ([...mathProbType.options].some(o => o.value === prevFormType)) mathProbType.value = prevFormType;
    }

    if(filterTypeSelect) {
        filterTypeSelect.addEventListener('change', () => {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snapshot) => { renderMathItems(snapshot.val() || {}); });
        });
    }

    function renderMathItems(probsObj) {
        if(!mathSavedList) return;
        mathSavedList.innerHTML = '';
        let list = Object.keys(probsObj).map(id => ({ id, ...probsObj[id] }));
        
        const selectedFilter = filterTypeSelect ? filterTypeSelect.value : "ALL";
        if (selectedFilter !== "ALL") list = list.filter(p => p.type === selectedFilter);

        if (list.length === 0) {
            mathSavedList.innerHTML = `<div style="font-size:0.78rem; color:#71717a; text-align:center; padding:20px 0;">등록된 문항이 없습니다.</div>`;
            return;
        }
        list.sort((a, b) => b.timestamp - a.timestamp);

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
                db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snap) => { renderMathItems(snap.val() || {}); });
            }
        });
    };

    window.deleteMathData = (event, id) => {
        event.stopPropagation();
        if(confirm("해당 문항을 영구 삭제합니까?")) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).remove();
            if (editingMathId === id) resetMathNotebookEditor();
        }
    };

    function resetMathNotebookEditor() {
        editingMathId = null; 
        if(mathProbTitle) mathProbTitle.value = ''; 
        if(mathProbWrong) mathProbWrong.value = ''; 
        if(mathProbApproach) mathProbApproach.value = ''; 
        if(mathProbSolution) mathProbSolution.value = '';
        if(activeMathFolder) db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snap) => { renderMathItems(snap.val() || {}); });
    }

    if(mathSaveBtn) {
        mathSaveBtn.addEventListener('click', () => {
            const title = mathProbTitle.value.trim(); if (!title) return alert('문항 제목을 입력하세요.');
            const payload = {
                title: title, type: mathProbType.value || '미분류', wrong: mathProbWrong.value.trim(),
                approach: mathProbApproach.value.trim(), solution: mathProbSolution.value.trim(), timestamp: Date.now()
            };
            if (editingMathId) db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${editingMathId}`).update(payload);
            else db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).push(payload);
            resetMathNotebookEditor();
        });
    }

    // 🌟 4-2) 유형 관리 모달 및 모바일 터치 드래그 스크롤 분리 로직
    if(btnManageTypes) btnManageTypes.addEventListener('click', () => { if(typeModal) typeModal.classList.remove('hidden'); });
    if(closeTypeModal) closeTypeModal.addEventListener('click', () => { if(typeModal) typeModal.classList.add('hidden'); });

    if(btnAddType) {
        btnAddType.addEventListener('click', () => {
            const typeName = newTypeInput.value.trim().replace(/[.#$\[\]]/g, "");
            if(!typeName) return alert('단원명을 기입해주세요.');
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes`).once('value', snap => {
                const data = snap.val() || {};
                const nextOrder = Object.keys(data).length;
                db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${typeName}`).set({ order: nextOrder });
                newTypeInput.value = '';
            });
        });
    }

    let activeTouchDraggingItem = null;

    function renderModalTypeList(typesObj) {
        if(!customTypeList) return;
        customTypeList.innerHTML = '';
        const sortedTypes = Object.keys(typesObj).map(key => {
            const val = typesObj[key];
            return { name: key, order: (val && val.order !== undefined) ? val.order : 999 };
        }).sort((a, b) => a.order - b.order);

        if(sortedTypes.length === 0) { 
            customTypeList.innerHTML = `<div style="font-size:0.75rem; color:#71717a; text-align:center; padding:10px;">등록된 유형이 없습니다.</div>`; 
            return; 
        }

        sortedTypes.forEach(t => {
            const div = document.createElement('div');
            div.className = 'type-manage-item';
            div.dataset.id = t.name;
            div.innerHTML = `
                <div>
                    <span class="drag-handle">☰</span>
                    <span>🏷️ ${t.name}</span>
                </div>
                <button class="compact-del-btn" onclick="deleteCustomType('${t.name}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            
            const handle = div.querySelector('.drag-handle');

            // PC 드래그앤드롭 이벤트
            div.setAttribute('draggable', 'true');
            div.addEventListener('dragstart', () => div.classList.add('dragging'));
            div.addEventListener('dragend', () => { div.classList.remove('dragging'); saveNewTypeOrder(); });

            // 모바일 터치이벤트 인터셉터 로직 (스크롤 간섭 차단)
            handle.addEventListener('touchstart', (e) => {
                activeTouchDraggingItem = div;
                div.classList.add('dragging');
            }, { passive: true });

            customTypeList.appendChild(div);
        });
    }

    if(customTypeList) {
        customTypeList.addEventListener('touchmove', (e) => {
            if (!activeTouchDraggingItem) return;
            const touch = e.touches[0];
            e.preventDefault(); // 정밀 핸들을 잡고 조작할 때만 브라우저 고유 스크롤 강제 잠금
            
            const afterElement = getDragAfterElement(customTypeList, '.type-manage-item', touch.clientX, touch.clientY);
            if (afterElement == null) customTypeList.appendChild(activeTouchDraggingItem);
            else customTypeList.insertBefore(activeTouchDraggingItem, afterElement);
        }, { passive: false });

        customTypeList.addEventListener('touchend', () => {
            if (activeTouchDraggingItem) {
                activeTouchDraggingItem.classList.remove('dragging');
                activeTouchDraggingItem = null;
                saveNewTypeOrder();
            }
        });

        customTypeList.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(customTypeList, '.type-manage-item', e.clientX, e.clientY);
            const draggingItem = document.querySelector('.type-manage-item.dragging');
            if(!draggingItem) return;
            if (afterElement == null) customTypeList.appendChild(draggingItem);
            else customTypeList.insertBefore(draggingItem, afterElement);
        });
    }

    function saveNewTypeOrder() {
        const items = [...customTypeList.querySelectorAll('.type-manage-item')];
        const updates = {};
        items.forEach((item, index) => {
            updates[`workspace/mathNotebooks/${activeMathFolder}/customTypes/${item.dataset.id}/order`] = index;
        });
        db.ref().update(updates);
    }

    window.deleteCustomType = (type) => {
        if(confirm(`[${type}] 유형을 삭제합니까?`)) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${type}`).remove();
        }
    };


    // --- 🛠️ 공통 정밀 위치 추적 유틸 ---
    function getDragAfterElement(container, selector, x, y) {
        const draggableElements = [...container.querySelectorAll(`${selector}:not(.dragging)`)];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offsetX = x - box.left - box.width / 2;
            const offsetY = y - box.top - box.height / 2;
            const distance = Math.sqrt(offsetX*offsetX + offsetY*offsetY);
            if (distance < closest.distance) return { distance: distance, element: child };
            else return closest;
        }, { distance: Infinity }).element;
    }

    function getTodayDateString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }

    // 초기 시동 연동
    renderCalendar();
    fetchDailyIntegratedData();
});
