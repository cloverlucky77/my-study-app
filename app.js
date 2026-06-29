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

    // --- 🧭 1. 사이드바 및 토글 제어 ---
    const mainSidebar = document.getElementById('main-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    const btnOpenSidebar = document.getElementById('btn-open-sidebar');
    const menuItems = document.querySelectorAll('.menu-item');
    const contentViews = document.querySelectorAll('.content-view');
    const sidebarSubFolders = document.getElementById('sidebar-sub-folders');
    const folderAddForm = document.getElementById('sidebar-folder-add-form');
    const newFolderNameInput = document.getElementById('new-folder-name-input');

    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', () => mainSidebar.classList.remove('active'));
    if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', () => mainSidebar.classList.add('active'));

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            const target = item.dataset.target;
            contentViews.forEach(view => {
                if(view.id === target) view.classList.remove('hidden');
                else view.classList.add('hidden');
            });
            mainSidebar.classList.remove('active');
        });
    });

    // --- 📅 2. 인터랙티브 달력 & 플래너 기능 모듈 ---
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
    
    // 플래너 신규 연동 바인딩 요소
    const plannerDirectForm = document.getElementById('planner-direct-form');
    const plannerDirectTime = document.getElementById('planner-direct-time');
    const plannerDirectText = document.getElementById('planner-direct-text');
    const timelineHoursContainer = document.getElementById('timeline-hours-container');
    const planReviewInput = document.getElementById('plan-review');
    const plannerSaveStatus = document.getElementById('planner-save-status');

    document.getElementById('btn-prev-month').addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); renderCalendarGrid(); });
    document.getElementById('btn-next-month').addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); renderCalendarGrid(); });

    if(todoForm) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rawTime = todoTimeInput.value;
            const finalTime = rawTime ? rawTime : "23:59";

            const newTodo = {
                date: selectedFullDate,
                time: finalTime,
                text: todoInput.value.trim(),
                done: false,
                timestamp: Date.now()
            };
            db.ref('workspace/todos').push(newTodo);
            todoInput.value = '';
            todoTimeInput.value = '';
        });
    }

    // 🌟 플래너 전용 폼 등록 처리 이벤트 추가
    if (plannerDirectForm) {
        plannerDirectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPlan = {
                date: selectedFullDate,
                time: plannerDirectTime.value,
                text: plannerDirectText.value.trim(),
                timestamp: Date.now()
            };
            db.ref('workspace/timelinePlanners').push(newPlan).then(() => {
                plannerDirectText.value = '';
                plannerDirectTime.value = '';
            });
        });
    }

    function renderCalendarGrid() {
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        if(calendarMonthYear) calendarMonthYear.textContent = `${year}년 ${String(month + 1).padStart(2, '0')}월`;
        if(calendarViewTitle) calendarViewTitle.textContent = `${year}년 ${month + 1}월 스케줄러 & 클라우드 워크스페이스`;

        if(!calendarDays) return;
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
                if(fullDateStr === getTodayDateString()) cell.classList.add('today');
                if(fullDateStr === selectedFullDate) cell.classList.add('selected');

                cell.innerHTML = `<span class="day-number">${i}</span><div class="day-indicators-row" id="ind-${fullDateStr}"></div>`;
                
                cell.addEventListener('click', () => {
                    selectedFullDate = fullDateStr;
                    document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected'));
                    cell.classList.add('selected');
                    if(selectedDateLabel) selectedDateLabel.textContent = selectedFullDate;
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
        if(!monthSummaryList) return;
        monthSummaryList.innerHTML = '';
        const activeCount = list.filter(t => !t.done).length;
        if(monthTodoCount) monthTodoCount.textContent = `${activeCount}개 일정 대기 중`;

        if (list.length === 0) {
            monthSummaryList.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:12px;">이번 달에 등록된 일정이 없습니다.</div>`;
            return;
        }

        list.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        list.forEach(item => {
            const dateShort = item.date.substring(5);
            const row = document.createElement('div');
            row.className = 'summary-todo-item';
            row.innerHTML = `
                <div class="summary-todo-left">
                    <span class="summary-date-tag">${dateShort} ${item.time === "23:59" ? "미지정" : item.time}</span>
                    <span class="summary-todo-text ${item.done ? 'line-through' : ''}">${item.text}</span>
                </div>
                <div class="summary-status-dot ${item.done ? 'done' : ''}"></div>
            `;
            
            row.addEventListener('click', () => {
                selectedFullDate = item.date;
                const parsedDate = new Date(item.date);
                currentViewDate.setFullYear(parsedDate.getFullYear());
                currentViewDate.setMonth(parsedDate.getMonth());
                if(selectedDateLabel) selectedDateLabel.textContent = selectedFullDate;
                renderCalendarGrid();
                fetchDailyIntegratedData();
            });
            monthSummaryList.appendChild(row);
        });
    }

    function fetchDailyIntegratedData() {
        // 투두리스트 데이터를 실시간으로 제어
        db.ref('workspace/todos').on('value', (snapshot) => {
            const todos = snapshot.val() || {};
            const list = Object.keys(todos).map(id => ({id, ...todos[id]})).filter(t => t.date === selectedFullDate);
            renderTodoListData(list);
        });
        
        // 🌟 플래너 전용 데이터 감시 및 정렬 처리 함수 실행
        fetchTimelinePlannerData();

        // 하루 성찰 리뷰 가져오기
        db.ref(`workspace/dayPlanners/${selectedFullDate}/review`).once('value', (snapshot) => {
            if(planReviewInput) planReviewInput.value = snapshot.val() || '';
        });
    }

    function renderTodoListData(list) {
        if(!todoList) return;
        todoList.innerHTML = '';
        list.sort((a,b) => a.time.localeCompare(b.time));
        
        let doneCount = list.filter(t => t.done).length;
        if(todoStats) todoStats.textContent = `완료 ${doneCount} / 전체 ${list.length}`;

        if (list.length === 0) {
            todoList.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:20px;">오늘 등록된 일정이 존재하지 않습니다.</div>`;
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
                    <span class="todo-card-time">${todo.time === "23:59" ? "종일" : todo.time}</span>
                    <span class="todo-card-text ${todo.done ? 'completed' : ''}">${todo.text}</span>
                </div>
                <button type="button" class="btn-todo-delete" onclick="deleteTodoItem('${todo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(card);
        });
    }

    // 🌟 [핵심] 플래너 일정 불러오기 및 시간 오름차순 자동 정렬 처리 함수
    function fetchTimelinePlannerData() {
        db.ref('workspace/timelinePlanners').on('value', (snapshot) => {
            if (!timelineHoursContainer) return;
            timelineHoursContainer.innerHTML = '';

            const data = snapshot.val() || {};
            const dayPlans = Object.keys(data)
                .map(id => ({ id, ...data[id] }))
                .filter(p => p.date === selectedFullDate);

            if (dayPlans.length === 0) {
                timelineHoursContainer.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:40px 10px;">등록된 플랜 일정이 없습니다. 시간을 입력해 추가해보세요!</div>`;
                return;
            }

            // 오름차순 정렬 (빠른 시간부터 순서대로)
            dayPlans.sort((a, b) => a.time.localeCompare(b.time));

            dayPlans.forEach(plan => {
                const row = document.createElement('div');
                row.className = 'timeline-row';
                row.innerHTML = `
                    <div class="timeline-left-group">
                        <span class="timeline-hour">${plan.time}</span>
                        <span class="timeline-text-display">${plan.text}</span>
                    </div>
                    <button type="button" class="btn-timeline-delete" onclick="deleteTimelinePlan('${plan.id}')">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                `;
                timelineHoursContainer.appendChild(row);
            });
            if(plannerSaveStatus) plannerSaveStatus.textContent = "동기화 완료";
        });
    }

    window.toggleTodoStatus = (id, currentStatus) => { db.ref(`workspace/todos/${id}`).update({ done: !currentStatus }).then(() => renderCalendarGrid()); };
    window.deleteTodoItem = (id) => { if(confirm("이 할 일을 삭제하시겠습니까?")) db.ref(`workspace/todos/${id}`).remove().then(() => renderCalendarGrid()); };
    
    // 🌟 플래너 일정 개별 삭제 글로벌 바인딩
    window.deleteTimelinePlan = (id) => {
        if (confirm("이 플래너 일정을 삭제하시겠습니까?")) {
            db.ref(`workspace/timelinePlanners/${id}`).remove();
        }
    };

    // 오늘의 피드백 저장 바인딩
    if(planReviewInput) {
        let reviewTimeout;
        planReviewInput.oninput = () => {
            clearTimeout(reviewTimeout);
            reviewTimeout = setTimeout(() => {
                db.ref(`workspace/dayPlanners/${selectedFullDate}`).update({ review: planReviewInput.value });
            }, 400);
        };
    }

    if(selectedDateLabel) selectedDateLabel.textContent = selectedFullDate;
    renderCalendarGrid();
    fetchDailyIntegratedData();


    // --- 💡 3. 아이디어 메모장 모듈 ---
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const btnSaveMemo = document.getElementById('btn-save-memo');
    const memoContainer = document.getElementById('memo-container');

    if(btnSaveMemo) {
        btnSaveMemo.addEventListener('click', () => {
            const title = memoTitle.value.trim();
            const body = memoContent.value.trim();
            if(!title || !body) { alert("내용을 입력하세요!"); return; }

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
            memoContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:40px; font-size:0.9rem;">아이디어 창고가 비어있습니다.</div>`;
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

    window.deleteMemoItem = (id) => { if(confirm("이 메모를 지울까요?")) db.ref(`workspace/memos/${id}`).remove(); };


    // --- 🧮 4. 수학 오답노트 모듈 ---
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
            item.innerHTML = `
                <div><i class="fa-regular fa-folder"></i> <span>${f.name}</span></div>
                <button type="button" class="btn-del-folder" onclick="event.stopPropagation(); deleteMathFolder('${id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            
            item.addEventListener('click', () => {
                activeMathFolder = id;
                document.querySelectorAll('.sub-folder-item').forEach(sf => sf.classList.remove('active'));
                item.classList.add('active');
                
                document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
                document.getElementById('menu-btn-math').classList.add('active');
                contentViews.forEach(view => { if(view.id === 'view-math') view.classList.remove('hidden'); else view.classList.add('hidden'); });

                if(mathFolderListTitle) mathFolderListTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> [${f.name}] 단원 리스트`;
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
        if(confirm("해당 단원 폴더와 안의 문항들을 모두 영구 소멸시키겠습니까?")) {
            db.ref(`workspace/mathFolders/${id}`).remove();
            db.ref(`workspace/mathNotebooks/${id}`).remove();
        }
    };

    function loadMathItemsForFolder() {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/items`).on('value', (snapshot) => {
            if(!mathItemsContainer) return;
            mathItemsContainer.innerHTML = '';
            const items = snapshot.val() || {};
            const list = Object.keys(items).map(id => ({id, ...items[id]})).sort((a,b) => b.timestamp - a.timestamp);

            if(list.length === 0) {
                mathItemsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-size:0.85rem;">오답이 비어있습니다.</div>`;
                return;
            }

            list.forEach(item => {
                const card = document.createElement('div');
                card.className = `math-item-card ${activeMathItemId === item.id ? 'active' : ''}`;
                card.innerHTML = `
                    <div class="math-card-top-meta">
                        <span class="math-card-identity">${item.source || '출처미상'} - ${item.number || '0'}번</span>
                        <div class="math-card-badges">
                            <span class="badge-unit diff-${item.difficulty}">${item.difficulty}</span>
                            <span class="badge-unit status-${item.status ? item.status.substring(0,2) : '다시'}">${item.status}</span>
                        </div>
                    </div>
                    <div class="math-card-core-question">${item.question || '코멘트 없음'}</div>
                    <div class="math-card-bottom-row">
                        <span class="math-reason-tag">${item.wrongReason}</span>
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
    }

    if(mathSaveBtn) {
        mathSaveBtn.addEventListener('click', () => {
            if(!activeMathFolder) { alert("단원을 먼저 선택해주세요!"); return; }
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
                db.ref(`workspace/mathNotebooks/${activeMathFolder}/items/${activeMathItemId}`).update(payload).then(() => alert("오답노트 수정 완료!"));
            } else {
                db.ref(`workspace/mathNotebooks/${activeMathFolder}/items`).push(payload).then((snap) => { activeMathItemId = snap.key; alert("새 문항 등록 완료!"); });
            }
        });
    }

    window.deleteMathItemUnit = (id) => { if(confirm("문항을 지우시겠습니까?")) db.ref(`workspace/mathNotebooks/${activeMathFolder}/items/${id}`).remove(); };

    // --- 🪟 5. 유형 관리 모달 제어 ---
    const typeModal = document.getElementById('type-modal');
    const btnOpenTypeModal = document.getElementById('btn-open-type-modal');
    const btnCloseTypeModal = document.getElementById('close-type-modal');
    const btnAddType = document.getElementById('btn-add-type');
    const newTypeInput = document.getElementById('new-type-input');

    if(btnOpenTypeModal) { btnOpenTypeModal.addEventListener('click', () => { if(!activeMathFolder){ alert("폴더를 먼저 선택하세요!"); return; } typeModal.classList.remove('hidden'); }); }
    if(btnCloseTypeModal) { btnCloseTypeModal.addEventListener('click', () => typeModal.classList.add('hidden')); }

    function listenToCustomTypes() {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes`).on('value', (snapshot) => {
            if(!customTypeList || !mathTypeSelect) return;
            customTypeList.innerHTML = '';
            mathTypeSelect.innerHTML = `<option value="미지정">일반 기본 유형</option>`;
            const types = snapshot.val() || {};
            Object.keys(types).forEach(id => {
                const opt = document.createElement('option');
                opt.value = id; opt.textContent = id;
                mathTypeSelect.appendChild(opt);

                const row = document.createElement('div');
                row.className = 'type-manage-item';
                row.innerHTML = `<span>${id}</span><button type="button" class="btn-todo-delete" onclick="deleteCustomType('${id}')">&times;</button>`;
                customTypeList.appendChild(row);
            });
        });
    }

    if(btnAddType) {
        btnAddType.addEventListener('click', () => {
            const val = newTypeInput.value.trim();
            if(!val) return;
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${val}`).set({ active: true }).then(() => { newTypeInput.value = ''; });
        });
    }

    window.deleteCustomType = (type) => { db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${type}`).remove(); };

    function getTodayDateString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }
});
