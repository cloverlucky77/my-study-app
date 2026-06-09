document.addEventListener('DOMContentLoaded', () => {

    // --- 0. 상단 시계 구동 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();


    // --- 1. 디데이처럼 누적 축적되는 다중 폴더 메모리 제어부 ---
    const memoTitleInput = document.getElementById('memo-title-input');
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const clearMemoBtn = document.getElementById('clear-memo-btn');
    const saveStatus = document.getElementById('save-status');
    const folderButtons = document.querySelectorAll('.tab-btn');
    const savedMemosContainer = document.getElementById('saved-memos-container');
    
    let currentFolder = 'general';
    let editingMemoId = null; // 수정 모드 추적 컴포넌트

    // 폴더별 내부 메모 배열 데이터 구조 생성
    let memoStorage = JSON.parse(localStorage.getItem('workspace_memo_v4_lists')) || {
        general: [],
        idea: [],
        study: []
    };

    // 현재 폴더에 들어있는 메모 카드 리스트 렌더링
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
                <button class="delete-btn" onclick="deleteMemoCard('${memo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            savedMemosContainer.appendChild(card);
        });
    }

    // 카드를 클릭했을 때 상단 입력창으로 다시 복원 (수정 모드 진입)
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

    // 메모 삭제 기능
    window.deleteMemoCard = (id) => {
        memoStorage[currentFolder] = memoStorage[currentFolder].filter(m => m.id !== id);
        localStorage.setItem('workspace_memo_v4_lists', JSON.stringify(memoStorage));
        if (editingMemoId === id) resetEditor();
        renderMemoCards();
    };

    // 입력 필드 초기화
    function resetEditor() {
        memoTitleInput.value = '';
        memoTextarea.value = '';
        editingMemoId = null;
        saveStatus.textContent = "모드: 새 메모 작성";
        saveStatus.style.color = "#71717a";
    }

    // 💾 저장 버튼 처리 로직 (추가 및 수정을 동시에 분기 연산)
    saveMemoBtn.addEventListener('click', () => {
        const titleText = memoTitleInput.value.trim();
        const contentText = memoTextarea.value.trim();

        if (!contentText) {
            alert('메모 내용을 입력해 주세요!');
            return;
        }

        // 제목이 없으면 첫 줄 내용 슬라이싱
        const finalTitle = titleText || contentText.split('\n')[0].substring(0, 15) || "제목 없는 메모";

        if (editingMemoId) {
            // 1. 기존 메모 수정 분기
            const memoIndex = memoStorage[currentFolder].findIndex(m => m.id === editingMemoId);
            if (memoIndex !== -1) {
                memoStorage[currentFolder][memoIndex].title = finalTitle;
                memoStorage[currentFolder][memoIndex].content = contentText;
            }
        } else {
            // 2. 신규 메모 추가 분기
            const newMemo = {
                id: 'memo_' + Date.now(),
                title: finalTitle,
                content: contentText
            };
            memoStorage[currentFolder].unshift(newMemo);
        }

        localStorage.setItem('workspace_memo_v4_lists', JSON.stringify(memoStorage));
        resetEditor();
        renderMemoCards();
    });

    // 입력 필드 비우기 버튼
    clearMemoBtn.addEventListener('click', resetEditor);

    // 📁 폴더 전환 탭 이벤트
    folderButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelector('.tab-btn.active').classList.remove('active');
            e.target.classList.add('active');
            
            currentFolder = e.target.getAttribute('data-folder');
            resetEditor();
            renderMemoCards();
        });
    });

    // 메모 초기 로딩 실행
    renderMemoCards();


    // --- 2. 플래너 기능 ---
    const todoForm = document.getElementById('todo-form');
    const todoTime = document.getElementById('todo-time');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    let todos = JSON.parse(localStorage.getItem('workspace_todos_v4')) || [];

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
        localStorage.setItem('workspace_todos_v4', JSON.stringify(todos));
        renderTodos();
        todoInput.value = '';
    });

    window.toggleTodo = (idx) => {
        todos[idx].completed = !todos[idx].completed;
        localStorage.setItem('workspace_todos_v4', JSON.stringify(todos));
        renderTodos();
    };

    window.deleteTodo = (idx) => {
        todos.splice(idx, 1);
        localStorage.setItem('workspace_todos_v4', JSON.stringify(todos));
        renderTodos();
    };

    renderTodos();


    // --- 3. 디데이 카운트다운 가로 정렬 고도화부 ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    let ddays = JSON.parse(localStorage.getItem('workspace_ddays_v4')) || [];

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
                <div style="display:flex; align-items:center; gap:16px;">
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
        localStorage.setItem('workspace_ddays_v4', JSON.stringify(ddays));
        renderDDays();
        ddayForm.reset();
    });

    window.deleteDDay = (idx) => {
        ddays.splice(idx, 1);
        localStorage.setItem('workspace_ddays_v4', JSON.stringify(ddays));
        renderDDays();
    };

    renderDDays();
});
