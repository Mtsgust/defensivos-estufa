/* ============================================================
   SNIPPET: baixa automática de estoque
   Cole este bloco dentro da tag <script> do pulverizacoes.html
   e do nutricao.html (logo após "let dados = [];").
   Requer config.js com API_URL (o mesmo que você já usa).
   ============================================================ */

async function baixarEstoque(produtoNome, quantidade, unidade, origem, origemId, obs) {
  try {
    const qtd = parseFloat(String(quantidade).replace(',', '.'));
    if (!produtoNome || !qtd || qtd <= 0) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({
      action: 'movimentar',
      data: { produtoNome, tipo: 'saida', quantidade: qtd, unidade: unidade || '',
              origem: origem || 'manual', origemId: origemId || '', obs: obs || '' }
    })});
  } catch(e) { console.warn('Falha ao dar baixa no estoque:', produtoNome, e); }
}

// Converte mL<->L e g<->kg para a unidade do cadastro do estoque.
// Ex: você aplicou 300 mL mas o estoque está em L -> baixa 0,3 L.
function converterUnidade(qtd, de, para) {
  const n = (u) => String(u||'').toLowerCase();
  if (n(de) === n(para) || !de || !para) return qtd;
  const d = n(de), p = n(para);
  if (d === 'ml' && p === 'l') return qtd / 1000;
  if (d === 'l' && p === 'ml') return qtd * 1000;
  if (d === 'g' && p === 'kg') return qtd / 1000;
  if (d === 'kg' && p === 'g') return qtd * 1000;
  return qtd; // unidades diferentes (ex: un x mL): baixa sem converter
}

/* ---------- USO EM pulverizacoes.html ----------

1) Na função salvar(), troque o trecho final por este
   (para capturar o id e dar baixa só quando for "feito"):

  closeForm();
  let origemId = editandoId;
  if(editandoId){
    await fetch(API_URL, {method:'POST', body: JSON.stringify({tipo:'pulverizacao', action:'update', id: editandoId, data: campos})});
  } else {
    const resp = await fetch(API_URL, {method:'POST', body: JSON.stringify({tipo:'pulverizacao', action:'add', data: campos})});
    try { origemId = (await resp.json()).id || null; } catch(e) {}
  }
  if(campos.status === 'feito'){
    const litros = parseFloat(String(litrosAgua).replace(',','.')) || 0;
    for(const p of produtos){
      const dose100 = parseFloat(String(p.dose100).replace(',','.')) || 0;
      if(dose100 > 0 && litros > 0){
        const gasto = (dose100/100)*litros; // na unidade do form (mL/g/L/kg)
        await baixarEstoque(p.nome, gasto, p.unidade, 'pulverizacao', origemId,
          `Pulverização estufa(s) ${campos.estufa} - ${litros}L água`);
      }
    }
  }
  carregar();

2) Na função marcarFeito(id), troque por esta versão:

async function marcarFeito(id){
  const d = dados.find(x => x.id === id);
  await fetch(API_URL, {method:'POST', body: JSON.stringify({
    tipo:'pulverizacao', action:'update', id,
    data:{ status:'feito', dataExecucao: hojeISO() }
  })});
  if(d){
    try{
      const prods = JSON.parse(d.produto || '[]');
      const litros = parseFloat(String(d.litrosAgua).replace(',','.')) || 0;
      const arr = Array.isArray(prods) ? prods : [{nome:d.produto, dose100:d.dose}];
      for(const p of arr){
        const dose100 = parseFloat(String(p.dose100 ?? '').replace(',','.')) || 0;
        if(dose100 > 0 && litros > 0){
          await baixarEstoque(p.nome, (dose100/100)*litros, p.unidade, 'pulverizacao', id,
            `Pulverização estufa(s) ${d.estufa}`);
        }
      }
    }catch(e){}
  }
  carregar();
}

   ---------- USO EM nutricao.html ----------

1) No dialog, adicione dois campos (quantidade + unidade) abaixo da Dose:

    <div class="row2">
      <div class="field">
        <label>Qtd usada (p/ baixa no estoque)</label>
        <input id="fQtd" type="number" step="any" inputmode="decimal" placeholder="ex: 2">
      </div>
      <div class="field">
        <label>Un.</label>
        <select id="fUnidade">
          <option value="kg">kg</option><option value="g">g</option>
          <option value="L">L</option><option value="mL">mL</option><option value="un">un</option>
        </select>
      </div>
    </div>

2) Em openForm(), adicione: document.getElementById('fQtd').value='';

3) Em salvar(), capture o id e dê baixa quando for "feito":

  closeForm();
  const payloadData = {
    estufa: document.getElementById('fEstufa').value,
    tipoTarefa: document.getElementById('fTipoTarefa').value,
    produto: document.getElementById('fProduto').value,
    dose: document.getElementById('fDose').value,
    obs: document.getElementById('fObs').value,
    status: status,
    dataPrevista: status === 'pendente' ? data : '',
    dataExecucao: status === 'feito' ? data : ''
  };
  const resp = await fetch(API_URL, {method:'POST', body: JSON.stringify({tipo:'nutricao', action:'add', data: payloadData})});
  let nid = null; try { nid = (await resp.json()).id || null; } catch(e) {}
  if(status === 'feito'){
    await baixarEstoque(payloadData.produto,
      document.getElementById('fQtd').value,
      document.getElementById('fUnidade').value,
      'nutricao', nid, `Nutrição estufa ${payloadData.estufa} (${payloadData.tipoTarefa})`);
  }
  carregar();

4) Em marcarFeito(id) da nutrição, pergunte a qtd ou use a dose:

async function marcarFeito(id){
  const d = dados.find(x => x.id === id);
  await fetch(API_URL, {method:'POST', body: JSON.stringify({
    tipo:'nutricao', action:'update', id,
    data:{ status:'feito', dataExecucao: hojeISO() }
  })});
  if(d && d.produto){
    // tenta extrair número da dose ("2kg" -> 2). Se não der, não baixa.
    const m = String(d.dose||'').match(/([\d.,]+)/);
    const qtd = m ? m[1] : '';
    const u = String(d.dose||'').toLowerCase().includes('kg') ? 'kg'
            : String(d.dose||'').toLowerCase().includes('ml') ? 'mL'
            : String(d.dose||'').toLowerCase().match(/\bg\b/) ? 'g'
            : String(d.dose||'').toLowerCase().includes('un') ? 'un' : 'L';
    if(qtd) await baixarEstoque(d.produto, qtd, u, 'nutricao', id, `Nutrição estufa ${d.estufa}`);
  }
  carregar();
}
*/
