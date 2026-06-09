// ==========================================================================
// [전역 상태 데이터]
// ==========================================================================
let todoItems = [];
let memoItems = [
  { id: 1, title: '첫 번째 고정 메모', content: '여기에 중요한 내용을 기록하세요.', pinned: true },
  { id: 2, title: '오늘의 공부 피드백', content: '수학 4점짜리 문항 오답 정리 필수.', pinned: false }
];
let noteItems = [
  { id: 1, subject: '수학Ⅰ', title: '삼각함수 활용 15번', date: '2026-06-10' },
  { id: 2, subject: '영어', title: '빈칸추론 34번 구문독해', date: '2026-06-09' }
];
let currentMemoId = 1;

// 애플리케이션 시작 시 최초 렌더링 실행
window.onload = function() {
  initTabs();
  renderTodoList();
  renderMemoList();
  renderNoteList();
  loadMemoEditor(currentMemoId);
};

// ==========================================================================
// 0) 왼쪽 사이드바 탭 전환 기능 (메모장, 오답노트 정상 작동용)
// ==========================================================================
function initTabs() {
  const menuItems = document.querySelectorAll('.sidebar-left .menu-item');
  const contents = document.querySelectorAll('.main-content .tab-content');
  const mainHeader = document.querySelector('.main-header');

  menuItems.forEach((menu, index) => {
    menu.addEventListener('click', () => {
      // 메뉴 활성화 변경
      menuItems.forEach(m => m.classList.remove('active'));
      menu.classList.add('active');

      // 본문 뷰 변경
      contents.forEach(c => c.classList.remove('active'));
      contents[index].classList.add('active');

      // 상단 헤더 타이틀 텍스트 동적 매칭
      if(index === 0) mainHeader.innerText = "2024년 00월";
      else if(index === 1) mainHeader.innerText = "메모장 & 고정메모";
      else if(index === 2) mainHeader.innerText = "과목별 오답노트";
    });
  });
}

// ==========================================================================
// 1) 통합 플래너 & 달력 로직
// ==========================================================================
function updatePlannerDate(dateText) {
  const title = document.getElementById('planner-title');
  if (title) title.innerText = `${dateText} 일정 관리`;
}

function addTodoItem() {
  const timeInput = document.getElementById('todo-time');
  const textInput = document.getElementById('todo-text');

  if (!textInput || !textInput.value.trim()) return;

  const newItem = {
    id: Date.now(),
    time: timeInput.value.trim() ? timeInput.value.trim() : '종일',
    text: textInput.value.trim(),
    completed: false
  };

  todoItems.push(newItem);
  timeInput.value = '';
  textInput.value = '';
  renderTodoList();
}

function deleteTodoItem(id) {
  todoItems = todoItems.filter(item => item.id !== id);
  renderTodoList();
}

function renderTodoList() {
  const container = document.getElementById('todo-container');
  const counter = document.getElementById('todo-counter');
  if (!container) return;

  if (todoItems.length === 0) {
    container.innerHTML = `<div class="empty-msg">등록된 일정이 없습니다.</div>`;
    counter.innerText = '0 / 0 완료';
    return;
  }

  container.innerHTML = '';
  let completedCount = 0;

  todoItems.forEach(item => {
    if (item.completed) completedCount++;
    const row = document.createElement('div');
    row.className = 'todo-item';
    row.innerHTML = `
      <div class="todo-content">
        <span class="todo-time">[${item.time}]</span>
        <span>${item.text}</span>
      </div>
      <button class="delete-btn" onclick="deleteTodoItem(${item.id})">✕</button>
    `;
    container.appendChild(row);
  });
  counter.innerText = `${completedCount} / ${todoItems.length} 완료`;
}

// ==========================================================================
// 2) [복구 완료] 메모장 기능 제어 로직
// ==========================================================================
function renderMemoList() {
  const container = document.getElementById('memo-container');
  if (!container) return;

  container.innerHTML = '';
  
  // 고정 메모가 상단에 배치되도록 정렬 정돈
  const sortedMemos = [...memoItems].sort((a, b) => b.pinned - a.pinned);

  sortedMemos.forEach(memo => {
    const btn = document.createElement('button');
    btn.className = `memo-item-btn ${memo.pinned ? 'pinned' : ''}`;
    btn.onclick = () => loadMemoEditor(memo.id);
    btn.innerHTML = `
      <strong>${memo.pinned ? '📌 ' : ''}${memo.title || '제목 없는 메모'}</strong>
      <div style="font-size:12px; color:#8a8f98; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${memo.content || '내용 없음'}</div>
    `;
    container.appendChild(btn);
  });
}

function loadMemoEditor(id) {
  currentMemoId = id;
  const memo = memoItems.find(m => m.id === id);
  if (!memo) return;

  document.getElementById('memo-title').value = memo.title;
  document.getElementById('memo-content').value = memo.content;
  document.getElementById('pin-btn').innerText = memo.pinned ? '고정 해제' : '상단 고정';
}

function createNewMemo() {
  const newMemo = {
    id: Date.now(),
    title: '',
    content: '',
    pinned: false
  };
  memoItems.push(newMemo);
  renderMemoList();
  loadMemoEditor(newMemo.id);
}

function saveMemo() {
  const memo = memoItems.find(m => m.id === currentMemoId);
  if (!memo) return;

  memo.title = document.getElementById('memo-title').value;
  memo.content = document.getElementById('memo-content').value;
  
  renderMemoList();
  alert('메모가 저장되었습니다.');
}

function togglePin() {
  const memo = memoItems.find(m => m.id === currentMemoId);
  if (!memo) return;

  memo.pinned = !memo.pinned;
  document.getElementById('pin-btn').innerText = memo.pinned ? '고정 해제' : '상단 고정';
  renderMemoList();
}

// ==========================================================================
// 3) [복구 완료] 과목별 오답노트 로직
// ==========================================================================
function renderNoteList() {
  const grid = document.getElementById('note-grid');
  if (!grid) return;

  grid.innerHTML = '';

  noteItems.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:between; align-items:start; justify-content: space-between;">
        <div>
          <div class="note-subject">${note.subject}</div>
          <h4 style="font-size:15px; margin-bottom:10px;">${note.title}</h4>
        </div>
        <button class="delete-btn" onclick="deleteNote(${note.id})">✕</button>
      </div>
      <div style="font-size:12px; color:#565d68; text-align:right;">${note.date}</div>
    `;
    grid.appendChild(card);
  });
}

function deleteNote(id) {
  noteItems = noteItems.filter(note => note.id !== id);
  renderNoteList();
}
