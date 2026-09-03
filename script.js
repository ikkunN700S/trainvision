document.addEventListener('DOMContentLoaded', () => {
    // 駅名（上下スライド）
    const stJa = document.getElementById('st-ja');
    const stEn = document.getElementById('st-en');

    // つぎは / Next（フェード）
    const nextJa = document.getElementById('next-ja');
    const nextEn = document.getElementById('next-en');

    // 種別（フェード）
    const typeJa = document.getElementById('type-ja');
    const typeEn = document.getElementById('type-en');

    // 行先（フェード）
    const destJa = document.getElementById('dest-ja');
    const destEn = document.getElementById('dest-en');
    
    let isEnglish = false;

    // 4秒ごとに日英切り替え
    setInterval(() => {
        if (!isEnglish) {
            // 日本語 → 英語
            slideText(stJa, stEn);
            fadeText(nextJa, nextEn);
            fadeText(typeJa, typeEn);
            fadeText(destJa, destEn);
        } else {
            // 英語 → 日本語
            slideText(stEn, stJa);
            fadeText(nextEn, nextJa);
            fadeText(typeEn, typeJa);
            fadeText(destEn, destJa);
        }
        isEnglish = !isEnglish;
    }, 4000);

    // 上から下へのスライド切替関数（0.7sアニメーション）
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
        }, 700); // 0.7秒後に固定
    }

    // フェードインアウト切替関数（CSS transition 0.7s）
    function fadeText(currentElem, nextElem) {
        currentElem.classList.remove('active');
        nextElem.classList.add('active');
    }
});