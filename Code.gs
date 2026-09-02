/**
 * Backend único para os dois apps (Pulverizações e Nutrição).
 * Cada "tipo" grava numa aba diferente da mesma planilha.
 *
 * Como usar:
 * 1. Crie uma Google Sheet nova (pode ser em branco).
 * 2. Extensões > Apps Script, apague o conteúdo e cole este arquivo inteiro.
 * 3. Implantar > Nova implantação > Tipo: App da Web.
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 4. Copie a URL do App da Web (termina em /exec) e cole no config.js dos dois HTMLs.
 */

var SHEETS = {
  pulverizacao: {
    name: 'Pulverizacoes',
    headers: ['id', 'dataCriacao', 'estufa', 'produto', 'alvo', 'dose', 'dataPrevista', 'status', 'dataExecucao', 'obs', 'litrosAgua']
  },
  nutricao: {
    name: 'Nutricao',
    headers: ['id', 'dataCriacao', 'estufa', 'tipoTarefa', 'produto', 'dose', 'dataPrevista', 'status', 'dataExecucao', 'obs']
  },
  bulario: {
    name: 'Bulario',
    headers: ['id', 'dataCriacao', 'nome', 'categoria', 'ingredienteAtivo', 'classeToxicologica', 'dose', 'carencia', 'obs', 'bulaLink']
  }
};

function getSheet_(tipo) {
  var cfg = SHEETS[tipo];
  if (!cfg) throw new Error('tipo inválido: ' + tipo);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(cfg.name);
  if (!sheet) {
    sheet = ss.insertSheet(cfg.name);
    sheet.appendRow(cfg.headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetToJSON_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = values.slice(1);
  return rows
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    })
    .filter(function (obj) { return obj.id; }); // ignora linhas vazias
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var tipo = e.parameter.tipo;
    var sheet = getSheet_(tipo);
    return jsonOut_({ ok: true, data: sheetToJSON_(sheet) });
  } catch (err) {
    return jsonOut_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var tipo = body.tipo;
    var action = body.action;
    var cfg = SHEETS[tipo];
    var sheet = getSheet_(tipo);

    if (action === 'add') {
      var d = body.data || {};
      var id = Utilities.getUuid();
      var now = new Date();
      var row = cfg.headers.map(function (h) {
        if (h === 'id') return id;
        if (h === 'dataCriacao') return now;
        if (h === 'status') return d.status || 'pendente';
        return d[h] || '';
      });
      sheet.appendRow(row);
      return jsonOut_({ ok: true, id: id });
    }

    if (action === 'update') {
      var values = sheet.getDataRange().getValues();
      var headers = values[0];
      var idCol = headers.indexOf('id');
      for (var i = 1; i < values.length; i++) {
        if (values[i][idCol] === body.id) {
          Object.keys(body.data || {}).forEach(function (key) {
            var col = headers.indexOf(key);
            if (col > -1) sheet.getRange(i + 1, col + 1).setValue(body.data[key]);
          });
          return jsonOut_({ ok: true });
        }
      }
      return jsonOut_({ ok: false, error: 'id não encontrado' });
    }

    if (action === 'delete') {
      var values2 = sheet.getDataRange().getValues();
      var idCol2 = values2[0].indexOf('id');
      for (var j = 1; j < values2.length; j++) {
        if (values2[j][idCol2] === body.id) {
          sheet.deleteRow(j + 1);
          return jsonOut_({ ok: true });
        }
      }
      return jsonOut_({ ok: false, error: 'id não encontrado' });
    }

    return jsonOut_({ ok: false, error: 'ação inválida' });
  } catch (err) {
    return jsonOut_({ ok: false, error: err.message });
  }
}
