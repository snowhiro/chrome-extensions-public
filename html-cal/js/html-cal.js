// 営業日数の定義（優先度と規模に基づく）
const businessDayMatrix = {
    highest: { large: 20, medium: 15, small: 10 },
    high: { large: 15, medium: 10, small: 5 },
    middle: { large: 7, medium: 5, small: 3 },
    low: { large: 5, medium: 3, small: 1 }
};

// 日本の祝日リスト（2025年分）
// 形式：'YYYY-MM-DD'
const jpHolidaysList = [
    // 2025年

    '2025-12-29', 
    '2025-12-30', 
    '2025-12-31', 
    // 2026年
    '2026-01-01', // 元日
    '2026-01-02', //
    '2026-01-12', // 成人の日
    '2026-02-11', // 建国記念の日
    '2026-03-20', // 春分の日
    '2026-04-29', // 昭和の日
    '2026-05-03', // 憲法記念日
    '2026-05-04', // みどりの日
    '2026-05-05', // こどもの日
    '2026-07-20', // 海の日
    '2026-08-11', // 山の日
    '2026-09-21', // 敬老の日
    '2026-09-22', // 秋分の日
    '2026-10-12', // スポーツの日
    '2026-11-03', // 文化の日
    '2026-11-23', // 勤労感謝の日
    
];

// 規制日リスト（YYYY/MM/DD形式を内部でYYYY-MM-DD形式に変換）
const regulationDateList = [
    '2025-12-19',
    '2025-12-22',
    '2025-12-23',
    '2025-12-24',
    '2025-12-25'
];

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setTodayAsDefault();
});

// イベントリスナーの設定
function setupEventListeners() {
    document.getElementById('dateInput').addEventListener('change', function() {
        updateTable();
        renderCalendar();
    });
    document.getElementById('dateInput').addEventListener('input', function() {
        updateTable();
        renderCalendar();
    });
}

// URLクエリパラメータから値を取得
function getQueryParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// 本日の日付またはクエリパラメータの日付をデフォルト値として設定
function setTodayAsDefault() {
    let defaultDate = new Date();
    
    // クエリパラメータにtargetDateがあればそれを使用
    const targetDate = getQueryParameter('targetDate');
    if (targetDate) {
        // targetDate形式をチェック（YYYY-MM-DD形式を想定）
        const parsedDate = new Date(targetDate + 'T00:00:00');
        if (!isNaN(parsedDate)) {
            defaultDate = parsedDate;
        }
    }
    
    const year = defaultDate.getFullYear();
    const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const day = String(defaultDate.getDate()).padStart(2, '0');
    document.getElementById('dateInput').value = `${year}-${month}-${day}`;
    currentCalendarDate = new Date(defaultDate);
    updateTable();
    renderCalendar();
}

// カレンダー用の現在の月を追跡する変数
let currentCalendarDate = new Date();

// 営業日（平日）をさかのぼる計算
function subtractBusinessDays(date, businessDaysToSubtract) {
    let currentDate = new Date(date);
    let daysSubtracted = 0;

    // さかのぼって営業日を数える
    while (daysSubtracted < businessDaysToSubtract) {
        currentDate.setDate(currentDate.getDate() - 1);
        
        // 土曜日（6）と日曜日（0）以外、かつ祝日以外を営業日としてカウント
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isHoliday(currentDate)) {
            daysSubtracted++;
        }
    }

    return currentDate;
}

// 祝日判定関数（営業日計算用）
function isHoliday(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // 祝日のみをチェック（規制日は除外）
    return jpHolidaysList.includes(dateString);
}

// 規制日判定関数
function isRegulationDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return regulationDateList.includes(dateString);
}

