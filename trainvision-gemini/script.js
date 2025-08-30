document.addEventListener('DOMContentLoaded', () => {
    // 駅のデータ (例として数駅のみ)
    const stations = [
        { name: "熱海", code: "CA00", isCurrent: false },
        { name: "三島", code: "CA01", isCurrent: false },
        { name: "沼津", code: "CA02", isCurrent: false },
        { name: "片浜", code: "CA03", isCurrent: false },
        { name: "原", code: "CA04", isCurrent: false },
        { name: "東田子の浦", code: "CA05", isCurrent: false },
        { name: "吉原", code: "CA06", isCurrent: false },
        { name: "岳南電車", code: "CA07", isCurrent: false },
        { name: "静岡", code: "CA17", isCurrent: true } // 現在の駅
    ];

    const currentStationDisplay = document.querySelector('.current-station');
    const currentStationCodeDisplay = document.querySelector('.header .station-code .code-number');
    const stationListContainer = document.querySelector('.station-list');
    const trackLine = document.querySelector('.track-line');
    const stationTrack = document.querySelector('.station-track');

    // 現在の駅を見つける
    let currentStationIndex = stations.findIndex(station => station.isCurrent);
    if (currentStationIndex === -1) {
        currentStationIndex = 0; // 見つからない場合は最初の駅を現在地とする
    }

    // 駅リストとマーカーを動的に生成
    function renderStations() {
        stationListContainer.innerHTML = '';
        stationTrack.innerHTML = '<div class="track-line"></div>'; // トラックラインを再描画

        stations.forEach((station, index) => {
            // 駅名の表示
            const stationItem = document.createElement('div');
            stationItem.classList.add('station-item');

            const stationName = document.createElement('div');
            stationName.classList.add('station-name');
            stationName.textContent = station.name;
            stationItem.appendChild(stationName);

            // モバイル向けに短い駅名を表示
            if (station.name.length > 5) { // 適当な文字数で判断
                const stationNameSmall = document.createElement('div');
                stationNameSmall.classList.add('station-name-small');
                stationNameSmall.textContent = station.name.substring(0, 3) + '...'; // 例として最初の3文字
                stationItem.appendChild(stationNameSmall);
            }


            const stationCode = document.createElement('div');
            stationCode.classList.add('station-code');
            stationCode.innerHTML = `CA<span class="code-number">${station.code.slice(2)}</span>`;
            stationItem.appendChild(stationCode);

            stationListContainer.appendChild(stationItem);

            // トラックマーカーの表示
            const marker = document.createElement('div');
            marker.classList.add('station-marker');
            // マーカーの位置を計算 (均等に配置)
            marker.style.left = `${(index / (stations.length - 1)) * 100}%`;
            if (index === currentStationIndex) {
                marker.classList.add('current');
            }
            stationTrack.appendChild(marker);
        });

        // 現在の駅情報をヘッダーに設定
        const currentStationData = stations[currentStationIndex];
        currentStationDisplay.textContent = currentStationData.name;
        currentStationCodeDisplay.textContent = currentStationData.code.slice(2);

        // 進捗バーの更新
        updateTrackProgress();
    }

    function updateTrackProgress() {
        const progress = (currentStationIndex / (stations.length - 1));
        trackLine.style.transform = `scaleX(${progress})`;

        // 現在の駅マーカーを更新
        const markers = document.querySelectorAll('.station-marker');
        markers.forEach((marker, index) => {
            if (index === currentStationIndex) {
                marker.classList.add('current');
            } else {
                marker.classList.remove('current');
            }
        });
    }

    // 初期レンダリング
    renderStations();

    // 進行状況をシミュレートする関数 (例: 5秒ごとに次の駅へ移動)
    let intervalId = setInterval(() => {
        if (currentStationIndex < stations.length - 1) {
            currentStationIndex++;
            updateTrackProgress();
            const currentStationData = stations[currentStationIndex];
            currentStationDisplay.textContent = currentStationData.name;
            currentStationCodeDisplay.textContent = currentStationData.code.slice(2);
        } else {
            // 終点に到達したら最初に戻るか、停止する
            clearInterval(intervalId);
            // オプション: 最初に戻る
            // currentStationIndex = 0;
            // renderStations();
            // intervalId = setInterval(..., 5000);
        }
    }, 5000); // 5秒ごとに更新

    // ウィンドウのリサイズ時に駅リストのレイアウトを調整 (モバイル対応)
    window.addEventListener('resize', () => {
        // 必要に応じて再描画ロジックをここに記述
        // 例: station-name-small の表示/非表示を再評価するなど
    });
});
