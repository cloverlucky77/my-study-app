document.addEventListener('DOMContentLoaded', () => {

    // --- 0. 상단 실시간 시계 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();


    // --- 1. 폴더별 메모장 제어 (버그 전면 수정 & 저장 버튼 연동) ---
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const saveStatus = document.getElementById('save-status');
    const folderButtons = document.querySelectorAll('.tab-btn');
    
    let currentFolder = 'general';
    let memoData = JSON.parse(localStorage.getItem('workspace-memo-v2')) || {
        general: '',
        idea: '',
        study: ''
    };

    function loadFolderMemo() {
        memoTextarea.value = memoData[currentFolder] || '';
        saveStatus.textContent = "저장 대기 중";
        saveStatus.style.color = "#707075";
    }

    // 각 탭 버튼 클릭 이벤트 바인딩 (수정된 상호작용)
    folderButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelector('.tab-btn.active').classList.remove('active');
            e.target.classList.add('active');
            
            currentFolder = e.target.getAttribute('data-folder');
            loadFolderMemo();
        });
    });

    // 텍스트 수정 감지 상태 표시
    memoTextarea.addEventListener('input', () => {
        saveStatus.textContent = "변경사항 있음 (저장 필요)";
        saveStatus.style.color = "#ffb300";
    });

    // 수동 저장 버튼 작동 로직
    saveMemoBtn.addEventListener('click', () => {
        memoData[currentFolder] = memoTextarea.value;
        localStorage.setItem('workspace-memo-v2', JSON.stringify(memoData));
        
        saveStatus.textContent = "안전하게 저장 완료";
        saveStatus.style.color = "#30d158";
        
        setTimeout(() => {
            saveStatus.textContent = "저장 완료";
            saveStatus.style.color = "#707075";
        }, 1500);
    });

    loadFolderMemo();


    // --- 2. 플래너 로직 및 완료 현황 카운터 ---
    const todoForm = document.getElementById('todo-form');
    const todoTime = document.getElementById('todo-time');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    let todos = JSON.parse(localStorage.getItem('workspace-todos')) || [];

    function updateTodoStats() {
        const completed = todos.filter(t => t.completed).length;
        todoStats.textContent = `${completed} / ${todos.length} 완료`;
    }

    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach((todo, idx) => {
            const li = document.createElement('li');
            li.className = `item-row ${todo.completed ? 'done' : ''}`;
            li.innerHTML = `
                <div class="item-left">
                    <span class="time-tag">${todo.time}</span>
                    <span class="item-text" onclick="toggleTodo(${idx})">${todo.text}</span>
                </div>
                <button class="delete-btn" onclick="deleteTodo(${idx})"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(li);
        });
        updateTodoStats();
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        todos.push({ time: todoTime.value, text: todoInput.value.trim(), completed: false });
        localStorage.setItem('workspace-todos', JSON.stringify(todos));
        renderTodos();
        todoInput.value = '';
    });

    window.toggleTodo = (idx) => {
        todos[idx].completed = !todos[idx].completed;
        localStorage.setItem('workspace-todos', JSON.stringify(todos));
        renderTodos();
    };

    window.deleteTodo = (idx) => {
        todos.splice(idx, 1);
        localStorage.setItem('workspace-todos', JSON.stringify(todos));
        renderTodos();
    };

    renderTodos();


    // --- 3. 디데이 연도/날짜 선택 및 연산 로직 ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    let ddays = JSON.parse(localStorage.getItem('workspace-ddays')) || [];

    function renderDDays() {
        ddayContainer.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        ddays.forEach((item, idx) => {
            const target = new Date(item.date);
            target.setHours(0, 0, 0, 0);
            
            const diff = target - today;
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            let displayD = `D-${days}`;
            if (days === 0) displayD = 'D-Day';
            else if (days < 0) displayD = `D+${Math.abs(days)}`;

            const div = document.createElement('div');
            div.className = 'dday-card';
            div.innerHTML = `
                <div class="dday-info">
                    <span class="dday-name">${item.title}</span>
                    <span class="dday-date-text">${item.date}</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="dday-number">${displayD}</span>
                    <button class="delete-btn" onclick="deleteDDay(${idx})"><i class="fa-regular fa-circle-xmark"></i></button>
                </div>
            `;
            ddayContainer.appendChild(div);
        });
    }

    ddayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        ddays.push({ title: ddayTitle.value.trim(), date: ddayDate.value });
        localStorage.setItem('workspace-ddays', JSON.stringify(ddays));
        renderDDays();
        ddayForm.reset();
    });

    window.deleteDDay = (idx) => {
        ddays.splice(idx, 1);
        localStorage.setItem('workspace-ddays', JSON.stringify(ddays));
        renderDDays();
    };

    renderDDays();
});
