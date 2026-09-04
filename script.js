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
    let isRouteMapInitialized = false;

    let footerNoteLines = [];
    let currentFooterPage = 0;
    const LINES_PER_PAGE = 2;

    fetch('presets.json')
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            presetsCache = data;
            const presetSelect = document.getElementById('preset-select');
            if (presetSelect) {
                presetSelect.innerHTML = '<option value="">プリセットを選択</option>';
                for (const key in data) {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = data[key].name;
                    presetSelect.appendChild(opt);
                }
            }
        })
        .catch(err => {
            console.warn('Presets loading failed:', err);
            const presetSelect = document.getElementById('preset-select');
            if (presetSelect) presetSelect.innerHTML = '<option value="">プリセット読込失敗(CORS等)</option>';
        });

    renderRouteMap();
    renderControlTable();
    adjustAllFittedTexts();
    
    // フッターテキスト初期化
    updateFooterNoteArray();

    setInterval(() => {
        let nextState = (currentState + 1) % 3;
        updatePart('type', currentState, nextState, false); 
        updatePart('dest', currentState, nextState, false); 
        updatePart('car',  currentState, nextState, false); 
        updatePart('next', currentState, nextState, false); 
        updatePart('st',   currentState, nextState, true);  
        currentState = nextState;
    }, 4000);

    setInterval(() => {
        isRouteEn = !isRouteEn;
        renderRouteMap();
        cycleFooterNote();
    }, 5000);

    function getStateName(state) {
        if (state === 0) return 'kanji';
        if (state === 1) return 'kana';
        return 'en';
    }

    function updatePart(prefix, current, next, isSlide) {
        const currentElem = document.getElementById(`${prefix}-${getStateName(current)}`);
        const nextElem = document.getElementById(`${prefix}-${getStateName(next)}`);
        if (!currentElem || !nextElem) return;

        const currentText = currentElem.textContent.replace(/\s+/g, '');
        const nextText = nextElem.textContent.replace(/\s+/g, '');

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

    // === 路線図グリッドレンダリング ===
    function renderRouteMap() {
        const grid = document.getElementById('route-map-grid');
        if (!grid) return;

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

        const timeLabel = document.getElementById('route-time-label');
        if (timeLabel) timeLabel.textContent = isRouteEn ? 'min' : '分';

        for (let i = 7; i >= 0; i--) {
            const st = stationData[i];
            
            const nameItem = document.getElementById(`route-st-name-${i}`);
            if (nameItem) {
                nameItem.className = `grid-item st-name-vert row-1 ${st.isPass ? 'grey-text' : ''}`;
                const nameText = isRouteEn ? st.nameEn : st.nameJa;
                const langClass = isRouteEn ? 'en-st-name' : 'ja-st-name';
                nameItem.innerHTML = `<div class="st-name-inner ${langClass}">${nameText}</div>`;
            }

            const idItem = document.getElementById(`route-st-id-${i}`);
            if (idItem) {
                idItem.className = `grid-item st-id row-2 ${st.isPass ? 'grey-text' : ''}`;
                const match = st.id.match(/^([A-Za-z]+)[-]([0-9A-Za-z]+)$/);
                if (match) {
                    idItem.innerHTML = `
                        <div class="lower-number-box">
                            <div class="lower-line-code">${match[1]}</div>
                            <div class="lower-st-num">${match[2]}</div>
                        </div>
                    `;
                } else {
                    idItem.innerHTML = st.id;
                }
            }

            if (i !== 0) {
                const timeItem = document.getElementById(`route-time-box-${i}`);
                if (timeItem) {
                    if (st.isPass) {
                        timeItem.innerHTML = `<div class="white-chevron"></div>`;
                    } else {
                        timeItem.innerHTML = `<div class="time-box">${st.time}</div>`;
                    }
                }
            }
        }

        const redChevronElem = document.getElementById('route-time-box-0');
        if (redChevronElem) {
            setTimeout(() => {
                // grid 全体が padding-left:25px を持ち、ラインも left:25px なのでオフセットを引いて計算
                const lineStartOffset = 25; 
                const rightEdge = redChevronElem.offsetLeft + redChevronElem.offsetWidth - lineStartOffset;
                const lineWidth = grid.offsetWidth - lineStartOffset;
                const pct = (rightEdge / lineWidth) * 100;
                document.documentElement.style.setProperty('--line-fill-percent', pct + '%');
            }, 0);
        }

        adjustAllFittedTexts();
    }

    // === フッターノート（右下案内テキスト）ロジック ===
    function updateFooterNoteArray() {
        const footerInputElem = document.getElementById('input-footer-note');
        if (!footerInputElem) return;
        
        const text = footerInputElem.value;
        footerNoteLines = text.split('\n').filter(line => line.trim() !== '');
        currentFooterPage = 0;
        renderFooterNotePage();
    }

    const footerInput = document.getElementById('input-footer-note');
    if (footerInput) {
        footerInput.addEventListener('input', updateFooterNoteArray);
    }

    function cycleFooterNote() {
        if (footerNoteLines.length <= LINES_PER_PAGE) return; 
        
        currentFooterPage++;
        if (currentFooterPage * LINES_PER_PAGE >= footerNoteLines.length) {
            currentFooterPage = 0;
        }
        
        const footerDisplay = document.getElementById('footer-note-display');
        if (footerDisplay) {
            footerDisplay.classList.add('fade-out');
            setTimeout(() => {
                renderFooterNotePage();
                footerDisplay.classList.remove('fade-out');
            }, 500);
        }
    }

    function renderFooterNotePage() {
        const footerDisplay = document.getElementById('footer-note-display');
        if (!footerDisplay) return;
        
        if (footerNoteLines.length === 0) {
            footerDisplay.innerHTML = '';
            return;
        }
        const start = currentFooterPage * LINES_PER_PAGE;
        const pageLines = footerNoteLines.slice(start, start + LINES_PER_PAGE);
        footerDisplay.innerHTML = pageLines.join('<br>');
    }

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

    // === カラー・チェックボックス同期イベント ===
    document.getElementById('input-company-color')?.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--company-color', e.target.value);
    });
    document.getElementById('input-separator-color')?.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--separator-color', e.target.value);
    });
    document.getElementById('input-line-color')?.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--line-color', e.target.value);
    });

    document.getElementById('btn-sync-color')?.addEventListener('click', () => {
        const baseColor = document.getElementById('input-company-color').value;
        
        if (document.getElementById('sync-separator').checked) {
            document.getElementById('input-separator-color').value = baseColor;
            document.documentElement.style.setProperty('--separator-color', baseColor);
        }
        if (document.getElementById('sync-line').checked) {
            document.getElementById('input-line-color').value = baseColor;
            document.documentElement.style.setProperty('--line-color', baseColor);
        }
        if (document.getElementById('sync-type').checked) {
            updateCustomTypeUI(null, null, baseColor, null, null);
        }
    });

    // === 次駅ナンバリング表示トグル ===
    document.getElementById('toggle-top-numbering')?.addEventListener('change', (e) => {
        const topNumberBox = document.getElementById('st-number-box');
        if (topNumberBox) {
            topNumberBox.style.display = e.target.checked ? 'flex' : 'none';
        }
    });

    // === 図形形状の変更 ===
    const selectShape = document.getElementById('select-shape');
    if (selectShape) {
        selectShape.addEventListener('change', (e) => {
            const shape = e.target.value;
            let radius = '8px';
            if (shape === 'square') radius = '0px';
            if (shape === 'circle') radius = '50%';
            document.documentElement.style.setProperty('--numbering-radius', radius);
        });
    }

    const selectTimeboxShape = document.getElementById('select-timebox-shape');
    if (selectTimeboxShape) {
        selectTimeboxShape.addEventListener('change', (e) => {
            const shape = e.target.value;
            let radius = '0px';
            if (shape === 'rounded') radius = '6px';
            if (shape === 'circle') radius = '50px'; // pill shape
            document.documentElement.style.setProperty('--timebox-radius', radius);
        });
    }


    // === インライン 種別設定 ===
    const presetSelect = document.getElementById('preset-select');
    const typeSelect = document.getElementById('type-select');
    
    const inTypeKanji = document.getElementById('input-type-kanji');
    const inTypeEn = document.getElementById('input-type-en');
    const inTypeText = document.getElementById('input-type-text'); 
    const inTypeColor = document.getElementById('input-type-color'); 
    const inTypeOutline = document.getElementById('input-type-outline');

    if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
            if (typeSelect) typeSelect.innerHTML = '<option value="">-</option>';
            const presetKey = e.target.value;
            if (presetsCache[presetKey] && typeSelect) {
                const types = presetsCache[presetKey].types;
                types.forEach((t, i) => {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.textContent = t.ja;
                    typeSelect.appendChild(opt);
                });
            }
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            const presetKey = presetSelect ? presetSelect.value : '';
            const typeIdx = e.target.value;
            if (presetKey && typeIdx !== "" && presetsCache[presetKey]) {
                const t = presetsCache[presetKey].types[typeIdx];
                updateCustomTypeUI(t.ja, t.en, t.bg, t.text, t.outline);
            }
        });
    }

    const customInputs = [inTypeKanji, inTypeEn, inTypeColor, inTypeText, inTypeOutline];
    customInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                if (presetSelect) presetSelect.value = ""; 
                if (typeSelect) typeSelect.innerHTML = '<option value="">-</option>';
                applyCustomTypeFromUI();
            });
        }
    });

    function updateCustomTypeUI(kanji, en, bg, text, outline) {
        if (kanji !== null && inTypeKanji) inTypeKanji.value = kanji;
        if (en !== null && inTypeEn) inTypeEn.value = en;
        if (bg !== null && inTypeColor) inTypeColor.value = bg;
        if (text !== null && inTypeText) inTypeText.value = text;
        if (outline !== null && inTypeOutline) inTypeOutline.checked = outline;
        applyCustomTypeFromUI();
    }

    function applyCustomTypeFromUI() {
        const kanji = inTypeKanji ? inTypeKanji.value : "";
        const en = inTypeEn ? inTypeEn.value : "";
        const bg = inTypeColor ? inTypeColor.value : "#000";
        const text = inTypeText ? inTypeText.value : "#fff";
        const outline = inTypeOutline ? inTypeOutline.checked : false;
        
        applyTypeConfig(kanji, kanji, en, bg, text, outline);
    }

    function applyTypeConfig(kanji, kana, en, bg, text, outline) {
        const tKanji = document.querySelector('#type-kanji .inner');
        const tKana = document.querySelector('#type-kana .inner');
        const tEn = document.querySelector('#type-en .inner');
        if (tKanji) tKanji.textContent = kanji;
        if (tKana) tKana.textContent = kana;
        if (tEn) tEn.textContent = en;
        
        document.documentElement.style.setProperty('--type-bg', bg);
        document.documentElement.style.setProperty('--type-text', text);
        if (outline) {
            document.documentElement.style.setProperty('--type-border', `inset 0 0 0 2px ${text}`);
        } else {
            document.documentElement.style.setProperty('--type-border', 'none');
        }
        adjustAllFittedTexts();
    }

    // === その他のUI連動設定 ===
    setupInputSync('input-dest-kanji', 'dest-kanji');
    setupInputSync('input-dest-kana',  'dest-kana');
    setupInputSync('input-dest-en',    'dest-en');

    setupInputSync('input-st-kanji',   'st-kanji');
    setupInputSync('input-st-kana',    'st-kana');
    setupInputSync('input-st-en',      'st-en');

    const carNumInput = document.getElementById('input-car-num');
    if (carNumInput) {
        carNumInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (document.getElementById('car-num-kanji')) document.getElementById('car-num-kanji').textContent = val;
            if (document.getElementById('car-num-kana')) document.getElementById('car-num-kana').textContent = val;
            if (document.getElementById('car-num-en')) document.getElementById('car-num-en').textContent = val;
            adjustAllFittedTexts();
        });
    }

    const lineCodeInput = document.getElementById('input-line-code');
    if (lineCodeInput) {
        lineCodeInput.addEventListener('input', (e) => {
            if (document.getElementById('st-line-code')) document.getElementById('st-line-code').textContent = e.target.value;
        });
    }

    const stNumInput = document.getElementById('input-st-num');
    if (stNumInput) {
        stNumInput.addEventListener('input', (e) => {
            if (document.getElementById('st-num-val')) document.getElementById('st-num-val').textContent = e.target.value;
        });
    }

    function setupInputSync(inputId, targetId) {
        const inputElem = document.getElementById(inputId);
        if (inputElem) {
            inputElem.addEventListener('input', (e) => {
                const target = document.getElementById(targetId);
                if (target) {
                    const inner = target.querySelector('.inner');
                    if (inner) inner.textContent = e.target.value;
                    adjustAllFittedTexts();
                }
            });
        }
    }

    function renderControlTable() {
        const tbody = document.getElementById('stations-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        stationData.forEach((st, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><input type="text" value="${st.nameJa}" data-idx="${idx}" data-field="nameJa" style="width:90px;"></td>
                <td><input type="text" value="${st.nameEn}" data-idx="${idx}" data-field="nameEn" style="width:90px;"></td>
                <td><input type="text" value="${st.id}" data-idx="${idx}" data-field="id" style="width:70px;" placeholder="例: JA-01"></td>
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