document.addEventListener('DOMContentLoaded', () => {
    const stJa = document.getElementById('st-ja');
    const stEn = document.getElementById('st-en');
    
    let isEnglish = false;

    // 4秒ごとに日英切り替え
    setInterval(() => {
        if (!isEnglish) {
            // 日本語 → 英語
            switchText(stJa, stEn);
        } else {
            // 英語 → 日本語（同じく上から下へのアニメーションを適用）
            switchText(stEn, stJa);
        }
        isEnglish = !isEnglish;
    }, 4000);

    function switchText(currentElem, nextElem) {
        // 既存のクラスをリセット
        currentElem.classList.remove('active', 'enter-down', 'exit-down');
        nextElem.classList.remove('active', 'enter-down', 'exit-down');

        // リフロー（再描画）を強制してアニメーションを毎回最初から再生させる
        void currentElem.offsetWidth;
        void nextElem.offsetWidth;

        // アニメーション用クラスを付与
        currentElem.classList.add('exit-down');
        nextElem.classList.add('enter-down');

        // アニメーション完了（0.4秒後）に表示状態を保持
        setTimeout(() => {
            currentElem.classList.remove('exit-down');
            nextElem.classList.remove('enter-down');
            nextElem.classList.add('active');
        }, 700);
    }
});