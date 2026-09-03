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
    let presetsCache = {};
    let isRouteMapInitialized = false; // DOM初回生成フラグ

    // プリセット読み込み
    fetch('presets.json')
        .then(res => res.json())
        .then(data => {
            presetsCache = data;
            const presetSelect = document.getElementById('preset-select');
            presetSelect.innerHTML = '<option value="">プリセットを選択</option>';
            for (const key in data) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = data[key].name;
                presetSelect.appendChild(opt);
            }
        })
        .catch(err => {
            console.error('Presets loading failed', err);
            document.getElementById('preset-select').innerHTML = '<option value="">プリセットなし</option>';
        });

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

        // 文字列が同一の場合はフェード・スライドさせず瞬時に状態切替（チラつき防止）
        if (currentText === nextText) {
            currentElem.style.transition = 'none';
            nextElem.style.transition = 'none';

            currentElem.classList.remove('active', 'enter-down', 'exit-down');
            nextElem.classList.add('active');

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

    // === 路線図グリッドレンダリング（DOM再生成を防ぐ方式） ===
    function renderRouteMap() {
        const grid = document.getElementById('route-map-grid');

        // 初回のみHTML要素を生成
        if (!isRouteMapInitialized) {
            grid.innerHTML = '';

            const bg = document.createElement('div');
            bg.className = 'time-bar-bg';
            grid.appendChild(bg);

            const emptyRow1 = document.createElement('div');
            emptyRow1.className = 'grid-item row-1';
            grid.appendChild(emptyRow1);

            for (let i = 7; i >= 0; i--) {
                const item = document.createElement('div');
                item.className = 'grid-item st-name-vert row-1';
                item.id = `route-st-name-${i}`;
                grid.appendChild(item);
            }

            const emptyRow2 = document.createElement('div');
            emptyRow2.className = 'grid-item row-2';
            grid.appendChild(emptyRow2);

            for (let i = 7; i >= 0; i--) {
                const item = document.createElement('div');
                item.className = 'grid-item st-id row-2';
                item.id = `route-st-id-${i}`;
                grid.appendChild(item);
            }

            const labelItem = document.createElement('div');
            labelItem.className = 'grid-item time-label row-3';
            labelItem.id = 'route-time-label';
            grid.appendChild(labelItem);

            for (let i = 7; i >= 0; i--) {
                const item = document.createElement('div');
                item.className = 'grid-item row-3';
                item.id = `route-time-box-${i}`;

                if (i === 0) {
                    // 赤矢印部分は最初から固定で生成して中身はもう触らない
                    item.className += ' red-chevron-container';
                    item.innerHTML = `
                        <div class="time-box-bg"></div>
                        <div class="red-chevron-large"></div>
                    `;
                }
                grid.appendChild(item);
            }
            isRouteMapInitialized = true;
        }

        // 以降は中身のテキスト・クラスのみを更新
        document.getElementById('route-time-label').textContent = isRouteEn ? 'min' : '分';

        for (let i = 7; i >= 0; i--) {
            const st = stationData[i];
            
            // 駅名の更新
            const nameItem = document.getElementById(`route-st-name-${i}`);
            nameItem.className = `grid-item st-name-vert row-1 ${st.isPass ? 'grey-text' : ''}`;
            const nameText = isRouteEn ? st.nameEn : st.nameJa;
            const langClass = isRouteEn ? 'en-st-name' : 'ja-st-name';
            nameItem.innerHTML = `<div class="st-name-inner ${langClass}">${nameText}</div>`;

            // 駅IDの更新
            const idItem = document.getElementById(`route-st-id-${i}`);
            idItem.className = `grid-item st-id row-2 ${st.isPass ? 'grey-text' : ''}`;
            idItem.textContent = st.id;

            // 所要時間の更新（1駅目の赤矢印は更新スキップ）
            if (i !== 0) {
                const timeItem = document.getElementById(`route-time-box-${i}`);
                if (st.isPass) {
                    timeItem.innerHTML = `<div class="white-chevron"></div>`;
                } else {
                    timeItem.innerHTML = `<div class="time-box">${st.time}</div>`;
                }
            }
        }

        // グレーラインの境界合わせ（DOM生成後）
        const redChevronElem = document.getElementById('route-time-box-0');
        if (redChevronElem) {
            setTimeout(() => {
                const rightEdge = redChevronElem.offsetLeft + redChevronElem.offsetWidth;
                const pct = (rightEdge / grid.offsetWidth) * 100;
                document.documentElement.style.setProperty('--line-fill-percent', pct + '%');
            }, 0);
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
                inner.style.transform = 'rotate(-55deg) scale(1)'; 
                const maxWidth = 110; 
                const currentWidth = inner.scrollWidth;
                if (currentWidth > maxWidth) {
                    const ratio = maxWidth / currentWidth;
                    inner.style.transform = `rotate(-55deg) scale(${ratio})`;
                }
            } else {
                inner.style.transform = 'scaleY(1)';
                const maxHeight = 100;
                const currentHeight = inner.scrollHeight;
                if (currentHeight > maxHeight) {
                    inner.style.transform = `scaleY(${maxHeight / currentHeight})`;
                }
            }
        });
    }

    // === コントロールパネル UIイベント ===
    document.getElementById('input-company-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--company-color', e.target.value);
    });
    document.getElementById('input-line-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--line-color', e.target.value);
    });
    document.getElementById('input-type-color').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--type-bg', e.target.value);
    });
    document.getElementById('btn-sync-color').addEventListener('click', () => {
        const c = document.getElementById('input-company-color').value;
        document.getElementById('input-line-color').value = c;
        document.getElementById('input-type-color').value = c;
        document.documentElement.style.setProperty('--line-color', c);
        document.documentElement.style.setProperty('--type-bg', c);
    });

    // プリセット連動
    const presetSelect = document.getElementById('preset-select');
    const typeSelect = document.getElementById('type-select');
    
    presetSelect.addEventListener('change', (e) => {
        typeSelect.innerHTML = '<option value="">-</option>';
        const presetKey = e.target.value;
        if (presetsCache[presetKey]) {
            const types = presetsCache[presetKey].types;
            types.forEach((t, i) => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = t.ja;
                typeSelect.appendChild(opt);
            });
        }
    });

    typeSelect.addEventListener('change', (e) => {
        const presetKey = presetSelect.value;
        const typeIdx = e.target.value;
        if (presetKey && typeIdx !== "") {
            const t = presetsCache[presetKey].types[typeIdx];
            applyTypeConfig(t.ja, t.ja, t.en, t.bg, t.text, t.outline);
        }
    });

    // モーダル処理 (手動カスタム)
    const modal = document.getElementById('type-modal');
    document.getElementById('btn-custom-type').addEventListener('click', () => {
        document.getElementById('modal-type-kanji').value = document.querySelector('#type-kanji .inner').textContent;
        document.getElementById('modal-type-en').value = document.querySelector('#type-en .inner').textContent;
        modal.style.display = 'flex';
    });
    document.getElementById('modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    document.getElementById('modal-save').addEventListener('click', () => {
        const kanji = document.getElementById('modal-type-kanji').value;
        const en = document.getElementById('modal-type-en').value;
        const bg = document.getElementById('modal-type-bg').value;
        const txt = document.getElementById('modal-type-text').value;
        const outline = document.getElementById('modal-type-outline').checked;
        applyTypeConfig(kanji, kanji, en, bg, txt, outline);
        modal.style.display = 'none';
        presetSelect.value = "";
        typeSelect.innerHTML = '<option value="">-</option>';
    });

    function applyTypeConfig(kanji, kana, en, bg, text, outline) {
        document.querySelector('#type-kanji .inner').textContent = kanji;
        document.querySelector('#type-kana .inner').textContent = kana;
        document.querySelector('#type-en .inner').textContent = en;
        
        document.documentElement.style.setProperty('--type-bg', bg);
        document.documentElement.style.setProperty('--type-text', text);
        if (outline) {
            document.documentElement.style.setProperty('--type-border', `inset 0 0 0 2px ${text}`);
        } else {
            document.documentElement.style.setProperty('--type-border', 'none');
        }
        adjustAllFittedTexts();
    }

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