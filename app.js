fetch('stations.json')
  .then(response => response.json())
  .then(data => {
    const { stations, currentIndex, trainType, carNumber } = data;

    // 駅表示
    const list = document.getElementById('station-list');
    stations.forEach((station, index) => {
      const stationEl = document.createElement('div');
      stationEl.classList.add('station');
      if (index === currentIndex) {
        stationEl.classList.add('current');
      }

      const nameEl = document.createElement('div');
      nameEl.className = 'station-name';
      nameEl.textContent = station.name;

      const codeBox = document.createElement('div');
      codeBox.className = 'station-code-box';

      const topCode = document.createElement('div');
      topCode.className = 'station-code-top';
      topCode.textContent = station.code;

      const bottomCode = document.createElement('div');
      bottomCode.className = 'station-code-bottom';
      bottomCode.textContent = station.number;

      codeBox.appendChild(topCode);
      codeBox.appendChild(bottomCode);

      stationEl.appendChild(nameEl);
      stationEl.appendChild(codeBox);
      list.appendChild(stationEl);
    });

    // 種別表示
    const typeEl = document.getElementById('train-type');
    typeEl.textContent = trainType.label;
    typeEl.style.backgroundColor = trainType.color;

    // 次の駅
    const nextEl = document.getElementById('next-station-name');
    nextEl.textContent = stations[currentIndex + 1]?.name || '終点';

    // 号車番号
    document.getElementById('car-number').textContent = `${carNumber}号車`;
  });
