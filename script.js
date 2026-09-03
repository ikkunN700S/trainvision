document.addEventListener('DOMContentLoaded', () => {
    
    // 現在の表示状態 (0: 漢字, 1: ひらがな, 2: 英語)
    let currentState = 0; 

    // 初回ロード時にすべてのはみ出し自動調整を実行
    adjustAllFittedTexts();

    // 4秒ごとに切り替え
    setInterval(() => {
        let nextState = (currentState + 1) % 3;

        updatePart('type', currentState, nextState, false); 
        updatePart('dest', currentState, nextState, false); 
        updatePart('car',  currentState, nextState, false); 
        updatePart('next', currentState, nextState, false); 
        updatePart('st',   currentState, nextState, true);  

        currentState = nextState;
    }, 4000);

    function getStateName(state) {
        if (state === 0) return 'kanji';
        if (state === 1) return 'kana';
        return 'en';
    }

    function updatePart(prefix, current, next, isSlide) {
        const currentElem = document.getElementById(`${prefix}-${getStateName(current)}`);
        const nextElem = document.getElementById(`${prefix}-${getStateName(next)}`);

        const currentText = currentElem.textContent.replace(/\s+/g, '');
        const nextText = nextElem.textContent.replace(/\s+/g, '');

        if (currentText === nextText) {
            currentElem.classList.remove('active', 'enter-down', 'exit-down');
            nextElem.classList.add('active');
            adjustAllFittedTexts(); // 再調整
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

    // === はみ出し対策の自動縮小計算（Scale適用） ===
    function adjustAllFittedTexts() {
        // 1. ヘッダー系（種別、行先、号車数字、次へ）の横方向押しつぶし
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
                // 一度スケールをリセットして正しい自然幅を計測
                inner.style.transform = 'scaleX(1)';
                const parentWidth = parent.clientWidth;
                const innerWidth = inner.scrollWidth;

                if (innerWidth > parentWidth && parentWidth > 0) {
                    const ratio = parentWidth / innerWidth;
                    inner.style.transform = `scaleX(${ratio})`;
                } else {
                    inner.style.transform = 'scaleX(1)';
                }
            });
        });

        // 2. 下部1〜8駅目の縦書き駅名（上下方向の縮小）
        const vertNames = document.querySelectorAll('.st-name-vert');
        vertNames.forEach(container => {
            const inner = container.querySelector('.st-name-inner');
            if (!inner) return;

            inner.style.transform = 'scaleY(1)';
            const maxHeight = 100; // 上部ライン等にかぶらない上限高さ
            const currentHeight = inner.scrollHeight;

            if (currentHeight > maxHeight) {
                const ratio = maxHeight / currentHeight;
                inner.style.transform = `scaleY(${ratio})`;
            } else {
                inner.style.transform = 'scaleY(1)';
            }
        });
    }
});