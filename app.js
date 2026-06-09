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

    // 🕒 신설된 하루 정리 플래너 DOM 엘리먼트 추적
    const planAmInput = document.getElementById('plan-am');
    const planPmInput = document.getElementById('plan-pm');
    const planEveInput = document.getElementById('plan-eve');
    const planReviewInput = document.getElementById('plan-review');
    const plannerSaveStatus = document.getElementById('planner-save-status');

    // --- 기존 app.js 내 renderCalendar 함수 수정 ---
    function renderCalendar() {
        if(!calendarDays) return;
        calendarDays.innerHTML = '';
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
    
    // 1. 달력 카드 내부의 연월 표시 (예: 2026년 6월)
        if(calendarMonthYear) {
            calendarMonthYear.textContent = `${year}년 ${month + 1}월`;
        }
    
    // 🔍 [여기 수정] 왼쪽 위 대제목(2024년 00월)도 실시간으로 연동되도록 추가합니다!
        const calendarViewTitle = document.getElementById('calendar-view-title');
        if(calendarViewTitle) {
            calendarViewTitle.textContent = `${year}년 ${String(month + 1).padStart(2, '0')}월`;
        }
    
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
    
    // ... 이하 기존 달력 렌더링 코드 동일 ...
        
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
        
        // [새 기능] 날짜 변경 시 해당 날짜의 하루 일정 플래너 정보 불러오기
        db.ref(`workspace/dayPlanners/${selectedFullDate}`).once('value', (snapshot) => {
            const data = snapshot.val() || { am: '', pm: '', eve: '', review: '' };
            if(planAmInput) planAmInput.value = data.am || '';
            if(planPmInput) planPmInput.value = data.pm || '';
            if(planEveInput) planEveInput.value = data.eve || '';
            if(planReviewInput) planReviewInput.value = data.review || '';
            if(plannerSaveStatus) plannerSaveStatus.textContent = "자동 저장됨";
        });
    }

    // 하루 일정 플래너 인풋 입력 시 디바운스 실시간 Firebase 전송 처리
    let plannerTimeout;
    function syncPlannerToCloud() {
        if(plannerSaveStatus) plannerSaveStatus.textContent = "저장 중...";
        clearTimeout(plannerTimeout);
        plannerTimeout = setTimeout(() => {
            db.ref(`workspace/dayPlanners/${selectedFullDate}`).set({
                am: planAmInput.value,
                pm: planPmInput.value,
                eve: planEveInput.value,
                review: planReviewInput.value
            });
            if(plannerSaveStatus) plannerSaveStatus.textContent = "자동 저장됨";
        }, 500);
    }

    if(planAmInput) planAmInput.oninput = syncPlannerToCloud;
    if(planPmInput) planPmInput.oninput = syncPlannerToCloud;
    if(planEveInput) planEveInput.oninput = syncPlannerToCloud;
    if(planReviewInput) planReviewInput.oninput = syncPlannerToCloud;

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
        if(list.length === 0){
            savedMemosContainer.innerHTML = `<div style="color:#71717a; font-size:0.8rem; text-align:center;">보관함이 비어있습니다.</div>`;
            return;
        }
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
            if (data) {
                memoTitleInput.value = data.title;
                memoTextarea.value = data.content;
                editingMemoId = id;
            }
        });
    };

    window.deleteMemoData = (event, id) => {
        event.stopPropagation();
        db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).remove();
        if(editingMemoId===id) resetMemoEditor();
    };

    function resetMemoEditor() {
        memoTitleInput.value = '';
        memoTextarea.value = '';
        editingMemoId = null;
    }

    if(saveMemoBtn) {
        saveMemoBtn.addEventListener('click', () => {
            const text = memoTextarea.value.trim();
            if (!text) return;
            const payload = {
                title: memoTitleInput.value.trim() || text.substring(0,12),
                content: text,
                date: getTodayDateString()
            };
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
    const mathProblemsContainer = document.getElementById('math-problems-container');
    const mathNewProbBtn = document.getElementById('math-new-prob-btn');
    
    const btnOpenTypeModal = document.getElementById('btn-open-type-modal');
    const modalOverlay = document.getElementById('type-modal');
    const closeTypeModal = document.getElementById('close-type-modal');
    const newTypeInput = document.getElementById('new-type-input');
    const btnAddType = document.getElementById('btn-add-type');
    const customTypeList = document.getElementById('custom-type-list');

    let activeMathFolder = null;
    let editingProbId = null;

    db.ref('workspace/mathNotebooks').on('value', (snapshot) => {
        const mathData = snapshot.val() || {};
        renderMathDashboard(mathData);
        renderSidebarMathFolders(mathData);
        if(activeMathFolder) {
            if(!mathData[activeMathFolder]) { exitMathFolderScope(); }
            else {
                renderMathProblemsList(mathData[activeMathFolder].problems || {});
                renderTypeSelectOptions(mathData[activeMathFolder].customTypes || {});
                renderTypeManageItems(mathData[activeMathFolder].customTypes || {});
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
                <button class="btn-folder-delete-absolute" onclick="deleteEntireMathFolder(event, '${folder.name}')"><i class="fa-regular fa-trash-can"></i></button>
                <div class="folder-icon" style="color:#60a5fa;"><i class="fa-solid fa-book"></i></div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-memo-count">${count}개 오답</div>
            `;
            card.addEventListener('click', (e) => {
                if(e.target.closest('.btn-folder-delete-absolute')) return;
                enterMathFolderScope(folder.name);
            });
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => { card.classList.remove('dragging'); saveNewMathFolderOrder(); });
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

    function saveNewMathFolderOrder() {
        const cards = [...mathFolderGrid.querySelectorAll('.folder-card')];
        const updates = {};
        cards.forEach((card, index) => { updates[`workspace/mathNotebooks/${card.dataset.id}/order`] = index; });
        db.ref().update(updates);
    }

    function renderSidebarMathFolders(mathData) {
        if(!sidebarSubFolders) return;
        sidebarSubFolders.innerHTML = '';
        const sorted = Object.keys(mathData).map(name => ({
            name, order: mathData[name].order !== undefined ? mathData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        sorted.forEach(folder => {
            const btn = document.createElement('button');
            btn.className = 'sub-menu-item';
            btn.innerHTML = `<i class="fa-solid fa-book-open"></i> ${folder.name}`;
            btn.addEventListener('click', () => {
                menuItems.forEach(b => b.classList.remove('active'));
                document.getElementById('menu-btn-math').classList.add('active');
                contentViews.forEach(v => v.id === 'view-math' ? v.classList.remove('hidden') : v.classList.add('hidden'));
                sidebarSubFolders.classList.remove('hidden');
                enterMathFolderScope(folder.name);
            });
            sidebarSubFolders.appendChild(btn);
        });
    }

    if(mathCreateFolderBtn) {
        mathCreateFolderBtn.addEventListener('click', () => {
            const name = prompt('새 오답노트 과목/대단원 이름 입력:');
            if(!name) return;
            const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
            if(cleaned) db.ref('workspace/mathNotebooks/' + cleaned).set({ createdAt: Date.now(), order: 999, problems: {} });
        });
    }

    window.deleteEntireMathFolder = (event, folderName) => {
        event.stopPropagation();
        if(confirm(`[${folderName}] 과목 내부의 모든 문항 데이터가 영구히 소멸됩니다.`)) {
            db.ref('workspace/mathNotebooks/' + folderName).remove();
        }
    };

    function enterMathFolderScope(folderName) {
        activeMathFolder = folderName; resetMathEditor();
        if(mathExplorerZone) mathExplorerZone.classList.add('hidden');
        if(mathEditorZone) mathEditorZone.classList.remove('hidden');
        if(mathCurrentFolderTitle) mathCurrentFolderTitle.innerHTML = `<i class="fa-solid fa-book-open"></i> ${activeMathFolder}`;
    }
    if(mathBackBtn) mathBackBtn.addEventListener('click', exitMathFolderScope);
    function exitMathFolderScope() { activeMathFolder = null; if(mathEditorZone) mathEditorZone.classList.add('hidden'); if(mathExplorerZone) mathExplorerZone.classList.remove('hidden'); }

    function renderMathProblemsList(probsObj) {
        if(!mathProblemsContainer) return;
        mathProblemsContainer.innerHTML = '';
        const list = Object.keys(probsObj).map(id => ({ id, ...probsObj[id] }));
        if(list.length === 0) {
            mathProblemsContainer.innerHTML = `<div style="color:#71717a; font-size:0.8rem; text-align:center;">오답 문항이 없습니다.</div>`;
            return;
        }
        list.forEach(prob => {
            const typeLabel = prob.type ? `[${prob.type}] ` : '';
            const card = document.createElement('div');
            card.className = 'item-row';
            card.innerHTML = `
                <span class="item-text" onclick="loadMathProbData('${prob.id}')"><b style="color:#f87171;">${typeLabel}</b>${prob.title}</span>
                <button class="compact-del-btn" onclick="deleteMathProbData(event, '${prob.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            mathProblemsContainer.appendChild(card);
        });
    }

    window.loadMathProbData = (id) => {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).once('value', (snap) => {
            const data = snap.val();
            if(data) {
                mathProbTitle.value = data.title || '';
                mathProbType.value = data.type || '';
                mathProbWrong.value = data.wrongReason || '';
                mathProbApproach.value = data.approach || '';
                mathProbSolution.value = data.solution || '';
                editingProbId = id;
            }
        });
    };

    window.deleteMathProbData = (event, id) => {
        event.stopPropagation();
        if(confirm('이 문항을 삭제하시겠습니까?')) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).remove();
            if(editingProbId === id) resetMathEditor();
        }
    };

    function resetMathEditor() {
        mathProbTitle.value = '';
        mathProbWrong.value = '';
        mathProbApproach.value = '';
        mathProbSolution.value = '';
        editingProbId = null;
        if(mathProbType.options.length > 0) mathProbType.selectedIndex = 0;
    }
    if(mathNewProbBtn) mathNewProbBtn.addEventListener('click', resetMathEditor);

    if(mathSaveBtn) {
        mathSaveBtn.addEventListener('click', () => {
            const title = mathProbTitle.value.trim();
            if(!title) return alert('문제 제목을 최소한 입력해주세요.');
            const payload = {
                title,
                type: mathProbType.value,
                wrongReason: mathProbWrong.value.trim(),
                approach: mathProbApproach.value.trim(),
                solution: mathProbSolution.value.trim(),
                updatedAt: Date.now()
            };
            if(editingProbId) db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${editingProbId}`).update(payload);
            else db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).push(payload);
            resetMathEditor();
        });
    }

    function renderTypeSelectOptions(typesObj) {
        if(!mathProbType) return;
        const currentSelected = mathProbType.value;
        mathProbType.innerHTML = '';
        const sorted = Object.keys(typesObj).map(id => ({ id, ...typesObj[id], order: typesObj[id].order !== undefined ? typesObj[id].order : 999 })).sort((a,b) => a.order - b.order);
        
        if(sorted.length === 0) {
            mathProbType.innerHTML = `<option value="">등록된 유형 없음</option>`;
            return;
        }
        sorted.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id; opt.textContent = t.id;
            if(t.id === currentSelected) opt.selected = true;
            mathProbType.appendChild(opt);
        });
    }

    if(btnOpenTypeModal) btnOpenTypeModal.onclick = () => modalOverlay.classList.remove('hidden');
    if(closeTypeModal) closeTypeModal.onclick = () => modalOverlay.classList.add('hidden');

    if(btnAddType) {
        btnAddType.onclick = () => {
            const val = newTypeInput.value.trim().replace(/[.#$\[\]]/g, "");
            if(!val) return;
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${val}`).set({ order: 999 });
            newTypeInput.value = '';
        };
    }

    function renderTypeManageItems(typesObj) {
        if(!customTypeList) return;
        customTypeList.innerHTML = '';
        const sorted = Object.keys(typesObj).map(id => ({ id, ...typesObj[id], order: typesObj[id].order !== undefined ? typesObj[id].order : 999 })).sort((a,b) => a.order - b.order);

        sorted.forEach(t => {
            const item = document.createElement('div');
            item.className = 'type-manage-item';
            item.setAttribute('draggable', 'true');
            item.dataset.id = t.id;
            item.innerHTML = `
                <span><i class="fa-solid fa-bars" style="color:#4b5563; margin-right:8px; cursor:grab;"></i> ${t.id}</span>
                <button class="compact-del-btn" onclick="deleteCustomType('${t.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            item.addEventListener('dragstart', () => item.classList.add('dragging'));
            item.addEventListener('dragend', () => { item.classList.remove('dragging'); saveNewTypeOrder(); });
            customTypeList.appendChild(item);
        });
    }

    if(customTypeList) {
        customTypeList.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(customTypeList, '.type-manage-item', e.clientX, e.clientY);
            const draggingItem = document.querySelector('#custom-type-list .type-manage-item.dragging');
            if(!draggingItem) return;
            if(afterElement == null) customTypeList.appendChild(draggingItem);
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
            const offsetY = y - box.top - box.width / 2; // 중앙점 기반 정밀 유도식 유지
            const distance = Math.sqrt(offsetX*offsetX + offsetY*offsetY);
            if (distance < closest.distance) return { distance: distance, element: child };
            else return closest;
        }, { distance: Infinity }).element;
    }

    function getTodayDateString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }

    // 초기 시스템 기동
    renderCalendar();
    fetchDailyIntegratedData();
});
