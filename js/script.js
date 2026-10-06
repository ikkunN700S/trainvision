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

    let masterStationData = []; 
    let currentDisplayStartIndex = 0;
    let currentGlobalIndex = 0; // 全体の中で現在どの駅にいるか
    let currentArrowIndex = 0;  // 画面上の8マスのうち、どこに矢印を置くか

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
    }, 8000);

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
    
    const labelMode = document.getElementById('select-next-label')?.value || 'next';
    const chevronColor = document.getElementById('select-chevron-color')?.value || 'red';
    const isNextMode = (labelMode === 'next'); 

    // コンテナを左右反転
    const isMirror = document.getElementById('toggle-mirror-layout')?.checked;
    if (isMirror) {
        grid.style.transform = 'scaleX(-1)';
    } else {
        grid.style.transform = 'none';
    }

    if (showLowerNum) {
        grid.classList.remove('hide-numbering');
    } else {
        grid.classList.add('hide-numbering');
    }

    if (!isRouteMapInitialized) {
        grid.innerHTML = '';
        grid.style.position = 'relative'; 

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
            grid.appendChild(item);
        }

        const chevronLayer = document.createElement('div');
        chevronLayer.id = 'global-chevron-layer';
        chevronLayer.style.position = 'absolute';
        chevronLayer.style.left = '0';
        chevronLayer.style.width = '100%';
        chevronLayer.style.pointerEvents = 'none';
        chevronLayer.style.zIndex = '5';
        chevronLayer.innerHTML = `
            <div id="chevron-clipper" style="position: absolute; top: 50%; margin-top: -20px; height: 40px; width: 36px; overflow: hidden;">
                <div class="chevron-large" id="current-chevron-arrow" style="position: absolute; top: 50%; left: 80%; margin: 0; transform: translate(-50%, -50%) rotate(-135deg);"></div>
            </div>
        `;
        grid.appendChild(chevronLayer);

        isRouteMapInitialized = true;
    }

    // `isRouteEn` が未定義の場合は日本語をデフォルトにする安全対策
    const enMode = typeof isRouteEn !== 'undefined' ? isRouteEn : false;
    const timeLabel = document.getElementById('route-time-label');
    
    if (timeLabel) {
        timeLabel.innerHTML = `<div style="display:inline-block; ${isMirror ? 'transform: scaleX(-1);' : ''}">${enMode ? 'min' : '分'}</div>`;
    }

    for (let i = 7; i >= 0; i--) {
        const st = stationData[i];
        
        // 現在矢印がある位置（currentArrowIndex）より前の駅はグレーアウトさせる
        const isPassedStation = (i < currentArrowIndex) || (i === currentArrowIndex && isNextMode);
        const isGrey = st.isPass || isPassedStation;

        const nameItem = document.getElementById(`route-st-name-${i}`);
        if (nameItem) {
            nameItem.className = `grid-item st-name-vert row-1 ${isGrey ? 'grey-text' : ''}`;
            const nameText = enMode ? st.nameEn : st.nameJa;
            const langClass = enMode ? 'en-st-name' : 'ja-st-name';
            nameItem.innerHTML = `<div class="st-name-inner ${langClass}">${nameText}</div>`;
        }

        const idItem = document.getElementById(`route-st-id-${i}`);
        if (idItem) {
            idItem.className = `grid-item st-id row-2 ${isGrey ? 'grey-text' : ''}`;
            if (!showLowerNum) {
                idItem.innerHTML = '';
            } else {
                const match = (st.id || "").match(/^([A-Za-z]+)[-]([0-9A-Za-z]+)$/);
                if (match && showLowerShape) {
                    const activeColor = isGrey ? '#999999' : (st.lowerColor || 'transparent');

                    let r = '8px';
                    let boxBg = 'transparent';
                    let topColor = '';
                    let bottomBg = 'transparent';
                    let bottomColor = '';
                    let flexCol = '';

                    if (st.lowerShape === 'square') r = '0px';
                    if (st.lowerShape === 'circle') r = '50%';
                    if (st.lowerShape === 'jrc' || st.lowerShape === 'jrc_2') {
                        r = (st.lowerShape === 'jrc_2') ? '0px' : '6px';

                        flexCol = 'display: flex; flex-direction: column;';
                            
                        boxBg = activeColor; 
                            
                        // 通過時は薄いグレーにし、!importantでCSSに勝たせる
                        const jrcTopText = isGrey ? '#c0c0c0' : '#ffffff';
                        topColor = `background-color: transparent; color: ${jrcTopText} !important; height: 34%; width: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.75em;`;
                        
                        bottomBg = 'background-color: #ffffff; height: 66%; width: 100%; display: flex; align-items: center; justify-content: center;'; 
                        bottomColor = 'color: #000000; font-size: 1.1em; font-weight: bold;';
                    }
                        
                    // 子要素の span にも color: inherit !important; を付けて文字色消失を防ぐ
                    idItem.innerHTML = `
                        <div class="lower-number-box" style="border-color: ${activeColor}; border-radius: ${r}; background: ${boxBg}; overflow: hidden; padding: 0; ${flexCol}">
                            <div class="lower-line-code" style="${topColor}"><span class="inner" style="color: inherit !important;">${match[1]}</span></div>
                            <div class="lower-st-num" style="${bottomBg} ${bottomColor}"><span class="inner" style="color: inherit !important;">${match[2]}</span></div>
                        </div>
                    `;

                } else {
                    idItem.innerHTML = `<span class="inner">${st.id || ""}</span>`;
                }
            }
        }

        const timeItem = document.getElementById(`route-time-box-${i}`);
        if (timeItem) {
            if (st.isPass) {
                timeItem.innerHTML = `
                    <div style="position: relative; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
                        <div class="time-box" style="visibility: hidden; pointer-events: none;"><span class="inner">${st.time}</span></div>
                        <div class="white-chevron" style="position: absolute;"></div>
                    </div>
                `;
            } else {
                timeItem.innerHTML = `<div class="time-box"><span class="inner">${st.time}</span></div>`;
            }
        }
    }

    // ▼ 矢印の位置計算（0,1固定ではなく currentArrowIndex を基準にする）
    const chevronWrap = document.getElementById(`route-time-box-${currentArrowIndex}`);
    const globalLayer = document.getElementById('global-chevron-layer');
    const clipper = document.getElementById('chevron-clipper');
    const chevronArrow = document.getElementById('current-chevron-arrow');
    const box1 = document.getElementById(`route-time-box-${currentArrowIndex + 1}`);

    if (chevronWrap && globalLayer && clipper && chevronArrow) {
        chevronArrow.classList.remove('chevron-blink');
        void chevronArrow.offsetWidth; 
        chevronArrow.classList.add('chevron-blink');
        
        globalLayer.style.top = chevronWrap.offsetTop + 'px';
        globalLayer.style.height = chevronWrap.offsetHeight + 'px';

        const box0Center = chevronWrap.offsetLeft + (chevronWrap.offsetWidth / 2);
        let arrowAbsoluteCenterX = box0Center;

        if (isNextMode && box1) {
            const box1Center = box1.offsetLeft + (box1.offsetWidth / 2);
            arrowAbsoluteCenterX = (box0Center + box1Center) / 2;
        } else if (isNextMode && !box1) {
            // データ終端で「次へ」の箱が存在しない場合の安全処理
            arrowAbsoluteCenterX = chevronWrap.offsetLeft + chevronWrap.offsetWidth;
        }

        const clipperWidth = 36; 
        const halfWidth = clipperWidth / 2;

        clipper.style.left = (arrowAbsoluteCenterX - halfWidth) + 'px';
        chevronArrow.style.left = '80%';
        chevronArrow.style.transform = 'translate(-50%, -50%) rotate(-135deg)';

        setTimeout(() => {
            const lineStartOffset = 25; 
            const colorLineStop = arrowAbsoluteCenterX; 
            
            const centerPos = colorLineStop - lineStartOffset;
            const lineWidth = grid.offsetWidth - lineStartOffset;
            const pct = (centerPos / lineWidth) * 100;
            document.documentElement.style.setProperty('--line-fill-percent', pct + '%');
        }, 0);
    }

    // 路線図のカラーラインを各駅のナンバリングカラーに合わせて分割グラデーション化
    const timeBarBg = grid.querySelector('.time-bar-bg');
    const timeBarFill = grid.querySelector('.time-bar-fill');
    
    if (timeBarBg || timeBarFill) {
        const defaultColor = document.getElementById('input-line-color')?.value || '#cc0000';
        
        // 逆順モードかどうかの判定フラグ
        const isReverseData = document.getElementById('toggle-reverse-data')?.checked;
        
        const getColor = (idx) => {
            if (idx < 0 || idx > 7) return defaultColor;
            const c = stationData[idx]?.lowerColor;
            return (c && c !== 'transparent') ? c : defaultColor;
        };

        // 背景バー自体の左端のズレ（余白分）を取得
        const bgOffset = timeBarBg ? timeBarBg.offsetLeft : 0;

        // 各駅のボックスの中心（絶対ピクセル座標）を取得
        let centers = [];
        for (let i = 0; i < 8; i++) {
            const box = document.getElementById(`route-time-box-${i}`);
            centers[i] = box ? (box.offsetLeft + (box.offsetWidth / 2) - bgOffset) : 0;
        }

        // 画面の左から右へ並び替え
        let visualPoints = [];
        for(let i = 0; i < 8; i++) {
            visualPoints.push({ idx: i, x: centers[i] });
        }
        visualPoints.sort((a, b) => a.x - b.x);

        let stops = [];
        // 左端(0px) 〜 最初の駅の中心
        stops.push(`${getColor(visualPoints[0].idx)} 0px`);
        stops.push(`${getColor(visualPoints[0].idx)} ${visualPoints[0].x}px`);

        // 駅の中心 〜 次の駅の中心
        for (let v = 0; v < 7; v++) {
            const pt1 = visualPoints[v];
            const pt2 = visualPoints[v+1];
            
            // 順方向なら「進行先」、逆順なら「進行元」のカラーを採用
            const targetIdx = isReverseData 
                ? Math.min(pt1.idx, pt2.idx) 
                : Math.max(pt1.idx, pt2.idx);
                
            const segColor = getColor(targetIdx);
            
            stops.push(`${segColor} ${pt1.x}px`);
            stops.push(`${segColor} ${pt2.x}px`);
        }

        // 最後の駅の中心 〜 右端（余裕を持って大きく設定）
        stops.push(`${getColor(visualPoints[7].idx)} ${visualPoints[7].x}px`);
        stops.push(`${getColor(visualPoints[7].idx)} 3000px`);

        // 失われていた上下の立体感（光沢と影）をグラデーションで復元
        const shadeGradient = 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.5) 100%)';
        const colorGradient = `linear-gradient(to right, ${stops.join(', ')})`;
        
        // 2つのグラデーションを重ねて適用
        const combinedBackground = `${shadeGradient}, ${colorGradient}`;

        if (timeBarBg) {
            timeBarBg.style.backgroundImage = '';
            timeBarBg.style.backgroundColor = '';
        }
        
        if (timeBarFill) {
            timeBarFill.style.backgroundImage = combinedBackground;
            timeBarFill.style.backgroundColor = 'transparent';
            
            const gridWidth = grid.clientWidth || 1000;
            timeBarFill.style.backgroundSize = `${gridWidth}px 100%`;
            timeBarFill.style.backgroundRepeat = 'no-repeat';
        }
    }

    if (typeof adjustAllFittedTexts === 'function') {
        adjustAllFittedTexts();
    }
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

        // 反転フラグ取得
        const isMirror = document.getElementById('toggle-mirror-layout')?.checked;

        horizontalFits.forEach(fit => {
            fit.nodes.forEach(inner => {
                const parent = inner.parentElement;
                if (!parent) return;

                // 路線図内のテキストについて鏡文字を相殺
                const inGrid = inner.closest('#route-map-grid') !== null;
                const mScale = (inGrid && isMirror) ? -1 : 1;

                inner.style.transform = `scaleX(${mScale})`;
                const parentWidth = parent.clientWidth;
                const allowedWidth = parentWidth - fit.margin;
                const innerWidth = inner.scrollWidth;
                
                if (innerWidth > allowedWidth && allowedWidth > 0) {
                    inner.style.transform = `scaleX(${allowedWidth / innerWidth * mScale})`;
                }
            });
        });

        const vertInners = document.querySelectorAll('.st-name-inner');
        vertInners.forEach(inner => {
            // 縦書き・斜めが気の鏡文字を相殺
            const inGrid = inner.closest('#route-map-grid') !== null;
            const mScale = (inGrid && isMirror) ? -1 : 1;

            if (inner.classList.contains('en-st-name')) {
                inner.style.transform = `scaleX(${mScale}) rotate(-55deg) scale(1)`; 
                const maxWidth = 110; 
                const currentWidth = inner.scrollWidth;
                if (currentWidth > maxWidth) {
                    const ratio = maxWidth / currentWidth;
                    inner.style.transform = `scaleX(${mScale}) rotate(-55deg) scale(${ratio})`;
                }
            } else {
                inner.style.transform = `scaleX(${mScale}) scaleY(1)`;
                const maxHeight = 100;
                const currentHeight = inner.scrollHeight;
                if (currentHeight > maxHeight) {
                    inner.style.transform = `scaleX(${mScale}) scaleY(${maxHeight / currentHeight})`;
                }
            }
        });
    }

    // ▼ 逆順チェックボックスが押されたら、現在編集中のデータをその場で逆順にする
    document.getElementById('toggle-reverse-data')?.addEventListener('change', () => {
        if (!masterStationData || masterStationData.length === 0) return;
        
        // 現在のデータをコピーして逆順にする
        const rev = [...masterStationData].reverse();
        
        // 駅間の所要時間を正しく引き継ぐ
        for (let i = 0; i < rev.length; i++) {
            if (i === 0) {
                rev[i].time = ""; // 出発駅は時間なし
            } else {
                rev[i].time = masterStationData[masterStationData.length - i].time;
            }
        }
        
        // データを上書き
        masterStationData = rev;
        
        // 進行状況を先頭（0）にリセットし「ただいま」に戻す
        currentGlobalIndex = 0;
        const labelSelect = document.getElementById('select-next-label');
        if (labelSelect) labelSelect.value = 'now';
        
        // 画面を更新
        updateActiveStations();
    });

    // 左右反転チェックボックスが押されたら、画面を再描画する
    document.getElementById('toggle-mirror-layout')?.addEventListener('change', () => {
        renderRouteMap();
    });

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
                document.documentElement.style.setProperty('--timebox-width', '35px');
                document.documentElement.style.setProperty('--timebox-height', '35px');
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
        
        // 空欄になっている場合非表示にする
        const typeWrapper = document.querySelector('.train-type-wrapper');
        if (typeWrapper) {
            if (!kanji.trim() && !en.trim()) {
                typeWrapper.style.visibility = 'hidden';
            } else {
                typeWrapper.style.visibility = 'visible';
            }
        }

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
    const selectNextLabel = document.getElementById('select-next-label');
    if (selectNextLabel) {
        selectNextLabel.addEventListener('change', (e) => {
            const val = e.target.value;
            const nextKanji = document.querySelector('#next-kanji .inner');
            const nextKana = document.querySelector('#next-kana .inner');
            const nextEn = document.querySelector('#next-en .inner');
            
            if (val === 'now') {
                if (nextKanji) nextKanji.textContent = 'ただいま';
                if (nextKana) nextKana.textContent = 'ただいま';
                if (nextEn) nextEn.textContent = 'This is';
            } else {
                if (nextKanji) nextKanji.textContent = '次は'; 
                if (nextKana) nextKana.textContent = 'つぎは';
                if (nextEn) nextEn.textContent = 'Next';
            }
            adjustAllFittedTexts();
            renderRouteMap();
        });
        selectNextLabel.dispatchEvent(new Event('change')); // 初期読み込み時にも適用
    }

    // ▼ 矢印のカラーピッカーと変数の同期設定
    const color1Input = document.getElementById('chevron-color-1');
    const color2Input = document.getElementById('chevron-color-2');

    // 色をCSS変数に反映する関数
    function updateChevronColors() {
        if (color1Input) document.documentElement.style.setProperty('--chevron-color-1', color1Input.value);
        if (color2Input) document.documentElement.style.setProperty('--chevron-color-2', color2Input.value);
    }

    // ページ読み込み時に実行して、初期値を確実にセットする
    updateChevronColors();

    // カラーピッカーが変更されたらリアルタイムに色を反映する
    if (color1Input) color1Input.addEventListener('input', updateChevronColors);
    if (color2Input) color2Input.addEventListener('input', updateChevronColors);

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
                <td><input type="text" value="${st.nameKana || ''}" data-idx="${idx}" data-field="nameKana" style="width:70px;"></td>
                <td><input type="text" value="${st.nameEn}" data-idx="${idx}" data-field="nameEn" style="width:70px;"></td>
                <td><input type="text" value="${st.id}" data-idx="${idx}" data-field="id" style="width:55px;"></td>
                <td>
                    <select data-idx="${idx}" data-field="lowerShape" style="width:65px;">
                        <option value="square" ${st.lowerShape === 'square' ? 'selected' : ''}>四角</option>
                        <option value="rounded" ${st.lowerShape === 'rounded' ? 'selected' : ''}>角丸</option>
                        <option value="circle" ${st.lowerShape === 'circle' ? 'selected' : ''}>丸</option>
                        <option value="jrc" ${st.lowerShape === 'jrc' ? 'selected' : ''}>名鉄風</option>
                        <option value="jrc_2" ${st.lowerShape === 'jrc_2' ? 'selected' : ''}>JR東海風</option>
                    </select>
                </td>
                <td><input type="color" value="${st.lowerColor}" data-idx="${idx}" data-field="lowerColor" style="width:30px; height:24px; padding:0;"></td>
                <td><input type="checkbox" ${st.isSync !== false ? 'checked' : ''} data-idx="${idx}" data-field="isSync"></td>
                <td><input type="text" value="${st.time}" data-idx="${idx}" data-field="time" style="width:40px;" ${idx === 0 ? 'disabled' : ''}></td>
                <td><input type="checkbox" ${st.isPass ? 'checked' : ''} data-idx="${idx}" data-field="isPass" ${idx === 0 ? 'disabled' : ''}></td>
            `;
            tbody.appendChild(tr);
        });

        tbody.addEventListener('input', (e) => {
            const idx = e.target.dataset.idx;
            const field = e.target.dataset.field;
            if (idx === undefined) return;
            const numIdx = parseInt(idx, 10);

            if (field === 'isPass' || field === 'isSync') {
                stationData[idx][field] = e.target.checked;
            } else {
                stationData[idx][field] = e.target.value;
            }

            // マスターデータにも上書き保存
            if (masterStationData && masterStationData[currentDisplayStartIndex + numIdx]) {
                masterStationData[currentDisplayStartIndex + numIdx][field] = stationData[numIdx][field];
            }

            // テーブルを編集した際に、上部の大きなディスプレイにも即座に反映させる
            if (numIdx === (document.getElementById('select-next-label')?.value === 'next' ? 1 : 0)) {
                syncTopHeaderPanel(stationData[numIdx], document.getElementById('select-next-label')?.value === 'next');
            }
            renderRouteMap();
        });
    }

    // 個別の下部ナンバリングを一括同期するボタン処理
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

    // ▼ 「次へ」ボタンの処理
    document.getElementById('btn-next-state')?.addEventListener('click', () => {
        const labelSelect = document.getElementById('select-next-label');
        if (labelSelect.value === 'now') {
            // 終点でなければ「次は」へ進む
            if (currentGlobalIndex < masterStationData.length - 1) {
                labelSelect.value = 'next';
            }
        } else {
            // 矢印を次の駅へ進める
            if (currentGlobalIndex < masterStationData.length - 1) {
                currentGlobalIndex++;
                
                // 進んだ先の駅が「通過駅」なら「次は」のままにする
                if (masterStationData[currentGlobalIndex].isPass) {
                    labelSelect.value = 'next';
                } else {
                    labelSelect.value = 'now';
                }
            }
        }
        updateActiveStations();
    });

    // ▼ 「前へ」ボタンの処理
    document.getElementById('btn-prev-state')?.addEventListener('click', () => {
        const labelSelect = document.getElementById('select-next-label');
        
        if (labelSelect.value === 'next') {
            // 通過の場合は次はを維持
            if (masterStationData[currentGlobalIndex].isPass) {
                currentGlobalIndex--;
                labelSelect.value = 'next'; // 戻った先でも「次は」を維持して判定させる
            } else {
                labelSelect.value = 'now';
            }
        } else {
            if (currentGlobalIndex > 0) {
                currentGlobalIndex--;
                labelSelect.value = 'next';
            }
        }
        updateActiveStations();
    });

    function updateActiveStations() {
        const maxStartIndex = Math.max(0, masterStationData.length - 8);
        currentDisplayStartIndex = Math.min(currentGlobalIndex, maxStartIndex);
        currentArrowIndex = currentGlobalIndex - currentDisplayStartIndex;

        stationData = masterStationData.slice(currentDisplayStartIndex, currentDisplayStartIndex + 8);
        
        // 足りない場合は空データで埋める（nameKana を追加しました）
        while(stationData.length < 8) {
            stationData.push({ nameJa: "", nameKana: "", nameEn: "", id: "", time: "", isPass: true, lowerShape: "square", lowerColor: "transparent", isSync: false });
        }
        
        const labelSelect = document.getElementById('select-next-label');
        const isNext = (labelSelect && labelSelect.value === 'next');
        
        // 次へ向かっているなら次の駅、ただいまなら今の駅を取得
        let targetGlobalIndex = currentGlobalIndex;
        if (isNext) {
            targetGlobalIndex = Math.min(currentGlobalIndex + 1, masterStationData.length - 1);
            while (targetGlobalIndex < masterStationData.length - 1 && masterStationData[targetGlobalIndex].isPass) {
                targetGlobalIndex++;
            }
        }

        const targetStation = masterStationData[targetGlobalIndex] || {};
        
        const modeText = isNext ? '次は' : 'ただいま';
        const displaySpan = document.getElementById('current-state-display');
        if (displaySpan) displaySpan.textContent = `${modeText} ${targetStation.nameJa || ""}`;
        
        // 上部パネルの入力欄を同期し、大画面ヘッダー更新
        syncTopHeaderPanel(targetStation, isNext);
        
        if (typeof renderControlTable === 'function') {
            renderControlTable();
        }
        
        renderRouteMap();
    }

    // 対象駅のデータを、上部コントロールパネル（入力欄）に流し込む関数
    function syncTopHeaderPanel(station, isNext) {
        // 1. コントロール部の入力欄の値を変更（イベントは強制発火しません）
        const kanjiInput = document.getElementById('input-st-kanji');
        const kanaInput = document.getElementById('input-st-kana');
        const enInput = document.getElementById('input-st-en');
        const idInput = document.getElementById('input-top-st-id');
        
        if (kanjiInput) kanjiInput.value = station.nameJa || "";
        if (kanaInput) kanaInput.value = station.nameKana || "";
        if (enInput) enInput.value = station.nameEn || "";
        if (idInput) idInput.value = station.id || "";

        // ドロップダウンも現在の状態に合わせる
        const labelSelect = document.getElementById('select-next-label');
        if (labelSelect) labelSelect.value = isNext ? 'next' : 'now';

        // 2. 変更が終わったら、そのまま大画面更新関数を呼び出す
        updateBigHeaderDisplay(isNext);
    }

    // 上部コントロールパネルの入力値をもとに、大画面ヘッダーを描画する関数
    function updateBigHeaderDisplay(isNext) {
        // 1. コントロール部から最新の値を取得
        const kanji = document.getElementById('input-st-kanji')?.value || '';
        const kana = document.getElementById('input-st-kana')?.value || '';
        const en = document.getElementById('input-st-en')?.value || '';
        const idVal = document.getElementById('input-top-st-id')?.value || '';

        // ターゲット駅を取得し、形・色を取得
        let actualTargetIndex = currentGlobalIndex;
        if (isNext) {
            actualTargetIndex = Math.min(currentGlobalIndex + 1, masterStationData.length - 1);
            while (actualTargetIndex < masterStationData.length - 1 && masterStationData[actualTargetIndex].isPass) {
                actualTargetIndex++;
            }
        }
        const targetStation = masterStationData[actualTargetIndex] || {};
        
        // 色と形を取得（データがなければ丸と路線カラーをデフォルトにする）
        const shape = targetStation.lowerShape || 'circle';
        let color = targetStation.lowerColor;
        // 未設定時は全体の路線カラーを拾う
        if (!color || color === 'transparent') {
            color = document.getElementById('input-line-color')?.value || '#cc0000';
        }

        let r = '8px';
        if (shape === 'square') r = '0px';
        if (shape === 'circle') r = '50%';
        if (shape === 'jrc') r = '6px';
        if (shape === 'jrc_2') r = '0px';

        // 2. 次駅案内テキストの更新（.inner を狙い撃ちしてアニメーション構造を維持）
        const nextKanji = document.querySelector('#next-kanji .inner');
        if (nextKanji) nextKanji.textContent = isNext ? '次は' : 'ただいま';

        const nextKana = document.querySelector('#next-kana .inner');
        if (nextKana) nextKana.textContent = isNext ? 'つぎは' : 'ただいま';

        const nextEn = document.querySelector('#next-en .inner');
        if (nextEn) nextEn.textContent = isNext ? 'Next' : 'This is';

        // 3. 駅名の更新
        const applySpacing = (element, text, isEn) => {
            if (!element) return;
            element.textContent = text;
            
            // 日本語（漢字・ひらがな）の場合のみ字間を調整
            if (!isEn) {
                if (text.length === 2) {
                    element.style.letterSpacing = '1em';
                    element.style.paddingLeft = '1em'; // 最後の余白のズレを相殺して中央に保つ
                } else if (text.length === 3) {
                    element.style.letterSpacing = '0.3em';
                    element.style.paddingLeft = '0.3em';
                } else {
                    element.style.letterSpacing = '0';
                    element.style.paddingLeft = '0';
                }
            } else {
                // 英語は通常の字間
                element.style.letterSpacing = '0';
                element.style.paddingLeft = '0';
            }
        };

        const stKanji = document.querySelector('#st-kanji .inner');
        applySpacing(stKanji, kanji, false);

        const stKana = document.querySelector('#st-kana .inner');
        applySpacing(stKana, kana, false);

        const stEn = document.querySelector('#st-en .inner');
        applySpacing(stEn, en, true);

        // 4. ナンバリングの更新
        const topNumberBox = document.getElementById('st-number-box');
        const showNum = document.getElementById('toggle-top-numbering')?.checked ?? true;
        
        if (topNumberBox) {
            if (showNum && idVal) {
                topNumberBox.style.display = 'flex'; // コンテナを表示
                topNumberBox.style.visibility = 'visible';

                // JR東海風かどうかの判定フラグ
                const isJrc = (shape === 'jrc' || shape === 'jrc_2');
                
                topNumberBox.style.borderColor = color;
                topNumberBox.style.borderRadius = r;
                topNumberBox.style.overflow = 'hidden'; 
                topNumberBox.style.padding = isJrc ? '0' : '';
                topNumberBox.style.flexDirection = isJrc ? 'column' : '';
                
                // 親コンテナの背景全体を路線カラーにする
                topNumberBox.style.background = isJrc ? color : 'transparent';
                
                const match = idVal.match(/^([A-Za-z]+)[-]([0-9A-Za-z]+)$/);
                const lineCodeContainer = document.getElementById('st-line-code');
                const stNumValContainer = document.getElementById('st-num-val');
                
                if (lineCodeContainer) {
                    lineCodeContainer.style.color = isJrc ? '#ffffff' : '';
                    // 上半分は透明にする
                    lineCodeContainer.style.backgroundColor = 'transparent';
                    lineCodeContainer.style.height = isJrc ? '34%' : '';
                    lineCodeContainer.style.width = isJrc ? '100%' : '';
                    lineCodeContainer.style.display = isJrc ? 'flex' : '';
                    lineCodeContainer.style.alignItems = isJrc ? 'center' : '';
                    lineCodeContainer.style.justifyContent = isJrc ? 'center' : '';
                    lineCodeContainer.style.fontSize = isJrc ? '1em' : '';
                }
                
                if (stNumValContainer) {
                    stNumValContainer.style.color = isJrc ? '#000000' : '';
                    // 下半分を白にする
                    stNumValContainer.style.backgroundColor = isJrc ? '#ffffff' : 'transparent';
                    stNumValContainer.style.height = isJrc ? '66%' : '';
                    stNumValContainer.style.width = isJrc ? '100%' : '';
                    stNumValContainer.style.display = isJrc ? 'flex' : '';
                    stNumValContainer.style.alignItems = isJrc ? 'center' : '';
                    stNumValContainer.style.justifyContent = isJrc ? 'center' : '';
                }

                const lineCode = document.querySelector('#st-line-code .inner');
                const stNumVal = document.querySelector('#st-num-val .inner');
                
                if (match) {
                    if (lineCode) lineCode.textContent = match[1];
                    if (stNumVal) stNumVal.textContent = match[2];
                } else {
                    if (lineCode) lineCode.textContent = '';
                    if (stNumVal) stNumVal.textContent = idVal;
                }
            } else {
                topNumberBox.style.display = 'flex'; // コンテナを非表示
                topNumberBox.style.visibility = 'hidden';
            }
        }

        // 5. テキストを流し込んだ後、文字幅の自動縮小関数を呼ぶ
        if (typeof adjustAllFittedTexts === 'function') {
            setTimeout(() => {
                adjustAllFittedTexts();
            }, 10);
        }
    }

    // ▼ グローバル変数の拡張
    let presetDataList = []; // 読み込んだ複数路線のリストを保持

    // ▼ 値をセットしつつ、強制的に input/change イベントを発火させる関数
    function setAndTrigger(id, value, isCheckbox = false) {
        const el = document.getElementById(id);
        if (!el) return; // IDが見つからない場合はスキップ
        
        if (isCheckbox) {
            el.checked = value;
        } else {
            el.value = value;
        }
        // 手打ち入力したのと同じようにイベントを発生させる
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // ▼ コントロールパネルの「種別・路線設定など」を同期する関数
    function syncRouteSettingsPanel(preset) {
        if (!preset) return;

        // 1. 種別設定
        if (preset.trainType) {
            setAndTrigger('input-type-kanji', preset.trainType.nameJa || "");
            setAndTrigger('input-type-en', preset.trainType.nameEn || "");
            setAndTrigger('input-type-color', preset.trainType.bgColor || "#000000");
            setAndTrigger('input-type-text', preset.trainType.textColor || "#ffffff");
        }

        // 2. 行先設定 (NEW)
        if (preset.destination) {
            setAndTrigger('input-dest-kanji', preset.destination.nameJa || "");
            setAndTrigger('input-dest-kana', preset.destination.nameKana || "");
            setAndTrigger('input-dest-en', preset.destination.nameEn || "");
        }

        // 3. 号車設定 (NEW)
        if (preset.carSettings) {
            setAndTrigger('input-car-num', preset.carSettings.carNum || "1");
            setAndTrigger('input-car-style', preset.carSettings.style || "style-number-only");
            setAndTrigger('input-car-bg', preset.carSettings.bgColor || "#383838");
        }

        // 4. カラー設定 (NEW)
        if (preset.uiColors) {
            setAndTrigger('input-company-color', preset.uiColors.company || "#cc0000");
            setAndTrigger('input-separator-color', preset.uiColors.separator || "#cc0000");
            setAndTrigger('input-line-color', preset.uiColors.line || "#cc0000");
        }

        // 5. 右下案内テキスト (NEW)
        if (preset.footerNote !== undefined) {
            setAndTrigger('input-footer-note', preset.footerNote);
        }

        // 6. 路線・矢印設定
        if (preset.routeSettings) {
            setAndTrigger('chevron-color-1', preset.routeSettings.chevronColor1 || "#e60012");
            setAndTrigger('chevron-color-2', preset.routeSettings.chevronColor2 || "#0066cc");
            
            if (typeof updateChevronColors === 'function') updateChevronColors();

            setAndTrigger('toggle-lower-numbering', preset.routeSettings.showLowerNumbering !== false, true);
            setAndTrigger('toggle-lower-shape', preset.routeSettings.showLowerShape !== false, true);

            setAndTrigger('select-timebox-shape', preset.routeSettings.timeboxShape || "square");

            setAndTrigger('select-top-num-pos', preset.routeSettings.topNumPos || "left");
        }
    }

    // データを逆順にする関数
    function getProcessedStationData(preset) {
        if (!preset || !preset.stations) return [];
        const isReverseData = document.getElementById('toggle-reverse-data')?.checked;
        
        let stations = JSON.parse(JSON.stringify(preset.stations));
        
        if (isReverseData) {
            const rev = [...stations].reverse();
            for (let i = 0; i < rev.length; i++) {
                if (i === 0) {
                    rev[i].time = ""; // 出発駅は所要時間なし
                } else {
                    // 元の順方向での、駅間の所要時間を引き継ぐ
                    rev[i].time = stations[stations.length - i].time;
                }
            }
            stations = rev;
        }
        return stations;
    }

    // 指定した路線を画面にロードする関数
    function loadPresetRoute(index) {
        const preset = presetDataList[index];
        if (!preset) return;

        masterStationData = getProcessedStationData(preset);
        currentGlobalIndex = 0; // ★ リセット
        currentDisplayStartIndex = 0;
        currentArrowIndex = 0;
        
        const labelSelect = document.getElementById('select-next-label');
        if (labelSelect) labelSelect.value = 'now';

        syncRouteSettingsPanel(preset);
        updateActiveStations();
    }

    // JSONファイルの読み込み処理（複数路線対応）
    async function loadPresetsFromFile() {
        try {
            // 同じ階層にある presets.json を取得
            const response = await fetch('stationpreset.json');
            if (!response.ok) {
                throw new Error('ネットワークエラー: ' + response.status);
            }
            
            const data = await response.json();
            
            if (data.presets && Array.isArray(data.presets)) {
                presetDataList = data.presets;
                
                const selector = document.getElementById('preset-route-selector');
                if (selector) {
                    selector.innerHTML = ''; 
                    presetDataList.forEach((preset, index) => {
                        const opt = document.createElement('option');
                        opt.value = index;
                        opt.textContent = preset.presetName;
                        selector.appendChild(opt);
                    });
                }
                
                // 最初の路線を自動でロード
                loadPresetRoute(0);
            }
        } catch (error) {
            console.error("プリセットの読み込みに失敗しました:", error);
            alert("プリセットの読み込みに失敗しました。");
        }
    }

    // ▼ 2. ドロップダウンで路線を切り替えたときの処理
    document.getElementById('preset-route-selector')?.addEventListener('change', (event) => {
        const selectedIndex = parseInt(event.target.value, 10);
        loadPresetRoute(selectedIndex);
    });

    // ▼ 3. ページ読み込み時に自動実行
    loadPresetsFromFile();

    // ▼ 上部コントロール部（駅名・ナンバリング）を手入力したときの処理
    ['input-st-kanji', 'input-st-kana', 'input-st-en', 'input-top-st-id'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', (e) => {
            const labelSelect = document.getElementById('select-next-label');
            const isNext = (labelSelect && labelSelect.value === 'next');
            const targetGlobalIndex = isNext ? Math.min(currentGlobalIndex + 1, masterStationData.length - 1) : currentGlobalIndex;

            // マスターデータの該当駅を上書き保存
            if (masterStationData[targetGlobalIndex]) {
                if (id === 'input-st-kanji') masterStationData[targetGlobalIndex].nameJa = e.target.value;
                if (id === 'input-st-kana') masterStationData[targetGlobalIndex].nameKana = e.target.value;
                if (id === 'input-st-en') masterStationData[targetGlobalIndex].nameEn = e.target.value;
                if (id === 'input-top-st-id') masterStationData[targetGlobalIndex].id = e.target.value;
            }

            updateBigHeaderDisplay(isNext); // 大画面を更新
            if (typeof renderControlTable === 'function') renderControlTable(); // 下部テーブルも更新
            renderRouteMap(); // 路線図を更新
        });
    });

    // ▼ 「案内表示（次は/ただいま）」のドロップダウンを手動で変えたときの処理
    document.getElementById('select-next-label')?.addEventListener('change', () => {
        updateActiveStations();
    });

    // ▼ 上部ナンバリング表示/非表示のチェックボックス処理
    document.getElementById('toggle-top-numbering')?.addEventListener('change', () => {
        const labelSelect = document.getElementById('select-next-label');
        updateBigHeaderDisplay(labelSelect && labelSelect.value === 'next');

        document.getElementById('select-top-num-pos')?.dispatchEvent(new Event('change'));
    });

    // === ニュース・運行情報の表示切り替え処理 ===
    let adNewsTimer = null;
    let currentAdPageIndex = -1; // -1: 路線図, 0以上: ニュースページ
    let adNewsPages = [];

    function updateAdPages() {
        const rawText = document.getElementById('input-ad-news-text')?.value || '';
        // "---" で分割し、前後の空白を削除して空のページを除外
        adNewsPages = rawText.split('---').map(p => p.trim()).filter(p => p.length > 0);
        
        // プレビュー用に現在表示中のページがあれば即座に反映
        if (currentAdPageIndex >= 0 && currentAdPageIndex < adNewsPages.length) {
            renderAdPage(currentAdPageIndex);
        }
    }

    function startAdNewsCycle() {
        // 既存のタイマーをリセット
        if (adNewsTimer) clearTimeout(adNewsTimer);
        currentAdPageIndex = -1; // サイクルは必ず路線図からスタート

        const isEnabled = document.getElementById('toggle-ad-news')?.checked;
        if (!isEnabled || adNewsPages.length === 0) {
            showRouteMap();
            return;
        }

        // 路線図を表示する
        showRouteMap();
        
        // 路線図の待機時間（ミリ秒）を取得してタイマーをセット
        const waitTime = parseInt(document.getElementById('select-ad-interval')?.value || '12000', 10);
        adNewsTimer = setTimeout(cycleDisplay, waitTime);
    }

    function cycleDisplay() {
        currentAdPageIndex++;
        
        // 最後のニュースページを表示し終わったら、次は路線図(-1)に戻る
        if (currentAdPageIndex >= adNewsPages.length) {
            currentAdPageIndex = -1;
        }

        let waitTime = 0;

        if (currentAdPageIndex === -1) {
            // ▼ 路線図の表示処理
            showRouteMap();
            waitTime = parseInt(document.getElementById('select-ad-interval')?.value || '12000', 10);
        } else {
            // ▼ ニュースの表示処理
            renderAdPage(currentAdPageIndex);
            const pageSec = parseFloat(document.getElementById('input-page-interval')?.value || '6');
            waitTime = pageSec * 1000;
        }

        // 計算した待機時間で、次の切り替えを予約する
        adNewsTimer = setTimeout(cycleDisplay, waitTime);
    }

    function showRouteMap() {
        const adLayer = document.getElementById('ad-news-layer');
        if (adLayer) adLayer.style.visibility = 'hidden';
        
        const routeMap = document.getElementById('route-map-grid');
        if (routeMap) routeMap.style.visibility = 'visible';
    }

    function renderAdPage(index) {
        const adLayer = document.getElementById('ad-news-layer');
        const container = document.getElementById('ad-news-container');
        const routeMap = document.getElementById('route-map-grid');
        const pageIndicator = document.getElementById('ad-page-indicator');
        
        if (adLayer && container && routeMap) {
            container.innerHTML = adNewsPages[index];
            
            if (pageIndicator) {
                pageIndicator.textContent = `${index + 1} / ${adNewsPages.length}`;
            }
            
            routeMap.style.visibility = 'hidden';
            adLayer.style.visibility = 'visible';
        }
    }

    // --- イベントリスナーの登録と初期化処理 ---
    document.getElementById('toggle-ad-news')?.addEventListener('change', startAdNewsCycle);
    document.getElementById('select-ad-interval')?.addEventListener('change', startAdNewsCycle);
    
    // ニュース秒数が変更された時もサイクルを再スタート
    document.getElementById('input-page-interval')?.addEventListener('change', startAdNewsCycle);
    
    document.getElementById('input-ad-news-text')?.addEventListener('input', updateAdPages);

    setTimeout(() => {
        updateAdPages();
        if (document.getElementById('toggle-ad-news')?.checked) {
            startAdNewsCycle();
        } else {
            showRouteMap();
        }
    }, 100);

    // === 緊急停車ボタンの処理 ===
    let emergencyTimer = null;
    
    document.getElementById('btn-emergency')?.addEventListener('click', () => {
        const emLayer = document.getElementById('emergency-layer');
        if (!emLayer) return;
        
        // 警告画面をパッと表示
        emLayer.style.visibility = 'visible';
        
        // すでにタイマーが動いていたらリセット（連打対策）
        if (emergencyTimer) clearTimeout(emergencyTimer);
        
        // 12秒(12000ミリ秒)後に自動で非表示にする
        emergencyTimer = setTimeout(() => {
            emLayer.style.visibility = 'hidden';
        }, 12000);
    });

    // === 上部ナンバリングの左右位置切り替え ===
    const selectTopNumPos = document.getElementById('select-top-num-pos');
    if (selectTopNumPos) {
        selectTopNumPos.addEventListener('change', (e) => {
            const topNumberBox = document.getElementById('st-number-box');
            if (!topNumberBox) return;

            const pos = e.target.value;
            const parent = topNumberBox.parentElement;

            let dummySpacer = document.getElementById('num-dummy-spacer');
            if (!dummySpacer) {
                dummySpacer = document.createElement('div');
                dummySpacer.id = 'num-dummy-spacer';
                dummySpacer.style.flexShrink = '0';      // 縮まないようにする
                dummySpacer.style.visibility = 'hidden'; // 見えないようにする
                parent.appendChild(dummySpacer);
            }
            
            // 親要素が確実にFlexboxで横並びになるように保証する
            if (parent) {
                parent.style.display = 'flex';
                parent.style.alignItems = 'center';
                parent.style.width = '100%';
            }

            if (pos === 'right') {
                // 駅名より右側に移動（orderの数値を大きくすると後ろに回る）
                topNumberBox.style.order = '5';
                topNumberBox.style.marginLeft = '10px'; // 駅名との隙間
                topNumberBox.style.marginRight = '50px';
                dummySpacer.style.display = 'none';
            } else {
                // デフォルトの左側に配置
                topNumberBox.style.order = '0'; 
                topNumberBox.style.marginLeft = '0';
                topNumberBox.style.marginRight = '10px'; // 駅名との隙間

                // ▼ 左にある時は、右側に「ナンバリングと同じ幅」の透明な箱を置いてバランスをとる
                if (topNumberBox.style.display !== 'none') {
                    dummySpacer.style.display = 'block';
                    dummySpacer.style.order = '10'; // 一番右端へ配置
                    
                    // ナンバリング本体の幅 ＋ marginRightの幅をダミーに設定
                    // display:noneから復帰した直後は幅が取れないことがあるためsetTimeoutで取得
                    setTimeout(() => {
                        const boxWidth = topNumberBox.offsetWidth;
                        dummySpacer.style.width = (boxWidth > 0 ? boxWidth + 10 : 110) + 'px';
                    }, 0);
                } else {
                    dummySpacer.style.display = 'none';
                }
            }
            
            // レイアウト変更後に文字サイズ調整を再計算
            if (typeof adjustAllFittedTexts === 'function') {
                adjustAllFittedTexts();
            }
        });
        
        // ページ読み込み時にも適用させる
        selectTopNumPos.dispatchEvent(new Event('change'));
    }
});

// Service Worker の登録処理
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 現在のディレクトリをスコープに指定して登録
        navigator.serviceWorker.register('./sw.js', { scope: './' })
            .then((registration) => {
                console.log('ServiceWorker 登録成功 / スコープ:', registration.scope);
            })
            .catch((error) => {
                console.error('ServiceWorker 登録失敗:', error);
            });
    });
}

// キャッシュ強制リセット処理
    document.getElementById('btn-clear-cache')?.addEventListener('click', () => {
        if (!confirm('保存されているキャッシュをすべて削除し、最新の状態でリロードしますか？')) return;
        
        // Service Workerの登録解除
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        // キャッシュストレージの全削除
        if ('caches' in window) {
            caches.keys().then(function(keyList) {
                return Promise.all(keyList.map(function(key) {
                    return caches.delete(key);
                }));
            }).then(function() {
                // 強制リロード（キャッシュを無視）
                window.location.reload(true);
            });
        } else {
            window.location.reload(true);
        }
    });