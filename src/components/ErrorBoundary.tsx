import React from "react";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary] Erro não tratado:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "16px",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          <h2 style={{ color: "#820AD1" }}>Algo deu errado</h2>
          <p style={{ color: "#666" }}>
            Recarregue a página ou contate o suporte técnico.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#820AD1",
              color: "#fff",
              border: "none",
              borderRadius: "9999px",
              padding: "10px 24px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
