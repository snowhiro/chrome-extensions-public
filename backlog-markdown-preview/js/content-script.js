// サイドバーからのメッセージを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMarkdown') {
    const elementId = request.elementId;
    const element = document.getElementById(elementId);
    
    if (element && element.value) {
      sendResponse({
        markdown: element.value,
        success: true
      });
    } else {
      sendResponse({
        success: false,
        error: `要素が見つかりません: ${elementId}`
      });
    }
  }
});