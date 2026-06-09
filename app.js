document.addEventListener('DOMContentLoaded', () => {

    // --- 0. 상단 실시간 시계 설정 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 내부 연산 전용 날짜 텍스트 파서
    const getTodayDateString = () => new Date().toISOString().split('T')[0];


    // --- 1. 🗂️ 사용자 정의 파일 분류 및 날짜별 메모장 파트 ---
    const memoTitleInput = document.getElementById('memo-title-input');
    const memoCategorySelect = document.getElementById('memo-category-select');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const clearMemoBtn = document.getElementById('clear-memo-btn');
    const saveStatus = document.getElementById('save-status');
    const folderButtons = document.querySelectorAll('.tab-btn');
    const savedMemosContainer = document.getElementById('saved-memos-container');
    
    let currentFolder = 'general';
    let editingMemoId = null;
    
    const MEMO_KEY = 'workspace_v9_memos';
    const CAT_KEY = 'workspace_v9_categories';

    // 기본 파일 분류 풀 설정 및 로컬스토리지 연동
    let defaultCategories = ['일상', '동아리', '수학', '국어', '영어'];
    let customCategories = JSON.parse(localStorage.getItem(CAT_KEY)) || defaultCategories;
    let memoStorage = JSON.parse(localStorage.getItem(MEMO_KEY)) || { general: [], idea: [], study: [] };

    // 드롭다운에 카테고리 로드 엔진
    function updateCategoryDropdown() {
        memoCategorySelect.innerHTML = '';
        customCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = `📁 ${cat}`;
            memoCategorySelect.appendChild(opt);
        });
    }

    // ➕ 사용자가 직접 새로운 파일(분류)을 신규 등록하는 기능 구현
    addCategoryBtn.addEventListener('click', () => {
        const newCat = prompt('추가하고 싶으신 새로운 파일 분류(과목/주제) 이름을 입력하세요:');
        if (!newCat) return;
        const cleaned = newCat.trim();
        if (cleaned === '') return;
        
        if (customCategories.includes(cleaned)) {
            alert('이미 존재하는 분류 파일입니다!');
            return;
        }

        customCategories.push(cleaned);
        localStorage.setItem(CAT_KEY, JSON.stringify(customCategories));
        updateCategoryDropdown();
        memoCategorySelect.value = cleaned; // 새로 만든 파일로 즉시 자동 포커싱
    });

    // 날짜별 그룹 정렬 렌더링 시스템
    function renderMemoCards() {
        savedMemosContainer.innerHTML = '';
        const currentList = memoStorage[currentFolder] || [];

        if (currentList.length === 0) {
            savedMemosContainer.innerHTML = `<div style="font-size:0.8rem; color:#71717a; text-align:center; padding:20px;">이 폴더에 저장된 메모가 없습니다.</div>`;
            return;
        }

        // 날짜 기준 그룹 바인딩
        const grouped = {};
        currentList.forEach(memo => {
            const dateKey = memo.date || '날짜 미지정';
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(memo);
        });

        const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

        sortedDates.forEach(date => {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'memo-date-group-header';
            dateHeader.innerHTML = `<i class="fa-regular fa-clock"></i> ${date}`;
            savedMemosContainer.appendChild(dateHeader);

            grouped[date].forEach(memo => {
                const card = document.createElement('div');
                card.className = 'memo-item-card';
                card.innerHTML = `
                    <div class="memo-card-main" onclick="loadMemoToEditor('${memo.id}')">
                        <div class="memo-title-row">
                            <span class="file-tag">${memo.category || '일반'}</span>
                            <span class="memo-card-title">${memo.title}</span>
                        </div>
                        <span class="memo-card-snippet">${memo.content.substring(0, 45)}...</span>
                    </div>
                    <button class="compact-del-btn" onclick="deleteMemoCard(event, '${memo.id}')"><i class="fa-regular fa-trash-can"></i></button>
                `;
                savedMemosContainer.appendChild(card);
            });
        });
    }

    window.loadMemoToEditor = (id) => {
        const currentList = memoStorage[currentFolder];
        const targetMemo = currentList.find(m => m.id === id);
        if (targetMemo) {
            memoTitleInput.value = targetMemo.title;
            
            // 기존 분류 데이터 보존 처리 만약 없다면 기본값 할당
            if(!customCategories.includes(targetMemo.category)) {
                customCategories.push(targetMemo.category);
                localStorage.setItem(CAT_KEY, JSON.stringify(customCategories));
                updateCategoryDropdown();
            }
            memoCategorySelect.value = targetMemo.category;
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
        const categoryVal = memoCategorySelect.value || '일반';
        const contentText = memoTextarea.value.trim();
        if (!contentText) return alert('내용을 입력해 주세요!');

        const finalTitle = titleText || contentText.split('\n')[0].substring(0, 15) || "제목 없는 메모";

        if (editingMemoId) {
            const idx = memoStorage[currentFolder].findIndex(m => m.id === editingMemoId);
            if (idx !== -1) { 
                memoStorage[currentFolder][idx].title = finalTitle; 
                memoStorage[currentFolder][idx].category = categoryVal;
                memoStorage[currentFolder][idx].content = contentText; 
            }
        } else {
            memoStorage[currentFolder].unshift({ 
                id: 'memo_' + Date.now(), 
                title: finalTitle, 
                category: categoryVal,
                content: contentText,
                date: getTodayDateString()
            });
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
    
    // 초기 로딩구동
    updateCategoryDropdown();
    renderMemoCards();


    // --- 2. 📅 오늘의 플래너 파트 ---
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    const TODO_KEY = 'workspace_v9_todos';
    let allTodos = JSON.parse(localStorage.getItem(TODO_KEY)) || [];

    window.renderTodos = () => {
        todoList.innerHTML = '';
        const todayStr = getTodayDateString();
        
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
            date: getTodayDateString(),
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


    // --- 3. 🎯 디데이 카운트다운 파트 (실시간 정밀 연산 정상화 완비) ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    const DDAY_KEY = 'workspace_v9_ddays';
    let allDDays = JSON.parse(localStorage.getItem(DDAY_KEY)) || [];

    window.renderDDays = () => {
        ddayContainer.innerHTML = '';
        
        // 기준점 오늘 시각의 시분초 제거 파싱
        const today = new Date();
        today.setHours(0,0,0,0);

        allDDays.forEach((item, idx) => {
            const target = new Date(item.date);
            target.setHours(0,0,0,0);
            
            // 두 날짜 날짜차이 정밀 수학 카운트다운 연산
            const diff = target.getTime() - today.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            let displayD = '';
            if (days === 0) displayD = 'D-Day';
            else if (days > 0) displayD = `D-${days}`;  // ◀ 이제 텍스트가 아닌 실제 남은 숫자가 실시간 계산됩니다!
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
