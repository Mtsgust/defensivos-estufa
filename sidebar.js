/* Barra lateral compartilhada. A página diz quem está ativo com
   <body data-page="nutricao"> (painel, pulverizacoes, nutricao, estoque, bulario, inicio). */
(function(){
  var S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"';
  var items = [
    ['index.html', 'Painel', 'painel',
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'],
    ['pulverizacoes.html', 'Pulverizações', 'pulverizacoes',
      '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>'],
    ['nutricao.html', 'Nutrição', 'nutricao',
      '<path d="M12 21c-5 0-8-3-8-8 0-6 5-9 14-10-.5 9-2 18-6 18z"/><path d="M12 21c0-6 2-11 6-14"/>'],
    ['estoque.html', 'Estoque', 'estoque',
      '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'],
    ['colheita.html', 'Colheita', 'colheita',
      '<path d="M3 21h18"/><path d="M6 21v-9M12 21V5M18 21v-12"/>'],
    ['bulario.html', 'Bulário', 'bulario',
      '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>']
  ];
  var page = (document.body.getAttribute('data-page') || '').trim().toLowerCase();
  if(!page){
    var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    page = f.indexOf('pulv') === 0 ? 'pulverizacoes'
         : f.indexOf('nutr') === 0 ? 'nutricao'
         : f.indexOf('esto') === 0 ? 'estoque'
         : f.indexOf('bul') === 0 ? 'bulario'
         : f.indexOf('inic') === 0 ? 'inicio' : 'painel';
  }
  var nav = items.map(function(it){
    return '<a href="' + it[0] + '"' + (it[2] === page ? ' class="active"' : '') +
      '><svg ' + S + '>' + it[3] + '</svg>' + it[1] + '</a>';
  }).join('');
  var aside = document.createElement('aside');
  aside.className = 'sb-aside';
  aside.innerHTML =
    '<div class="sb-brand"><div class="sb-logo">E</div>' +
    '<div><b>Estufas</b><small>Controle · Capão Bonito SP</small></div></div>' +
    '<nav class="sb-nav">' + nav + '</nav>' +
    '<div class="sb-foot">v1 · dados da planilha</div>';
  document.body.classList.add('has-sidebar');
  document.body.insertBefore(aside, document.body.firstChild);
})();
