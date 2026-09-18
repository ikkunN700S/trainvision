// キャッシュのバージョン（ファイルを更新したらここを v2, v3... と書き換えることでキャッシュが更新されます）
const CACHE_NAME = 'trainvision-cache-v2';

// キャッシュ対象のファイルリスト（プロジェクト内の必要なファイルをすべて記述）
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './js/script.js',
    './js/version.js',
    './js/sharelink.js',
    './version.json',
    './presets.json',
    './stationpreset.json'
];

// インストール時にファイルをキャッシュする
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 新しいバージョンのSWが有効化されたとき、古いキャッシュを削除する
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// オフライン時のリクエスト処理
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュにファイルがあればそれを返す
                if (response) {
                    return response;
                }
                // キャッシュになければネットワークから取得する
                return fetch(event.request);
            })
    );
});