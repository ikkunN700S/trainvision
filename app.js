fetch('stations.json')
  .then(response => response.json())
  .then(data => {
    const { stations, currentIndex } = data;
    const list = document.getElementById('station-list');
    const nextName = document.getElementById('next-station-name');

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

    // 次の駅を表示（currentIndex + 1）
    if (stations[currentIndex + 1]) {
      nextName.textContent = stations[currentIndex + 1].name;
    } else {
      nextName.textContent = '終点';
    }
  });
