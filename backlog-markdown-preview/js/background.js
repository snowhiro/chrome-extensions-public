// サイドパネルを開く処理
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id }).catch((error) => {
    console.error('サイドパネルを開くのに失敗しました:', error);
  });
});

// インストール時の初期化処理
chrome.runtime.onInstalled.addListener(() => {
  // サイドパネルのオプションを設定
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
    console.error('サイドパネルの動作設定に失敗しました:', error);
  });
});

// タブが更新されたときにサイドパネルを自動更新
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.url.includes('backlog.jp')) {
//     // サイドパネルが開いている場合は通知
//     chrome.runtime.sendMessage({
//       action: 'tabUpdated',
//       tabId: tabId
//     }).catch(() => {
//       // サイドパネルが開いていない場合はエラーを無視
//     });
//   }
// });
