const CACHE_NAME = 'fkm-energy-v23'; // Mis à jour en v23 pour forcer le rafraîchissement
const ASSETS = [
  'index.html',
  'manifest.json'
];

// 1. Installation du Service Worker et mise en cache des actifs de base
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force le nouveau Service Worker à devenir actif immédiatement
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activation et suppression automatique des anciens caches obsolètes (comme la v1)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Nettoyage de l\'ancien cache obsolète :', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prend le contrôle immédiat des pages ouvertes
  );
});

// 3. Stratégie Réseau d'abord, Cache en secours (Idéal pour les mises à jour fréquentes)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Si le réseau fonctionne, on met à jour le cache dynamiquement et on renvoie la réponse
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // En cas de panne réseau ou mode hors-ligne, on pioche dans le cache
        return caches.match(e.request);
      })
  );
});
