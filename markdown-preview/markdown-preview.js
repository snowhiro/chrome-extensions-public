const markdownInput = document.getElementById('markdownInput');
const resultMarkdown = document.getElementById('resultMarkdown');
const preview = document.getElementById('preview');
const tableControls = document.getElementById('tableControls');
const addRowBtn = document.getElementById('addRowBtn');
const insertRowBtn = document.getElementById('insertRowBtn');
const addColBtn = document.getElementById('addColBtn');
const insertColBtn = document.getElementById('insertColBtn');
const finishEditBtn = document.getElementById('finishEditBtn');
const clearBtn = document.getElementById('clearBtn');

let currentEditTable = null;
let selectedCell = null;

markdownInput.addEventListener('input', function() {
    const oldEditTable = currentEditTable;
    preview.innerHTML = marked.parse(this.value);
    attachTableListeners();
    // 編集中のテーブルが存在し、プレビュー内に新しいテーブルがある場合は参照を更新
    if (oldEditTable) {
        const tables = preview.querySelectorAll('table');
        if (tables.length > 0) {
            currentEditTable = tables[0];
            currentEditTable.classList.add('editable');
            tableControls.style.display = 'block';
        }
    }
});

function attachTableListeners() {
    const tables = preview.querySelectorAll('table');
    tables.forEach(table => {
        const clonedTable = table.cloneNode(true);
        clonedTable.addEventListener('click', function(e) {
            if (e.target.tagName === 'TD' || e.target.tagName === 'TH') {
                startTableEdit(this);
                selectCell(e.target);
            }
        });
        // ダブルクリックで編集モード
        clonedTable.addEventListener('dblclick', function(e) {
            if (e.target.tagName === 'TD' || e.target.tagName === 'TH') {
                enableCellEdit(e.target);
            }
        });
        clonedTable.addEventListener('keydown', function(e) {
            if (e.key === 'Tab' && selectedCell && !selectedCell.contentEditable) {
                e.preventDefault();
                moveToNextCell(e.shiftKey);
            }
        });
        table.parentNode.replaceChild(clonedTable, table);
    });
}

function startTableEdit(table) {
    if (currentEditTable) {
        currentEditTable.classList.remove('editable');
    }
    currentEditTable = table;
    table.classList.add('editable');
    tableControls.style.display = 'block';
    console.log('Table edit mode activated');
}

function selectCell(cell) {
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    selectedCell = cell;
    cell.classList.add('selected');
    console.log('Cell selected');
}

function moveToNextCell(isShiftKey = false) {
    if (!selectedCell || !currentEditTable) return;
    
    const currentRow = selectedCell.parentNode;
    const currentRowIndex = Array.from(currentEditTable.rows).indexOf(currentRow);
    const currentCellIndex = getCellIndex(selectedCell);
    const totalCells = currentRow.cells.length;
    const totalRows = currentEditTable.rows.length;
    
    let nextRow = currentRow;
    let nextCellIndex = currentCellIndex;
    
    if (isShiftKey) {
        // Shift+Tab: 前のセルに移動
        if (currentCellIndex > 0) {
            nextCellIndex = currentCellIndex - 1;
        } else if (currentRowIndex > 0) {
            nextRow = currentEditTable.rows[currentRowIndex - 1];
            nextCellIndex = nextRow.cells.length - 1;
        }
    } else {
        // Tab: 次のセルに移動
        if (currentCellIndex < totalCells - 1) {
            nextCellIndex = currentCellIndex + 1;
        } else if (currentRowIndex < totalRows - 1) {
            nextRow = currentEditTable.rows[currentRowIndex + 1];
            nextCellIndex = 0;
        }
    }
    
    const nextCell = nextRow.cells[nextCellIndex];
    if (nextCell) {
        selectCell(nextCell);
        nextCell.focus();
    }
}

function enableCellEdit(cell) {
    const originalContent = cell.textContent;
    cell.contentEditable = 'true';
    cell.classList.add('editing');
    cell.focus();
    // テキストを全選択
    const range = document.createRange();
    range.selectNodeContents(cell);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    function saveCellEdit() {
        cell.contentEditable = 'false';
        cell.classList.remove('editing');
        cell.removeEventListener('blur', saveCellEdit);
        cell.removeEventListener('keydown', handleKeydown);
    }

    function handleKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCellEdit();
        } else if (e.key === 'Escape') {
            cell.textContent = originalContent;
            saveCellEdit();
        }
    }

    cell.addEventListener('blur', saveCellEdit);
    cell.addEventListener('keydown', handleKeydown);
}

