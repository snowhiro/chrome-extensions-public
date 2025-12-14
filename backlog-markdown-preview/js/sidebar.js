const MARKDOWN_ELEMENT_ID = 'markdown-textarea'; // 対象のtextArea要素ID


document.getElementById('getHTML').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return document.getElementById("markdown-textarea").value;
    }
  });
  console.log(results);
 renderMarkdown(results[0].result);
  
});

// async function updatePreview() {
//   const previewContent = document.getElementById('preview-content').value;
  
//   try {
//     // アクティブなタブを取得
//     const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//     if (!tabs.length) {
//       previewContent.innerHTML = '<p class="error">タブが見つかりません</p>';
//       return;
//     }

//     const tab = tabs[0];
//     const tabId = tab.id;


//     // コンテンツスクリプトからMarkdown内容を取得
//     try {
//       const response = await chrome.tabs.sendMessage(tabId, {
//         action: 'getMarkdown',
//         elementId: MARKDOWN_ELEMENT_ID
//       });

//       if (response && response.markdown) {
//         // Markdownをプレビューに変換して表示
//         renderMarkdown(response.markdown);
//       } else {
//         previewContent.innerHTML = '<p class="error">Markdown要素が見つかりません</p>';
//       }
//     } catch (error) {
//       if (error.message.includes('Receiving end does not exist')) {
//         previewContent.innerHTML = '<p class="error">ページの読み込みが完了していません。しばらく待ってから再度お試しください</p>';
//       } else {
//         throw error;
//       }
//     }
//   } catch (error) {
//     console.error('エラー:', error);
//     previewContent.innerHTML = `<p class="error">エラーが発生しました: ${error.message}</p>`;
//   }
// }

function renderMarkdown(markdown) {
  const previewContent = document.getElementById('preview-content');
  
  try {
    // marked.jsを使用してMarkdownをHTMLに変換
    const html = marked.parse(markdown);
    previewContent.innerHTML = html;
  } catch (error) {
    console.error('Markdown変換エラー:', error);
    previewContent.innerHTML = `<p class="error">Markdown変換に失敗しました: ${error.message}</p>`;
  }
}

// // ページ読み込み時にプレビューを更新
// document.addEventListener('DOMContentLoaded', () => {
//   updatePreview();
  
//   // リロードボタンのイベントリスナーを追加
//   const reloadButton = document.getElementById('reload-button');
//   if (reloadButton) {
//     reloadButton.addEventListener('click', updatePreview);
//   }
// });

// // アクティブなタブが変更されたときに更新
// chrome.tabs.onActivated.addListener(updatePreview);

// // タブの内容が更新されたときに更新
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.url.includes('backlog.jp')) {
//     updatePreview();
//   }
// });
