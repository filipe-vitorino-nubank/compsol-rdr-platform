# COMPSOL RDR Platform — Acesso

## URL de acesso (compartilhe esta com o time)

Esta URL **NUNCA muda** — sempre aponta para a versão mais recente:

> **Acesse:** [COMPSOL RDR Platform](https://script.google.com/a/macros/nubank.com.br/s/AKfycbwUBLuNnP0hKeMK6Ju9SdjBYXJPQsMkMEDhwvASYHm8ks79uI_d4GkmfERgLOehLdW3/exec)

```
https://script.google.com/a/macros/nubank.com.br/s/AKfycbwUBLuNnP0hKeMK6Ju9SdjBYXJPQsMkMEDhwvASYHm8ks79uI_d4GkmfERgLOehLdW3/exec
```

## Como funciona

- A URL é fixa e não muda a cada deploy
- Cada `npm run save` atualiza o código mantendo a mesma URL
- O histórico de versões é mantido no Apps Script (Implantar → Gerenciar)

## Para desenvolvedores

```bash
# Deploy completo (git + build + push + deploy)
npm run save

# Isso faz automaticamente:
#   1. git add + commit + push
#   2. npm run build (Vite → HTML único)
#   3. clasp push (envia o código)
#   4. clasp deploy --deploymentId (atualiza mesma URL)
#   5. Exibe a URL no terminal
```

## Histórico de versões

O Apps Script mantém o histórico completo em:

> Editor → Implantar → Gerenciar implantações
