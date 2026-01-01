// タスク管理クラス
class TasksManager {
  constructor() {
    this.storageKey = 'wbs_tasks';
    this.tasks = this.loadTasks();
  }

  loadTasks() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveTasks() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
  }

  addTask(task) {
    const newTask = {
      id: Date.now(),
      ...task,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
  }

  updateTask(id, updates) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      this.saveTasks();
    }
  }

  getTasks() {
    return this.tasks;
  }

  getTaskById(id) {
    return this.tasks.find(t => t.id === id);
  }

  getTasksByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  }

  getStats() {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      completed: this.tasks.filter(t => t.status === 'completed').length
    };
  }
}

// グローバルインスタンス
const tasksManager = new TasksManager();

// DOMが読み込まれた後の処理
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('taskForm');
  form.addEventListener('submit', handleAddTask);
  
  // メンバーを担当者ドロップダウンに追加
  loadMembersToDropdown();
  
  // ダッシュボードへ戻るボタン
  document.getElementById('backToDashboard').addEventListener('click', () => {
    window.location.href = 'sample.html';
  });
  
  // 初期表示
  renderTasks();
  updateStats();
});

// メンバーを担当者ドロップダウンに読み込む
function loadMembersToDropdown() {
  const members = JSON.parse(localStorage.getItem('wbs_members') || '[]');
  const assigneeSelect = document.getElementById('taskAssignee');
  
  members.forEach(member => {
    const option = document.createElement('option');
    option.value = member.id;
    option.textContent = member.name;
    assigneeSelect.appendChild(option);
  });
}

// タスク追加の処理
function handleAddTask(e) {
  e.preventDefault();

  const task = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    assignee: document.getElementById('taskAssignee').value || null,
    priority: document.getElementById('taskPriority').value,
    dueDate: document.getElementById('taskDueDate').value || null
  };

  tasksManager.addTask(task);
  
  // フォームをリセット
  document.getElementById('taskForm').reset();
  
  // 表示を更新
  renderTasks();
  updateStats();
}

// タスク一覧を表示
function renderTasks() {
  const tasksList = document.getElementById('tasksList');
  const tasks = tasksManager.getTasks();

  if (tasks.length === 0) {
    tasksList.innerHTML = `
      <div class="empty-state">
        <p>📭 まだタスクが登録されていません</p>
        <p>上記のフォームからタスクを追加してください</p>
      </div>
    `;
    return;
  }

  // タスクをステータスでグループ化して表示
  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    completed: tasks.filter(t => t.status === 'completed')
  };

  tasksList.innerHTML = Object.entries(tasksByStatus).map(([status, statusTasks]) => {
    return statusTasks.map(task => {
      const assigneeName = getAssigneeName(task.assignee);
      const dueDate = task.dueDate ? formatDate(task.dueDate) : '期限なし';
      const statusLabel = getStatusLabel(task.status);
      const priorityLabel = getPriorityLabel(task.priority);

      return `
        <div class="task-card">
          <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div>
              <span class="task-status status-${task.status}">${statusLabel}</span>
              <span class="task-priority priority-${task.priority}">${priorityLabel}</span>
            </div>
          </div>
          ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
          <div class="task-meta">
            <div class="meta-item">👤 ${assigneeName}</div>
            <div class="meta-item">📅 ${dueDate}</div>
          </div>
          <div class="task-actions">
            ${task.status !== 'completed' ? `
              <button class="btn-success status-btn" data-task-id="${task.id}" data-new-status="completed">完了にする</button>
            ` : ''}
            ${task.status === 'pending' ? `
              <button class="btn-success status-btn" data-task-id="${task.id}" data-new-status="in-progress">開始する</button>
            ` : ''}
            ${task.status === 'in-progress' ? `
              <button class="btn-success status-btn" data-task-id="${task.id}" data-new-status="pending">未開始に戻す</button>
            ` : ''}
            <button class="btn-danger delete-btn" data-task-id="${task.id}">削除</button>
          </div>
        </div>
      `;
    }).join('');
  }).join('');

  // イベントリスナーを設定
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = parseInt(e.target.getAttribute('data-task-id'));
      const newStatus = e.target.getAttribute('data-new-status');
      updateTaskStatus(taskId, newStatus);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = parseInt(e.target.getAttribute('data-task-id'));
      deleteTask(taskId);
    });
  });
}

// タスク削除
function deleteTask(id) {
  if (confirm('このタスクを削除してもよろしいですか？')) {
    tasksManager.removeTask(id);
    renderTasks();
    updateStats();
  }
}

// タスクステータス更新
function updateTaskStatus(id, newStatus) {
  tasksManager.updateTask(id, { status: newStatus });
  renderTasks();
  updateStats();
}

// 統計情報を更新
function updateStats() {
  const stats = tasksManager.getStats();
  document.getElementById('totalTasks').textContent = stats.total;
  document.getElementById('pendingTasks').textContent = stats.pending;
  document.getElementById('inProgressTasks').textContent = stats.inProgress;
  document.getElementById('completedTasks').textContent = stats.completed;
}

// ユーティリティ関数
function getAssigneeName(assigneeId) {
  if (!assigneeId) return '未割り当て';
  
  const members = JSON.parse(localStorage.getItem('wbs_members') || '[]');
  const member = members.find(m => m.id == assigneeId);
  return member ? member.name : '不明なメンバー';
}

function getStatusLabel(status) {
  const labels = {
    'pending': '未開始',
    'in-progress': '進行中',
    'completed': '完了'
  };
  return labels[status] || status;
}

function getPriorityLabel(priority) {
  const labels = {
    'low': '低',
    'medium': '中',
    'high': '高'
  };
  return labels[priority] || priority;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
