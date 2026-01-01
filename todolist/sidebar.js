const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoContainer = document.getElementById('todoContainer');
const settingsBtn = document.getElementById('settingsBtn');
const addNewBtn = document.getElementById('addNewBtn');
const exportBtn = document.getElementById('exportBtn');
const settingsModal = document.getElementById('settingsModal');
const detailModal = document.getElementById('detailModal');
const detailForm = document.getElementById('detailForm');
const todoModal = document.getElementById('todoModal');
const todoForm = document.getElementById('todoForm');
const settingsSortSelect = document.getElementById('settingsSortSelect');
const settingsHideCompleted = document.getElementById('settingsHideCompleted');
const clearStorageBtn = document.getElementById('clearStorageBtn');

let allTodos = [];
let currentSort = 'order';
let hideCompleted = true;
let currentDetailTodo = null;
let draggedElement = null;
let draggedIndex = null;

// 初期設定
settingsHideCompleted.checked = hideCompleted;

// 設定モーダル制御
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    settingsSortSelect.value = currentSort;
    settingsHideCompleted.checked = hideCompleted;
});

document.querySelector('#settingsModal .close-btn').addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

document.querySelector('.settings-close-btn').addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

// 詳細モーダル制御
document.querySelector('#detailModal .close-btn').addEventListener('click', () => {
    detailModal.classList.remove('active');
});

document.querySelector('.detail-close-btn').addEventListener('click', () => {
    detailModal.classList.remove('active');
});

document.querySelector('.detail-save-btn').addEventListener('click', () => {
    saveDetailChanges();
});

window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
    if (e.target === detailModal) {
        detailModal.classList.remove('active');
    }
    if (e.target === todoModal) {
        todoModal.classList.remove('active');
    }
});

// 設定変更イベント
settingsSortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    refreshDisplay();
});

settingsHideCompleted.addEventListener('change', (e) => {
    hideCompleted = e.target.checked;
    refreshDisplay();
});

// TODOモーダル制御
addNewBtn.addEventListener('click', () => {
    todoModal.classList.add('active');
});

document.querySelector('#todoModal .close-btn').addEventListener('click', () => {
    todoModal.classList.remove('active');
});

document.querySelector('.btn-cancel').addEventListener('click', () => {
    todoModal.classList.remove('active');
});

// エクスポートボタン制御
exportBtn.addEventListener('click', () => {
    exportTodosToJson();
});

// ストレージクリアボタン制御
clearStorageBtn.addEventListener('click', () => {
    if (confirm('ストレージを削除し、初期データを表示しますか？')) {
        chrome.storage.local.remove('allTodos', () => {
            console.log('ストレージがクリアされました');
            // 初期データを再度読み込む
            fetch(chrome.runtime.getURL('todo.json'))
                .then(response => response.json())
                .then(todos => {
                    allTodos = todos;
                    refreshDisplay();
                    settingsModal.classList.remove('active');
                })
                .catch(error => console.error('todo.json読み込みエラー:', error));
        });
    }
});

// todo.jsonから読み込み（初期データ）
Promise.all([
    fetch(chrome.runtime.getURL('todo.json'))
        .then(response => response.json())
        .catch(error => {
            console.error('todo.json読み込みエラー:', error);
            return [];
        }),
    new Promise((resolve) => {
        chrome.storage.local.get('allTodos', (result) => {
            resolve(result.allTodos || null);
        });
    })
]).then(([jsonTodos, storageTodos]) => {
    // ストレージにデータがあれば使用、なければJSONを使用
    if (storageTodos && storageTodos.length > 0) {
        allTodos = storageTodos;
        console.log('ストレージからデータを読み込みました:', allTodos.length + '件');
    } else {
        allTodos = jsonTodos;
        console.log('JSONからデータを読み込みました:', allTodos.length + '件');
    }
    refreshDisplay();
});

function refreshDisplay() {
    todoContainer.innerHTML = '';
    let filtered = allTodos;
    
    // 完了済みをフィルター
    if (hideCompleted) {
        filtered = filtered.filter(todo => todo.status !== '完了');
    }
    
    const sortedTodos = sortTodos([...filtered], currentSort);
    sortedTodos.forEach(todo => renderTodoCard(todo));
}

function sortTodos(todos, sortType) {
    const sorted = [...todos];
    
    switch(sortType) {
        case 'createdAt-asc':
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'createdAt-desc':
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'priority-asc':
            const priorityOrder = { '低': 1, '中': 2, '高': 3 };
            sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
        case 'priority-desc':
            const priorityOrderDesc = { '低': 3, '中': 2, '高': 1 };
            sorted.sort((a, b) => priorityOrderDesc[a.priority] - priorityOrderDesc[b.priority]);
            break;
        case 'order':
        default:
            sorted.sort((a, b) => (a.order || 999) - (b.order || 999));
            break;
    }
    
    return sorted;
}

