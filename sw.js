// Nome do cache
const CACHE_NAME = 'chatapp-cache-v1';

// Arquivos a serem armazenados em cache
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  // Adicione aqui outros arquivos estáticos importantes (imagens, etc.)
];

// Evento de Instalação: abre o cache e adiciona os arquivos principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Fetch: intercepta as requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta encontrar a resposta no cache
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna a resposta do cache
        // Se não, faz a requisição à rede
        return response || fetch(event.request);
      })
  );
});
