document.addEventListener('DOMContentLoaded', () => {

    // --- 0. 상단 시계 구동 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();


    // --- 1. 메모장 관리 파트 (Key 통일 및 저장 완전 복구) ---
    const memoTitleInput = document.getElementById('memo-title-input');
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const clearMemoBtn = document.getElementById('clear-memo-btn');
    const saveStatus = document.getElementById('save-status');
    const folderButtons = document.querySelectorAll('.tab-btn');
    const savedMemosContainer = document.getElementById('saved-memos-container');
    
    let currentFolder = 'general';
    let editingMemoId = null;

    // 저장 키 이름 안정화 고정
    const MEMO_KEY = 'workspace_final_memos';

    let memoStorage = JSON.parse(localStorage.getItem(MEMO_KEY)) || {
        general: [],
        idea: [],
        study: []
    };

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

        if (!contentText) {
            alert('메모 내용을 입력해 주세요!');
            return;
        }

        const finalTitle = titleText || contentText.split('\n')[0].substring(0, 15) || "제목 없는 메모";

        if (editingMemoId) {
            const memoIndex = memoStorage[currentFolder].findIndex(m => m.id === editingMemoId);
            if (memoIndex !== -1) {
                memoStorage[currentFolder][memoIndex].title = finalTitle;
                memoStorage[currentFolder][memoIndex].content = contentText;
            }
        } else {
            const newMemo = {
                id: 'memo_' + Date.now(),
                title: finalTitle,
                content: contentText
            };
            memoStorage[currentFolder].unshift(newMemo);
        }

        localStorage.setItem(MEMO_KEY, JSON.stringify(memoStorage));
        resetEditor();
        renderMemoCards();
    });

    clearMemoBtn.addEventListener('click', resetEditor);

    folderButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelector('.tab-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentFolder = e.target.getAttribute('data-folder');
            resetEditor();
            renderMemoCards();
        });
    });

    renderMemoCards();


    // --- 2. 플래너 파트 (제출 폼 오류 수정 및 실시간 저장) ---
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    const TODO_KEY = 'workspace_final_todos';
    let todos = JSON.parse(localStorage.getItem(TODO_KEY)) || [];

    function updateTodoStats() {
        const completed = todos.filter(t => t.completed).length;
        todoStats.textContent = `${completed} / ${todos.length} 완료`;
    }

    window.renderTodos = () => {
        todoList.innerHTML = '';
        todos.forEach((todo, idx) => {
            const li = document.createElement('li');
            li.className = `item-row ${todo.completed ? 'done' : ''}`;
            li.innerHTML = `
                <div class="item-left">
                    <span class="time-tag">${todo.time}</span>
                    <span class="item-text" onclick="toggleTodo(${idx})">${todo.text}</span>
                </div>
                <button class="compact-del-btn" onclick="deleteTodo(${idx})"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(li);
        });
        updateTodoStats();
    };

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const timeValue = todoTimeInput.value.trim();
        const textValue = todoInput.value.trim();

        if(!timeValue || !textValue) return;

        todos.push({ time: timeValue, text: textValue, completed: false });
        localStorage.setItem(TODO_KEY, JSON.stringify(todos));
        renderTodos();
        todoInput.value = '';
        todoTimeInput.value = '';
    });

    window.toggleTodo = (idx) => {
        todos[idx].completed = !todos[idx].completed;
        localStorage.setItem(TODO_KEY, JSON.stringify(todos));
        renderTodos();
    };

    window.deleteTodo = (idx) => {
        todos.splice(idx, 1);
        localStorage.setItem(TODO_KEY, JSON.stringify(todos));
        renderTodos();
    };

    renderTodos();


    // --- 3. 디데이 파트 (제출 폼 오류 수정 및 D-일수 연산 완벽 반영) ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    const DDAY_KEY = 'workspace_final_ddays';
    let ddays = JSON.parse(localStorage.getItem(DDAY_KEY)) || [];

    window.renderDDays = () => {
        ddayContainer.innerHTML = '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        ddays.forEach((item, idx) => {
            const target = new Date(item.date);
            target.setHours(0, 0, 0, 0);
            
            const diff = target.getTime() - today.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            let displayD = '';
            if (days === 0) {
                displayD = 'D-Day';
            } else if (days > 0) {
                displayD = `D-${days}`;
            } else {
                displayD = `D+${Math.abs(days)}`;
            }

            const div = document.createElement('div');
            div.className = 'dday-card';
            div.innerHTML = `
                <div class="dday-info">
                    <span class="dday-name">${item.title}</span>
                    <span class="dday-date-text">${item.date}</span>
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

        ddays.push({ title: titleVal, date: dateVal });
        localStorage.setItem(DDAY_KEY, JSON.stringify(ddays));
        renderDDays();
        ddayForm.reset();
    });

    window.deleteDDay = (idx) => {
        ddays.splice(idx, 1);
        localStorage.setItem(DDAY_KEY, JSON.stringify(ddays));
        renderDDays();
    };

    renderDDays();
});
