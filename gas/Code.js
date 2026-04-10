function doGet(e) {
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
