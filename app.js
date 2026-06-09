// ==========================================
// 🔥 구글 파이어베이스 클라우드 동기화 키 설정 완료
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyC1cf1kMJlsYHz7O-YPNDc-4MKpGL_fM3s",
    authDomain: "my-workspace-app-7163f.firebaseapp.com",
    databaseURL: "https://my-workspace-app-7163f-default-rtdb.firebaseio.com",
    projectId: "my-workspace-app-7163f",
    storageBucket: "my-workspace-app-7163f.firebasestorage.app",
    messagingSenderId: "119886197584",
    appId: "1:119886197584:web:53abc2966f016f9143f255"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {

    // --- 🧭 사이드바 탭 전환 제어기 ---
    const menuItems = document.querySelectorAll('.menu-item');
    const contentViews = document.querySelectorAll('.content-view');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            contentViews.forEach(view => {
                if (view.id === targetId) view.classList.remove('hidden');
                else view.classList.add('hidden');
            });
        });
    });

    // --- 상단 실시간 시계 모듈 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

    const getTodayDateString = () => new Date().toISOString().split('T')[0];


    // --- 🗂️ 1. 일반 메모장 엔진 (클라우드 폴더형) ---
    const folderExplorerZone = document.getElementById('folder-explorer-zone');
    const memoEditorZone = document.getElementById('memo-editor-zone');
    const folderGridContainer = document.getElementById('folder-grid-container');
    const createFolderBtn = document.getElementById('create-folder-btn');
    
    const backToFoldersBtn = document.getElementById('back-to-folders-btn');
    const currentFolderTitle = document.getElementById('current-folder-title');
    const memoTitleInput = document.getElementById('memo-title-input');
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const clearMemoBtn = document.getElementById('clear-memo-btn');
    const saveStatus = document.getElementById('save-status');
    const savedMemosContainer = document.getElementById('saved-memos-container');

    let activeFolderName = null; 
    let editingMemoId = null;

    db.ref('workspace/folders').on('value', (snapshot) => {
        const foldersData = snapshot.val() || {};
        if (Object.keys(foldersData).length === 0) {
            const initDirs = ['일반 메모', '아이디어'];
            initDirs.forEach(d => db.ref('workspace/folders/' + d).set({ createdAt: Date.now() }));
            return;
        }
        renderFolderDashboard(foldersData);
        if (activeFolderName && foldersData[activeFolderName]) {
            renderFolderMemos(foldersData[activeFolderName].memos || {});
        }
    });

    function renderFolderDashboard(foldersData) {
        folderGridContainer.innerHTML = '';
        Object.keys(foldersData).forEach(folderName => {
            const count = Object.keys(foldersData[folderName].memos || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.innerHTML = `
                <div class="folder-icon"><i class="fa-solid fa-folder-open"></i></div>
                <div class="folder-name">${folderName}</div>
                <div class="folder-memo-count">${count}개의 기록</div>
                <button class="folder-del-btn" onclick="deleteEntireFolder(event, '${folderName}')"><i class="fa-solid fa-xmark"></i></button>
            `;
            card.addEventListener('click', () => enterFolderScope(folderName));
            folderGridContainer.appendChild(card);
        });
    }

    createFolderBtn.addEventListener('click', () => {
        const name = prompt('새 일반 메모 분류 이름을 입력하세요:');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
        if (cleaned) db.ref('workspace/folders/' + cleaned).update({ createdAt: Date.now() });
    });

    window.deleteEntireFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 분류 전체와 그 내용물을 영구 삭제할까요?`)) {
            db.ref('workspace/folders/' + folderName).remove();
            if (activeFolderName === folderName) exitFolderScope();
        }
    };

    function enterFolderScope(folderName) {
        activeFolderName = folderName;
        resetEditor();
        folderExplorerZone.classList.add('hidden');
        memoEditorZone.classList.remove('hidden');
        currentFolderTitle.innerHTML = `<i class="fa-regular fa-folder-open"></i> ${activeFolderName}`;
        db.ref('workspace/folders/' + folderName + '/memos').once('value', (snapshot) => {
            renderFolderMemos(snapshot.val() || {});
        });
    }

    backToFoldersBtn.addEventListener('click', exitFolderScope);
    function exitFolderScope() {
        activeFolderName = null;
        memoEditorZone.classList.add('hidden');
        folderExplorerZone.classList.remove('hidden');
    }

    function renderFolderMemos(memosObj) {
        savedMemosContainer.innerHTML = '';
        const list = Object.keys(memosObj).map(id => ({ id, ...memosObj[id] }));
        if (list.length === 0) {
            savedMemosContainer.innerHTML = `<div style="font-size:0.8rem; color:#71717a; text-align:center; padding:15px;">저장된 기록이 없습니다.</div>`;
            return;
        }
        const grouped = {};
        list.forEach(m => {
            if(!grouped[m.date]) grouped[m.date] = [];
            grouped[m.date].push(m);
        });
        Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).forEach(date => {
            const h = document.createElement('div');
            h.className = 'memo-date-group-header';
            h.innerHTML = `<i class="fa-regular fa-clock"></i> ${date}`;
            savedMemosContainer.appendChild(h);

            grouped[date].forEach(memo => {
                const card = document.createElement('div');
                card.className = 'memo-item-card';
                card.innerHTML = `
                    <div class="memo-card-main" onclick="loadMemoData('${memo.id}')">
                        <span class="memo-card-title">${memo.title}</span>
                        <span class="memo-card-snippet">${memo.content.substring(0,35)}...</span>
                    </div>
                    <button class="compact-del-btn" onclick="deleteMemoData(event, '${memo.id}')"><i class="fa-regular fa-trash-can"></i></button>
                `;
                savedMemosContainer.appendChild(card);
            });
        });
    }

    window.loadMemoData = (id) => {
        db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                memoTitleInput.value = data.title;
                memoTextarea.value = data.content;
                editingMemoId = id;
                saveStatus.textContent = "수정 중";
            }
        });
    };

    window.deleteMemoData = (event, id) => {
        event.stopPropagation();
        db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).remove();
        if (editingMemoId === id) resetEditor();
    };

    function resetEditor() {
        memoTitleInput.value = '';
        memoTextarea.value = '';
        editingMemoId = null;
        saveStatus.textContent = "새 메모";
    }

    saveMemoBtn.addEventListener('click', () => {
        const textContent = memoTextarea.value.trim();
        if (!textContent) return alert('메모 내용을 입력하세요!');
        const payload = {
            title: memoTitleInput.value.trim() || textContent.split('\n')[0].substring(0, 12),
            content: textContent,
            date: getTodayDateString()
        };
        if (editingMemoId) db.ref(`workspace/folders/${activeFolderName}/memos/${editingMemoId}`).update(payload);
        else db.ref(`workspace/folders/${activeFolderName}/memos`).push(payload);
        resetEditor();
    });
    clearMemoBtn.addEventListener('click', resetEditor);


    // --- 📚 2. 과목별 오답노트 시스템 (추가/삭제/정렬 완비) ---
    const mathExplorerZone = document.getElementById('math-explorer-zone');
    const mathEditorZone = document.getElementById('math-editor-zone');
    const mathFolderGrid = document.getElementById('math-folder-grid');
    const mathCreateFolderBtn = document.getElementById('math-create-folder-btn');
    
    const mathBackBtn = document.getElementById('math-back-btn');
    const mathCurrentFolderTitle = document.getElementById('math-current-folder-title');
    const mathProbTitle = document.getElementById('math-prob-title');
    const mathProbWrong = document.getElementById('math-prob-wrong');
    const mathProbApproach = document.getElementById('math-prob-approach');
    const mathProbSolution = document.getElementById('math-prob-solution');
    const mathSaveBtn = document.getElementById('math-save-btn');
    const mathClearBtn = document.getElementById('math-clear-btn');
    const mathSaveStatus = document.getElementById('math-save-status');
    const mathSavedList = document.getElementById('math-saved-list');
    const btnToggleSort = document.getElementById('btn-toggle-sort');

    let activeMathFolder = null;
    let editingMathId = null;
    let currentSortMode = 'latest'; // 'latest' (최신순) 혹은 'alpha' (이름순)

    // 과목 폴더 실시간 데이터 동기화 리스너
    db.ref('workspace/mathNotebooks').on('value', (snapshot) => {
        const mathData = snapshot.val() || {};
        // 첫 개설 시 기본 세팅 예시 공급 (원하는 대로 삭제 및 커스텀 가능)
        if (Object.keys(mathData).length === 0) {
            const defaultMathDirs = ['수학 고난도', '영어 빈칸추론', '국어 비문학'];
            defaultMathDirs.forEach(d => db.ref('workspace/mathNotebooks/' + d).set({ createdAt: Date.now() }));
            return;
        }
        renderMathDashboard(mathData);
        if (activeMathFolder && mathData[activeMathFolder]) {
            renderMathItems(mathData[activeMathFolder].problems || {});
        }
    });

    function renderMathDashboard(mathData) {
        mathFolderGrid.innerHTML = '';
        Object.keys(mathData).forEach(folderName => {
            const count = Object.keys(mathData[folderName].problems || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.innerHTML = `
                <div class="folder-icon"><i class="fa-solid fa-book"></i></div>
                <div class="folder-name">${folderName}</div>
                <div class="folder-memo-count">${count}개의 기록</div>
                <button class="folder-del-btn" onclick="deleteMathFolder(event, '${folderName}')"><i class="fa-solid fa-xmark"></i></button>
            `;
            card.addEventListener('click', () => enterMathFolder(folderName));
            mathFolderGrid.appendChild(card);
        });
    }

    // [자유 추가 기능] 수학, 영어 등 자유로운 이름 기입 가능
    mathCreateFolderBtn.addEventListener('click', () => {
        const name = prompt('새로 추가할 오답노트 과목 또는 문제집 이름을 입력하세요:');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
        if (cleaned) db.ref('workspace/mathNotebooks/' + cleaned).update({ createdAt: Date.now() });
    });

    // [자유 삭제 기능] 과목 통째로 완파 제거
    window.deleteMathFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 오답노트 폴더와 그 안의 모든 문항 수식이 삭제됩니다. 영구 삭제할까요?`)) {
            db.ref('workspace/mathNotebooks/' + folderName).remove();
            if (activeMathFolder === folderName) exitMathFolder();
        }
    };

    function enterMathFolder(folderName) {
        activeMathFolder = folderName;
        resetMathEditor();
        mathExplorerZone.classList.add('hidden');
        mathEditorZone.classList.remove('hidden');
        mathCurrentFolderTitle.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${activeMathFolder}`;
        db.ref('workspace/mathNotebooks/' + folderName + '/problems').once('value', (snapshot) => {
            renderMathItems(snapshot.val() || {});
        });
    }

    mathBackBtn.addEventListener('click', exitMathFolder);
    function exitMathFolder() {
        activeMathFolder = null;
        mathEditorZone.classList.add('hidden');
        mathExplorerZone.classList.remove('hidden');
    }

    // 🎛️ 정렬 기준 토글 버튼 리스너
    btnToggleSort.addEventListener('click', () => {
        if (currentSortMode === 'latest') {
            currentSortMode = 'alpha';
            btnToggleSort.innerHTML = `<i class="fa-solid fa-arrow-down-a-z"></i> 이름순 보기`;
        } else {
            currentSortMode = 'latest';
            btnToggleSort.innerHTML = `<i class="fa-solid fa-arrow-down-9-1"></i> 최신순 보기`;
        }
        // 활성화된 과목 데이터 다시 렌더링 요청
        if (activeMathFolder) {
            db.ref('workspace/mathNotebooks/' + activeMathFolder + '/problems').once('value', (snapshot) => {
                renderMathItems(snapshot.val() || {});
            });
        }
    });

    // 문항 리스트 렌더링 + 정렬 연산 탑재
    function renderMathItems(probsObj) {
        mathSavedList.innerHTML = '';
        let list = Object.keys(probsObj).map(id => ({ id, ...probsObj[id] }));
        
        if(list.length === 0) {
            mathSavedList.innerHTML = `<div style="font-size:0.8rem; color:#71717a; text-align:center; padding:15px;">등록된 문제가 없습니다. 오답 노트를 기입해 보세요!</div>`;
            return;
        }

        // [정렬 필터 기동]
        if (currentSortMode === 'latest') {
            // 최신순 정렬 (타임스탬프 역순)
            list.sort((a, b) => b.timestamp - a.timestamp);
        } else if (currentSortMode === 'alpha') {
            // 이름순 정렬 (가나다 오름차순)
            list.sort((a, b) => a.title.localeCompare(b.title));
        }

        list.forEach(p => {
            const card = document.createElement('div');
            card.className = 'memo-item-card';
            card.innerHTML = `
                <div class="memo-card-main" onclick="loadMathData('${p.id}')">
                    <span class="memo-card-title">${p.title}</span>
                    <span class="memo-card-snippet" style="color:#f87171;">오답분석: ${p.wrong.substring(0, 35)}...</span>
                </div>
                <button class="compact-del-btn" onclick="deleteMathData(event, '${p.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            mathSavedList.appendChild(card);
        });
    }

    window.loadMathData = (id) => {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                mathProbTitle.value = data.title;
                mathProbWrong.value = data.wrong;
                mathProbApproach.value = data.approach;
                mathProbSolution.value = data.solution;
                editingMathId = id;
                mathSaveStatus.textContent = "문항 수정 중";
            }
        });
    };

    window.deleteMathData = (event, id) => {
        event.stopPropagation();
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).remove();
        if (editingMathId === id) resetMathEditor();
    };

    function resetMathEditor() {
        mathProbTitle.value = '';
        mathProbWrong.value = '';
        mathProbApproach.value = '';
        mathProbSolution.value = '';
        editingMathId = null;
        mathSaveStatus.textContent = "새 문항 등록";
    }

    mathSaveBtn.addEventListener('click', () => {
        const title = mathProbTitle.value.trim();
        const wrong = mathProbWrong.value.trim();
        const approach = mathProbApproach.value.trim();
        const solution = mathProbSolution.value.trim();

        if (!title || !solution) return alert('문제 제목과 풀이과정은 필수로 기입하셔야 저장됩니다!');

        const payload = { 
            title, 
            wrong, 
            approach, 
            solution, 
            timestamp: Date.now() // 정렬용 시각 정보 주입
        };

        if (editingMathId) db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${editingMathId}`).update(payload);
        else db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).push(payload);
        
        resetMathEditor();
    });

    mathClearBtn.addEventListener('click', resetMathEditor);


    // --- 📅 3. 오늘의 플래너 클라우드 동기화 엔진 ---
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    db.ref('workspace/todos').on('value', (snapshot) => {
        renderTodoList(snapshot.val() || {});
    });

    function renderTodoList(todosObj) {
        todoList.innerHTML = '';
        const todayStr = getTodayDateString();
        const list = Object.keys(todosObj).map(id => ({ id, ...todosObj[id] })).filter(t => t.date === todayStr);

        const completed = list.filter(t => t.completed).length;
        todoStats.textContent = `${completed} / ${list.length} 완료`;

        list.forEach(todo => {
            const li = document.createElement('li');
            li.className = `item-row ${todo.completed ? 'done' : ''}`;
            li.innerHTML = `
                <div class="item-left">
                    <span class="time-tag">${todo.time}</span>
                    <span class="item-text" onclick="toggleTodoCloud('${todo.id}', ${todo.completed})">${todo.text}</span>
                </div>
                <button class="compact-del-btn" onclick="deleteTodoCloud('${todo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            todoList.appendChild(li);
        });
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        db.ref('workspace/todos').push({
            date: getTodayDateString(),
            time: todoTimeInput.value.trim(),
            text: todoInput.value.trim(),
            completed: false
        });
        todoInput.value = ''; todoTimeInput.value = '';
    });

    window.toggleTodoCloud = (id, currentStatus) => db.ref(`workspace/todos/${id}`).update({ completed: !currentStatus });
    window.deleteTodoCloud = (id) => db.ref(`workspace/todos/${id}`).remove();


    // --- 🎯 4. 디데이 카운트다운 클라우드 엔진 ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    db.ref('workspace/ddays').on('value', (snapshot) => {
        renderDDayList(snapshot.val() || {});
    });

    function renderDDayList(ddaysObj) {
        ddayContainer.innerHTML = '';
        const today = new Date(); today.setHours(0,0,0,0);

        Object.keys(ddaysObj).forEach(id => {
            const item = ddaysObj[id];
            const target = new Date(item.date); target.setHours(0,0,0,0);
            const diff = target.getTime() - today.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            let displayD = days === 0 ? 'D-Day' : (days > 0 ? `D-${days}` : `D+${Math.abs(days)}`);

            const div = document.createElement('div');
            div.className = 'dday-card';
            div.innerHTML = `
                <div class="dday-info">
                    <span class="dday-name">${item.title}</span>
                    <span class="dday-date-text">목표일: ${item.date}</span>
                </div>
                <div class="dday-right-zone">
                    <span class="dday-number">${displayD}</span>
                    <button class="compact-del-btn" onclick="deleteDDayCloud('${id}')"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;
            ddayContainer.appendChild(div);
        });
    }

    ddayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!ddayTitle.value.trim() || !ddayDate.value) return;
        db.ref('workspace/ddays').push({ title: ddayTitle.value.trim(), date: ddayDate.value });
        ddayForm.reset();
    });

    window.deleteDDayCloud = (id) => db.ref(`workspace/ddays/${id}`).remove();

});
