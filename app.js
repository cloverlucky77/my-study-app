/* Ultimate Cloud Workspace JS - Optimized Hub Script */
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
    let currentViewDate = new Date(); 
    let selectedFullDate = getTodayDateString(); 

    // --- 🧭 1. 사이드바 컨트롤러 패널 ---
    const mainSidebar = document.getElementById('main-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    const btnOpenSidebar = document.getElementById('btn-open-sidebar');
    const outsideToggleButtons = document.querySelectorAll('.sidebar-toggle-outside');
    const menuItems = document.querySelectorAll('.menu-item');
    const contentViews = document.querySelectorAll('.content-view');
    const sidebarSubFolders = document.getElementById('sidebar-sub-folders');
    const folderAddForm = document.getElementById('sidebar-folder-add-form');
    const newFolderNameInput = document.getElementById('new-folder-name-input');

    if (btnCloseSidebar) {
        btnCloseSidebar.addEventListener('click', () => {
            mainSidebar.classList.add('collapsed');
            mainSidebar.classList.remove('active');
            if(btnOpenSidebar) btnOpenSidebar.classList.remove('hidden');
        });
    }
    if (btnOpenSidebar) {
        btnOpenSidebar.addEventListener('click', () => {
            mainSidebar.classList.remove('collapsed');
            mainSidebar.classList.add('active');
            btnOpenSidebar.classList.add('hidden');
        });
    }

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            const target = item.dataset.target;
            contentViews.forEach(view => {
                if(view.id === target) view.classList.remove('hidden');
                else view.classList.add('hidden');
            });
            if(window.innerWidth <= 768) {
                mainSidebar.classList.add('collapsed');
                mainSidebar.classList.remove('active');
                if(btnOpenSidebar) btnOpenSidebar.classList.remove('hidden');
            }
        });
    });


    // --- 📅 2. 달력 및 대제목 동기화 연동 모듈 변수 설정 ---
    const calendarDays = document.getElementById('calendar-days');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarViewTitle = document.getElementById('calendar-view-title'); 
    const selectedDateLabel = document.getElementById('selected-date-label');
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    const monthSummaryList = document.getElementById('month-summary-list');
    const monthTodoCount = document.getElementById('month-todo-count');

    // [수정] 하루 24H 단위 플래너 시간대 확장 스펙 정의 (05시~24시)
    const startHour = 5;
    const endHour = 24;
    const timelineContainer = document.getElementById('timeline-hours-container');
    const planReviewInput = document.getElementById('plan-review');
    const plannerSaveStatus = document.getElementById('planner-save-status');

    // [수정] 24H 시간 레이아웃을 생성하여 HTML에 주입하는 모듈
    function createTimelineUI() {
        if (!timelineContainer) return;
        timelineContainer.innerHTML = '';
        
        for (let h = startHour; h <= endHour; h++) {
            const hourStr = String(h).padStart(2, '0') + ':00';
            const row = document.createElement('div');
            row.className = 'timeline-row';
            
            row.innerHTML = `
                <span class="timeline-hour">${hourStr}</span>
                <input type="text" id="plan-hr-${h}" class="planner-text-input" placeholder="${hourStr}의 계획 및 실행 기록을 작성하세요...">
            `;
            
            row.querySelector('input').oninput = syncPlannerToCloud;
            timelineContainer.appendChild(row);
        }
    }
    createTimelineUI();

    document.getElementById('btn-prev-month').addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); renderCalendarGrid(); });
    document.getElementById('btn-next-month').addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); renderCalendarGrid(); });

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTodo = {
            date: selectedFullDate,
            time: todoTimeInput.value || "---",
            text: todoInput.value.trim(),
            done: false,
            timestamp: Date.now()
        };
        db.ref('workspace/todos').push(newTodo);
        todoInput.value = '';
        todoTimeInput.value = '';
    });

    function renderCalendarGrid() {
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        calendarMonthYear.textContent = `${year}년 ${String(month + 1).padStart(2, '0')}월`;
        if(calendarViewTitle) calendarViewTitle.textContent = `${year}년 ${month + 1}월 스케줄러 & 클라우드 워크스페이스`;

        calendarDays.innerHTML = '';
        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevLastDate = new Date(year, month, 0).getDate();

        for (let x = firstDayIndex; x > 0; x--) {
            const d = prevLastDate - x + 1;
            const cell = document.createElement('div');
            cell.className = 'day-cell other-month';
            cell.innerHTML = `<span class="day-number">${d}</span>`;
            calendarDays.appendChild(cell);
        }

        db.ref('workspace/todos').once('value', (snapshot) => {
            const todos = snapshot.val() || {};
            const currentMonthStr = `${year}-${String(month+1).padStart(2,'0')}`;
            const monthAllList = [];

            for (let i = 1; i <= lastDate; i++) {
                const iStr = String(i).padStart(2, '0');
                const fullDateStr = `${currentMonthStr}-${iStr}`;
                
                const cell = document.createElement('div');
                cell.className = 'day-cell';
                
                const currentDayOfWeek = new Date(year, month, i).getDay();
                if(currentDayOfWeek === 0) cell.classList.add('sun-cell');
                if(fullDateStr === getTodayDateString()) cell.classList.add('today');
                if(fullDateStr === selectedFullDate) cell.classList.add('selected');

                cell.innerHTML = `<span class="day-number">${i}</span><div class="day-indicators-row" id="ind-${fullDateStr}"></div>`;
                
                cell.addEventListener('click', () => {
                    selectedFullDate = fullDateStr;
                    document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected'));
                    cell.classList.add('selected');
                    selectedDateLabel.textContent = selectedFullDate;
                    fetchDailyIntegratedData();
                });

                calendarDays.appendChild(cell);

                const dayTodos = Object.keys(todos).map(id => ({id, ...todos[id]})).filter(t => t.date === fullDateStr);
                if (dayTodos.length > 0) {
                    const indContainer = document.getElementById(`ind-${fullDateStr}`);
                    if(indContainer) {
                        dayTodos.slice(0, 3).forEach(t => {
                            const dot = document.createElement('div');
                            dot.className = `indicator-dot ${t.done ? 'completed' : ''}`;
                            indContainer.appendChild(dot);
                        });
                    }
                    dayTodos.forEach(t => monthAllList.push(t));
                }
            }

            renderMonthSummaryData(monthAllList);
        });
    }

    function renderMonthSummaryData(list) {
        monthSummaryList.innerHTML = '';
        const activeCount = list.filter(t => !t.done).length;
        monthTodoCount.textContent = `${activeCount}개 일정 대기 중`;

        if (list.length === 0) {
            monthSummaryList.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:12px;">이번 달에 등록된 일정이 없습니다.</div>`;
            return;
        }

        list.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        list.forEach(item => {
            const dateShort = item.date.substring(5);
            const row = document.createElement('div');
            row.className = 'summary-todo-item';
            row.innerHTML = updateMonthSummaryItemHtml(dateShort, item);
            monthSummaryList.appendChild(row);
        });
    }

    function updateMonthSummaryItemHtml(dateShort, item) {
        return `
            <div class="summary-todo-left">
                <span class="summary-date-tag">${dateShort} ${item.time}</span>
                <span class="summary-todo-text ${item.done ? 'line-through' : ''}">${item.text}</span>
            </div>
            <div class="summary-status-dot ${item.done ? 'done' : ''}"></div>
        `;
    }

    function fetchDailyIntegratedData() {
        db.ref('workspace/todos').on('value', (snapshot) => {
            const todos = snapshot.val() || {};
            const list = Object.keys(todos).map(id => ({id, ...todos[id]})).filter(t => t.date === selectedFullDate);
            renderTodoListData(list);
        });
        
        // [수정] 05시부터 24시까지 세분화된 플래너 데이터 로드 및 맵핑
        db.ref(`workspace/dayPlanners/${selectedFullDate}`).once('value', (snapshot) => {
            const data = snapshot.val() || {};
            
            for (let h = startHour; h <= endHour; h++) {
                const inputField = document.getElementById(`plan-hr-${h}`);
                if (inputField) {
                    inputField.value = data[`hr_${h}`] || '';
                }
            }
            if(planReviewInput) planReviewInput.value = data.review || '';
            if(plannerSaveStatus) plannerSaveStatus.textContent = "자동 저장됨";
        });
    }

    function renderTodoListData(list) {
        todoList.innerHTML = '';
        list.sort((a,b) => a.time.localeCompare(b.time));
        
        let doneCount = list.filter(t => t.done).length;
        todoStats.textContent = `완료 ${doneCount} / 전체 ${list.length}`;

        if (list.length === 0) {
            todoList.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:20px;">오늘의 일정이 비어있습니다.</div>`;
            return;
        }

        list.forEach(todo => {
            const card = document.createElement('div');
            card.className = 'todo-item-card';
            card.innerHTML = `
                <div class="todo-item-left">
                    <span class="todo-checkbox-wrapper ${todo.done ? 'checked' : ''}" onclick="toggleTodoStatus('${todo.id}', ${todo.done})">
                        <i class="${todo.done ? 'fa-solid fa-square-check' : 'fa-regular fa-square'}"></i>
                    </span>
                    <span class="todo-card-time">${todo.time}</span>
                    <span class="todo-card-text ${todo.done ? 'completed' : ''}">${todo.text}</span>
                </div>
                <button type="button" class="btn-todo-delete" onclick="deleteTodoItem('${todo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(card);
        });
    }

    window.toggleTodoStatus = (id, currentStatus) => { db.ref(`workspace/todos/${id}`).update({ done: !currentStatus }).then(() => renderCalendarGrid()); };
    window.deleteTodoItem = (id) => { if(confirm("이 일정을 영구 삭제하시겠습니까?")) db.ref(`workspace/todos/${id}`).remove().then(() => renderCalendarGrid()); };

    // [수정] 24H 모든 인풋창들의 값 일괄 취합 후 저장 처리 로직 (Debounce)
    let plannerTimeout;
    function syncPlannerToCloud() {
        if(plannerSaveStatus) plannerSaveStatus.textContent = "저장 중...";
        clearTimeout(plannerTimeout);
        
        plannerTimeout = setTimeout(() => {
            const plannerData = {};
            
            for (let h = startHour; h <= endHour; h++) {
                const inputField = document.getElementById(`plan-hr-${h}`);
                if (inputField) {
                    plannerData[`hr_${h}`] = inputField.value;
                }
            }
            plannerData['review'] = planReviewInput ? planReviewInput.value : '';

            db.ref(`workspace/dayPlanners/${selectedFullDate}`).set(plannerData);
            if(plannerSaveStatus) plannerSaveStatus.textContent = "자동 저장됨";
        }, 500);
    }
    
    if(planReviewInput) planReviewInput.oninput = syncPlannerToCloud;

    selectedDateLabel.textContent = selectedFullDate;
    renderCalendarGrid();
    fetchDailyIntegratedData();


    // --- 💡 3. 아이디어 메모장 연동 모듈 ---
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const btnSaveMemo = document.getElementById('btn-save-memo');
    const memoContainer = document.getElementById('memo-container');

    if(btnSaveMemo) {
        btnSaveMemo.addEventListener('click', () => {
            const title = memoTitle.value.trim();
            const body = memoContent.value.trim();
            if(!title || !body) { alert("제목과 내용을 모두 빠짐없이 입력하세요!"); return; }

            const newMemo = { title, body, date: getTodayDateString(), timestamp: Date.now() };
            db.ref('workspace/memos').push(newMemo).then(() => {
                memoTitle.value = '';
                memoContent.value = '';
            });
        });
    }

    db.ref('workspace/memos').on('value', (snapshot) => {
        if(!memoContainer) return;
        memoContainer.innerHTML = '';
        const memos = snapshot.val() || {};
        const memoList = Object.keys(memos).map(id => ({id, ...memos[id]})).sort((a,b) => b.timestamp - a.timestamp);

        if(memoList.length === 0) {
            memoContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px; font-size:0.9rem;">등록된 클라우드 아이디어가 없습니다.</div>`;
            return;
        }

        memoList.forEach(m => {
            const card = document.createElement('div');
            card.className = 'memo-card';
            card.innerHTML = `
                <div>
                    <div class="memo-card-header">
                        <h4 class="memo-card-title">${m.title}</h4>
                        <button class="btn-memo-delete" onclick="deleteMemoItem('${m.id}')">&times;</button>
                    </div>
                    <p class="memo-card-body">${m.body.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="memo-card-footer">${m.date}</div>
            `;
            memoContainer.appendChild(card);
        });
    });

    window.deleteMemoItem = (id) => { if(confirm("이 메모 카드를 삭제할까요?")) db.ref(`workspace/memos/${id}`).remove(); };


    // --- 🧮 4. 수학 오답노트 연동 모듈 패널 ---
    let activeMathFolder = '';
    let activeMathItemId = '';
    const customTypeList = document.getElementById('custom-type-list');
    const mathTypeSelect = document.getElementById('math-type-select');
    const mathItemsContainer = document.getElementById('math-items-container');
    const mathFolderListTitle = document.getElementById('math-folder-list-title');

    const mathSource = document.getElementById('math-source');
    const mathNumber = document.getElementById('math-number');
    const mathDifficulty = document.getElementById('math-difficulty');
    const mathWrongReason = document.getElementById('math-wrong-reason');
    const mathStatus = document.getElementById('math-status');
    const mathQuestion = document.getElementById('math-question');
    const mathSolution = document.getElementById('math-solution');
    const mathSaveBtn = document.getElementById('math-save-btn');
    const btnNewMathItem = document.getElementById('btn-new-math-item');

    db.ref('workspace/mathFolders').on('value', (snapshot) => {
        if(!sidebarSubFolders) return;
        sidebarSubFolders.innerHTML = '';
        const folders = snapshot.val() || {};
        
        Object.keys(folders).forEach(id => {
            const f = folders[id];
            const item = document.createElement('div');
            item.className = `sub-folder-item ${activeMathFolder === id ? 'active' : ''}`;
            item.dataset.id = id;
            item.innerHTML = `
                <div><i class="fa-regular fa-folder"></i> <span>${f.name}</span></div>
                <button type="button" class="btn-del-folder" onclick="event.stopPropagation(); deleteMathFolder('${id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            
            item.addEventListener('click', () => {
                activeMathFolder = id;
                document.querySelectorAll('.sub-folder-item').forEach(sf => sf.classList.remove('active'));
                item.classList.add('active');
                
                document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
                const mBtn = document.getElementById('menu-btn-math');
                if(mBtn) mBtn.classList.add('active');
                contentViews.forEach(view => { if(view.id === 'view-math') view.classList.remove('hidden'); else view.classList.add('hidden'); });

                mathFolderListTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> [${f.name}] 단원 리스트`;
                initMathEditorForm();
                loadMathItemsForFolder();
                listenToCustomTypes();
            });

            sidebarSubFolders.appendChild(item);
        });
    });

    if(folderAddForm) {
        folderAddForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = newFolderNameInput.value.trim();
            if(!name) return;
            db.ref('workspace/mathFolders').push({ name, timestamp: Date.now() }).then(() => { newFolderNameInput.value = ''; });
        });
    }

    window.deleteMathFolder = (id) => {
        if(confirm("단원을 삭제하면 해당 단원 내의 모든 오답 문항 데이터가 영구 소멸됩니다. 정말 삭제하시겠습니까?")) {
            db.ref(`workspace/mathFolders/${id}`).remove();
            db.ref(`workspace/mathNotebooks/${id}`).remove();
            if(activeMathFolder === id) { activeMathFolder = ''; mathItemsContainer.innerHTML = ''; initMathEditorForm(); mathFolderListTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> 선택된 단원 문항 리스트`; }
        }
    };

    function loadMathItemsForFolder() {
        if(!activeMathFolder) return;
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/items`).on('value', (snapshot) => {
            if(!mathItemsContainer) return;
            mathItemsContainer.innerHTML = '';
            const items = snapshot.val() || {};
            const list = Object.keys(items).map(id => ({id, ...items[id]})).sort((a,b) => b.timestamp - a.timestamp);

            if(list.length === 0) {
                mathItemsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:40px; font-size:0.85rem;">단원에 등록된 오답 문항이 없습니다. <br>상단 우측 '새 문항 등록' 버튼을 누르세요.</div>`;
                return;
            }

            list.forEach(item => {
                const card = document.createElement('div');
                card.className = `math-item-card ${activeMathItemId === item.id ? 'active' : ''}`;
                card.innerHTML = `
                    <div class="math-card-top-meta">
                        <span class="math-card-identity">${item.source || '미정출처'} - ${item.number || '0'}번</span>
                        <div class="math-card-badges">
                            <span class="badge-unit diff-${item.difficulty}">${item.difficulty || '중'}</span>
                            <span class="badge-unit status-${item.status ? item.status.substring(0,2) : '다시'}">${item.status || '미지정'}</span>
                        </div>
                    </div>
                    <div class="math-card-core-question">${item.question || '요약 코멘트가 없습니다.'}</div>
                    <div class="math-card-bottom-row">
                        <span class="math-reason-tag"><i class="fa-solid fa-triangle-exclamation"></i> ${item.wrongReason || '원인 분석 미지정'}</span>
                        <button type="button" class="btn-math-delete" onclick="event.stopPropagation(); deleteMathItemUnit('${item.id}')"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                `;

                card.addEventListener('click', () => {
                    activeMathItemId = item.id;
                    document.querySelectorAll('.math-item-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    bindMathItemToEditor(item);
                });

                mathItemsContainer.appendChild(card);
            });
        });
    }

    function initMathEditorForm() {
        activeMathItemId = '';
        if(mathSource) mathSource.value = '';
        if(mathNumber) mathNumber.value = '';
        if(mathDifficulty) mathDifficulty.value = '중';
        if(mathWrongReason) mathWrongReason.value = '개념 부족';
        if(mathStatus) mathStatus.value = '다시 풀어야 함';
        if(mathQuestion) mathQuestion.value = '';
        if(mathSolution) mathSolution.value = '';
        const label = document.getElementById('math-editor-title-label');
        if(label) label.innerHTML = `<i class="fa-solid fa-square-poll-horizontal"></i> 신규 오답 문항 등록 모드`;
    }

    if(btnNewMathItem) { btnNewMathItem.addEventListener('click', () => { initMathEditorForm(); document.querySelectorAll('.math-item-card').forEach(c => c.classList.remove('active')); }); }

    function bindMathItemToEditor(item) {
        if(mathSource) mathSource.value = item.source || '';
        if(mathNumber) mathNumber.value = item.number || '';
        if(mathDifficulty) mathDifficulty.value = item.difficulty || '중';
        if(mathWrongReason) mathWrongReason.value = item.wrongReason || '개념 부족';
        if(mathStatus) mathStatus.value = item.status || '다시 풀어야 함';
        if(mathQuestion) mathQuestion.value = item.question || '';
        if(mathSolution) mathSolution.value = item.solution || '';
        const label = document.getElementById('math-editor-title-label');
        if(label) label.innerHTML = `<i class="fa-solid fa-square-poll-horizontal"></i> 문항 상세 데이터 수정 중`;
    }

    if(mathSaveBtn) {
        mathSaveBtn.addEventListener('click', () => {
            if(!activeMathFolder) { alert("좌측 사이드바에서 타겟 단원 폴더를 먼저 개설하고 선택해주세요!"); return; }
            const payload = {
                source: mathSource.value.trim(),
                number: mathNumber.value.trim(),
                difficulty: mathDifficulty.value,
                wrongReason: mathWrongReason.value,
                status: mathStatus.value,
                question: mathQuestion.value.trim(),
                solution: mathSolution.value.trim(),
                timestamp: Date.now()
            };

            if(activeMathItemId) {
                db.ref(`workspace/mathNotebooks/${activeMathFolder}/items/${activeMathItemId}`).update(payload).then(() => alert("클라우드 오답노트 수정 반영 완료!"));
            } else {
                db.ref(`workspace/mathNotebooks/${activeMathFolder}/items`).push(payload).then((snap) => { activeMathItemId = snap.key; alert("새로운 오답 문항이 성공적으로 클라우드에 안착되었습니다!"); });
            }
        });
    }

    window.deleteMathItemUnit = (id) => { if(confirm("해당 오답 문항을 목록에서 지우시겠습니까?")) { db.ref(`workspace/mathNotebooks/${activeMathFolder}/items/${id}`).remove().then(() => { if(activeMathItemId === id) initMathEditorForm(); }); } };


    // --- 🪟 5. 드래그 레이아웃 제어 유형관리 모달 제어 서브 파트 ---
    const typeModal = document.getElementById('type-modal');
    const btnOpenTypeModal = document.getElementById('btn-open-type-modal');
    const btnCloseTypeModal = document.getElementById('close-type-modal');
    const btnAddType = document.getElementById('btn-add-type');
    const newTypeInput = document.getElementById('new-type-input');

    if(btnOpenTypeModal) { btnOpenTypeModal.addEventListener('click', () => { if(!activeMathFolder){ alert("단원 폴더를 먼저 지정하세요!"); return; } typeModal.classList.remove('hidden'); }); }
    if(btnCloseTypeModal) { btnCloseTypeModal.addEventListener('click', () => typeModal.classList.add('hidden')); }

    function listenToCustomTypes() {
        if(!activeMathFolder) return;
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes`).orderByChild('order').on('value', (snapshot) => {
            if(!customTypeList || !mathTypeSelect) return;
            customTypeList.innerHTML = '';
            mathTypeSelect.innerHTML = `<option value="미지정">일반 기본 유형</option>`;

            const types = snapshot.val() || {};
            const sortedTypes = Object.keys(types).map(id => ({id, ...types[id]})).sort((a,b) => (a.order || 0) - (b.order || 0));

            sortedTypes.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id; opt.textContent = t.id;
                mathTypeSelect.appendChild(opt);

                const row = document.createElement('div');
                row.className = 'type-manage-item';
                row.draggable = true;
                row.dataset.id = t.id;
                row.innerHTML = `<div><i class="fa-solid fa-bars"></i> <span>${t.id}</span></div><button type="button" class="btn-todo-delete" onclick="deleteCustomType('${t.id}')">&times;</button>`;
                
                row.addEventListener('dragstart', () => row.classList.add('dragging'));
                row.addEventListener('dragend', () => { row.classList.remove('dragging'); saveNewTypeOrder(); });
                customTypeList.appendChild(row);
            });

            initDragAndDropEvents();
        });
    }

    if(btnAddType) {
        btnAddType.addEventListener('click', () => {
            const val = newTypeInput.value.trim();
            if(!val) return;
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${val}`).set({ order: 999 }).then(() => { newTypeInput.value = ''; });
        });
    }

    function initDragAndDropEvents() {
        if(!customTypeList) return;
        customTypeList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(customTypeList, '.type-manage-item', e.clientX, e.clientY);
            const draggingItem = document.querySelector('.dragging');
            if(!draggingItem) return;
            if (afterElement == null) customTypeList.appendChild(draggingItem);
            else customTypeList.insertBefore(draggingItem, afterElement);
        });
    }

    function saveNewTypeOrder() {
        const items = [...customTypeList.querySelectorAll('.type-manage-item')];
        const updates = {};
        items.forEach((item, index) => { updates[`workspace/mathNotebooks/${activeMathFolder}/customTypes/${item.dataset.id}/order`] = index; });
        db.ref().update(updates);
    }

    window.deleteCustomType = (type) => {
        if(confirm(`[${type}] 유형을 소멸시키겠습니까?`)) db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${type}`).remove();
    };


    // --- 🛠️ 유틸리티 모듈 ---
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
});
