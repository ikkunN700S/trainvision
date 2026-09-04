document.addEventListener('DOMContentLoaded', () => {

    let stationData = [
        { nameJa: "要町", nameEn: "Kanamecho", id: "F-08", time: "",  isPass: false, lowerShape: "circle", lowerColor: "#cc0000", isSync: true },
        { nameJa: "池袋", nameEn: "Ikebukuro", id: "F-09", time: "4", isPass: false, lowerShape: "circle", lowerColor: "#cc0000", isSync: true  },
        { nameJa: "雑司が谷", nameEn: "Zoshigaya", id: "F-10", time: "", isPass: true, lowerShape: "circle", lowerColor: "#cc0000", isSync: true },
        { nameJa: "西早稲田", nameEn: "Nishi-Waseda", id: "F-11", time: "", isPass: true, lowerShape: "circle", lowerColor: "#cc0000", isSync: true },
        { nameJa: "東新宿", nameEn: "Higashi-Shinjuku", id: "F-12", time: "", isPass: true, lowerShape: "circle", lowerColor: "#cc0000", isSync: true },
        { nameJa: "新宿三丁目", nameEn: "Shinjuku-Sanchome", id: "F-13", time: "10", isPass: false, lowerShape: "circle", lowerColor: "#cc0000", isSync: true },
        { nameJa: "北参道", nameEn: "Kita-Sando", id: "F-14", time: "", isPass: true, lowerShape: "circle", lowerColor: "#cc0000", isSync: true },
        { nameJa: "明治神宮前", nameEn: "Meiji-Jingumae", id: "F-15", time: "14", isPass: false, lowerShape: "circle", lowerColor: "#cc0000", isSync: true }
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

    function renderRouteMap() {
        const grid = document.getElementById('route-map-grid');
        if (!grid) return;

        const showLowerNum = document.getElementById('toggle-lower-numbering')?.checked ?? true;
        const showLowerShape = document.getElementById('toggle-lower-shape')?.checked ?? true;

        if (showLowerNum) {
            grid.classList.remove('hide-numbering');
        } else {
            grid.classList.add('hide-numbering');
        }

        if (!isRouteMapInitialized) {
            grid.innerHTML = '';
            const bg = document.createElement('div');
            bg.className = 'time-bar-bg';
            bg.innerHTML = `
                <div class="time-bar-fill"></div>
                <div class="time-bar-mask-top"></div>
                <div class="time-bar-mask-bottom"></div>
            `;
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
            const showLowerNum = document.getElementById('toggle-lower-numbering')?.checked ?? true;
            const showLowerShape = document.getElementById('toggle-lower-shape')?.checked ?? true;

            if (idItem) {
                idItem.className = `grid-item st-id row-2 ${st.isPass ? 'grey-text' : ''}`;
                if (!showLowerNum) {
                    idItem.innerHTML = '';
                } else {
                    const match = st.id.match(/^([A-Za-z]+)[-]([0-9A-Za-z]+)$/);
                    if (match && showLowerShape) {
                        // 個別図形の半径を計算
                        let r = '8px';
                        if (st.lowerShape === 'square') r = '0px';
                        if (st.lowerShape === 'circle') r = '50%';
                        
                        idItem.innerHTML = `
                            <div class="lower-number-box" style="border-color: ${st.lowerColor}; border-radius: ${r};">
                                <div class="lower-line-code"><span class="inner">${match[1]}</span></div>
                                <div class="lower-st-num"><span class="inner">${match[2]}</span></div>
                            </div>
                        `;
                    } else {
                        idItem.innerHTML = `<span class="inner">${st.id}</span>`;
                    }
                }
            }

            if (i !== 0) {
                const timeItem = document.getElementById(`route-time-box-${i}`);
                if (timeItem) {
                    if (st.isPass) {
                        timeItem.innerHTML = `<div class="white-chevron"></div>`;
                    } else {
                        timeItem.innerHTML = `<div class="time-box"><span class="inner">${st.time}</span></div>`;
                    }
                }
            }
        }

        const redChevronElem = document.getElementById('route-time-box-0');
        if (redChevronElem) {
            setTimeout(() => {
                const lineStartOffset = 25; 
                const centerPos = redChevronElem.offsetLeft + (redChevronElem.offsetWidth / 2) - lineStartOffset;
                const lineWidth = grid.offsetWidth - lineStartOffset;
                const pct = (centerPos / lineWidth) * 100;
                document.documentElement.style.setProperty('--line-fill-percent', pct + '%');
            }, 0);
        }

        adjustAllFittedTexts();
    }

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
            { nodes: document.querySelectorAll('.train-type .inner'), margin: 24 }, 
            { nodes: document.querySelectorAll('.destination .inner'), margin: 0 },
            { nodes: document.querySelectorAll('.car-number .number'), margin: 0 },
            { nodes: document.querySelectorAll('.next-label .inner'), margin: 0 },
            { nodes: document.querySelectorAll('.station-name .inner'), margin: 0 },
            { nodes: document.querySelectorAll('.station-number-box .line-code .inner'), margin: 4 },
            { nodes: document.querySelectorAll('.station-number-box .st-num .inner'), margin: 4 },
            { nodes: document.querySelectorAll('.lower-number-box .lower-line-code .inner'), margin: 4 },
            { nodes: document.querySelectorAll('.lower-number-box .lower-st-num .inner'), margin: 4 },
            { nodes: document.querySelectorAll('.st-id .inner'), margin: 4 },
            { nodes: document.querySelectorAll('.time-box .inner'), margin: 4 }
        ];

        horizontalFits.forEach(fit => {
            fit.nodes.forEach(inner => {
                const parent = inner.parentElement;
                if (!parent) return;
                inner.style.transform = 'scaleX(1)';
                const parentWidth = parent.clientWidth;
                const allowedWidth = parentWidth - fit.margin;
                const innerWidth = inner.scrollWidth;
                
                if (innerWidth > allowedWidth && allowedWidth > 0) {
                    inner.style.transform = `scaleX(${allowedWidth / innerWidth})`;
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
        const baseTarget = document.getElementById('sync-base-target').value;
        let baseColor = '';
        if (baseTarget === 'company') baseColor = document.getElementById('input-company-color').value;
        if (baseTarget === 'line') baseColor = document.getElementById('input-line-color').value;
        if (baseTarget === 'separator') baseColor = document.getElementById('input-separator-color').value;
        if (baseTarget === 'type') baseColor = document.getElementById('input-type-color').value;
        
        if (document.getElementById('sync-company')?.checked && baseTarget !== 'company') {
            document.getElementById('input-company-color').value = baseColor;
            document.documentElement.style.setProperty('--company-color', baseColor);
        }
        if (document.getElementById('sync-separator')?.checked && baseTarget !== 'separator') {
            document.getElementById('input-separator-color').value = baseColor;
            document.documentElement.style.setProperty('--separator-color', baseColor);
        }
        if (document.getElementById('sync-line')?.checked && baseTarget !== 'line') {
            document.getElementById('input-line-color').value = baseColor;
            document.documentElement.style.setProperty('--line-color', baseColor);
        }
        if (document.getElementById('sync-type')?.checked && baseTarget !== 'type') {
            updateCustomTypeUI(null, null, baseColor, null, null);
        }
    });

    // === 駅ナンバリング＆図形表示トグル ===
    document.getElementById('toggle-top-numbering')?.addEventListener('change', (e) => {
        const topNumberBox = document.getElementById('st-number-box');
        if (topNumberBox) topNumberBox.style.display = e.target.checked ? 'flex' : 'none';
    });

    document.getElementById('toggle-lower-numbering')?.addEventListener('change', () => {
        renderRouteMap();
    });
    
    document.getElementById('toggle-lower-shape')?.addEventListener('change', () => {
        renderRouteMap();
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
        selectShape.dispatchEvent(new Event('change'));
    }

    const selectTimeboxShape = document.getElementById('select-timebox-shape');
    if (selectTimeboxShape) {
        selectTimeboxShape.addEventListener('change', (e) => {
            const shape = e.target.value;
            if (shape === 'square') {
                document.documentElement.style.setProperty('--timebox-width', '50px');
                document.documentElement.style.setProperty('--timebox-height', '32px');
                document.documentElement.style.setProperty('--timebox-radius', '0px');
            } else if (shape === 'rounded') {
                document.documentElement.style.setProperty('--timebox-width', '50px');
                document.documentElement.style.setProperty('--timebox-height', '32px');
                document.documentElement.style.setProperty('--timebox-radius', '6px');
            } else if (shape === 'circle') {
                document.documentElement.style.setProperty('--timebox-width', '40px');
                document.documentElement.style.setProperty('--timebox-height', '40px');
                document.documentElement.style.setProperty('--timebox-radius', '50%');
            }
        });
        selectTimeboxShape.dispatchEvent(new Event('change'));
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
            document.documentElement.style.setProperty('--type-text-shadow', '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 2px rgba(0,0,0,0.5)');
        } else {
            document.documentElement.style.setProperty('--type-text-shadow', 'none');
        }
        adjustAllFittedTexts();
    }

    // === 号車表示のデザイン・背景色変更 ===
    const carStyleSelect = document.getElementById('input-car-style');
    const carBgInput = document.getElementById('input-car-bg');
    const carWrapper = document.getElementById('car-wrapper');

    if (carStyleSelect && carWrapper) {
        carStyleSelect.addEventListener('change', (e) => {
            carWrapper.className = `car-number-wrapper ${e.target.value}`;
        });
        carStyleSelect.dispatchEvent(new Event('change'));
    }
    if (carBgInput) {
        carBgInput.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--car-bg-color', e.target.value);
        });
        carBgInput.dispatchEvent(new Event('input'));
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
            const target = document.querySelector('#st-line-code .inner');
            if (target) target.textContent = e.target.value;
            adjustAllFittedTexts(); // 入力時に即座に縮小判定を行う
        });
    }

    const stNumInput = document.getElementById('input-st-num');
    if (stNumInput) {
        stNumInput.addEventListener('input', (e) => {
            const target = document.querySelector('#st-num-val .inner');
            if (target) target.textContent = e.target.value;
            adjustAllFittedTexts();
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
                <td><input type="text" value="${st.nameJa}" data-idx="${idx}" data-field="nameJa" style="width:70px;"></td>
                <td><input type="text" value="${st.nameEn}" data-idx="${idx}" data-field="nameEn" style="width:70px;"></td>
                <td><input type="text" value="${st.id}" data-idx="${idx}" data-field="id" style="width:55px;"></td>
                <td>
                    <select data-idx="${idx}" data-field="lowerShape" style="width:65px;">
                        <option value="square" ${st.lowerShape === 'square' ? 'selected' : ''}>四角</option>
                        <option value="rounded" ${st.lowerShape === 'rounded' ? 'selected' : ''}>角丸</option>
                        <option value="circle" ${st.lowerShape === 'circle' ? 'selected' : ''}>丸</option>
                    </select>
                </td>
                <td><input type="color" value="${st.lowerColor}" data-idx="${idx}" data-field="lowerColor" style="width:30px; height:24px; padding:0;"></td>
                <td><input type="checkbox" ${st.isSync ? 'checked' : ''} data-idx="${idx}" data-field="isSync"></td>
                <td><input type="text" value="${st.time}" data-idx="${idx}" data-field="time" style="width:40px;" ${idx === 0 ? 'disabled' : ''}></td>
                <td><input type="checkbox" ${st.isPass ? 'checked' : ''} data-idx="${idx}" data-field="isPass" ${idx === 0 ? 'disabled' : ''}></td>
            `;
            tbody.appendChild(tr);
        });

        tbody.addEventListener('input', (e) => {
            const idx = e.target.dataset.idx;
            const field = e.target.dataset.field;
            if (idx === undefined) return;

            if (field === 'isPass' || field === 'isSync') {
                stationData[idx][field] = e.target.checked;
            } else {
                stationData[idx][field] = e.target.value;
            }
            renderRouteMap();
        });
    }

    // === 個別の下部ナンバリングを一括同期するボタン処理 (修正版) ===
    document.getElementById('btn-sync-lower-num')?.addEventListener('click', () => {
        // ドロップダウンで選択された基準駅（0〜7）を取得
        const baseIdx = document.getElementById('sync-lower-base-idx').value;
        const baseStation = stationData[baseIdx];
        const mainColor = baseStation.lowerColor;
        const mainShape = baseStation.lowerShape;
        
        stationData.forEach((st) => {
            if (st.isSync) {
                st.lowerColor = mainColor;
                st.lowerShape = mainShape;
            }
        });
        renderControlTable(); // パネルの表示を更新
        renderRouteMap();     // モニターの表示を更新
    });

    // === 画像ダウンロード機能 ===
    document.getElementById('btn-download')?.addEventListener('click', () => {
        const monitor = document.getElementById('lcd-monitor');

        html2canvas(monitor, { 
            scale: 2, 
            backgroundColor: '#ffffff',
            onclone: (clonedDoc) => {
                // ① 見切れ対策：裏画面だけ全体の縮小を解除
                const clonedMonitor = clonedDoc.getElementById('lcd-monitor');
                if (clonedMonitor) clonedMonitor.style.transform = 'none';

                // ② 縦書きズレ＆はみ出し対策：
                // 元の画面で計算された縮小率を読み取り、裏画面の文字サイズに直接適用する
                const originalMonitor = document.getElementById('lcd-monitor');
                const originalJaNames = originalMonitor.querySelectorAll('.st-name-inner.ja-st-name');
                const clonedJaNames = clonedDoc.querySelectorAll('.st-name-inner.ja-st-name');

                clonedJaNames.forEach((el, index) => {
                    const origEl = originalJaNames[index];
                    
                    // 元の要素に適用されている縮小率(scaleY)を取得
                    const transformStr = origEl.style.transform || '';
                    let scaleY = 1;
                    const match = transformStr.match(/scaleY\(([0-9.]+)\)/);
                    if (match) scaleY = parseFloat(match[1]);

                    // html2canvasのバグを避けるため、縦書き設定と変形を解除
                    el.style.writingMode = 'horizontal-tb';
                    el.style.transform = 'none'; 
                    el.style.textAlign = 'center';
                    el.style.lineHeight = '1';

                    // 縮小率をフォントサイズと文字間隔に掛け算する
                    const newFontSize = 26 * scaleY;
                    const newSpacing = 4 * scaleY;

                    // 文字を1文字ずつのブロック(div)にして縦に積む
                    const text = origEl.textContent;
                    el.innerHTML = '';
                    for (const char of text) {
                        const span = clonedDoc.createElement('div');
                        span.textContent = char;
                        span.style.fontSize = `${newFontSize}px`;
                        span.style.marginBottom = `${newSpacing}px`;
                        
                        // 長音符（ー）だけは縦向きに回転させる
                        if (char === 'ー') {
                            span.style.transform = 'rotate(90deg)';
                        }
                        el.appendChild(span);
                    }
                });
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'train-vision.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });
});