# NuStage BA — Design System Reference

> Referência completa de tipografia, cores, tokens CSS, ícones e componentes do NuStage BA.
> Use este documento como base para qualquer novo desenvolvimento visual do projeto.

---

## Sumário

1. [Fontes](#1-fontes)
2. [Tokens CSS](#2-tokens-css)
3. [Paleta de Cores](#3-paleta-de-cores)
4. [Tipografia](#4-tipografia)
5. [Sombras & Border Radius](#5-sombras--border-radius)
6. [Ícones](#6-ícones)
7. [Componentes](#7-componentes)
8. [Layout & Sidebar](#8-layout--sidebar)
9. [Padrões de Animação](#9-padrões-de-animação)
10. [Boas Práticas](#10-boas-práticas)
11. [Regras de Tema Dark](#11-regras-de-tema-dark--boas-práticas)
12. [Apps Script — Considerações Especiais](#12-apps-script--considerações-especiais)
13. [Componentes — Estado Atual](#13-componentes--estado-atual-do-projeto)

---

## 1. Fontes

### Importação (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

### Famílias

| Variável CSS       | Fonte            | Uso                                        |
|--------------------|------------------|--------------------------------------------|
| `--font-body`      | DM Sans          | Toda a interface — corpo, labels, botões   |
| `--font-mono`      | JetBrains Mono   | Código, valores técnicos, IDs, contadores  |

### Pesos disponíveis — DM Sans

| Peso | Label      |
|------|------------|
| 100  | Thin       |
| 200  | ExtraLight |
| 300  | Light      |
| 400  | Regular    |
| 500  | Medium     |
| 600  | SemiBold   |
| 700  | Bold       |
| 800  | ExtraBold  |
| 900  | Black      |

---

## 2. Tokens CSS

Defina todos os tokens em `:root`. **Nunca use valores hardcoded** — sempre referencie as variáveis CSS.

```css
:root {
  /* ── Backgrounds ── */
  --bg-primary:       #f4f5f7;
  --bg-card:          #ffffff;
  --bg-card-hover:    #f0f0f5;
  --bg-input:         #f7f7fa;
  --bg-surface:       #f9f9fc;

  /* ── Borders ── */
  --border:           #e2e2ea;
  --border-focus:     #820AD1;

  /* ── Texto ── */
  --text-primary:     #1a1a2e;
  --text-secondary:   #5a5a70;
  --text-muted:       #9090a0;

  /* ── Brand Purple ── */
  --accent-purple:      #820AD1;
  --accent-purple-light:#9b2fe8;
  --accent-purple-dim:  rgba(130, 10, 209, 0.08);

  /* ── Brand Green ── */
  --accent-green:       #00A868;
  --accent-green-light: #00c078;
  --accent-green-dim:   rgba(0, 168, 104, 0.08);

  /* ── Semânticas ── */
  --warning:          #d97706;
  --warning-dim:      rgba(217, 119, 6, 0.08);
  --danger:           #dc2626;
  --danger-dim:       rgba(220, 38, 38, 0.08);

  /* ── Sidebar (dark) ── */
  --sidebar-bg:           #06000f;
  --sidebar-text:         #c8b8e8;
  --sidebar-text-muted:   #5a4a72;
  --sidebar-border:       rgba(130,10,209,0.18);
  --sidebar-hover:        rgba(130,10,209,0.18);

  /* ── Tipografia ── */
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* ── Border Radius ── */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;

  /* ── Sombras ── */
  --shadow:    0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.12);

  /* ── Transição padrão ── */
  --transition: all 0.2s ease;
}
```

---

## 3. Paleta de Cores

### Brand Purple

| Token / Nome   | Hex                        | Uso principal                           |
|----------------|----------------------------|-----------------------------------------|
| Purple 900     | `#3a0a80`                  | Fundos hero escuros                     |
| Purple 800     | `#5a0aaa`                  | Gradientes de destaque                  |
| Purple 700     | `#820AD1` (`--accent-purple`) | Cor primária da marca — CTAs, links  |
| Purple 600     | `#9B3FE0` / `--accent-purple-light` | Hover states, destaques         |
| Purple 400     | `#b06aff`                  | Elementos sutis, ícones decorativos     |
| Purple 200     | `#d8a8ff`                  | Texto em backgrounds escuros            |
| Purple Dim     | `rgba(130,10,209,0.08)` (`--accent-purple-dim`) | Fundo de badges, estados focus |

### Semânticas

| Nome         | Hex        | Uso                              |
|--------------|------------|----------------------------------|
| Success      | `#00A868`  | Concluído, on track, aprovado    |
| Success Light| `#00c078`  | Hover de elementos de sucesso    |
| Warning      | `#d97706`  | Atenção, prazo próximo           |
| Danger       | `#dc2626`  | Erro, atrasado, em risco         |
| Info / Blue  | `#3B82F6`  | Informação, status neutro        |

### Cores de Papel (Role Colors)

| Papel                 | Cor        | Hex        |
|-----------------------|------------|------------|
| Product Ops           | Pink       | `#FF0084`  |
| Business Analyst      | Purple     | `#C778FF`  |
| Automation Architect  | Blue       | `#3B82F6`  |
| Developer             | Orange     | `#F97316`  |

### UI / Backgrounds

| Token CSS           | Hex        | Uso                                      |
|---------------------|------------|------------------------------------------|
| `--bg-primary`      | `#f4f5f7`  | Fundo geral da página                    |
| `--bg-card`         | `#ffffff`  | Cards, painéis, modais                   |
| `--bg-card-hover`   | `#f0f0f5`  | Estado hover de cards                    |
| `--bg-input`        | `#f7f7fa`  | Campos de formulário                     |
| `--bg-surface`      | `#f9f9fc`  | Superfícies secundárias dentro de cards  |

### Sidebar (dark theme)

| Token                  | Valor                       |
|------------------------|-----------------------------|
| `--sidebar-bg`         | `#06000f`                   |
| `--sidebar-text`       | `#c8b8e8`                   |
| `--sidebar-text-muted` | `#5a4a72`                   |
| `--sidebar-border`     | `rgba(130,10,209,0.18)`     |

---

## 4. Tipografia

### Escala tipográfica

| Nome        | Tamanho | Peso | Letter Spacing | Line Height | Uso principal                     |
|-------------|---------|------|----------------|-------------|-----------------------------------|
| Display     | 64px    | 900  | -2px           | 1.0         | Hero de landing, tela inicial     |
| H1          | 48px    | 800  | -1.5px         | 1.1         | Título principal de página        |
| H2          | 36px    | 700  | -1px           | 1.15        | Seções e dashboards               |
| H3          | 24px    | 700  | -0.5px         | 1.2         | Subseções, card titles            |
| H4          | 18px    | 600  | -0.2px         | 1.3         | Rótulos de grupo, item destacado  |
| Body Large  | 16px    | 400  | 0              | 1.65        | Parágrafos de destaque            |
| Body        | 14px    | 400  | 0              | 1.6         | Texto corrido padrão              |
| Small       | 12px    | 500  | 0              | 1.5         | Metadados, labels secundárias     |
| Caption     | 11px    | 600  | 1.5px          | 1.4         | Badges, tags em maiúsculas        |

### Padrões de uso

```css
/* Título de seção */
font-size: 28px;
font-weight: 800;
letter-spacing: -0.8px;
color: var(--text-primary);

/* Eyebrow / tag de seção */
font-size: 11px;
font-weight: 800;
letter-spacing: 2.5px;
text-transform: uppercase;
color: var(--accent-purple);

/* Label de subsection */
font-size: 11px;
font-weight: 700;
letter-spacing: 1.5px;
text-transform: uppercase;
color: var(--text-muted);

/* Valor de KPI (mono) */
font-family: var(--font-mono);
font-size: 24–28px;
font-weight: 900;
color: <cor semântica>;

/* Texto de insight/legenda */
font-size: 11px;
font-weight: 500;
color: var(--text-secondary);
line-height: 1.4;
```

### JetBrains Mono — usos recomendados

- Valores numéricos em KPI cards
- IDs de ticket (ex: `RPAS-1042`)
- Versões e hashes (ex: `v2.4.1`, `sha: a3f9c1d`)
- Tokens CSS no design system
- Percentuais e métricas técnicas

---

## 5. Sombras & Border Radius

### Border Radius

| Token         | Valor  | Uso                                        |
|---------------|--------|--------------------------------------------|
| `--radius-sm` | 6px    | Badges, chips, elementos pequenos, inputs  |
| `--radius-md` | 10px   | Cards, botões, painéis                     |
| `--radius-lg` | 14px   | Modais, containers grandes, hero cards     |
| Full          | 9999px | Pills, avatares, contadores                |

### Sombras

| Token / Nome      | Valor CSS                                                   | Uso                          |
|-------------------|-------------------------------------------------------------|------------------------------|
| `--shadow`        | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`   | Cards, inputs padrão         |
| `--shadow-lg`     | `0 4px 16px rgba(0,0,0,0.12)`                               | Modais, dropdowns, hover     |
| Purple glow sm    | `0 0 16px rgba(130,10,209,0.25)`                            | Foco / hover ativo           |
| Purple glow lg    | `0 0 40px rgba(130,10,209,0.35)`                            | CTAs, elementos destacados   |

---

## 6. Ícones

**Biblioteca:** [Lucide React](https://lucide.dev) — `import { IconName } from 'lucide-react'`

### Tamanhos padrão

| Contexto                     | Tamanho |
|------------------------------|---------|
| Ícone inline em texto        | 14px    |
| Botão / label de navegação   | 16px    |
| Card header                  | 18px    |
| Hero / destaque de seção     | 22–28px |
| Placeholder / empty state    | 32–40px |

### Ícones por categoria

#### Navegação
`Home`, `ArrowLeft`, `ArrowRight`, `ChevronRight`, `ChevronDown`, `ChevronUp`, `X`, `Menu`, `MoreVertical`

#### Ações
`Plus`, `Trash2`, `Copy`, `Settings`, `Search`, `Upload`, `Download`, `Edit`, `Save`, `Link`, `ExternalLink`, `RefreshCw`

#### Status & Alertas
`CheckCircle2`, `AlertCircle`, `AlertTriangle`, `Info`, `HelpCircle`, `Loader`, `Lock`, `Unlock`, `Shield`, `ShieldAlert`

#### Arquivos & Conteúdo
`FileText`, `FileCode2`, `FileSearch`, `Clipboard`, `ClipboardList`, `History`, `Bookmark`, `Tag`

#### Tempo & Planejamento
`Calendar`, `Clock`, `Target`, `TrendingUp`, `TrendingDown`, `BarChart3`, `Sigma`, `Gauge`

#### Pessoas & Times
`User`, `Users`, `UserPlus`, `UserCheck`, `Briefcase`, `Construction`

#### Tecnologia
`Cpu`, `Server`, `GitBranch`, `Workflow`, `Cog`, `Globe`, `Layers`, `Database`, `Terminal`, `Code2`

#### Produto & Negócio
`Rocket`, `Zap`, `Compass`, `LayoutDashboard`, `MessageSquare`, `ListChecks`, `Map`, `Crosshair`, `Activity`

---

## 7. Componentes

### Botões

```css
/* Primary */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--accent-purple);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-body);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 14px rgba(130,10,209,0.35);
}
.btn-primary:hover { background: var(--accent-purple-light); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Secondary */
.btn-secondary {
  /* mesmo padding/border-radius */
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.btn-secondary:hover { border-color: var(--accent-purple); color: var(--accent-purple); }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.btn-ghost:hover { background: var(--bg-card-hover); border-color: var(--accent-purple); color: var(--accent-purple); }

/* Danger */
.btn-danger {
  background: var(--danger-dim);
  border: 1px solid rgba(220,38,38,0.25);
  color: var(--danger);
}
```

### Status Badges

```css
/* Padrão reutilizável */
.badge {
  display: inline-flex;
  align-items: center;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 2px 8px;
  border-radius: 9999px;
  white-space: nowrap;
  /* color, background, border definidos por contexto: */
  color: <cor>;
  background: <cor>12;
  border: 1px solid <cor>35;
}
```

| Label         | Cor referência        |
|---------------|-----------------------|
| Concluído     | `--accent-green`      |
| On Track      | `--accent-green`      |
| Em andamento  | `--accent-purple`     |
| Atenção       | `--warning`           |
| Atrasado      | `--danger`            |
| Em Risco      | `--danger`            |
| Backlog       | `--text-secondary`    |

### Fases NuStage

```tsx
// F1 → F6 com profundidade crescente de purple
const colors = ['#b06aff', '#9B3FE0', '#820AD1', '#6a0ab0', '#5a0aaa', '#3a0a80'];

<span style={{
  fontSize: 13, fontWeight: 800,
  padding: '6px 18px', borderRadius: 9999,
  border: '1px solid',
  background: `${colors[i]}18`,
  color: colors[i],
  borderColor: `${colors[i]}40`,
}}>
  F{i + 1}
</span>
```

### KPI Card

```tsx
// Padrão: borda lateral colorida, ícone com fundo, valor mono grande
<div style={{
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '16px 18px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-card)',
  border: `1px solid var(--border)`,
  borderLeft: `3px solid ${color}`,       // ← acento visual por categoria
  boxShadow: 'var(--shadow)',
  transition: 'var(--transition)',
}}>
  {/* Ícone */}
  <div style={{
    width: 42, height: 42,
    borderRadius: 'var(--radius-sm)',
    background: `${color}18`,
    border: `1px solid ${color}28`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color,
  }}>{icon}</div>

  {/* Conteúdo */}
  <div>
    <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>{label}</div>
    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginTop: 3 }}>{insight}</div>
  </div>
</div>
```

### Section Card

```tsx
// Card com topo colorido por categoria, sombra e header distinto
<div style={{
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderTop: `2px solid ${color}`,         // ← identidade por categoria no topo
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow)',
  overflow: 'hidden',
}}>
  {/* Header */}
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
    background: `${color}06`,              // ← tint levíssimo
  }}>
    {/* Icon container */}
    <div style={{
      width: 24, height: 24,
      borderRadius: 6,
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color,
    }}>{icon}</div>
    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>{title}</span>
    {action}
  </div>

  {/* Body */}
  <div style={{ padding: 16 }}>{children}</div>
</div>
```

### Section Header (Faixa separadora)

```tsx
// Separador visual entre grandes blocos de conteúdo
<div style={{
  display: 'flex', alignItems: 'flex-start', gap: 12,
  marginBottom: 16, paddingBottom: 12,
  borderBottom: '1px solid var(--border)',
}}>
  {/* Barra lateral colorida — varia por contexto */}
  <div style={{
    width: 3, minHeight: 36,
    borderRadius: 4,
    background: color,              // ex: var(--accent-purple), var(--accent-green), #3B82F6
    flexShrink: 0, marginTop: 2,
  }} />
  <div>
    <h2 style={{
      fontSize: 12, fontWeight: 800,
      color: 'var(--text-primary)',
      textTransform: 'uppercase',
      letterSpacing: '1.2px',
      margin: 0,
    }}>{title}</h2>
    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.5 }}>{subtitle}</p>
  </div>
</div>
```

### Hero / Section Hero (dark)

```tsx
// Padrão de hero escuro com gradiente purple, grid hexagonal e glow
<div style={{
  position: 'relative', overflow: 'hidden',
  background: 'linear-gradient(135deg, #06000f 0%, #0e0028 30%, #1e0050 65%, #3a0a80 100%)',
  borderRadius: 'var(--radius-lg)',
  minHeight: 160,
}}>
  {/* Orbs de luz */}
  <div style={{
    position: 'absolute', width: 250, height: 250, borderRadius: '50%',
    top: -80, right: 60,
    background: 'rgba(130,10,209,0.3)',
    filter: 'blur(70px)',
  }} />

  {/* Grid hexagonal */}
  <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
    <defs>
      <pattern id="hexPat" width="60" height="52" patternUnits="userSpaceOnUse">
        <polygon points="30,1 59,16 59,36 30,51 1,36 1,16"
          fill="none" stroke="rgba(176,106,255,0.07)" strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hexPat)" />
  </svg>

  {/* Conteúdo */}
  <div style={{ position: 'relative', zIndex: 2, padding: '32px 36px' }}>
    {/* Eyebrow */}
    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8 }}>
      {eyebrow}
    </div>
    {/* Título com gradiente */}
    <h2 style={{
      fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 900,
      letterSpacing: '-1.5px', lineHeight: 1.1, margin: 0,
      background: 'linear-gradient(135deg, #ffffff 0%, #C778FF 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    }}>{title}</h2>
    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', lineHeight: 1.6 }}>{subtitle}</p>
  </div>
</div>
```

### Form Inputs

```css
.form-input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  font-size: 13px;
  font-family: var(--font-body);
  color: var(--text-primary);
  outline: none;
  transition: var(--transition);
}
.form-input:focus {
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 3px var(--accent-purple-dim);
}

/* Variante mono (para IDs, tokens) */
.form-input.mono { font-family: var(--font-mono); }

label.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
```

### Cards de conteúdo

```css
/* Padrão */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow);
}

/* Accent (hero, CTA) */
.card-accent {
  background: linear-gradient(135deg, #820AD1 0%, #5a0aaa 100%);
  border: none;
}

/* Success */
.card-success {
  background: rgba(0,168,104,0.04);
  border-color: rgba(0,168,104,0.2);
}
```

---

## 8. Layout & Sidebar

### Estrutura principal

```
┌─────────────────────────────────────────────┐
│  .app-container  (display: flex, h: 100%)    │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Sidebar │  │  Drawer  │  │  .app-main │ │
│  │  Primary │  │ (groups) │  │  (content) │ │
│  │  64px    │  │  200px   │  │  flex: 1   │ │
│  └──────────┘  └──────────┘  └────────────┘ │
└─────────────────────────────────────────────┘
```

### Sidebar

- **Fundo:** `linear-gradient(180deg, #060010 0%, #0e0025 30%, #180040 65%, #240555 100%)`
- **Borda direita:** `1px solid rgba(130,10,209,0.2)` com pseudo-elemento gradiente
- **Largura collapsed:** 64px (icon rail)
- **Largura expanded:** 220px
- **Transição:** `cubic-bezier(0.22, 1, 0.36, 1)` — 400ms

### Topbar

```css
.app-topbar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}
```

### Área de conteúdo

```css
.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
```

---

## 9. Padrões de Animação

### Keyframes globais

```css
/* Pulsar (ponto de status ao vivo) */
@keyframes nustage-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.85); }
}

/* Giro (loading) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Drift de orb de luz */
@keyframes home-orb-drift {
  0%   { transform: translate(0, 0) scale(1); }
  100% { transform: translate(20px, -15px) scale(1.05); }
}

/* Partícula flutuante */
@keyframes float-particle {
  0%, 100% { transform: translateY(0px); opacity: 0.4; }
  50%       { transform: translateY(-6px); opacity: 0.8; }
}
```

### Hover padrão em cards

```css
/* Elevação suave ao hover */
transition: var(--transition);
transform: translateY(-2px) a -3px;
box-shadow: var(--shadow-lg);
```

### Loading spinner

```tsx
<Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-purple)' }} />
```

---

## 10. Boas Práticas

### ✅ Faça

- Use **sempre** variáveis CSS (`var(--token)`) — nunca valores hardcoded
- Use `var(--font-body)` em todos os elementos de texto
- Use `var(--font-mono)` para valores numéricos, IDs e código
- Aplique `var(--shadow)` em cards e `var(--shadow-lg)` em modais/dropdowns
- Use `borderLeft: 3px solid <cor>` para indicar categoria/estado em cards
- Use `borderTop: 2px solid <cor>` para dar identidade de categoria a section cards
- Aplique `transition: var(--transition)` em elementos interativos
- Use `letter-spacing: 1.2–2.5px` + `text-transform: uppercase` em labels/eyebrows
- Componha gradientes de background com `#06000f → #1e0050 → #3a0a80` para heroes escuros
- Use grid hexagonal SVG como padrão decorativo de fundo em heroes

### ❌ Evite

- Valores de cor hardcoded no JSX/TSX sem necessidade
- Sombras sem `var(--shadow)` como base
- Font-size abaixo de 9px (ilegível em qualquer tela)
- Cards sem `border-radius: var(--radius-md)` ou `var(--radius-lg)`
- Botões sem `font-family: var(--font-body)` (herdado, mas confirme em `<button>`)
- Inline `onMouseEnter/onMouseLeave` para hover — prefira CSS classes + `transition`
- Múltiplas cores semânticas inventadas — use apenas as definidas no `:root`

### Hierarquia de cor semântica

```
Estado de alerta:    var(--danger)    #dc2626
Estado de atenção:   var(--warning)   #d97706
Estado ok/positivo:  var(--accent-green) #00A868
Estado neutro/info:  #3B82F6
Ação primária:       var(--accent-purple) #820AD1
Dado de BA:          #C778FF
```

### Opacidades de cor compostas

Use sufixo hexadecimal na cor para transparência sem rgba:

| Opacidade | Sufixo | Uso                         |
|-----------|--------|-----------------------------|
| 4%        | `06`   | Tints de fundo mínimos      |
| 6%        | `0A`   | Fundo de cards de foco      |
| 8%        | `14`   | `--accent-purple-dim`       |
| 10%       | `1A`   | Fundos de ícones            |
| 12%       | `1F`   | Chips, badges leves         |
| 16%       | `29`   | Contornos ativos            |
| 20%       | `33`   | Bordas de estado ativo      |
| 30%       | `4D`   | Bordas de alerta            |

---

## 11. Regras de Tema Dark — Boas Práticas

### Problema comum: fundo transparente

Em componentes que sobrepõem outros (modais, drawers, painéis
laterais, tooltips, dropdowns), **NUNCA** usar `background: white`,
`background: #fff` ou `background: transparent`.

Esses valores funcionam no tema light mas causam transparência
indesejada no tema dark, fazendo o conteúdo de fundo vazar.

### Regra obrigatória para componentes sobrepostos

Qualquer componente que renderiza sobre outro **DEVE** usar:

```css
/* ✅ CORRETO */
background: var(--bg-secondary);   /* modais, drawers, painéis */
background: var(--bg-card);        /* cards internos */
background: var(--bg-input);       /* campos de formulário */
color: var(--text-primary);        /* texto principal */
border: 0.5px solid var(--border); /* bordas */

/* ❌ ERRADO — nunca usar em componentes sobrepostos */
background: white;
background: #fff;
background: #ffffff;
background: transparent;
background-color: white;
```

### Componentes que requerem atenção especial

| Componente | Token correto |
|---|---|
| Modal / Dialog | `var(--bg-secondary)` |
| Drawer / Side panel | `var(--bg-secondary)` |
| Detalhes de solicitação | `var(--bg-secondary)` |
| Dropdown / Select | `var(--bg-secondary)` |
| Tooltip | `var(--bg-secondary)` |
| Card interno | `var(--bg-card)` |
| Input / Textarea / Select | `var(--bg-input)` |
| Overlay de fundo | `var(--bg-overlay)` |

### Exceções permitidas para transparent

Apenas estes elementos podem usar `background: transparent`:
- Botões ghost (`.btn-ghost`)
- Overlays de fundo semitransparente (`.modal-overlay`)
- Elementos decorativos sem conteúdo

### CSS global de proteção (já aplicado no projeto)

O arquivo `src/index.css` contém regras globais que
previnem fundos brancos no tema dark:

```css
[data-theme="dark"] input,
[data-theme="dark"] select,
[data-theme="dark"] textarea {
  background: var(--bg-input, rgba(255,255,255,0.05));
  color: var(--text-primary);
  border-color: var(--border);
}

[data-theme="dark"] option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
```

### Checklist ao criar novo componente

Antes de fazer deploy de qualquer componente novo:

- [ ] Testei no tema dark (`data-theme="dark"`)?
- [ ] Todos os backgrounds usam tokens CSS (`var(--bg-*)`)?
- [ ] Não há valores hardcoded (`#fff`, `white`, `transparent`)?
- [ ] Inputs e selects têm `background: var(--bg-input)`?
- [ ] Textos usam `var(--text-primary)` ou `var(--text-secondary)`?
- [ ] Bordas usam `var(--border)` ou `var(--border-hover)`?

### Tokens legados vs Design System

O projeto migrou de tokens `--color-*` para o design system.
Não usar tokens antigos em código novo:

| Token antigo (legado) | Token correto (design system) |
|---|---|
| `--color-surface` | `var(--bg-secondary)` |
| `--color-surface-raised` | `var(--bg-tertiary)` |
| `--color-surface-hover` | `var(--bg-card-hover)` |
| `--color-ink` | `var(--text-primary)` |
| `--color-ink-muted` | `var(--text-secondary)` |
| `--color-ink-subtle` | `var(--text-muted)` |
| `--color-border` | `var(--border)` |
| `--color-border-strong` | `var(--border-hover)` |
| `--color-bg` | `var(--bg-primary)` |
| `--color-focus-ring` | `var(--purple-dim2)` |

---

## 12. Apps Script — Considerações Especiais

### OAuth e autenticação

- O token `ScriptApp.getOAuthToken()` **NÃO** funciona para
  chamadas `fetch()` diretas à Sheets API do lado do cliente
- Usar sempre `google.script.run` para operações de planilha
- `Session.getActiveUser().getEmail()` retorna apenas o email
- Nome e foto devem ser buscados via People API no `doGet()`

### Componentes que não funcionam no iframe do Apps Script

- `createPortal` do React não funciona no iframe
- Renderizar modais inline, sem portal
- `window.location.reload()` pode causar tela branca
- `localStorage` funciona normalmente

### Deploy

- `npm run save` faz git + build + clasp push + clasp deploy
- A URL do deploy muda a cada `clasp deploy` — sempre usar
  a URL retornada pelo terminal após o deploy
- `Script is already up to date` no clasp push significa que
  o código não mudou — verificar se as alterações foram salvas

---

## 13. Componentes — Estado Atual do Projeto

### Estrutura de arquivos

```
src/
  components/
    Home/
      HeroCarousel.tsx  — carousel 4 temas no hero
    Layout/
      AppLayout.tsx     — layout principal com sidebar
      Topbar.tsx        — topbar com toggle dark/light
      Sidebar.tsx       — sidebar colapsável 64px/220px
    StepForm/           — formulário multi-etapas
    team/
      TeamDrawer.tsx    — drawer lateral de equipe
    ui/
      LoadingScreen.tsx — loading padronizado com logo
  context/
    ThemeContext.tsx    — dark/light mode com localStorage
    AuthContext.tsx     — autenticação OAuth/Apps Script
    ModalContext.tsx    — modais padronizados
  hooks/
    useAdminCheck.ts    — verifica admin via planilha
  lib/
    gasClient.ts        — helper para google.script.run
    sheetsApi.ts        — operações na planilha
  utils/
    deriveRobotTemplates.ts — deriva templates do robô
  pages/
    Home.tsx            — página inicial com carousel
    DashboardPage.tsx   — painel de acompanhamento
    RdrRequestPage.tsx  — nova solicitação (wizard)
    ConfigPage.tsx      — configurações (admin only)
gas/
  Code.js               — doGet, getSolicitacoes, etc.
  appsscript.json       — scopes OAuth e config GAS
```

---

*NuStage BA Design System — Referência atualizada em 10/04/2026*
*Stack: React 18 + TypeScript + Vite (singlefile) — Google Apps Script deploy*
