const { execSync } = require('child_process');

try {
  execSync('git add .');

  const diff = execSync('git diff --cached --name-only').toString().trim();

  if (!diff) {
    console.log('✅ Nada para commitar — tudo já está salvo.');
    process.exit(0);
  }

  const files = diff.split('\n').filter(Boolean);
  const names = files
    .slice(0, 5)
    .map(f => f.split('/').pop().replace(/\.(tsx?|css|json|md)$/, ''))
    .join(', ');

  const extra = files.length > 5 ? ` +${files.length - 5}` : '';

  const date = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });

  const message = `chore: ${names}${extra} — ${date}`;

  execSync(`git commit -m "${message}"`);
  console.log(`📦 Commit: ${message}`);

  execSync('git push origin-personal main', { stdio: 'inherit' });
  console.log('✅ Push concluído!');

  console.log('🚀 Fazendo deploy no Apps Script...');
  execSync('bash scripts/build-gas.sh', { stdio: 'inherit' });
  console.log('✅ Tudo concluído!');

} catch (err) {
  if (err.message.includes('nothing to commit')) {
    console.log('✅ Nada para commitar — tudo já está salvo.');
    process.exit(0);
  }
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
