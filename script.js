document.addEventListener('DOMContentLoaded', () => {
    const stationNameWrapper = document.getElementById('station-name-wrapper');
    let isEnglish = false;

    // 4秒（4000ミリ秒）ごとに日英を切り替える
    setInterval(() => {
        isEnglish = !isEnglish;
        
        if (isEnglish) {
            // クラス 'is-en' を付与して英語表示アニメーションを実行
            stationNameWrapper.classList.add('is-en');
        } else {
            // クラス 'is-en' を外して日本語表示アニメーションを実行
            stationNameWrapper.classList.remove('is-en');
        }
    }, 4000);
});