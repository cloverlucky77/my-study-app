document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. 상단 실시간 시계 기능 (추천 추가 기능) ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }
    setInterval(updateClock, 1000);
    updateClock();


    // --- 1. 메모장 기능 (자동 저장) ---
    const memoTextarea = document.getElementById('memo-textarea');
    
    // 기존에 저장된 메모 불러오기
    const savedMemo = localStorage.getItem('daily-memo');
    if (savedMemo) {
        memoTextarea.value = savedMemo;
    }

    // 입력할 때마다 실시간 로컬스토리지 저장
    memoTextarea.addEventListener('input', () => {
        localStorage.setItem('daily-memo', memoTextarea.value);
    });


    // --- 2. 플래너 / 투두 기능 ---
    const todoForm = document.getElementById('todo-form');
    const todoTime = document.getElementById('todo-time');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    let plannerItems = JSON.parse(localStorage.getItem('planner-items')) || [];

    function savePlanner() {
        localStorage.setItem('planner-items', JSON.stringify(plannerItems));
    }

    function renderPlanner() {
        todoList.innerHTML = '';
        
        // 시간순 정렬 (일과를 가장 위로, 그 뒤는 시간순)
        plannerItems.sort((a, b) => {
            if (a.time === '일과') return -1;
            if (b.time === '일과') return 1;
            return a.time.localeCompare(b.time);
        });

        plannerItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `item-row ${item.completed ? 'done' : ''}`;
            
            li.innerHTML = `
                <div class="item-content">
                    <span class="item-time">${item.time}</span>
                    <span class="item-text" onclick="toggleItem(${index})">${item.text}</span>
                </div>
                <button class="action-btn" onclick="deleteItem(${index})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            `;
            todoList.appendChild(li);
        });
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const time = todoTime.value;
        const text = todoInput.value.trim();

        if (text) {
            plannerItems.push({ time, text, completed: false });
            savePlanner();
            renderPlanner();
            todoInput.value = '';
        }
    });

    window.toggleItem = function(index) {
        plannerItems[index].completed = !plannerItems[index].completed;
        savePlanner();
        renderPlanner();
    };

    window.deleteItem = function(index) {
        plannerItems.splice(index, 1);
        savePlanner();
        renderPlanner();
    };

    renderPlanner();


    // --- 3. 포커스 타이머 기능 ---
    let timerInterval;
    let isRunning = false;
    let timeLeft = 25 * 60;

    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');

    function updateTimerDisplay() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isRunning = false;
                alert('포커스 시간이 종료되었습니다!');
                timeLeft = 25 * 60;
                updateTimerDisplay();
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = 25 * 60;
        updateTimerDisplay();
    }

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    updateTimerDisplay();
});
