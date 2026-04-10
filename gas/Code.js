function ensureAdminsSheet() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Admins');

    if (!sheet) {
      sheet = ss.insertSheet('Admins');
      sheet.getRange('A1:C1').setValues([['email', 'role', 'ativo']]);
      sheet.getRange('A1:C1').setFontWeight('bold')
           .setBackground('#820AD1').setFontColor('#ffffff');

      var adminEmail = Session.getEffectiveUser().getEmail();
      sheet.getRange('A2:C2').setValues([[adminEmail, 'admin', 'true']]);
      Logger.log('Aba Admins criada: ' + adminEmail);
    }
  } catch(e) {
    Logger.log('Erro ensureAdminsSheet: ' + e.message);
  }
}

function doGet(e) {
  if (e.parameter && e.parameter.page === 'mapa') {
    return HtmlService.createHtmlOutputFromFile('mapa-rdr')
      .setTitle('Mapa Neural — COMPSOL RDR')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  ensureAdminsSheet();

  var userEmail = Session.getActiveUser().getEmail();

  if (!userEmail || !userEmail.endsWith('@nubank.com.br')) {
    return HtmlService.createHtmlOutput(
      '<html><body style="font-family:sans-serif;text-align:center;padding:40px">' +
      '<h2 style="color:#820AD1">Acesso restrito</h2>' +
      '<p>Esta plataforma é exclusiva para colaboradores Nubank.</p>' +
      '<p>Use sua conta @nubank.com.br</p>' +
      '</body></html>'
    ).setTitle('COMPSOL RDR — Acesso Restrito');
  }

  var accessToken = ScriptApp.getOAuthToken();

  var props = PropertiesService.getScriptProperties();
  var config = {
    USER_EMAIL:        userEmail,
    ACCESS_TOKEN:      accessToken,
    TOKEN_EXP:         String(Date.now() + 55 * 60 * 1000),
    SHEET_ID:          props.getProperty('SHEET_ID'),
    GCP_PROJECT_ID:    props.getProperty('GCP_PROJECT_ID'),
    GCP_LOCATION:      props.getProperty('GCP_LOCATION')     || 'us-central1',
    GEMINI_MODEL:      props.getProperty('GEMINI_MODEL')     || 'gemini-2.0-flash-001',
    SLACK_PROXY_URL:   props.getProperty('SLACK_PROXY_URL'),
    SLACK_PROXY_TOKEN: props.getProperty('SLACK_PROXY_TOKEN'),
    SLACK_TEAM_ID:     props.getProperty('SLACK_TEAM_ID'),
    SLACK_DOMAIN:      props.getProperty('SLACK_DOMAIN')     || 'nubank.slack.com',
    GLEAN_URL:         props.getProperty('GLEAN_URL')        || 'https://nubank-prod-be.glean.com/chat',
    GOOGLE_CLIENT_ID:  props.getProperty('GOOGLE_CLIENT_ID'),
    GOOGLE_API_KEY:    props.getProperty('GOOGLE_API_KEY'),
  };

  var userName  = userEmail.split('@')[0];
  var userPhoto = '';

  try {
    var peopleRes = UrlFetchApp.fetch(
      'https://people.googleapis.com/v1/people/me?personFields=names,photos,emailAddresses',
      {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          Accept: 'application/json',
        },
        muteHttpExceptions: true,
      }
    );

    var code = peopleRes.getResponseCode();
    Logger.log('People API status: ' + code);

    if (code === 200) {
      var d = JSON.parse(peopleRes.getContentText());
      Logger.log('People API data: ' + JSON.stringify(d).substring(0, 300));

      var displayName = d.names && d.names[0] && d.names[0].displayName;
      var photoUrl    = d.photos && d.photos[0] && d.photos[0].url;

      if (displayName) userName  = displayName;
      if (photoUrl)    userPhoto = photoUrl;

      Logger.log('Nome: ' + userName + ' | Foto: ' + (userPhoto ? 'ok' : 'vazio'));
    } else {
      Logger.log('People API erro: ' + peopleRes.getContentText().substring(0, 200));
    }
  } catch(e) {
    Logger.log('People API exception: ' + e.message);
  }

  if (!userPhoto || userName === userEmail.split('@')[0]) {
    var profile = getUserProfile_(userEmail);
    if (profile.name)  userName  = profile.name;
    if (profile.photo) userPhoto = profile.photo;
  }

  config.USER_NAME  = userName;
  config.USER_PHOTO = userPhoto;

  var template = HtmlService.createTemplateFromFile('index');
  template.appConfig = JSON.stringify(config);

  return template.evaluate()
    .setTitle('COMPSOL RDR Platform')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getNewToken() {
  return {
    accessToken: ScriptApp.getOAuthToken(),
    exp:         Date.now() + 55 * 60 * 1000,
    email:       Session.getActiveUser().getEmail(),
  };
}

function testAccess() {
  var token   = ScriptApp.getOAuthToken();
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');

  var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '?fields=title';
  var res = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true,
  });

  Logger.log('Status: ' + res.getResponseCode());
  Logger.log('Body: '   + res.getContentText());
  Logger.log('Email: '  + Session.getActiveUser().getEmail());
  Logger.log('Token length: ' + token.length + ' chars');
}

