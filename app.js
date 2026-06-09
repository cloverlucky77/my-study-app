// ==========================================
// 🔥 파이어베이스 원격 데이터베이스 연결 설정
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

    // --- 🧭 사이드바 탭 제어 엔진 ---
    const menuItems = document.querySelectorAll('.menu-item');
    const contentViews = document.querySelectorAll('.content-view');
    const sidebarSubFolders = document.getElementById('sidebar-sub-folders');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            contentViews.forEach(view => {
                if (view.id === targetId) view.classList.remove('hidden');
                else view.classList.add('hidden');
            });

            if (item.id !== 'menu-btn-math') {
                sidebarSubFolders.classList.add('hidden');
            } else {
                sidebarSubFolders.classList.remove('hidden');
            }
        });
    });

    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

    const getTodayDateString = () => new Date().toISOString().split('T')[0];


    // --- 🗂️ 1. 일반 메모장 엔진 ---
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
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folderName}</div>
                <div class="folder-memo-count">${count}개 완료</div>
                <div class="folder-action-bar">
                    <button class="btn-folder-action del" onclick="deleteEntireFolder(event, '${folderName}')"><i class="fa-regular fa-trash-can"></i> 삭제</button>
                </div>
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
        if (confirm(`[${folderName}] 분류 전체를 삭제할까요?`)) {
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
            savedMemosContainer.innerHTML = `<div style="font-size:0.8rem; color:#71717a; text-align:center; padding:15px;">기록이 없습니다.</div>`;
            return;
        }
        list.forEach(memo => {
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
        if (!textContent) return alert('내용을 입력하세요!');
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


    // --- 📚 2. 과목별 오답노트 시스템 (불러오기 + 심플 폴더 UI 완비) ---
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
    let currentSortMode = 'latest'; 

    db.ref('workspace/mathNotebooks').on('value', (snapshot) => {
        const mathData = snapshot.val() || {};
        renderMathDashboard(mathData);
        renderSidebarSubFolders(mathData); 

        if (activeMathFolder && mathData[activeMathFolder]) {
            renderMathItems(mathData[activeMathFolder].problems || {});
        }
    });

    // 보기 편하게 최적화된 심플 폴더 그리드 출력 함수
    function renderMathDashboard(mathData) {
        mathFolderGrid.innerHTML = '';
        
        const sortedFolders = Object.keys(mathData).map(name => ({
            name,
            ...mathData[name],
            order: mathData[name].order !== undefined ? mathData[name].order : 0
        })).sort((a, b) => a.order - b.order);

        if (sortedFolders.length === 0) {
            mathFolderGrid.innerHTML = `<div style="grid-column:1/-1; font-size:0.85rem; color:#71717a; text-align:center; padding:20px;">생성된 폴더가 없습니다.</div>`;
            return;
        }

        sortedFolders.forEach((folder) => {
            const count = Object.keys(folder.problems || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.innerHTML = `
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-memo-count">${count}개 저장됨</div>
                <div class="folder-action-bar">
                    <button class="btn-folder-action" onclick="moveMathFolderOrder(event, '${folder.name}', -1)"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="btn-folder-action" onclick="moveMathFolderOrder(event, '${folder.name}', 1)"><i class="fa-solid fa-chevron-down"></i></button>
                    <button class="btn-folder-action del" onclick="deleteMathFolder(event, '${folder.name}')"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;
            card.addEventListener('click', () => enterMathFolder(folder.name));
            mathFolderGrid.appendChild(card);
        });
    }

    function renderSidebarSubFolders(mathData) {
        sidebarSubFolders.innerHTML = '';
        const sortedFolders = Object.keys(mathData).map(name => ({
            name,
            order: mathData[name].order !== undefined ? mathData[name].order : 0
        })).sort((a, b) => a.order - b.order);

        if (sortedFolders.length === 0) return;

        sortedFolders.forEach(folder => {
            const subBtn = document.createElement('button');
            subBtn.type = 'button';
            subBtn.className = 'sub-menu-item';
            subBtn.innerHTML = `<i class="fa-solid fa-chevron-right"></i> ${folder.name}`;
            subBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menuItems.forEach(btn => btn.classList.remove('active'));
                document.getElementById('menu-btn-math').classList.add('active');
                contentViews.forEach(view => {
                    if (view.id === 'view-math') view.classList.remove('hidden');
                    else view.classList.add('hidden');
                });
                sidebarSubFolders.classList.remove('hidden');
                enterMathFolder(folder.name);
            });
            sidebarSubFolders.appendChild(subBtn);
        });
    }

    window.moveMathFolderOrder = (event, folderName, direction) => {
        event.stopPropagation();
        db.ref('workspace/mathNotebooks').once('value', (snapshot) => {
            const mathData = snapshot.val() || {};
            const list = Object.keys(mathData).map(name => ({
                name,
                order: mathData[name].order !== undefined ? mathData[name].order : 0
            })).sort((a, b) => a.order - b.order);

            const index = list.findIndex(f => f.name === folderName);
            if (index === -1) return;

            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= list.length) return;

            const temp = list[index];
            list[index] = list[newIndex];
            list[newIndex] = temp;

            const updates = {};
            list.forEach((f, idx) => { updates[`workspace/mathNotebooks/${f.name}/order`] = idx; });
            db.ref().update(updates);
        });
    };

    mathCreateFolderBtn.addEventListener('click', () => {
        const name = prompt('새 오답노트 과목 폴더 이름을 입력하세요:');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
        if (!cleaned) return;

        db.ref('workspace/mathNotebooks').once('value', (snapshot) => {
            const mathData = snapshot.val() || {};
            const nextOrder = Object.keys(mathData).length;
            db.ref('workspace/mathNotebooks/' + cleaned).update({ 
                createdAt: Date.now(),
                order: nextOrder
            });
        });
    });

    window.deleteMathFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 폴더와 내부의 모든 문제 기록을 삭제할까요?`)) {
            db.ref('workspace/mathNotebooks/' + folderName).remove();
            if (activeMathFolder === folderName) exitMathFolder();
        }
    };

    function enterMathFolder(folderName) {
        activeMathFolder = folderName;
        resetMathEditor();
        mathExplorerZone.classList.add('hidden');
        mathEditorZone.classList.remove('hidden');
        mathCurrentFolderTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${activeMathFolder}`;
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

    btnToggleSort.addEventListener('click', () => {
        if (currentSortMode === 'latest') {
            currentSortMode = 'alpha';
            btnToggleSort.innerHTML = `<i class="fa-solid fa-arrow-down-a-z"></i> 이름순 보기`;
        } else {
            currentSortMode = 'latest';
            btnToggleSort.innerHTML = `<i class="fa-solid fa-arrow-down-9-1"></i> 최신순 보기`;
        }
        if (activeMathFolder) {
            db.ref('workspace/mathNotebooks/' + activeMathFolder + '/problems').once('value', (snapshot) => {
                renderMathItems(snapshot.val() || {});
            });
        }
    });

    // 💡 문항 리스트 렌더링 함수
    function renderMathItems(probsObj) {
        mathSavedList.innerHTML = '';
        let list = Object.keys(probsObj).map(id => ({ id, ...probsObj[id] }));
        
        if(list.length === 0) {
            mathSavedList.innerHTML = `<div style="font-size:0.8rem; color:#71717a; text-align:center; padding:15px;">저장된 문제 기록이 없습니다.</div>`;
            return;
        }

        if (currentSortMode === 'latest') list.sort((a, b) => b.timestamp - a.timestamp);
        else if (currentSortMode === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title));

        list.forEach(p => {
            const card = document.createElement('div');
            card.className = 'memo-item-card';
            card.innerHTML = `
                <div class="memo-card-main" onclick="loadMathData('${p.id}')">
                    <span class="memo-card-title">${p.title}</span>
                    <span class="memo-card-snippet" style="color:#f87171;">오답분석: ${p.wrong.substring(0, 32)}...</span>
                </div>
                <button class="compact-del-btn" onclick="deleteMathData(event, '${p.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            mathSavedList.appendChild(card);
        });
    }

    // 💡 [새 기능] 메모장처럼 과거 기록을 터치하면 서식 창으로 원격 로드하는 함수
    window.loadMathData = (id) => {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // 입력창들에 과거 데이터를 주입
                mathProbTitle.value = data.title;
                mathProbWrong.value = data.wrong;
                mathProbApproach.value = data.approach;
                mathProbSolution.value = data.solution;
                
                editingMathId = id; // 현재 수정 중인 키값 기억
                mathSaveStatus.textContent = "문항 수정 중";
                mathSaveStatus.style.color = "#60a5fa";
                
                // 터치 후 편집 편의를 위해 스크롤을 부드럽게 상단 편집 영역으로 올려줍니다.
                document.getElementById('view-math').scrollIntoView({ behavior: 'smooth' });
            }
        });
    };

    window.deleteMathData = (event, id) => {
        event.stopPropagation();
        if(confirm("이 오답 문항 기록을 영구 삭제할까요?")) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).remove();
            if (editingMathId === id) resetMathEditor();
        }
    };

    function resetMathEditor() {
        mathProbTitle.value = '';
        mathProbWrong.value = '';
        mathProbApproach.value = '';
        mathProbSolution.value = '';
        editingMathId = null;
        mathSaveStatus.textContent = "새 문항 등록";
        mathSaveStatus.style.color = "#71717a";
    }

    // 저장 버튼 클릭 핸들러 (추가 및 수정을 동시에 분기 처리)
    mathSaveBtn.addEventListener('click', () => {
        const title = mathProbTitle.value.trim();
        const wrong = mathProbWrong.value.trim();
        const approach = mathProbApproach.value.trim();
        const solution = mathProbSolution.value.trim();

        if (!title || !solution) return alert('문제 제목과 풀이과정은 필수 기입 사항입니다.');

        const payload = { title, wrong, approach, solution, timestamp: Date.now() };

        if (editingMathId) {
            // 💡 수정 상태일 때는 기존 경로에 덮어쓰기(Update) 수행
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${editingMathId}`).update(payload);
        } else {
            // 💡 신규 상태일 때는 새로운 유니크 노드로 Push 수행
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).push(payload);
        }
        
        resetMathEditor();
    });

    mathClearBtn.addEventListener('click', resetMathEditor);


    // --- 📅 3. 오늘의 플래너 클라우드 엔진 ---
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
