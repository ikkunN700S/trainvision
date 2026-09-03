document.addEventListener('DOMContentLoaded', () => {
    
    // 現在の表示状態 (0: 漢字, 1: ひらがな, 2: 英語)
    let currentState = 0; 

    // 4秒ごとに切り替え
    setInterval(() => {
        let nextState = (currentState + 1) % 3;

        // 各パーツの更新 (prefix, 現在の状態, 次の状態, スライドにするか)
        updatePart('type', currentState, nextState, false); // 種別
        updatePart('dest', currentState, nextState, false); // 行先
        updatePart('car',  currentState, nextState, false); // 号車
        updatePart('next', currentState, nextState, false); // つぎは
        updatePart('st',   currentState, nextState, true);  // 駅名

        currentState = nextState;
    }, 4000);

    // 状態IDからクラス名を取得するヘルパー関数
    function getStateName(state) {
        if (state === 0) return 'kanji';
        if (state === 1) return 'kana';
        return 'en';
    }

    // 表示切り替えとスキップ判定を行うメイン関数
    function updatePart(prefix, current, next, isSlide) {
        const currentElem = document.getElementById(`${prefix}-${getStateName(current)}`);
        const nextElem = document.getElementById(`${prefix}-${getStateName(next)}`);

        // HTML内の空白や改行を取り除いた純粋なテキストを比較
        const currentText = currentElem.textContent.replace(/\s+/g, '');
        const nextText = nextElem.textContent.replace(/\s+/g, '');

        // 現在と次のテキストが同一の場合、アニメーションを発生させずに裏で状態だけ切り替える
        if (currentText === nextText) {
            currentElem.classList.remove('active', 'enter-down', 'exit-down');
            nextElem.classList.add('active');
            return; // ここで終了
        }

        // テキストが異なる場合は指定のアニメーションを実行
        if (isSlide) {
            slideText(currentElem, nextElem);
        } else {
            fadeText(currentElem, nextElem);
        }
    }

    // 上から下へのスライド切替関数
    function slideText(currentElem, nextElem) {
        currentElem.classList.remove('active', 'enter-down', 'exit-down');
        nextElem.classList.remove('active', 'enter-down', 'exit-down');

        // 強制リフロー（アニメーション再実行のため）
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

    // フェードインアウト切替関数
    function fadeText(currentElem, nextElem) {
        currentElem.classList.remove('active');
        nextElem.classList.add('active');
    }
});