function getEquipeMembers() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss      = SpreadsheetApp.openById(sheetId);
    var sheet   = ss.getSheetByName('Equipe');

    if (!sheet) return { members: [], error: 'Aba Equipe não encontrada' };

    var rows = sheet.getDataRange().getValues();
    var members = rows.slice(1).map(function(row) {
      return {
        id:           row[0] || '',
        name:         row[1] || '',
        display_name: row[2] || '',
        title:        row[3] || '',
        avatar:       row[4] || '',
        is_admin:     row[5] === true || row[5] === 'true' || row[5] === 'TRUE',
        email:        row[6] || '',
      };
    }).filter(function(m) { return m.name || m.email; });

    return { members: members, error: null };
  } catch (e) {
    return { members: [], error: e.message };
  }
}

function getSolicitacoes() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    var data  = sheet.getDataRange().getValues();
    return { rows: data, error: null };
  } catch(e) {
    return { rows: [], error: e.message };
  }
}

function appendSolicitacao(rowData) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    sheet.appendRow(rowData);
    return { success: true, error: null };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function updateSheetCell(sheetRow, sheetCol, value) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    sheet.getRange(sheetRow, sheetCol).setValue(value);
    return { success: true, error: null };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function getSheetHeaders() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    var row   = sheet.getRange(1, 1, 1, 57).getValues()[0];
    return { headers: row, error: null };
  } catch(e) {
    return { headers: [], error: e.message };
  }
}

function writeSheetHeaders(headers) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return { success: true, error: null };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function getEquipeSyncTimestamp() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Equipe');
    if (!sheet) return { timestamp: null, error: 'Aba Equipe não encontrada' };
    var val = sheet.getRange('H1').getValue();
    return { timestamp: val || null, error: null };
  } catch(e) {
    return { timestamp: null, error: e.message };
  }
}

function setEquipeSyncTimestamp(timestamp) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Equipe');
    if (!sheet) return { success: false, error: 'Aba Equipe não encontrada' };
    sheet.getRange('H1').setValue(timestamp);
    return { success: true, error: null };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function checkIsAdmin(email) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Admins');

    if (!sheet) return { isAdmin: false, error: 'Aba Admins não encontrada' };

    var rows = sheet.getDataRange().getValues();
    var found = rows.slice(1).find(function(row) {
      return row[0] && row[0].toString().toLowerCase() === (email || '').toLowerCase()
          && (row[2] === true || row[2] === 'true' || row[2] === 'TRUE');
    });

    return { isAdmin: !!found, error: null };
  } catch (e) {
    return { isAdmin: false, error: e.message };
  }
}

function getUserProfile_(email) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Equipe');
    if (!sheet) return { name: null, photo: null };

    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var rowEmail = (rows[i][6] || '').toString().toLowerCase();
      if (rowEmail === (email || '').toLowerCase()) {
        return {
          name:  rows[i][1] || rows[i][2] || null,
          photo: rows[i][4] || null,
        };
      }
    }
    return { name: null, photo: null };
  } catch(e) {
    Logger.log('getUserProfile_ erro: ' + e.message);
    return { name: null, photo: null };
  }
}
