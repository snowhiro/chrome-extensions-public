// メンバーデータの管理
class MembersManager {
  constructor() {
    this.storageKey = 'wbs_members';
    this.members = this.loadMembers();
  }

  loadMembers() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveMembers() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.members));
  }

  addMember(member) {
    const newMember = {
      id: Date.now(),
      ...member,
      createdAt: new Date().toISOString()
    };
    this.members.push(newMember);
    this.saveMembers();
    return newMember;
  }

  removeMember(id) {
    this.members = this.members.filter(m => m.id !== id);
    this.saveMembers();
  }

  updateMember(id, updates) {
    const member = this.members.find(m => m.id === id);
    if (member) {
      Object.assign(member, updates);
      this.saveMembers();
    }
  }

  getMembers() {
    return this.members;
  }

  getMemberById(id) {
    return this.members.find(m => m.id === id);
  }
}

// グローバルインスタンス
const membersManager = new MembersManager();

// DOMが読み込まれた後の処理
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('memberForm');
  form.addEventListener('submit', handleAddMember);
  
  // ダッシュボードへ戻るボタン
  document.getElementById('backToDashboard').addEventListener('click', () => {
    window.location.href = 'sample.html';
  });
  
  // 初期表示
  renderMembers();
  updateStats();
});

// メンバー追加の処理
function handleAddMember(e) {
  e.preventDefault();

  const member = {
    name: document.getElementById('memberName').value
  };

  membersManager.addMember(member);
  
  // フォームをリセット
  document.getElementById('memberForm').reset();
  
  // 表示を更新
  renderMembers();
  updateStats();
}

// メンバー一覧を表示
function renderMembers() {
  const membersList = document.getElementById('membersList');
  const members = membersManager.getMembers();

  if (members.length === 0) {
    membersList.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <p>📭 まだメンバーが登録されていません</p>
        <p>上記のフォームからメンバーを追加してください</p>
      </div>
    `;
    return;
  }

  membersList.innerHTML = members.map(member => {
    const initials = member.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return `
      <div class="member-card">
        <div class="member-avatar">${initials}</div>
        <div class="member-name">${member.name}</div>
        <div class="member-actions">
          <button class="btn-danger delete-btn" data-member-id="${member.id}">削除</button>
        </div>
      </div>
    `;
  }).join('');

  // 削除ボタンのイベントリスナーを設定
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const memberId = parseInt(e.target.getAttribute('data-member-id'));
      deleteMember(memberId);
    });
  });
}

// メンバー削除
function deleteMember(id) {
  if (confirm('このメンバーを削除してもよろしいですか？')) {
    membersManager.removeMember(id);
    renderMembers();
    updateStats();
  }
}

// 統計情報を更新
function updateStats() {
  const members = membersManager.getMembers();
  document.getElementById('totalMembers').textContent = members.length;
}
