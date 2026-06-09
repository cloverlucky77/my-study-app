// --- 1. 뽀모도로 타이머 기능 ---
let timerInterval;
let isRunning = false;
let timeLeft = 25 * 60; // 25분을 초단위로 설정
let totalFocusMinutes = 0;

const timerDisplay = document.getElementById('timer');
const timerStatus = document.getElementById('timer-status');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const totalFocusTimeDisplay = document.getElementById('total-focus-time');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
            alert('집중 시간이 끝났습니다! 5분간 휴식하세요.');
            totalFocusMinutes += 25;
            totalFocusTimeDisplay.textContent = `${totalFocusMinutes}분`;
            timeLeft = 5 * 60; // 휴식 시간 5분으로 전환
            timerStatus.textContent = '휴식 시간!';
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
    timerStatus.textContent = '공부 시간!';
    updateTimerDisplay();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);


// --- 2. 투두리스트 기능 ---
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const completedCountDisplay = document.getElementById('completed-count');

let todos = [];

function updateStats() {
    const completedCount = todos.filter(todo => todo.completed).length;
    completedCountDisplay.textContent = `${completedCount}개`;
}

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <span onclick="toggleTodo(${index})">${todo.text}</span>
            <button class="delete-btn" onclick="deleteTodo(${index})">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        `;
        todoList.appendChild(li);
    });
    updateStats();
}

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, completed: false });
        todoInput.value = '';
        renderTodos();
    }
});

window.toggleTodo = function(index) {
    todos[index].completed = !todos[index].completed;
    renderTodos();
};

window.deleteTodo = function(index) {
    todos.splice(index, 1);
    renderTodos();
};

// 초기 타이머 셋팅
updateTimerDisplay();
