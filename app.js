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

    // --- 🧭 사이드바 여닫기 토글 엔진 ---
    const mainSidebar = document.getElementById('main-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    const btnOpenSidebar = document.getElementById('btn-open-sidebar');
    const outsideToggleButtons = document.querySelectorAll('.sidebar-toggle-outside');

    function hideSidebar() {
        mainSidebar.classList.add('collapsed');
        outsideToggleButtons.forEach(btn => btn.classList.remove('hidden'));
    }

    function showSidebar() {
        mainSidebar.classList.remove('collapsed');
        outsideToggleButtons.forEach(btn => btn.classList.add('hidden'));
    }

    if(btnCloseSidebar) btnCloseSidebar.addEventListener('click', hideSidebar);
    if(btnOpenSidebar) btnOpenSidebar.addEventListener('click', showSidebar);
    
    // 타 뷰에 분산 생성된 햄버거 메뉴에도 연동 적용
    document.querySelectorAll('.aria-toggle-sidebar').forEach(btn => {
        btn.addEventListener('click', showSidebar);
    });

    // --- 🧭 메뉴 변환 및 시계 ---
    const menuItems = document.querySelectorAll('.menu-item');
    const contentViews = document.querySelectorAll('.content-view');
    const sidebarSubFolders = document.getElementById('sidebar-sub-folders');
    const sidebarMemoFolders = document.getElementById('sidebar-memo-folders');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            
            contentViews.forEach(view => {
                if (view.id === targetId) view.classList.remove('hidden');
                else view.classList.add('hidden');
            });
            
            if (item.id === 'menu-btn-math') {
                sidebarSubFolders.classList.remove('hidden');
                sidebarMemoFolders.classList.add('hidden');
            } else if (item.id === 'menu-btn-memo') {
                sidebarMemoFolders.classList.remove('hidden');
                sidebarSubFolders.classList.add('hidden');
            } else {
                sidebarSubFolders.classList.add('hidden');
                sidebarMemoFolders.classList.add('hidden');
            }
        });
    });

    const clockDisplay = document.getElementById('live-clock');
    setInterval(() => { clockDisplay.textContent = new Date().toTimeString().split(' ')[0]; }, 1000);
    const getTodayDateString = () => new Date().toISOString().split('T')[0];


    // --- 🗂️ 1. 일반 메모장 분류 보관함 ---
    const folderExplorerZone = document.getElementById('folder-explorer-zone');
    const memoEditorZone = document.getElementById('memo-editor-zone');
    const folderGridContainer = document.getElementById('folder-grid-container');
    const createFolderBtn = document.getElementById('create-folder-btn');
    const backToFoldersBtn = document.getElementById('back-to-folders-btn');
    const currentFolderTitle = document.getElementById('current-folder-title');
    const memoTitleInput = document.getElementById('memo-title-input');
    const memoTextarea = document.getElementById('memo-textarea');
    const saveMemoBtn = document.getElementById('save-memo-btn');
    const savedMemosContainer = document.getElementById('saved-memos-container');

    let activeFolderName = null; 
    let editingMemoId = null;

    db.ref('workspace/folders').on('value', (snapshot) => {
        const foldersData = snapshot.val() || {};
        renderFolderDashboard(foldersData);
        renderSidebarMemoFolders(foldersData);
        if (activeFolderName) {
            if (!foldersData[activeFolderName]) { exitFolderScope(); } 
            else { renderFolderMemos(foldersData[activeFolderName].memos || {}); }
        }
    });

    function renderFolderDashboard(foldersData) {
        folderGridContainer.innerHTML = '';
        const sorted = Object.keys(foldersData).map(name => ({
            name, ...foldersData[name], order: foldersData[name].order !== undefined ? foldersData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        sorted.forEach(folder => {
            const count = Object.keys(folder.memos || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.setAttribute('draggable', 'true');
            card.dataset.id = folder.name;
            card.innerHTML = `
                <button class="btn-folder-delete-absolute" onclick="deleteEntireFolder(event, '${folder.name}')"><i class="fa-regular fa-trash-can"></i></button>
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-memo-count">${count}개 보관됨</div>
            `;
            card.addEventListener('click', (e) => {
                if(e.target.closest('.btn-folder-delete-absolute')) return;
                enterFolderScope(folder.name);
            });
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                saveNewMemoFolderOrder();
            });
            folderGridContainer.appendChild(card);
        });
    }

    folderGridContainer.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(folderGridContainer, '.folder-card', e.clientX, e.clientY);
        const draggingCard = document.querySelector('#folder-grid-container .folder-card.dragging');
        if(!draggingCard) return;
        if (afterElement == null) folderGridContainer.appendChild(draggingCard);
        else folderGridContainer.insertBefore(draggingCard, afterElement);
    });

    function saveNewMemoFolderOrder() {
        const cards = [...folderGridContainer.querySelectorAll('.folder-card')];
        const updates = {};
        cards.forEach((card, index) => { updates[`workspace/folders/${card.dataset.id}/order`] = index; });
        db.ref().update(updates);
    }

    function renderSidebarMemoFolders(foldersData) {
        sidebarMemoFolders.innerHTML = '';
        const sorted = Object.keys(foldersData).map(name => ({
            name, order: foldersData[name].order !== undefined ? foldersData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        sorted.forEach(folder => {
            const btn = document.createElement('button');
            btn.className = 'sub-menu-item';
            btn.innerHTML = `<i class="fa-regular fa-folder"></i> ${folder.name}`;
            btn.addEventListener('click', () => {
                menuItems.forEach(b => b.classList.remove('active'));
                document.getElementById('menu-btn-memo').classList.add('active');
                contentViews.forEach(v => v.id === 'view-memo' ? v.classList.remove('hidden') : v.classList.add('hidden'));
                sidebarMemoFolders.classList.remove('hidden');
                enterFolderScope(folder.name);
            });
            sidebarMemoFolders.appendChild(btn);
        });
    }

    createFolderBtn.addEventListener('click', () => {
        const name = prompt('새 분류 폴더명을 입력하세요:');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
        if (cleaned) db.ref('workspace/folders/' + cleaned).set({ createdAt: Date.now(), order: 999, memos: {} });
    });

    window.deleteEntireFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 폴더를 서버에서 삭제하시겠습니까?`)) {
            db.ref('workspace/folders/' + folderName).remove();
        }
    };

    function enterFolderScope(folderName) {
        activeFolderName = folderName; resetEditor();
        folderExplorerZone.classList.add('hidden'); memoEditorZone.classList.remove('hidden');
        currentFolderTitle.innerHTML = `<i class="fa-regular fa-folder-open"></i> ${activeFolderName}`;
    }
    backToFoldersBtn.addEventListener('click', exitFolderScope);
    function exitFolderScope() { activeFolderName = null; memoEditorZone.classList.add('hidden'); folderExplorerZone.classList.remove('hidden'); }

    function renderFolderMemos(memosObj) {
        savedMemosContainer.innerHTML = '';
        const list = Object.keys(memosObj).map(id => ({ id, ...memosObj[id] }));
        if(list.length === 0){ savedMemosContainer.innerHTML = `<div style="color:#71717a; font-size:0.8rem; text-align:center;">기록이 없습니다.</div>`; return; }
        list.forEach(memo => {
            const card = document.createElement('div');
            card.className = 'item-row';
            card.innerHTML = `
                <span class="item-text" onclick="loadMemoData('${memo.id}')">📂 ${memo.title}</span>
                <button class="compact-del-btn" onclick="deleteMemoData(event, '${memo.id}')"><i class="fa-regular fa-trash-can"></i></button>
            `;
            savedMemosContainer.appendChild(card);
        });
    }

    window.loadMemoData = (id) => {
        db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) { memoTitleInput.value = data.title; memoTextarea.value = data.content; editingMemoId = id; document.getElementById('save-status').textContent = "수정 모드"; }
        });
    };
    window.deleteMemoData = (event, id) => { event.stopPropagation(); db.ref(`workspace/folders/${activeFolderName}/memos/${id}`).remove(); if(editingMemoId===id) resetEditor(); };
    function resetEditor() { memoTitleInput.value = ''; memoTextarea.value = ''; editingMemoId = null; document.getElementById('save-status').textContent = "새 메모"; }
    saveMemoBtn.addEventListener('click', () => {
        const text = memoTextarea.value.trim(); if (!text) return;
        const payload = { title: memoTitleInput.value.trim() || text.substring(0,10), content: text, date: getTodayDateString() };
        if (editingMemoId) db.ref(`workspace/folders/${activeFolderName}/memos/${editingMemoId}`).update(payload);
        else db.ref(`workspace/folders/${activeFolderName}/memos`).push(payload);
        resetEditor();
    });
    document.getElementById('clear-memo-btn').addEventListener('click', resetEditor);


    // --- 📚 2. 과목별 및 문제 유형별 오답노트 (터치 제어 드래그 엔진 탑재) ---
    const mathExplorerZone = document.getElementById('math-explorer-zone');
    const mathEditorZone = document.getElementById('math-editor-zone');
    const mathFolderGrid = document.getElementById('math-folder-grid');
    const mathCreateFolderBtn = document.getElementById('math-create-folder-btn');
    const mathBackBtn = document.getElementById('math-back-btn');
    const mathCurrentFolderTitle = document.getElementById('math-current-folder-title');
    
    const mathProbTitle = document.getElementById('math-prob-title');
    const mathProbType = document.getElementById('math-prob-type');
    const mathProbWrong = document.getElementById('math-prob-wrong');
    const mathProbApproach = document.getElementById('math-prob-approach');
    const mathProbSolution = document.getElementById('math-prob-solution');
    
    const mathSaveBtn = document.getElementById('math-save-btn');
    const mathClearBtn = document.getElementById('math-clear-btn');
    const mathSaveStatus = document.getElementById('math-save-status');
    const mathSavedList = document.getElementById('math-saved-list');
    
    const filterTypeSelect = document.getElementById('math-filter-type-select');
    const btnToggleSort = document.getElementById('btn-toggle-sort');

    const btnManageTypes = document.getElementById('btn-manage-types');
    const typeModal = document.getElementById('type-modal');
    const closeTypeModal = document.getElementById('close-type-modal');
    const newTypeInput = document.getElementById('new-type-input');
    const btnAddType = document.getElementById('btn-add-type');
    const customTypeList = document.getElementById('custom-type-list');

    let activeMathFolder = null;
    let editingMathId = null;
    let currentSortMode = 'latest'; 

    db.ref('workspace/mathNotebooks').on('value', (snapshot) => {
        const mathData = snapshot.val() || {};
        renderMathDashboard(mathData);
        renderSidebarSubFolders(mathData); 

        if (activeMathFolder) {
            if (!mathData[activeMathFolder]) { 
                exitMathFolder(); 
            } else { 
                const typesObj = mathData[activeMathFolder].customTypes || {};
                renderTypeDropdowns(typesObj);
                renderMathItems(mathData[activeMathFolder].problems || {}); 
                renderModalTypeList(typesObj);
            }
        }
    });

    function renderMathDashboard(mathData) {
        mathFolderGrid.innerHTML = '';
        const sorted = Object.keys(mathData).map(name => ({
            name, ...mathData[name], order: mathData[name].order !== undefined ? mathData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        if(sorted.length === 0) {
            mathFolderGrid.innerHTML = `<div style="grid-column:1/-1; font-size:0.85rem; color:#71717a; text-align:center; padding:35px;">과목 폴더가 비어있습니다.</div>`;
            return;
        }

        sorted.forEach(folder => {
            const count = Object.keys(folder.problems || {}).length;
            const card = document.createElement('div');
            card.className = 'folder-card';
            card.setAttribute('draggable', 'true');
            card.dataset.id = folder.name;
            card.innerHTML = `
                <button class="btn-folder-delete-absolute" onclick="deleteMathFolder(event, '${folder.name}')"><i class="fa-regular fa-trash-can"></i></button>
                <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-memo-count">${count}문항 보관</div>
            `;
            
            card.addEventListener('click', (e) => {
                if(e.target.closest('.btn-folder-delete-absolute')) return;
                enterMathFolder(folder.name);
            });
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                saveNewFolderOrder();
            });
            mathFolderGrid.appendChild(card);
        });
    }

    mathFolderGrid.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(mathFolderGrid, '.folder-card', e.clientX, e.clientY);
        const draggingCard = document.querySelector('#math-folder-grid .folder-card.dragging');
        if(!draggingCard) return;
        if (afterElement == null) mathFolderGrid.appendChild(draggingCard);
        else mathFolderGrid.insertBefore(draggingCard, afterElement);
    });

    function getDragAfterElement(container, selector, x, y) {
        const draggableElements = [...container.querySelectorAll(`${selector}:not(.dragging)`)];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offsetX = x - box.left - box.width / 2;
            const offsetY = y - box.top - box.height / 2;
            const distance = Math.sqrt(offsetX*offsetX + offsetY*offsetY);
            if (distance < closest.distance) return { distance: distance, element: child };
            else return closest;
        }, { distance: Infinity }).element;
    }

    function saveNewFolderOrder() {
        const cards = [...mathFolderGrid.querySelectorAll('.folder-card')];
        const updates = {};
        cards.forEach((card, index) => { updates[`workspace/mathNotebooks/${card.dataset.id}/order`] = index; });
        db.ref().update(updates);
    }

    function renderSidebarSubFolders(mathData) {
        sidebarSubFolders.innerHTML = '';
        const sorted = Object.keys(mathData).map(name => ({
            name, order: mathData[name].order !== undefined ? mathData[name].order : 999
        })).sort((a,b) => a.order - b.order);

        sorted.forEach(folder => {
            const btn = document.createElement('button');
            btn.className = 'sub-menu-item';
            btn.innerHTML = `<i class="fa-solid fa-square-root-variable"></i> ${folder.name}`;
            btn.addEventListener('click', () => {
                menuItems.forEach(b => b.classList.remove('active'));
                document.getElementById('menu-btn-math').classList.add('active');
                contentViews.forEach(v => v.id === 'view-math' ? v.classList.remove('hidden') : v.classList.add('hidden'));
                sidebarSubFolders.classList.remove('hidden');
                enterMathFolder(folder.name);
            });
            sidebarSubFolders.appendChild(btn);
        });
    }

    mathCreateFolderBtn.addEventListener('click', () => {
        const name = prompt('새 과목 오답노트 폴더 이름을 입력하세요:');
        if (!name) return;
        const cleaned = name.trim().replace(/[.#$\[\]]/g, "");
        if (!cleaned) return;
        db.ref('workspace/mathNotebooks/' + cleaned).set({ 
            createdAt: Date.now(), order: 999, problems: {}, 
            customTypes: { 
                "지수함수": { order: 0 }, 
                "로그함수": { order: 1 } 
            }
        });
    });

    window.deleteMathFolder = (event, folderName) => {
        event.stopPropagation();
        if (confirm(`[${folderName}] 과목 내부 모든 문항 데이터가 영구 삭제됩니다.`)) {
            db.ref('workspace/mathNotebooks/' + folderName).remove();
        }
    };

    function enterMathFolder(folderName) {
        activeMathFolder = folderName; resetMathEditor();
        mathExplorerZone.classList.add('hidden'); mathEditorZone.classList.remove('hidden');
        mathCurrentFolderTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${activeMathFolder}`;
        filterTypeSelect.value = "ALL";
    }
    mathBackBtn.addEventListener('click', exitMathFolder);
    function exitMathFolder() { activeMathFolder = null; mathEditorZone.classList.add('hidden'); mathExplorerZone.classList.remove('hidden'); }

    function renderTypeDropdowns(typesObj) {
        const prevFilter = filterTypeSelect.value;
        const prevFormType = mathProbType.value;

        filterTypeSelect.innerHTML = '<option value="ALL">전체 유형 보기</option>';
        mathProbType.innerHTML = '';

        const sortedTypes = Object.keys(typesObj).map(key => {
            const val = typesObj[key];
            return { name: key, order: (val && val.order !== undefined) ? val.order : 999 };
        }).sort((a, b) => a.order - b.order);

        if(sortedTypes.length === 0) sortedTypes.push({ name: "미분류", order: 0 });

        sortedTypes.forEach(t => {
            filterTypeSelect.innerHTML += `<option value="${t.name}">${t.name}</option>`;
            mathProbType.innerHTML += `<option value="${t.name}">${t.name}</option>`;
        });

        if ([...filterTypeSelect.options].some(o => o.value === prevFilter)) filterTypeSelect.value = prevFilter;
        if ([...mathProbType.options].some(o => o.value === prevFormType)) mathProbType.value = prevFormType;
    }

    filterTypeSelect.addEventListener('change', () => {
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snapshot) => { renderMathItems(snapshot.val() || {}); });
    });
    btnToggleSort.addEventListener('click', () => {
        currentSortMode = (currentSortMode === 'latest') ? 'alpha' : 'latest';
        btnToggleSort.innerHTML = currentSortMode === 'latest' ? `<i class="fa-solid fa-arrow-down-9-1"></i> 최신순` : `<i class="fa-solid fa-arrow-down-a-z"></i> 이름순`;
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snapshot) => { renderMathItems(snapshot.val() || {}); });
    });

    function renderMathItems(probsObj) {
        mathSavedList.innerHTML = '';
        let list = Object.keys(probsObj).map(id => ({ id, ...probsObj[id] }));
        
        const selectedFilter = filterTypeSelect.value;
        if (selectedFilter !== "ALL") list = list.filter(p => p.type === selectedFilter);

        if (list.length === 0) {
            mathSavedList.innerHTML = `<div style="font-size:0.78rem; color:#71717a; text-align:center; padding:20px 0;">등록된 문제가 없습니다.</div>`;
            return;
        }

        if (currentSortMode === 'latest') list.sort((a, b) => b.timestamp - a.timestamp);
        else list.sort((a, b) => a.title.localeCompare(b.title));

        list.forEach(p => {
            const card = document.createElement('div');
            card.className = `notebook-item-card ${editingMathId === p.id ? 'active-item' : ''}`;
            card.innerHTML = `
                <div class="notebook-card-main" onclick="loadMathData('${p.id}')">
                    <span class="notebook-card-badge">${p.type || '미분류'}</span>
                    <span class="notebook-card-title">${p.title}</span>
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
                editingMathId = id;
                mathProbTitle.value = data.title;
                mathProbType.value = data.type || '미분류';
                mathProbWrong.value = data.wrong || '';
                mathProbApproach.value = data.approach || '';
                mathProbSolution.value = data.solution || '';
                mathSaveStatus.textContent = "📝 기록 조회 및 수정 모드";
                mathSaveStatus.style.color = "#34d399";
                db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snap) => { renderMathItems(snap.val() || {}); });
            }
        });
    };

    window.deleteMathData = (event, id) => {
        event.stopPropagation();
        if(confirm("이 문제를 삭제하시겠습니까?")) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${id}`).remove();
            if (editingMathId === id) resetMathEditor();
        }
    };

    function resetMathEditor() {
        editingMathId = null; mathProbTitle.value = ''; mathProbWrong.value = ''; mathProbApproach.value = ''; mathProbSolution.value = '';
        mathSaveStatus.textContent = "✨ 새 문항 등록 모드"; mathSaveStatus.style.color = "#71717a";
        if(activeMathFolder) db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).once('value', (snap) => { renderMathItems(snap.val() || {}); });
    }

    mathSaveBtn.addEventListener('click', () => {
        const title = mathProbTitle.value.trim(); if (!title) return alert('문제 제목을 적어주세요.');
        const payload = {
            title: title, type: mathProbType.value || '미분류', wrong: mathProbWrong.value.trim(),
            approach: mathProbApproach.value.trim(), solution: mathProbSolution.value.trim(), timestamp: Date.now()
        };
        if (editingMathId) db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems/${editingMathId}`).update(payload);
        else db.ref(`workspace/mathNotebooks/${activeMathFolder}/problems`).push(payload);
        resetMathEditor();
    });
    mathClearBtn.addEventListener('click', resetMathEditor);


    // 🌟 [유형 모달 전용: PC 드래그 + 모바일 터치 하이브리드 엔진]
    btnManageTypes.addEventListener('click', () => { typeModal.classList.remove('hidden'); });
    closeTypeModal.addEventListener('click', () => typeModal.classList.add('hidden'));

    btnAddType.addEventListener('click', () => {
        const typeName = newTypeInput.value.trim().replace(/[.#$\[\]]/g, "");
        if(!typeName) return alert('유형 단원명을 입력해 주세요.');
        db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes`).once('value', snap => {
            const data = snap.val() || {};
            const nextOrder = Object.keys(data).length;
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${typeName}`).set({ order: nextOrder });
            newTypeInput.value = '';
        });
    });

    function renderModalTypeList(typesObj) {
        customTypeList.innerHTML = '';
        const sortedTypes = Object.keys(typesObj).map(key => {
            const val = typesObj[key];
            return { name: key, order: (val && val.order !== undefined) ? val.order : 999 };
        }).sort((a, b) => a.order - b.order);

        if(sortedTypes.length === 0) { 
            customTypeList.innerHTML = `<div style="font-size:0.75rem; color:#71717a; text-align:center; padding:10px;">등록된 단원이 없습니다.</div>`; 
            return; 
        }

        sortedTypes.forEach(t => {
            const div = document.createElement('div');
            div.className = 'type-manage-item';
            div.setAttribute('draggable', 'true');
            div.dataset.id = t.name;
            div.innerHTML = `<span>☰ 🏷️ ${t.name}</span><button class="compact-del-btn" onclick="deleteCustomType('${t.name}')"><i class="fa-regular fa-trash-can"></i></button>`;
            
            // 1) 데스크탑 마우스 드래그 바인딩
            div.addEventListener('dragstart', () => div.classList.add('dragging'));
            div.addEventListener('dragend', () => {
                div.classList.remove('dragging');
                saveNewTypeOrder();
            });

            // 2) 모바일 전용 터치 트래커 주입
            div.addEventListener('touchstart', (e) => {
                div.classList.add('dragging');
            }, { passive: true });

            div.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                // 손가락 위치 기반으로 아래에 깔린 타겟 엘리먼트 추적 연산
                const afterElement = getDragAfterElement(customTypeList, '.type-manage-item', touch.clientX, touch.clientY);
                const draggingItem = document.querySelector('.type-manage-item.dragging');
                if(!draggingItem) return;
                
                if (afterElement == null) customTypeList.appendChild(draggingItem);
                else customTypeList.insertBefore(draggingItem, afterElement);
            }, { passive: true });

            div.addEventListener('touchend', () => {
                if(div.classList.contains('dragging')) {
                    div.classList.remove('dragging');
                    saveNewTypeOrder();
                }
            });

            customTypeList.appendChild(div);
        });
    }

    // 마우스 드래그 오버 보정
    customTypeList.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(customTypeList, '.type-manage-item', e.clientX, e.clientY);
        const draggingItem = document.querySelector('.type-manage-item.dragging');
        if(!draggingItem) return;
        if (afterElement == null) customTypeList.appendChild(draggingItem);
        else customTypeList.insertBefore(draggingItem, afterElement);
    });

    function saveNewTypeOrder() {
        const items = [...customTypeList.querySelectorAll('.type-manage-item')];
        const updates = {};
        items.forEach((item, index) => {
            updates[`workspace/mathNotebooks/${activeMathFolder}/customTypes/${item.dataset.id}/order`] = index;
        });
        db.ref().update(updates);
    }

    window.deleteCustomType = (type) => {
        if(confirm(`[${type}] 단원을 삭제하시겠습니까?`)) {
            db.ref(`workspace/mathNotebooks/${activeMathFolder}/customTypes/${type}`).remove();
        }
    };


    // --- 📅 3. 오늘의 플래너 클라우드 엔진 ---
    const todoForm = document.getElementById('todo-form');
    const todoTimeInput = document.getElementById('todo-time-input');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStats = document.getElementById('todo-stats');

    db.ref('workspace/todos').on('value', (snapshot) => { renderTodoList(snapshot.val() || {}); });

    function renderTodoList(todosObj) {
        todoList.innerHTML = '';
        const todayStr = getTodayDateString();
        const list = Object.keys(todosObj).map(id => ({ id, ...todosObj[id] })).filter(t => t.date === todayStr);
        todoStats.textContent = `${list.filter(t => t.completed).length} / ${list.length} 완료`;

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
        db.ref('workspace/todos').push({ date: getTodayDateString(), time: todoTimeInput.value.trim(), text: todoInput.value.trim(), completed: false });
        todoInput.value = ''; todoTimeInput.value = '';
    });
    window.toggleTodoCloud = (id, cur) => db.ref(`workspace/todos/${id}`).update({ completed: !cur });
    window.deleteTodoCloud = (id) => db.ref(`workspace/todos/${id}`).remove();


    // --- 🎯 4. 디데이 카운트다운 클라우드 엔진 ---
    const ddayForm = document.getElementById('dday-form');
    const ddayTitle = document.getElementById('dday-title');
    const ddayDate = document.getElementById('dday-date');
    const ddayContainer = document.getElementById('dday-container');

    db.ref('workspace/ddays').on('value', (snapshot) => { renderDDayList(snapshot.val() || {}); });

    function renderDDayList(ddaysObj) {
        ddayContainer.innerHTML = '';
        const today = new Date(); today.setHours(0,0,0,0);
        Object.keys(ddaysObj).forEach(id => {
            const item = ddaysObj[id];
            const target = new Date(item.date); target.setHours(0,0,0,0);
            const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            let displayD = days === 0 ? 'D-Day' : (days > 0 ? `D-${days}` : `D+${Math.abs(days)}`);

            const div = document.createElement('div');
            div.className = 'dday-card';
            div.innerHTML = `
                <div class="dday-info"><span class="dday-name">${item.title}</span><span class="dday-date-text">목표일: ${item.date}</span></div>
                <div class="dday-right-zone"><span class="dday-number">${displayD}</span><button class="compact-del-btn" onclick="deleteDDayCloud('${id}')"><i class="fa-regular fa-trash-can"></i></button></div>
            `;
            ddayContainer.appendChild(div);
        });
    }

    ddayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        db.ref('workspace/ddays').push({ title: ddayTitle.value.trim(), date: ddayDate.value });
        ddayForm.reset();
    });
    window.deleteDDayCloud = (id) => db.ref(`workspace/ddays/${id}`).remove();

});
