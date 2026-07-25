// Service worker mínimo — só existe para permitir "instalar" o app.
// Não guarda cache das chamadas ao Google Apps Script, pra sempre puxar dado novo.
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // passa direto, sem cache — mantém os dados sempre atualizados
  return;
});
