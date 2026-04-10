import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { HeroCarousel } from "../components/Home/HeroCarousel";

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, scriptReady, signInWithGoogle } = useAuth();
  const { openChat } = useChat();

  const requireLogin = (location.state as { requireLogin?: boolean } | null)?.requireLogin;

  useEffect(() => {
    if (requireLogin && !isAuthenticated && scriptReady) {
      signInWithGoogle();
    }
  }, [requireLogin, isAuthenticated, scriptReady, signInWithGoogle]);

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="hero-grid-bg" />

        {/* Topbar com tag + status */}
        <div className="hero-topbar">
          <div className="hero-tag">
            <div className="hero-tag-dot" />
            <span className="hero-tag-text">Equipe BOAS &middot; &Aacute;rea do Produto</span>
          </div>
          <div className="hero-status-bar">
            <div className="hero-status-item">
              <div className="hero-status-dot" style={{ background: 'var(--success, #22c55e)' }} />
              <span>UiPath Operacional</span>
            </div>
            <div className="hero-status-sep" />
            <div className="hero-status-item">
              <div className="hero-status-dot" style={{ background: 'var(--purple-600, #820AD1)' }} />
              <span>Drive Autom&aacute;tico</span>
            </div>
            <div className="hero-status-sep" />
            <div className="hero-status-item">
              <div className="hero-status-dot" style={{ background: 'var(--warning, #f59e0b)' }} />
              <span>Shuffle Monitorar</span>
            </div>
          </div>
        </div>

        {/* Grid principal 2 colunas */}
        <div className="hero-inner">
          {/* Coluna esquerda */}
          <div className="hero-left">
            <h1 className="hero-title">
              RDR Dossiê<br />
              <span className="hero-title-accent">Automação</span>
            </h1>
            <p className="hero-desc">
              Plataforma RPA que automatiza a geração dos dossiês
              enviados ao Banco Central, eliminando o processo manual
              de captura de widgets no Shuffle.
            </p>
            <div className="hero-buttons">
              <button className="btn-hero-primary" onClick={() => navigate("/solicitacao")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Nova Solicitação
              </button>
              <button className="btn-hero-ghost" onClick={() => navigate("/painel")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                Ver Painel
              </button>
            </div>
          </div>

          {/* Coluna direita — Carousel tamanho real */}
          <div className="hero-right">
            <HeroCarousel />
          </div>
        </div>
      </section>

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
                stroke="var(--purple-600)"
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
              style={{ background: "var(--purple-600)" }}
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
