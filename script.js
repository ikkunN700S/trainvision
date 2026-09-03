document.addEventListener('DOMContentLoaded', () => {

    let stationData = [
        { nameJa: "一駅目", nameEn: "STATION 1", id: "JA-01", time: "",  isPass: false },
        { nameJa: "二駅目", nameEn: "STATION 2", id: "JA-02", time: "10", isPass: true  },
        { nameJa: "三駅目", nameEn: "STATION 3", id: "JA-03", time: "10", isPass: false },
        { nameJa: "四駅目", nameEn: "STATION 4", id: "JA-04", time: "15", isPass: false },
        { nameJa: "五駅目", nameEn: "STATION 5", id: "JA-05", time: "20", isPass: false },
        { nameJa: "六駅目", nameEn: "STATION 6", id: "JA-06", time: "25", isPass: false },
        { nameJa: "七駅目", nameEn: "STATION 7", id: "JA-07", time: "30", isPass: false },
        { nameJa: "八駅目", nameEn: "STATION 8", id: "JA-08", time: "35", isPass: false }
    ];

    let currentState = 0;   
    let isRouteEn = false;  

    renderRouteMap();
    renderControlTable();
    adjustAllFittedTexts();

    // 4秒周期：上部テキスト切替
    setInterval(() => {
        let nextState = (currentState + 1) % 3;

        updatePart('type', currentState, nextState, false); 
        updatePart('dest', currentState, nextState, false); 
        updatePart('car',  currentState, nextState, false); 
        updatePart('next', currentState, nextState, false); 
        updatePart('st',   currentState, nextState, true);  

        currentState = nextState;
    }, 4000);

    // 5秒周期：下部路線図の英語/日本語切替
    setInterval(() => {
        isRouteEn = !isRouteEn;
        renderRouteMap();
    }, 5000);


    function getStateName(state) {
        if (state === 0) return 'kanji';
        if (state === 1) return 'kana';
        return 'en';
    }

    // === テキスト変更とアニメーション処理 ===
    function updatePart(prefix, current, next, isSlide) {
        const currentElem = document.getElementById(`${prefix}-${getStateName(current)}`);
        const nextElem = document.getElementById(`${prefix}-${getStateName(next)}`);
        if (!currentElem || !nextElem) return;

        const currentText = currentElem.textContent.replace(/\s+/g, '');
        const nextText = nextElem.textContent.replace(/\s+/g, '');

        // 切り替え前後の文字列が同じ場合：フェードやアニメーションを行わずに即座に状態だけを移行する
        if (currentText === nextText) {
            currentElem.style.transition = 'none';
            nextElem.style.transition = 'none';

            currentElem.classList.remove('active', 'enter-down', 'exit-down');
            nextElem.classList.add('active');

            // 強制リフロー（CSS適用）
            void currentElem.offsetWidth;
            void nextElem.offsetWidth;

            setTimeout(() => {
                currentElem.style.transition = '';
                nextElem.style.transition = '';
            }, 50);

            adjustAllFittedTexts();
            return; 
        }

        if (isSlide) {
            slideText(currentElem, nextElem);
        } else {
            fadeText(currentElem, nextElem);
        }
        adjustAllFittedTexts();
    }

    function slideText(currentElem, nextElem) {
        currentElem.classList.remove('active', 'enter-down', 'exit-down');
        nextElem.classList.remove('active', 'enter-down', 'exit-down');

        void currentElem.offsetWidth;
        void nextElem.offsetWidth;

        currentElem.classList.add('exit-down');
        nextElem.classList.add('enter-down');

        setTimeout(() => {
            currentElem.classList.remove('exit-down');
            nextElem.classList.remove('enter-down');
            nextElem.classList.add('active');
        }, 700); 
    }

    function fadeText(currentElem, nextElem) {
        currentElem.classList.remove('active');
        nextElem.classList.add('active');
    }

    // === 路線図グリッドレンダリング ===
    function renderRouteMap() {
        const grid = document.getElementById('route-map-grid');
        grid.innerHTML = '';

        const bg = document.createElement('div');
        bg.className = 'time-bar-bg';
        grid.appendChild(bg);

        // 1行目：駅名 (8駅目〜1駅目)
        const emptyRow1 = document.createElement('div');
        emptyRow1.className = 'grid-item row-1';
        grid.appendChild(emptyRow1);

        for (let i = 7; i >= 0; i--) {
            const st = stationData[i];
            const item = document.createElement('div');
            item.className = `grid-item st-name-vert row-1 ${st.isPass ? 'grey-text' : ''}`;
            
            const nameText = isRouteEn ? st.nameEn : st.nameJa;
            const langClass = isRouteEn ? 'en-st-name' : 'ja-st-name';
            item.innerHTML = `<div class="st-name-inner ${langClass}">${nameText}</div>`;
            grid.appendChild(item);
        }

        // 2行目：駅ID (8駅目〜1駅目)
        const emptyRow2 = document.createElement('div');
        emptyRow2.className = 'grid-item row-2';
        grid.appendChild(emptyRow2);

        for (let i = 7; i >= 0; i--) {
            const st = stationData[i];
            const item = document.createElement('div');
            item.className = `grid-item st-id row-2 ${st.isPass ? 'grey-text' : ''}`;
            item.textContent = st.id;
            grid.appendChild(item);
        }

        // 3行目：所要時間/矢印
        const labelItem = document.createElement('div');
        labelItem.className = 'grid-item time-label row-3';
        labelItem.textContent = isRouteEn ? 'min' : '分';
        grid.appendChild(labelItem);

        for (let i = 7; i >= 0; i--) {
            const st = stationData[i];
            const item = document.createElement('div');
            item.className = 'grid-item row-3';

            if (i === 0) {
                item.className += ' red-chevron-container';
                item.innerHTML = `
                    <div class="time-box-bg"></div>
                    <div class="red-chevron-large"></div>
                `;
            } else if (i === 1 && st.isPass) {
                item.innerHTML = `<div class="white-chevron"></div>`;
            } else if (st.isPass) {
                item.innerHTML = `<div class="white-chevron"></div>`;
            } else {
                item.innerHTML = `<div class="time-box">${st.time}</div>`;
            }
            grid.appendChild(item);
        }

        adjustAllFittedTexts();
    }

    // === はみ出し自動縮小処理 ===
    function adjustAllFittedTexts() {
        const horizontalFits = [
            document.querySelectorAll('.train-type .inner'),
            document.querySelectorAll('.destination .inner'),
            document.querySelectorAll('.car-number .number'),
            document.querySelectorAll('.next-label .inner'),
            document.querySelectorAll('.station-name .inner')
        ];

        horizontalFits.forEach(nodeList => {
            nodeList.forEach(inner => {
                const parent = inner.parentElement;
                if (!parent) return;
                inner.style.transform = 'scaleX(1)';
                const parentWidth = parent.clientWidth;
                const innerWidth = inner.scrollWidth;

                if (innerWidth > parentWidth && parentWidth > 0) {
                    inner.style.transform = `scaleX(${parentWidth / innerWidth})`;
                }
            });
        });

        const vertInners = document.querySelectorAll('.st-name-inner');
        vertInners.forEach(inner => {
            if (inner.classList.contains('en-st-name')) {
                // 英語斜め配置（-55度）のはみ出し調整
                inner.style.transform = 'rotate(-55deg) scale(1)'; 
                const maxWidth = 110; 
                const currentWidth = inner.scrollWidth;
                if (currentWidth > maxWidth) {
                    const ratio = maxWidth / currentWidth;
                    inner.style.transform = `rotate(-55deg) scale(${ratio})`;
                }
            } else {
                // 日本語縦書きのはみ出し調整
                inner.style.transform = 'scaleY(1)';
                const maxHeight = 100;
                const currentHeight = inner.scrollHeight;
                if (currentHeight > maxHeight) {
                    inner.style.transform = `scaleY(${maxHeight / currentHeight})`;
                }
            }
        });
    }

    // === UIイベントリスナー設定 ===
    document.getElementById('input-line-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--line-color', e.target.value);
    });
    document.getElementById('input-type-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--type-color', e.target.value);
    });
    document.getElementById('btn-sync-color').addEventListener('click', () => {
        const lineColor = document.getElementById('input-line-color').value;
        document.getElementById('input-type-color').value = lineColor;
        document.documentElement.style.setProperty('--type-color', lineColor);
    });

    setupInputSync('input-type-kanji', 'type-kanji');
    setupInputSync('input-type-kana',  'type-kana');
    setupInputSync('input-type-en',    'type-en');

    setupInputSync('input-dest-kanji', 'dest-kanji');
    setupInputSync('input-dest-kana',  'dest-kana');
    setupInputSync('input-dest-en',    'dest-en');

    setupInputSync('input-st-kanji',   'st-kanji');
    setupInputSync('input-st-kana',    'st-kana');
    setupInputSync('input-st-en',      'st-en');

    document.getElementById('input-car-num').addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById('car-num-kanji').textContent = val;
        document.getElementById('car-num-kana').textContent = val;
        document.getElementById('car-num-en').textContent = val;
        adjustAllFittedTexts();
    });

    document.getElementById('input-line-code').addEventListener('input', (e) => {
        document.getElementById('st-line-code').textContent = e.target.value;
    });
    document.getElementById('input-st-num').addEventListener('input', (e) => {
        document.getElementById('st-num-val').textContent = e.target.value;
    });

    document.getElementById('select-shape').addEventListener('change', (e) => {
        const shape = e.target.value;
        let radius = '8px';
        if (shape === 'square') radius = '0px';
        if (shape === 'circle') radius = '50%';
        document.documentElement.style.setProperty('--numbering-radius', radius);
    });

    function setupInputSync(inputId, targetId) {
        document.getElementById(inputId).addEventListener('input', (e) => {
            const target = document.getElementById(targetId);
            if (target) {
                const inner = target.querySelector('.inner');
                if (inner) inner.textContent = e.target.value;
                adjustAllFittedTexts();
            }
        });
    }

    function renderControlTable() {
        const tbody = document.getElementById('stations-table-body');
        tbody.innerHTML = '';

        stationData.forEach((st, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><input type="text" value="${st.nameJa}" data-idx="${idx}" data-field="nameJa" style="width:90px;"></td>
                <td><input type="text" value="${st.nameEn}" data-idx="${idx}" data-field="nameEn" style="width:90px;"></td>
                <td><input type="text" value="${st.id}" data-idx="${idx}" data-field="id" style="width:60px;"></td>
                <td><input type="text" value="${st.time}" data-idx="${idx}" data-field="time" style="width:40px;" ${idx === 0 ? 'disabled' : ''}></td>
                <td><input type="checkbox" ${st.isPass ? 'checked' : ''} data-idx="${idx}" data-field="isPass" ${idx === 0 ? 'disabled' : ''}></td>
            `;
            tbody.appendChild(tr);
        });

        tbody.addEventListener('input', (e) => {
            const idx = e.target.dataset.idx;
            const field = e.target.dataset.field;
            if (idx === undefined) return;

            if (field === 'isPass') {
                stationData[idx].isPass = e.target.checked;
            } else {
                stationData[idx][field] = e.target.value;
            }
            renderRouteMap();
        });
    }
});