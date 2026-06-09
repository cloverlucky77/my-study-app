document.addEventListener('DOMContentLoaded', () => {

    // --- 0. 상단 실시간 시계 설정 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 내부 시스템 처리용 오늘 날짜 추출 고정 (분류 최적화)
    const getTodayDateString = () => new Date().toISOString().split('T')[0];


    // --- 1. 🗂️ 세분화 메모장 파트 ---
    const memoTitleInput = document.getElementById('memo-title-input');
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const clearMemoBtn = document.getElementById('clear-memo-btn');
    const saveStatus = document.getElementById('save-status');
    const folderButtons = document.querySelectorAll('.tab-btn');
    const savedMemosContainer = document.getElementById('saved-memos-container');
    
    let currentFolder = 'general';
    let editingMemoId = null;
    const MEMO_KEY = 'workspace_v7_memos';

    let memoStorage = JSON.parse(localStorage.getItem(MEMO_KEY)) || { general: [], idea: [], study: [] };

    function renderMemoCards() {
        savedMemosContainer.innerHTML = '';
        const currentList = memoStorage[currentFolder] || [];

        if (currentList.length === 0) {
            savedMemosContainer.innerHTML = `<div style="font-size:0.8rem; color:#71717a; text-align:center; padding:20px;">이 폴더에 저장된 메모가 없습니다.</div>`;
            return;
        }

        currentList.forEach(memo => {
            const card = document.createElement('div');
            card.className = 'memo-item-card';
            card.innerHTML = `
                <div class="memo-card-main" onclick="loadMemoToEditor('${memo.id}')">
                    <span class="memo-card-title">📝 ${memo.title}</span>
                    <span class="memo-card-snippet">${memo.content.substring(0, 45)}...</span>
                </div>
                <button class="compact-del-btn" onclick="deleteMemoCard(event, '${memo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            savedMemosContainer.appendChild(card);
        });
    }

    window.loadMemoToEditor = (id) => {
        const currentList = memoStorage[currentFolder];
        const targetMemo = currentList.find(m => m.id === id);
        if (targetMemo) {
            memoTitleInput.value = targetMemo.title;
            memoTextarea.value = targetMemo.content;
            editingMemoId = id;
            saveStatus.textContent = "모드: 메모 수정 중";
            saveStatus.style.color = "#f59e0b";
        }
    };

    window.deleteMemoCard = (event, id) => {
        event.stopPropagation();
        memoStorage[currentFolder] = memoStorage[currentFolder].filter(m => m.id !== id);
        localStorage.setItem(MEMO_KEY, JSON.stringify(memoStorage));
        if (editingMemoId === id) resetEditor();
        renderMemoCards();
    };

    function resetEditor() {
        memoTitleInput.value = '';
        memoTextarea.value = '';
        editingMemoId = null;
        saveStatus.textContent = "모드: 새 메모 작성";
        saveStatus.style.color = "#71717a";
    }

    saveMemoBtn.addEventListener('click', () => {
        const titleText = memoTitleInput.value.trim();
        const contentText = memoTextarea.value.trim();
        if (!contentText) return alert('내용을 입력해 주세요!');

        const finalTitle = titleText || contentText.split('\n')[0].substring(0, 15) || "제목 없는 메모";

        if (editingMemoId) {
            const idx = memoStorage[currentFolder].findIndex(m => m.id === editingMemoId);
            if (idx !== -1) { memoStorage[currentFolder][idx].title = finalTitle; memoStorage[currentFolder][idx].content = contentText; }
        } else {
            memoStorage[currentFolder].unshift({ id: 'memo_' + Date.now(), title: finalTitle, content: contentText });
        }
        localStorage.setItem(MEMO_KEY, JSON.stringify(memoStorage));
        resetEditor();
        renderMemoCards();
    });

    clearMemoBtn.addEventListener('click', resetEditor);
    folderButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelector('.tab-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentFolder = e.target.getAttribute('data-folder');
            resetEditor();
            renderMemoCards();
        });
    });
    renderMemoCards();


    // --- 2. 📅 플래너 파트 (오늘 날짜 자동 분류 관리) ---
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    const TODO_KEY = 'workspace_v7_todos';
    let allTodos = JSON.parse(localStorage.getItem(TODO_KEY)) || [];

    window.renderTodos = () => {
        todoList.innerHTML = '';
        const todayStr = getTodayDateString();
        
        // 데이터 누적 구조 속에서 오직 '오늘 날짜' 데이터만 뽑아와서 깔끔하게 바인딩
        const filtered = allTodos.filter(t => t.date === todayStr);
        const completed = filtered.filter(t => t.completed).length;
        todoStats.textContent = `${completed} / ${filtered.length} 완료`;

        filtered.forEach(todo => {
            const origIdx = allTodos.findIndex(t => t.id === todo.id);
            const li = document.createElement('li');
            li.className = `item-row ${todo.completed ? 'done' : ''}`;
            li.innerHTML = `
                <div class="item-left">
                    <span class="time-tag">${todo.time}</span>
                    <span class="item-text" onclick="toggleTodo(${origIdx})">${todo.text}</span>
                </div>
                <button class="compact-del-btn" onclick="deleteTodo(${origIdx})"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(li);
        });
    };

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        allTodos.push({
            id: 'todo_' + Date.now(),
            date: getTodayDateString(), // 오늘 날짜 태그를 달아 자동 저장 분류
            time: todoTimeInput.value.trim(),
            text: todoInput.value.trim(),
            completed: false
        });
        localStorage.setItem(TODO_KEY, JSON.stringify(allTodos));
        renderTodos();
        todoInput.value = '';
        todoTimeInput.value = '';
    });

    window.toggleTodo = (origIdx) => {
        allTodos[origIdx].completed = !allTodos[origIdx].completed;
        localStorage.setItem(TODO_KEY, JSON.stringify(allTodos));
        renderTodos();
    };

    window.deleteTodo = (origIdx) => {
        allTodos.splice(origIdx, 1);
        localStorage.setItem(TODO_KEY, JSON.stringify(allTodos));
        renderTodos();
    };
    renderTodos();


    // --- 3. 🎯 디데이 카운트다운 파트 (연산 메커니즘 완전 정상화) ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    const DDAY_KEY = 'workspace_v7_ddays';
    let allDDays = JSON.parse(localStorage.getItem(DDAY_KEY)) || [];

    window.renderDDays = () => {
        ddayContainer.innerHTML = '';
        
        // 실시간 연산용 오늘 표준 시간 초기화
        const today = new Date();
        today.setHours(0,0,0,0);

        allDDays.forEach((item, idx) => {
            const target = new Date(item.date);
            target.setHours(0,0,0,0);
            
            // 두 날짜 간격 계산 (정밀 밀리초 변환 연산)
            const diff = target.getTime() - today.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            let displayD = '';
            if (days === 0) displayD = 'D-Day';
            else if (days > 0) displayD = `D-${days}`;  // ◀ 드디어 완벽하게 카운트다운 숫자가 표기됩니다!
            else displayD = `D+${Math.abs(days)}`;

            const div = document.createElement('div');
            div.className = 'dday-card';
            div.innerHTML = `
                <div class="dday-info">
                    <span class="dday-name">${item.title}</span>
                    <span class="dday-date-text">목표일: ${item.date}</span>
                </div>
                <div class="dday-right-zone">
                    <span class="dday-number">${displayD}</span>
                    <button class="compact-del-btn" onclick="deleteDDay(${idx})"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;
            ddayContainer.appendChild(div);
        });
    };

    ddayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleVal = ddayTitle.value.trim();
        const dateVal = ddayDate.value;

        if(!titleVal || !dateVal) return;

        allDDays.push({
            title: titleVal,
            date: dateVal // 입력 필드에서 정밀 수집한 목표 날짜 저장
        });
        
        localStorage.setItem(DDAY_KEY, JSON.stringify(allDDays));
        renderDDays();
        ddayForm.reset();
    });

    window.deleteDDay = (idx) => {
        allDDays.splice(idx, 1);
        localStorage.setItem(DDAY_KEY, JSON.stringify(allDDays));
        renderDDays();
    };
    renderDDays();
});
