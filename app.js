document.addEventListener('DOMContentLoaded', () => {

    // --- 0. 실시간 시계 연동 구동부 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();


    // --- 1. 폴더별 독립 분리형 메모장 핵심 로직 ---
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const saveStatus = document.getElementById('save-status');
    const folderButtons = document.querySelectorAll('.tab-btn');
    
    let currentFolder = 'general';
    // 로컬스토리지 키값을 유니크하게 변경하여 꼬임 방지
    let memoData = JSON.parse(localStorage.getItem('workspace_memo_v3')) || {
        general: '',
        idea: '',
        study: ''
    };

    function loadFolderMemo() {
        memoTextarea.value = memoData[currentFolder] || '';
        saveStatus.textContent = "저장 대기 중";
        saveStatus.style.color = "#71717a";
    }

    // 📁 폴더 선택 탭 이벤트 리스너 선언 및 완벽 바인딩
    folderButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // 기존 active 해제 및 신규 주입
            document.querySelector('.tab-btn.active').classList.remove('active');
            e.target.classList.add('active');
            
            // 현재 활성화된 탭의 내용 로드
            currentFolder = e.target.getAttribute('data-folder');
            loadFolderMemo();
        });
    });

    // 텍스트 감지 피드백 변경
    memoTextarea.addEventListener('input', () => {
        saveStatus.textContent = "변경사항 있음 (저장 필요)";
        saveStatus.style.color = "#f59e0b";
    });

    // 💾 명시적인 수동 저장 버튼 시스템 제어
    saveMemoBtn.addEventListener('click', () => {
        memoData[currentFolder] = memoTextarea.value;
        localStorage.setItem('workspace_memo_v3', JSON.stringify(memoData));
        
        saveStatus.textContent = "메모 저장 완료";
        saveStatus.style.color = "#10b981";
        
        setTimeout(() => {
            saveStatus.textContent = "안전하게 저장됨";
            saveStatus.style.color = "#71717a";
        }, 1200);
    });

    // 첫 진입 시 초기화 로드
    loadFolderMemo();


    // --- 2. 플래너 기능 및 상태 현황 업데이트 ---
    const todoForm = document.getElementById('todo-form');
    const todoTime = document.getElementById('todo-time');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    let todos = JSON.parse(localStorage.getItem('workspace_todos_v3')) || [];

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
                <button class="delete-btn" onclick="deleteTodo(${idx})"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(li);
        });
        updateTodoStats();
    };

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        todos.push({ time: todoTime.value, text: todoInput.value.trim(), completed: false });
        localStorage.setItem('workspace_todos_v3', JSON.stringify(todos));
        renderTodos();
        todoInput.value = '';
    });

    window.toggleTodo = (idx) => {
        todos[idx].completed = !todos[idx].completed;
        localStorage.setItem('workspace_todos_v3', JSON.stringify(todos));
        renderTodos();
    };

    window.deleteTodo = (idx) => {
        todos.splice(idx, 1);
        localStorage.setItem('workspace_todos_v3', JSON.stringify(todos));
        renderTodos();
    };

    renderTodos();


    // --- 3. 디데이 카운트다운 연산 시스템 ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    let ddays = JSON.parse(localStorage.getItem('workspace_ddays_v3')) || [];

    window.renderDDays = () => {
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
                <div style="display:flex; align-items:center; gap:12px;">
                    <span class="dday-number">${displayD}</span>
                    <button class="delete-btn" onclick="deleteDDay(${idx})"><i class="fa-regular fa-circle-xmark"></i></button>
                </div>
            `;
            ddayContainer.appendChild(div);
        });
    };

    ddayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        ddays.push({ title: ddayTitle.value.trim(), date: ddayDate.value });
        localStorage.setItem('workspace_ddays_v3', JSON.stringify(ddays));
        renderDDays();
        ddayForm.reset();
    });

    window.deleteDDay = (idx) => {
        ddays.splice(idx, 1);
        localStorage.setItem('workspace_ddays_v3', JSON.stringify(ddays));
        renderDDays();
    };

    renderDDays();
});
