interface EnvConfig {
  googleClientId: string;
  googleApiKey: string;
  sheetId: string;
}

const requiredVars = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_API_KEY',
  'VITE_SHEET_ID',
] as const;

export const getEnvConfig = (): EnvConfig => {
  const missing = requiredVars.filter(
    key => !import.meta.env[key] || import.meta.env[key].includes('your_')
  );

  if (missing.length > 0) {
    console.error(
      '[Config] Variáveis de ambiente ausentes:',
      missing.join(', '),
      '\nConfigure o arquivo .env na raiz do projeto. Veja .env.example.'
    );
  }

  return {
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    googleApiKey:   import.meta.env.VITE_GOOGLE_API_KEY   || '',
    sheetId:        import.meta.env.VITE_SHEET_ID         || '',
  };
};

export const isMissingCredentials = (): boolean => {
  const { googleClientId, googleApiKey } = getEnvConfig();
  return !googleClientId || !googleApiKey ||
         googleClientId.includes('your_') || googleApiKey.includes('your_');
};