// 日付をフォーマット（YYYY年MM月DD日）
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}年${month}月${day}日（${dayOfWeek}）`;
}

// テーブルを更新する関数
function updateTable() {
    const dateInput = document.getElementById('dateInput').value;
    
    if (!dateInput) {
        return;
    }

    const inputDate = new Date(dateInput + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const priorities = ['highest', 'high', 'middle', 'low'];
    const priorityLabels = {
        highest: 'Highest',
        high: 'High',
        middle: 'Middle',
        low: 'Low'
    };
    const scaleLabels = ['large', 'medium', 'small'];

    priorities.forEach(priority => {
        const row = document.createElement('tr');
        
        // 優先度セル
        const priorityCell = document.createElement('th');
        priorityCell.textContent = priorityLabels[priority];
        row.appendChild(priorityCell);

        // 各規模のセル
        scaleLabels.forEach(scale => {
            const cell = document.createElement('td');
            const businessDays = businessDayMatrix[priority][scale];
            const deadlineDate = subtractBusinessDays(inputDate, businessDays);
            const deadlineDateFormatted = formatDate(deadlineDate);
            
            // 今日から締切日までの残り営業日数を計算
            const remainingBusinessDays = calculateBusinessDaysBetween(today, deadlineDate);
            
            // 表示形式：「日付（曜日） 残り：X営業日」
            const displayText = `${deadlineDateFormatted}\n残り：${remainingBusinessDays}営業日`;
            cell.innerHTML = displayText.replace(/\n/g, '<br>');
            cell.className = 'table-cell-deadline';
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// 2つの日付間の営業日数を計算する関数
function calculateBusinessDaysBetween(startDate, endDate) {
    let currentDate = new Date(startDate);
    let businessDayCount = 0;

    // startDateからendDateまで営業日をカウント
    while (currentDate < endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        
        // 土曜日（6）と日曜日（0）以外、かつ祝日・規制日以外を営業日としてカウント
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isHoliday(currentDate) && !isRegulationDate(currentDate)) {
            businessDayCount++;
        }
    }

    return businessDayCount;
}

// カレンダーをレンダリング
function renderCalendar() {
    const dateInput = document.getElementById('dateInput').value;
    
    if (!dateInput) {
        document.getElementById('calendarContainer').innerHTML = '';
        return;
    }
    
    const inputDate = new Date(dateInput + 'T00:00:00');
    
    // 全ての締切日を計算して最も早い日付を見つける
    let earliestDeadline = null;
    const priorities = ['highest', 'high', 'middle', 'low'];
    const scaleLabels = ['large', 'medium', 'small'];
    
    priorities.forEach(priority => {
        scaleLabels.forEach(scale => {
            const businessDays = businessDayMatrix[priority][scale];
            const deadlineDate = subtractBusinessDays(inputDate, businessDays);
            
            if (!earliestDeadline || deadlineDate < earliestDeadline) {
                earliestDeadline = deadlineDate;
            }
        });
    });
    
    // 凍結日から最も早い締切日までの期間でカレンダーを表示
    // （凍結日のほうが後なので、開始日は締切日、終了日は凍結日）
    const startDate = earliestDeadline || inputDate;
    const endDate = new Date(inputDate);
    
    const calendarContainer = document.getElementById('calendarContainer');
    calendarContainer.innerHTML = '';
    
    // 開始日から終了日までを月ごとに処理
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                       '7月', '8月', '9月', '10月', '11月', '12月'];
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // 月のセクションを作成
        const monthSection = document.createElement('div');
        monthSection.className = 'calendar-month-section';
        
        // 月名ヘッダー
        const monthHeader = document.createElement('h3');
        monthHeader.className = 'calendar-month-header';
        monthHeader.textContent = `${year}年 ${monthNames[month]}`;
        monthSection.appendChild(monthHeader);
        
        // 曜日ヘッダー
        const weekHeader = document.createElement('div');
        weekHeader.className = 'calendar-week week-header';
        const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
        dayLabels.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day day-label';
            dayEl.textContent = day;
            weekHeader.appendChild(dayEl);
        });
        monthSection.appendChild(weekHeader);
        
        // 月の最初の日と最後の日を取得
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        // 表示開始日と表示終了日を決定
        const displayStartDate = new Date(firstDayOfMonth);
        const displayEndDate = new Date(lastDayOfMonth);
        
        // 表示開始日がstartDateより前なら、startDateを開始日にする
        if (displayStartDate < startDate) {
            displayStartDate.setDate(startDate.getDate());
            displayStartDate.setMonth(startDate.getMonth());
            displayStartDate.setFullYear(startDate.getFullYear());
        }
        
        // 表示終了日がendDateより後なら、endDateを終了日にする
        if (displayEndDate > endDate) {
            displayEndDate.setDate(endDate.getDate());
            displayEndDate.setMonth(endDate.getMonth());
            displayEndDate.setFullYear(endDate.getFullYear());
        }
        
        // 月の最初の日の曜日を取得
        const startDayOfWeek = firstDayOfMonth.getDay();
        
        // 週単位でカレンダーを生成
        let currentWeek = document.createElement('div');
        currentWeek.className = 'calendar-week';
        
        // 月の最初の週の前の空白を埋める
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            currentWeek.appendChild(emptyDay);
        }
        
        // 月内のカレンダーを生成
        const dayCounter = new Date(firstDayOfMonth);
        
        while (dayCounter.getMonth() === month) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            
            // 日付テキスト
            const dateText = document.createElement('div');
            dateText.className = 'calendar-day-number';
            dateText.textContent = dayCounter.getDate();
            dayEl.appendChild(dateText);
            
            // 表示範囲外の場合は薄くする
            if (dayCounter < displayStartDate || dayCounter > displayEndDate) {
                dayEl.classList.add('out-of-range');
            } else {
                const dayOfWeek = dayCounter.getDay();
                
                // 規制日をチェック（祝日・規制日よりも先にチェック）
                if (isRegulationDate(dayCounter)) {
                    dayEl.classList.add('regulation-date');
                } else if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(dayCounter)) {
                    // 土曜日（6）と日曜日（0）、または祝日をチェック
                    dayEl.classList.add('weekend-holiday');
                }
                
                // 凍結日と同じ日付をハイライト
                if (dayCounter.getTime() === inputDate.getTime()) {
                    dayEl.classList.add('selected');
                }
                
                // 締切日をハイライトし、優先度/規模情報を追加
                const deadlines = [];
                priorities.forEach(priority => {
                    scaleLabels.forEach(scale => {
                        const businessDays = businessDayMatrix[priority][scale];
                        const deadlineDate = subtractBusinessDays(inputDate, businessDays);
                        if (dayCounter.getTime() === deadlineDate.getTime()) {
                            // 規制日が優先される場合、deadlineクラスを追加しない
                            if (!isRegulationDate(dayCounter)) {
                                dayEl.classList.add('deadline');
                            }
                            deadlines.push({ priority, scale });
                        }
                    });
                });
                
                // 締切日の情報を表示
                if (deadlines.length > 0) {
                    const infoText = document.createElement('div');
                    infoText.className = 'deadline-info';
                    const priorityLabels = { highest: 'highest', high: 'high', middle: 'middle', low: 'low' };
                    const scaleLabels2 = { large: '大', medium: '中', small: '小' };
                    infoText.textContent = deadlines.map(d => `${priorityLabels[d.priority]}/${scaleLabels2[d.scale]}`).join(' ');
                    dayEl.appendChild(infoText);
                }
                
                // 今日をハイライト
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (dayCounter.getTime() === today.getTime()) {
                    dayEl.classList.add('today');
                }
            }
            
            currentWeek.appendChild(dayEl);
            
            // 7日で週を区切る
            if (currentWeek.children.length === 7) {
                monthSection.appendChild(currentWeek);
                currentWeek = document.createElement('div');
                currentWeek.className = 'calendar-week';
            }
            
            dayCounter.setDate(dayCounter.getDate() + 1);
        }
        
        // 残りの空白を埋める
        while (currentWeek.children.length > 0 && currentWeek.children.length < 7) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            currentWeek.appendChild(emptyDay);
        }
        
        if (currentWeek.children.length > 0) {
            monthSection.appendChild(currentWeek);
        }
        
        calendarContainer.appendChild(monthSection);
        
        // 次の月へ
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
    }
    
    // カレンダーの日付要素にクリックイベントリスナーを追加
    addCalendarDateClickListeners();
}

// カレンダーの日付クリック時のイベントハンドラー
function addCalendarDateClickListeners() {
    const calendarDays = document.querySelectorAll('.calendar-day:not(.empty):not(.day-label):not(.out-of-range)');
    
    calendarDays.forEach(dayEl => {
        dayEl.addEventListener('click', function() {
            const dayNumber = parseInt(this.querySelector('.calendar-day-number').textContent);
            const monthHeader = this.closest('.calendar-month-section').querySelector('.calendar-month-header');
            const monthText = monthHeader.textContent;
            
            // 年月日を抽出
            const match = monthText.match(/(\d+)年\s*(\d+)月/);
            if (!match) return;
            
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            
            // クリックされた日付を作成
            const clickedDate = new Date(year, month - 1, dayNumber);
            
            // 今日から残りの営業日を計算
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const businessDays = calculateBusinessDaysBetween(today, clickedDate);
            
            // 情報を表示
            displayDateInfo(clickedDate, businessDays);
        });
    });
}

// 日付情報を表示
function displayDateInfo(date, businessDays) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    const dateString = `${year}年${month}月${day}日（${dayOfWeek}）`;
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <p><strong>日付：</strong> ${dateString}</p>
        <p class="business-days">今日からの残りの営業日：<strong>${businessDays}</strong>営業日</p>
    `;
    
    document.getElementById('dateModal').style.display = 'flex';
}

// モーダルを閉じる
function closeDateModal() {
    document.getElementById('dateModal').style.display = 'none';
}

// モーダル外をクリックした場合も閉じる
document.addEventListener('click', function(event) {
    const modal = document.getElementById('dateModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});