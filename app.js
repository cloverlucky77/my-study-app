// ==========================================
// 🔥 [필독] 구글 파이어베이스 설정 데이터 연동 영역
// ==========================================
// 본인의 파이어베이스 콘솔 프로젝트 설정화면에서 제공받은 config 값으로 꼭 교체해 주세요!
const firebaseConfig = {
    apiKey: "AIzaSyAs-YOUR-REAL-API-KEY-HERE",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/", // ◀ 특히 실시간 디비 주소가 가장 중요합니다.
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdefabcdef"
};

// 파이어베이스 엔진 기동
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {

    // --- 상단 실시간 시계 모듈 ---
    const clockDisplay = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

    const getTodayDateString = () => new Date().toISOString().split('T')[0];


    // --- 🗂️ 1. 구조개편: 클라우드 파일 탐색기 & 내장 메모장 엔진 ---
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

    let activeFolderName = null; // 현재 어떤 파일(폴더)에 진입해 있는지 추적
    let editingMemoId = null;

    // 파이어베이스 리스너: 실시간으로 동적 폴더 구조 및 폴더 내 메모 갯수 연산 감시
    db.ref('workspace/folders').on('value', (snapshot) => {
        const foldersData = snapshot.val() || {};
        
        // 기본으로 깔고 갈 초기 폴더 데이터 설정 (디비에 아무것도 없을 때 자동 공급)
        if (Object.keys(foldersData).length === 0) {
            const initDirs = ['일반', '동아리', '수학', '일상'];
            initDirs.forEach(d => {
                db.ref('workspace/folders/' + d).set({ createdAt: Date.now() });
            });
            return;
        }

        renderFolderDashboard(foldersData);
        
        // 만약 특정 폴더 안에 진입해 있는 상태라면, 메모 리스트도 실시간 갱신 처리
        if (activeFolderName && foldersData[activeFolderName]) {
            renderFolderMemos(foldersData[activeFolderName].memos || {});
        }
    });

    // 폴더 탐색기 대시보드 렌더링
    function renderFolderDashboard(foldersData) {
        folderGridContainer.innerHTML = '';
        
        Object.keys(foldersData).forEach(folderName => {
            const folderObj = foldersData[folderName];
            const memosObj = folderObj.memos || {};
            const memoCount = Object.keys(memosObj).length;

            const card = document.createElement('div');
            card.className = 'folder-card';
            card.innerHTML = `
                <div class="folder-icon"><i class="fa-solid fa-folder-open"></i></div>
                <div class="folder-name">${folderName}</div>
                <div class="folder-memo-count">${memoCount}개의 기록</div>
                <button class="folder-del-btn" onclick="deleteEntireFolder(event, '${folderName}')"><i class="fa-solid fa-xmark"></i></button>
            `;
            // 폴더 클릭 시 -> 해당 파일 안으로 진입하는 핵심 핸들러 연동
            card.addEventListener('click', () => enterFolderScope(folderName));
            folderGridContainer.appendChild(card);
        });
    }

    // 신규 파일 분류(폴더) 만들기 버튼
    createFolderBtn.addEventListener('click', () => {
        const name = prompt('새로 만들 파일 분류(폴더)의 이름을 입력해 주세요:');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, ""); // 파이어베이스 금지 기호 정제
        if (!cleaned) return;

        db.ref('workspace/folders/' + cleaned).update({ createdAt: Date.now() });
    });

    // 파일 분류 완전 영구삭제
    window.deleteEntireFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 파일 분류 전체와 그 내부의 메모 기록을 클라우드 서버에서 영구 삭제할까요?`)) {
            db.ref('workspace/folders/' + folderName).remove();
            if (activeFolderName === folderName) exitFolderScope();
        }
    };

    // 📂 특정 파일(폴더) 안으로 들어가기!
    function enterFolderScope(folderName) {
        activeFolderName = folderName;
        resetEditor();

        // UI 토글 전환 (탐색기 숨기고 메모장 에디터 켜기)
        folderExplorerZone.classList.add('hidden');
        memoEditorZone.classList.remove('hidden');
        currentFolderTitle.innerHTML = `<i class="fa-regular fa-folder-open"></i> ${activeFolderName}`;

        // 해당 폴더 안의 내용 즉시 가져와서 그리기
        db.ref('workspace/folders/' + folderName + '/memos').once('value', (snapshot) => {
            renderFolderMemos(snapshot.val() || {});
        });
    }

    // ◀ 파일 밖으로 나가기 버튼 클릭 시
    backToFoldersBtn.addEventListener('click', exitFolderScope);
    function exitFolderScope() {
        activeFolderName = null;
        memoEditorZone.classList.add('hidden');
        folderExplorerZone.classList.remove('hidden');
    }

    // 특정 파일 내부에 귀속된 메모들을 날짜별로 파싱하여 리스팅하는 엔진
    function renderFolderMemos(memosObj) {
        savedMemosContainer.innerHTML = '';
        const memoList = [];
        
        Object.keys(memosObj).forEach(id => {
            memoList.push({ id, ...memosObj[id] });
        });

        if (memoList.length === 0) {
            savedMemosContainer.innerHTML = `<div style="font-size:0.8rem; color:#71717a; text-align:center; padding:20px;">이 파일 분류 안에 저장된 메모가 없습니다. 먼저 작성해 보세요!</div>`;
            return;
        }

        // 날짜별 그룹 정렬 빌딩
        const grouped = {};
        memoList.forEach(m => {
            const dKey = m.date || '날짜 미상';
            if (!grouped[dKey]) grouped[dKey] = [];
            grouped[dKey].push(m);
        });

        const sortedDates = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

        sortedDates.forEach(date => {
            const header = document.createElement('div');
            header.className = 'memo-date-group-header';
            header.innerHTML = `<i class="fa-regular fa-clock"></i> ${date}`;
            savedMemosContainer.appendChild(header);

            grouped[date].forEach(memo => {
                const card = document.createElement('div');
                card.className = 'memo-item-card';
                card.innerHTML = `
                    <div class="memo-card-main" onclick="loadMemoData('${memo.id}')">
                        <span class="memo-card-title">${memo.title}</span>
                        <span class="memo-card-snippet">${memo.content.substring(0, 45)}...</span>
                    </div>
                    <button class="compact-del-btn" onclick="deleteMemoData(event, '${memo.id}')"><i class="fa-regular fa-trash-can"></i></button>
                `;
                savedMemosContainer.appendChild(card);
            });
        });
    }

    // 메모 클릭 시 에디터 서식창으로 데이터 업로드
    window.loadMemoData = (id) => {
        db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                memoTitleInput.value = data.title;
                memoTextarea.value = data.content;
                editingMemoId = id;
                saveStatus.textContent = "수정 중";
                saveStatus.style.color = "#f59e0b";
            }
        });
    };

    // 메모장 개별 지우기
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
        saveStatus.style.color = "#71717a";
    }

    // 현재 열린 파일(폴더) 영역 안에 메모장 저장 트랜잭션 날리기
    saveMemoBtn.addEventListener('click', () => {
        const textTitle = memoTitleInput.value.trim();
        const textContent = memoTextarea.value.trim();
        if (!textContent) return alert('메모 내용을 입력하세요!');

        const finalTitle = textTitle || textContent.split('\n')[0].substring(0, 15) || "제목 없는 메모";

        const payload = {
            title: finalTitle,
            content: textContent,
            date: getTodayDateString(),
            updatedAt: Date.now()
        };

        if (editingMemoId) {
            db.ref(`workspace/folders/${activeFolderName}/memos/${editingMemoId}`).update(payload);
        } else {
            db.ref(`workspace/folders/${activeFolderName}/memos`).push(payload);
        }
        resetEditor();
    });

    clearMemoBtn.addEventListener('click', resetEditor);


    // --- 📅 2. 오늘의 플래너 클라우드 엔진 ---
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    db.ref('workspace/todos').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        renderTodoList(data);
    });

    function renderTodoList(todosObj) {
        todoList.innerHTML = '';
        const todayStr = getTodayDateString();
        
        const list = [];
        Object.keys(todosObj).forEach(id => {
            if (todosObj[id].date === todayStr) {
                list.push({ id, ...todosObj[id] });
            }
        });

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
        todoInput.value = '';
        todoTimeInput.value = '';
    });

    window.toggleTodoCloud = (id, currentStatus) => {
        db.ref(`workspace/todos/${id}`).update({ completed: !currentStatus });
    };

    window.deleteTodoCloud = (id) => {
        db.ref(`workspace/todos/${id}`).remove();
    };


    // --- 🎯 3. 디데이 카운트다운 클라우드 엔진 ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    db.ref('workspace/ddays').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        renderDDayList(data);
    });

    function renderDDayList(ddaysObj) {
        ddayContainer.innerHTML = '';
        const today = new Date();
        today.setHours(0,0,0,0);

        Object.keys(ddaysObj).forEach(id => {
            const item = ddaysObj[id];
            const target = new Date(item.date);
            target.setHours(0,0,0,0);
            
            const diff = target.getTime() - today.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            let displayD = '';
            if (days === 0) displayD = 'D-Day';
            else if (days > 0) displayD = `D-${days}`;
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
                    <button class="compact-del-btn" onclick="deleteDDayCloud('${id}')"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;
            ddayContainer.appendChild(div);
        });
    }

    ddayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleVal = ddayTitle.value.trim();
        const dateVal = ddayDate.value;
        if(!titleVal || !dateVal) return;

        db.ref('workspace/ddays').push({ title: titleVal, date: dateVal });
        ddayForm.reset();
    });

    window.deleteDDayCloud = (id) => {
        db.ref(`workspace/ddays/${id}`).remove();
    };

});
