// メニューボタンのイベントリスナー設定
document.getElementById('dashboardBtn').addEventListener('click', () => {
  openInNewTab('sample.html');
});

document.getElementById('membersBtn').addEventListener('click', () => {
  openInNewTab('members.html');
});

document.getElementById('tasksBtn').addEventListener('click', () => {
  openInNewTab('tasks.html');
});

document.getElementById('wbsBtn').addEventListener('click', () => {
  openInNewTab('wbs.html');
});

// 新しいタブでHTMLファイルを開く
function openInNewTab(htmlFile) {
  chrome.tabs.create({
    url: chrome.runtime.getURL(htmlFile)
  });
}