// フォーム送信
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('modalTitle').value;
    const detail = document.getElementById('modalDetail').value;
    const status = document.getElementById('modalStatus').value;
    const priority = document.getElementById('modalPriority').value;

    const newTodo = {
        id: Date.now(),
        title: title,
        detail: detail,
        createdAt: new Date().toISOString(),
        status: status,
        priority: priority
    };

    allTodos.push(newTodo);
    saveTodosToStorage(allTodos);
    refreshDisplay();
    todoForm.reset();
    todoModal.classList.remove('active');
});

function renderTodoCard(todo) {
    const card = document.createElement('div');
    card.className = 'todo-card';
    card.draggable = true;
    card.dataset.todoId = todo.id;
    
    const date = new Date(todo.createdAt);
    const formattedDate = date.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    card.innerHTML = `
        <div class="todo-header">
            <span class="drag-handle">⋮⋮</span>
            <div class="todo-title">${escapeHtml(todo.title)}</div>
            <div class="todo-priority priority-${todo.priority}">${todo.priority}</div>
        </div>
        <div class="todo-footer">
            <span class="todo-status status-${todo.status}">${todo.status}</span>
            <span>${formattedDate}</span>
            <div class="todo-actions">
                <button class="todo-complete-btn" data-id="${todo.id}">完了</button>
            </div>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('todo-complete-btn') && !e.target.classList.contains('drag-handle')) {
            showDetail(todo);
        }
    });

    const completeBtn = card.querySelector('.todo-complete-btn');
    completeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        markAsComplete(todo);
    });

    // ドラッグイベント
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragleave', handleDragLeave);

    todoContainer.appendChild(card);
}

function markAsComplete(todo) {
    const updatedTodo = {
        ...todo,
        status: '完了'
    };

    // allTodosを更新
    const index = allTodos.findIndex(t => t.id === todo.id);
    if (index !== -1) {
        allTodos[index] = updatedTodo;
    }

    saveTodosToStorage(allTodos);
    refreshDisplay();
}

function showDetail(todo) {
    currentDetailTodo = todo;
    
    const date = new Date(todo.createdAt);
    const formattedDate = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('detailTitle').value = escapeHtml(todo.title);
    document.getElementById('detailPriority').value = todo.priority;
    document.getElementById('detailStatus').value = todo.status;
    document.getElementById('detailDescription').value = escapeHtml(todo.detail);
    document.getElementById('detailCreatedAt').textContent = formattedDate;

    detailModal.classList.add('active');
}

function saveDetailChanges() {
    if (!currentDetailTodo) return;

    const updatedTodo = {
        ...currentDetailTodo,
        title: document.getElementById('detailTitle').value,
        detail: document.getElementById('detailDescription').value,
        status: document.getElementById('detailStatus').value,
        priority: document.getElementById('detailPriority').value
    };

    // allTodosを更新
    const index = allTodos.findIndex(t => t.id === currentDetailTodo.id);
    if (index !== -1) {
        allTodos[index] = updatedTodo;
    }

    saveTodosToStorage(allTodos);
    refreshDisplay();
    detailModal.classList.remove('active');
}

function saveTodosToStorage(todos) {
    // chrome.storage.localに保存
    chrome.storage.local.set({ allTodos: todos });
    console.log('TODOがストレージに保存されました:', todos);
}

function exportTodosToJson() {
    const dataStr = JSON.stringify(allTodos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ドラッグ&ドロップハンドラー
function handleDragStart(e) {
    draggedElement = this;
    draggedIndex = Array.from(todoContainer.children).indexOf(this);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.todo-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    draggedElement = null;
    draggedIndex = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement && this.classList.contains('todo-card')) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.target === this) {
        this.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (this !== draggedElement && this.classList.contains('todo-card')) {
        const newIndex = Array.from(todoContainer.children).indexOf(this);
        const draggedTodoId = parseInt(draggedElement.dataset.todoId);
        
        // 表示順でソート中であることを確認
        if (currentSort !== 'order') {
            alert('「表示順」ソートの時のみドラッグ&ドロップで並び替え可能です');
            return;
        }
        
        // 実際のallTodosの配列内で並び替え
        const draggedTodo = allTodos.find(t => t.id === draggedTodoId);
        if (!draggedTodo) return;
        
        const draggedAllIndex = allTodos.findIndex(t => t.id === draggedTodoId);
        allTodos.splice(draggedAllIndex, 1);
        
        // ドロップ先のTODOを見つける
        let insertIndex = 0;
        const dropTargetId = parseInt(this.dataset.todoId);
        const dropTargetIndex = allTodos.findIndex(t => t.id === dropTargetId);
        
        if (newIndex < draggedIndex) {
            insertIndex = dropTargetIndex;
        } else {
            insertIndex = dropTargetIndex + 1;
        }
        
        allTodos.splice(insertIndex, 0, draggedTodo);
        
        // order属性を再割り当て
        allTodos.forEach((todo, index) => {
            todo.order = index + 1;
        });
        
        saveTodosToStorage(allTodos);
        refreshDisplay();
    }
    
    this.classList.remove('drag-over');
    return false;
}

// ウィンドウリサイズ時に自動調整
window.addEventListener('resize', () => {
    refreshDisplay();
});
