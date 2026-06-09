document.addEventListener('DOMContentLoaded', () => {

    // --- 0. 상단 실시간 시계 설정 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();


    // --- 1. 📅 전역 마스터 날짜 세팅 및 제어 장치 ---
    const globalDatePicker = document.getElementById('global-date-picker');
    const todoDateTitle = document.getElementById('selected-date-title-todo');
    const ddayDateTitle = document.getElementById('selected-date-title-dday');

    // 첫 구동 시 무조건 시스템 오늘 날짜 자동 기본값 바인딩
    const todayStr = new Date().toISOString().split('T')[0];
    globalDatePicker.value = todayStr;

    function syncDateTitles(dateVal) {
        const parts = dateVal.split('-');
        const formatted = `${parts[1]}월 ${parts[2]}일`;
        todoDateTitle.textContent = formatted;
        ddayDateTitle.textContent = formatted;
    }
    syncDateTitles(todayStr);

    // 사용자가 상단 달력을 변경하면 플래너와 디데이가 즉시 리렌더링됨
    globalDatePicker.addEventListener('change', (e) => {
        syncDateTitles(e.target.value);
        renderTodos();
        renderDDays();
    });


    // --- 2. 🗂️ 세분화 메모장 제어 (독립형 구조) ---
    const memoTitleInput = document.getElementById('memo-title-input');
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const clearMemoBtn = document.getElementById('clear-memo-btn');
    const saveStatus = document.getElementById('save-status');
    const folderButtons = document.querySelectorAll('.tab-btn');
    const savedMemosContainer = document.getElementById('saved-memos-container');
    
    let currentFolder = 'general';
    let editingMemoId = null;
    const MEMO_KEY = 'workspace_v6_memos';

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


    // --- 3. 📅 날짜 종속형 플래너 관리 시스템 ---
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    const TODO_KEY = 'workspace_v6_todos';
    let allTodos = JSON.parse(localStorage.getItem(TODO_KEY)) || [];

    window.renderTodos = () => {
        todoList.innerHTML = '';
        const activeDate = globalDatePicker.value;
        
        // 현재 마스터 달력에 선택된 날짜의 데이터만 필터링 분리
        const filtered = allTodos.filter(t => t.date === activeDate);
        const completed = filtered.filter(t => t.completed).length;
        todoStats.textContent = `${completed} / ${filtered.length} 완료`;

        filtered.forEach(todo => {
            // 원본 배열 인덱스 찾기
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
            date: globalDatePicker.value,
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


    // --- 4. 🎯 디데이 카운트다운 정밀 연산 시스템 (버그 수정 완결) ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayContainer = document.getElementById('dday-container');

    const DDAY_KEY = 'workspace_v6_ddays';
    let allDDays = JSON.parse(localStorage.getItem(DDAY_KEY)) || [];

    window.renderDDays = () => {
        ddayContainer.innerHTML = '';
        const activeDate = globalDatePicker.value;
        
        // 현재 선택된 기준 날짜 데이터만 추출
        const filtered = allDDays.filter(d => d.date === activeDate);

        filtered.forEach(item => {
            const origIdx = allDDays.findIndex(d => d.id === item.id);
            
            // 실시간 컴퓨터 오늘 날짜 기준 계산 
            const today = new Date();
            today.setHours(0,0,0,0);
            
            // 타겟 등록 지정 날짜 계산
            const target = new Date(item.date);
            target.setHours(0,0,0,0);
            
            const diff = target.getTime() - today.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            let displayD = '';
            if (days === 0) displayD = 'D-Day';
            else if (days > 0) displayD = `D-${days}`;  // ◀ 드디어 D-숫자 매칭 완벽 구현!
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
                    <button class="compact-del-btn" onclick="deleteDDay(${origIdx})"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;
            ddayContainer.appendChild(div);
        });
    };

    ddayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        allDDays.push({
            id: 'dday_' + Date.now(),
            date: globalDatePicker.value, // 마스터 상단 날짜 기준으로 자동 등록 처리
            title: ddayTitle.value.trim()
        });
        localStorage.setItem(DDAY_KEY, JSON.stringify(allDDays));
        renderDDays();
        ddayForm.reset();
    });

    window.deleteDDay = (origIdx) => {
        allDDays.splice(origIdx, 1);
        localStorage.setItem(DDAY_KEY, JSON.stringify(allDDays));
        renderDDays();
    };
    renderDDays();
});
