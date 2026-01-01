// ダッシュボード用スクリプト
document.addEventListener('DOMContentLoaded', () => {
  updateDashboardStats();
  setupCardListeners();
});

function updateDashboardStats() {
  // localStorage からデータを取得
  const members = JSON.parse(localStorage.getItem('wbs_members') || '[]');
  const tasks = JSON.parse(localStorage.getItem('wbs_tasks') || '[]');
  
  // 統計値を更新
  document.getElementById('memberCount').textContent = members.length;
  document.getElementById('taskCount').textContent = tasks.length;
  document.getElementById('wbsCount').textContent = '0';    // WBS機能実装時に更新
  
  // 進捗率を計算
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  document.getElementById('progressPercent').textContent = progressPercent + '%';
}

// カードのクリックリスナーを設定
function setupCardListeners() {
  document.querySelectorAll('.card[data-page]').forEach(card => {
    card.addEventListener('click', () => {
      const page = card.getAttribute('data-page');
      window.location.href = page;
    });
  });
}
