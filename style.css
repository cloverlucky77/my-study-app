/* 극도의 깔끔함을 추구하는 스튜디오 무채색 감성 테마 */
:root {
    --bg: #0a0a0a;
    --panel-bg: #121212;
    --panel-border: #1f1f1f;
    --input-bg: #181818;
    --text-main: #eff1f5;
    --text-muted: #6e6e73;
    --accent: #ffffff;
    --accent-dim: #3a3a3c;
    --danger: #ff453a;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Geist', 'Inter', -apple-system, sans-serif;
}

body {
    background-color: var(--bg);
    color: var(--text-main);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 30px 20px;
    -webkit-font-smoothing: antialiased;
}

.dashboard-wrapper {
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* 최상단 헤더 바 */
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 4px;
    border-bottom: 1px solid var(--panel-border);
}

.top-bar .brand {
    font-weight: 600;
    font-size: 0.85rem;
    letter-spacing: 3px;
    color: var(--text-main);
}

.top-bar .clock {
    font-size: 0.9rem;
    font-weight: 400;
    letter-spacing: 0.5px;
    color: var(--text-muted);
}

/* 대시보드 2열 균형 레이아웃 */
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}

@media (max-width: 900px) {
    .dashboard-grid {
        grid-template-columns: 1fr;
    }
}

.col {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* 패널 모던 디자인 */
.panel {
    background-color: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: border-color 0.2s ease;
}

.panel:hover {
    border-color: #2c2c2e;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-title {
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: -0.2px;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 미니멀 폼 필드 스타일 (투박함 완전 제거) */
.inline-form {
    display: flex;
    gap: 8px;
    background-color: var(--input-bg);
    border: 1px solid var(--panel-border);
    padding: 6px;
    border-radius: 8px;
}

.inline-form select, 
.inline-form input {
    background: transparent;
    border: none;
    color: var(--text-main);
    font-size: 0.85rem;
    outline: none;
    padding: 6px 10px;
}

.inline-form select {
    color: var(--text-muted);
    cursor: pointer;
}

.inline-form input {
    flex: 1;
}

.icon-btn-add {
    background-color: var(--accent);
    color: #000;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.8rem;
    transition: opacity 0.15s;
}

.icon-btn-add:hover { opacity: 0.9; }

/* 리스트 아이템 디자인 */
.item-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
}

.item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    background-color: #161618;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
}

.item-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.time-tag {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 2px 6px;
    background-color: #2c2c2e;
    border-radius: 4px;
    color: #aeaeae;
}

.item-text {
    font-size: 0.85rem;
    cursor: pointer;
}

.item-row.done {
    opacity: 0.4;
}
.item-row.done .item-text {
    text-decoration: line-through;
}

.delete-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.85rem;
}
.delete-btn:hover { color: var(--danger); }

/* 세분화 폴더 메모 탭 */
.folder-tabs {
    display: flex;
    gap: 6px;
    border-bottom: 1px solid var(--panel-border);
    padding-bottom: 10px;
}

.tab-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
}

.tab-btn:hover {
    color: var(--text-main);
    background-color: #1c1c1e;
}

.tab-btn.active {
    color: var(--text-main);
    background-color: #2c2c2e;
}

.memo-panel {
    flex: 1;
}

.textarea-wrapper {
    flex: 1;
    display: flex;
}

#memo-textarea {
    width: 100%;
    min-height: 240px;
    background-color: #161618;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    padding: 16px;
    color: var(--text-main);
    font-size: 0.9rem;
    line-height: 1.6;
    resize: none;
    outline: none;
}

#memo-textarea:focus {
    border-color: #3a3a3c;
}

.save-status {
    text-align: right;
    font-size: 0.75rem;
    color: var(--text-muted);
}

/* 디데이 스케줄러 그리드 */
.dday-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-height: 160px;
    overflow-y: auto;
}

.dday-card {
    background-color: #161618;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dday-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.dday-name { font-size: 0.85rem; font-weight: 500; }
.dday-date-text { font-size: 0.75rem; color: var(--text-muted); }
.dday-number {
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: -0.5px;
}

/* 포커스 타이머 (가로형 가로 밸런스 바) */
.timer-bar-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.timer-meta {
    display: flex;
    align-items: center;
    gap: 20px;
}

.timer-digits {
    font-size: 1.8rem;
    font-weight: 300;
    font-variant-numeric: tabular-nums;
}

.timer-controls {
    display: flex;
    gap: 6px;
}

.ctrl-btn {
    background-color: #2c2c2e;
    color: var(--text-main);
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
}

.ctrl-btn.action {
    background-color: var(--accent);
    color: #000;
}

.ctrl-btn.text {
    background: transparent;
    color: var(--text-muted);
}
.ctrl-btn.text:hover { color: var(--text-main); }

/* 스크롤바 커스텀 */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2c2c2e; border-radius: 10px; }
