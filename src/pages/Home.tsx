import { useNavigate } from "react-router-dom";

export function Home() {
  const navigate = useNavigate();

  const openChat = () => {
    const fab = document.querySelector(".chat-fab") as HTMLButtonElement | null;
    fab?.click();
  };

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-tag">
          <div className="home-tag-dot" />
          <span>COMPSOL · Área do Produto</span>
        </div>

        <h1 className="home-title">
          RDR Dossiê
          <br />
          <span className="home-title-accent">Automação</span>
        </h1>

        <p className="home-subtitle">
          Este projeto de RPA automatiza a geração dos dossiês RDR enviados ao
          Banco Central, substituindo a captura manual de widgets no Shuffle e a
          montagem das evidências em .docx. O robô consolida automaticamente os
          dados dos squads, traduz informações para português, registra data e
          hora de acesso às evidências e, quando possível, bloqueia as tabelas
          geradas para evitar alterações manuais. Com isso, reduzimos tempo de
          resposta e SLA, liberando o time para focar em análises e estratégias
          que suportem nossos OKRs.
        </p>

        <div className="home-btns">
          <button
            className="home-btn-primary"
            onClick={() => navigate("/solicitacao")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Nova Solicitação
          </button>
          <button
            className="home-btn-ghost"
            onClick={() => navigate("/painel")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Ver Painel
          </button>
        </div>
      </section>

      {/* ── Métricas ── */}
      <div className="home-metrics">
        <div className="home-metric">
          <div className="home-metric-value">
            94<span>/dia</span>
          </div>
          <div className="home-metric-label">
            Dossiês processados em média por dia
          </div>
        </div>
        <div className="home-metric">
          <div className="home-metric-value">6.278</div>
          <div className="home-metric-label">
            Reclamações InvOps jan–ago (escopo)
          </div>
        </div>
        <div className="home-metric">
          <div className="home-metric-value">
            ~21<span> min</span>
          </div>
          <div className="home-metric-label">
            Tempo médio manual por dossiê
          </div>
        </div>
        <div className="home-metric">
          <div className="home-metric-value">47</div>
          <div className="home-metric-label">Analistas RDR no processo</div>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <section className="home-content">
        {/* Action cards */}
        <div className="home-section-label">Ações rápidas</div>
        <div className="home-cards">
          <div
            className="home-card"
            onClick={() => navigate("/solicitacao")}
          >
            <div
              className="home-card-icon"
              style={{ background: "var(--purple-dim)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--purple-700)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M12 18v-6" />
                <path d="M9 15h6" />
              </svg>
            </div>
            <div className="home-card-title">Nova solicitação</div>
            <div className="home-card-desc">
              Solicite evidências RDR para casos Mule Account — Fraudster ou
              Victim
            </div>
            <div className="home-card-arrow">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
          </div>

          <div className="home-card" onClick={() => navigate("/painel")}>
            <div
              className="home-card-icon"
              style={{ background: "var(--success-dim)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
            </div>
            <div className="home-card-title">Acompanhar solicitações</div>
            <div className="home-card-desc">
              Visualize pendentes, status do UiPath e documentos gerados no
              Drive
            </div>
            <div className="home-card-arrow">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
          </div>

          <div className="home-card" onClick={openChat}>
            <div
              className="home-card-icon"
              style={{ background: "rgba(59,130,246,0.1)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <div className="home-card-title">Entender o processo</div>
            <div className="home-card-desc">
              Regras de negócio, cenários Fraudster e Victim, trilhas de
              evidência
            </div>
            <div className="home-card-arrow">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status dos sistemas */}
        <div className="home-section-label" style={{ marginTop: 28 }}>
          Status dos sistemas
        </div>

        <div className="home-status-row">
          <div className="home-status-left">
            <div
              className="home-status-dot"
              style={{ background: "var(--success)" }}
            />
            <div>
              <div className="home-status-name">UiPath Orchestrator</div>
              <div className="home-status-desc">
                Performer ativo — processando dossiês InvOps
              </div>
            </div>
          </div>
          <span className="home-status-badge home-status-badge--green">
            Operacional
          </span>
        </div>

        <div className="home-status-row">
          <div className="home-status-left">
            <div
              className="home-status-dot"
              style={{ background: "var(--purple-700)" }}
            />
            <div>
              <div className="home-status-name">Google Drive</div>
              <div className="home-status-desc">
                Pasta RDR - Ops Defense - Complaint Solutions
              </div>
            </div>
          </div>
          <span className="home-status-badge home-status-badge--purple">
            Automático
          </span>
        </div>

        <div className="home-status-row">
          <div className="home-status-left">
            <div
              className="home-status-dot"
              style={{ background: "var(--warning)" }}
            />
            <div>
              <div className="home-status-name">Shuffle API</div>
              <div className="home-status-desc">
                Captura de widgets — dependência externa
              </div>
            </div>
          </div>
          <span className="home-status-badge home-status-badge--amber">
            Monitorar
          </span>
        </div>

        {/* Fluxo TO-BE */}
        <div className="home-section-label" style={{ marginTop: 28 }}>
          Fluxo TO-BE
        </div>
        <div className="home-flow">
          <div className="home-flow-step">
            <div className="home-flow-num">1</div>
            <div className="home-flow-label">Analista solicita</div>
          </div>
          <span className="home-flow-arrow">→</span>
          <div className="home-flow-step">
            <div className="home-flow-num">2</div>
            <div className="home-flow-label">Dispatcher valida</div>
          </div>
          <span className="home-flow-arrow">→</span>
          <div className="home-flow-step">
            <div className="home-flow-num">3</div>
            <div className="home-flow-label">Performer captura widgets</div>
          </div>
          <span className="home-flow-arrow">→</span>
          <div className="home-flow-step">
            <div className="home-flow-num">4</div>
            <div className="home-flow-label">Dossiê .docx gerado</div>
          </div>
          <span className="home-flow-arrow">→</span>
          <div className="home-flow-step">
            <div className="home-flow-num">5</div>
            <div className="home-flow-label">Drive + notif. Slack</div>
          </div>
        </div>
      </section>
    </div>
  );
}