function getCellIndex(cell) {
    return Array.from(cell.parentNode.children).indexOf(cell);
}

function getRowIndex(cell) {
    const row = cell.parentNode;
    return Array.from(currentEditTable.children).findIndex(r => r === row || Array.from(r.children).includes(row));
}

function htmlToMarkdown(html) {
    let markdown = html;
    
    // <a href="url">text</a> を [text](url) に変換
    markdown = markdown.replace(/<a\s+href=["']([^"']+)["']>([^<]+)<\/a>/gi, '[$2]($1)');
    
    // <strong>text</strong> を **text** に変換
    markdown = markdown.replace(/<strong>([^<]+)<\/strong>/gi, '**$1**');
    
    // <em>text</em> を *text* に変換
    markdown = markdown.replace(/<em>([^<]+)<\/em>/gi, '*$1*');
    
    // <code>text</code> を `text` に変換
    markdown = markdown.replace(/<code>([^<]+)<\/code>/gi, '`$1`');
    
    // その他のHTMLタグを削除（テキストは保持）
    markdown = markdown.replace(/<[^>]+>/g, '');
    
    return markdown.trim();
}

function tableToMarkdown(table) {
    let markdown = '';
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td, th');
        const cellTexts = Array.from(cells).map(cell => {
            // HTMLをMarkdown形式に変換
            return htmlToMarkdown(cell.innerHTML);
        });
        markdown += '| ' + cellTexts.join(' | ') + ' |\n';
        
        if (rowIndex === 0) {
            markdown += '| ' + cellTexts.map(() => '---').join(' | ') + ' |\n';
        }
    });
    
    return markdown;
}

addRowBtn.addEventListener('click', function() {
    console.log('Add row clicked, currentEditTable:', currentEditTable);
    if (!currentEditTable) return;
    const newRow = currentEditTable.insertRow();
    const colCount = currentEditTable.rows[0].cells.length;
    for (let i = 0; i < colCount; i++) {
        newRow.insertCell();
    }
});

insertRowBtn.addEventListener('click', function() {
    console.log('Insert row clicked');
    if (!currentEditTable || !selectedCell) {
        alert('セルを選択してください');
        return;
    }
    const rowIndex = Array.from(currentEditTable.rows).indexOf(selectedCell.parentNode);
    const newRow = currentEditTable.insertRow(rowIndex);
    const colCount = currentEditTable.rows[0].cells.length;
    for (let i = 0; i < colCount; i++) {
        newRow.insertCell();
    }
});

addColBtn.addEventListener('click', function() {
    console.log('Add column clicked, currentEditTable:', currentEditTable);
    if (!currentEditTable) return;
    for (let row of currentEditTable.rows) {
        row.insertCell();
    }
});

insertColBtn.addEventListener('click', function() {
    console.log('Insert column clicked');
    if (!currentEditTable || !selectedCell) {
        alert('セルを選択してください');
        return;
    }
    const colIndex = getCellIndex(selectedCell);
    for (let row of currentEditTable.rows) {
        const newCell = row.insertCell(colIndex);
        newCell.textContent = '';
    }
});

finishEditBtn.addEventListener('click', function() {
    if (currentEditTable) {
        currentEditTable.classList.remove('editable');
        const markdownTable = tableToMarkdown(currentEditTable);
        resultMarkdown.value = '';
        resultMarkdown.value += markdownTable;
        resultMarkdown.dispatchEvent(new Event('input'));
    }
    if (selectedCell) {
        selectedCell.classList.remove('selected');
        selectedCell = null;
    }
    tableControls.style.display = 'none';
    // currentEditTable はリセットしない（再度編集可能にするため）
    console.log('Edit mode finished, table reference retained');
});

clearBtn.addEventListener('click', function() {
    if (confirm('入力内容をすべてクリアしますか？')) {
        markdownInput.value = '';
        resultMarkdown.value = '';
        preview.innerHTML = '';
        tableControls.style.display = 'none';
        if (selectedCell) {
            selectedCell.classList.remove('selected');
            selectedCell = null;
        }
        if (currentEditTable) {
            currentEditTable.classList.remove('editable');
            currentEditTable = null;
        }
        console.log('All content cleared');
    }
});

attachTableListeners();
