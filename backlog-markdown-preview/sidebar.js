const MARKDOWN_ELEMENT_ID = 'markdown-textarea'; // 対象のtextArea要素ID

async function updatePreview() {
  const previewContent = document.getElementById('preview-content');
  
  try {
    // アクティブなタブを取得
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) {
      previewContent.innerHTML = '<p class="error">タブが見つかりません</p>';
      return;
    }

    const tab = tabs[0];
    const tabId = tab.id;


    // コンテンツスクリプトからMarkdown内容を取得
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'getMarkdown',
        elementId: MARKDOWN_ELEMENT_ID
      });

      if (response && response.markdown) {
        // Markdownをプレビューに変換して表示
        renderMarkdown(response.markdown);
      } else {
        previewContent.innerHTML = '<p class="error">Markdown要素が見つかりません</p>';
      }
    } catch (error) {
      if (error.message.includes('Receiving end does not exist')) {
        previewContent.innerHTML = '<p class="error">ページの読み込みが完了していません。しばらく待ってから再度お試しください</p>';
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('エラー:', error);
    previewContent.innerHTML = `<p class="error">エラーが発生しました: ${error.message}</p>`;
  }
}

function renderMarkdown(markdown) {
  const previewContent = document.getElementById('preview-content');
  
  // 簡単なMarkdownレンダリング（本格的な場合はmarked.jsなどを使用）
  let html = markdown
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = `<p>${html}</p>`;
  previewContent.innerHTML = html;
}

// ページ読み込み時にプレビューを更新
document.addEventListener('DOMContentLoaded', () => {
  updatePreview();
  
  // リロードボタンのイベントリスナーを追加
  const reloadButton = document.getElementById('reload-button');
  if (reloadButton) {
    reloadButton.addEventListener('click', updatePreview);
  }
});

// アクティブなタブが変更されたときに更新
chrome.tabs.onActivated.addListener(updatePreview);

// タブの内容が更新されたときに更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('backlog.jp')) {
    updatePreview();
  }
});
