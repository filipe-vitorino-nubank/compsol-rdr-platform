import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { sendGeminiMessage, type ChatMessage, type ChatAttachment } from "../../services/geminiService";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

type ChatMode = null | "gemini" | "glean";

const SUGGESTIONS = [
  "Quando usar Bloqueio Cautelar?",
  "O que é TFO Concluído pelo Nubank?",
  "Diferença entre Victim e Fraudster?",
  "Como preencher o campo de contestação?",
];

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/x-matroska",
  "video/quicktime",
  "application/pdf",
  "text/plain",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/opus",
  "audio/aac",
  "audio/flac",
  "audio/x-pcm",
];

function maxSizeMb(mimeType: string): number {
  if (mimeType.startsWith("video/")) return 50;
  if (mimeType.startsWith("audio/")) return 25;
  return 10;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usePageContext, setUsePageContext] = useState(true);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, getAccessTokenForSheets } = useAuth();
  const feedbackModal = useModal();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!showAttachMenu) return;
    const handler = (ev: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(ev.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAttachMenu]);

  const handleClose = () => {
    setMessages([]);
    setAttachments([]);
    setInput("");
    setMode(null);
    setOpen(false);
  };

  const handleFabClick = () => {
    if (open) handleClose();
    else setOpen(true);
  };

  const handleSelectGlean = () => {
    const w = 460;
    const h = 680;
    const left = window.screen.width - w - 20;
    const top = window.screen.height - h - 60;
    const gleanUrl = import.meta.env.VITE_GLEAN_URL || "https://nubank-prod-be.glean.com/chat";
    window.open(
      gleanUrl,
      "GleanChat",
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,toolbar=no,menubar=no,location=no`,
    );
    setOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const added: ChatAttachment[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        feedbackModal.error("Tipo não suportado", `O arquivo "${file.name}" não é suportado. Use imagem, vídeo, áudio, PDF ou TXT.`);
        continue;
      }
      const limit = maxSizeMb(file.type);
      if (file.size > limit * 1024 * 1024) {
        feedbackModal.error("Arquivo muito grande", `O arquivo "${file.name}" excede o limite de ${limit}MB.`);
        continue;
      }

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });

      added.push({ name: file.name, mimeType: file.type, data: base64 });
    }

    setAttachments((prev) => [...prev, ...added]);
    e.target.value = "";
  };

  const handleGoogleDrivePick = () => {
    setShowAttachMenu(false);

    const loadAndPick = async () => {
      const accessToken = await getAccessTokenForSheets({ interactive: false });

      await new Promise<void>((resolve) => {
        if ((window as any).gapi?.client) {
          resolve();
          return;
        }
        (window as any).gapi.load("picker", () => resolve());
      });

      const google = (window as any).google;
      const picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setCallback(async (data: { action: string; docs?: { id: string; name: string; mimeType: string }[] }) => {
          if (data.action === google.picker.Action.PICKED && data.docs?.[0]) {
            const doc = data.docs[0];
            try {
              const res = await fetch(
                `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                { headers: { Authorization: `Bearer ${accessToken}` } },
              );
              const blob = await res.blob();
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(",")[1];
                setAttachments((prev) => [
                  ...prev,
                  { name: doc.name, mimeType: doc.mimeType, data: base64 },
                ]);
              };
              reader.readAsDataURL(blob);
            } catch {
              feedbackModal.error("Erro no Google Drive", "Não foi possível baixar o arquivo do Drive. Tente novamente.");
            }
          }
        })
        .build();

      picker.setVisible(true);
    };

    loadAndPick();
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setLoading(true);

    try {
      const accessToken = await getAccessTokenForSheets({ interactive: false });
      const reply = await sendGeminiMessage(next, usePageContext, accessToken);
      setMessages((prev) => [...prev, { role: "model", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Desculpe, ocorreu um erro. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return createPortal(
    <>
      {/* Panel */}
      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <span className="chat-title">
                  {mode === "gemini" ? "Gemini" : "Assistente COMPSOL"}
                </span>
                <span className="chat-subtitle">
                  {mode === "gemini" ? "Google Gemini 2.0 Flash" : "Escolha um assistente"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {mode === "gemini" && messages.length > 0 && (
                <button
                  type="button"
                  className="chat-icon-btn"
                  onClick={() => { setMessages([]); setAttachments([]); }}
                  title="Nova conversa"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" opacity="0.4" />
                    <path d="M17 8H7c-1.1 0-2 .9-2 2v10l3-3h9c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2z" />
                  </svg>
                </button>
              )}
              <button type="button" className="chat-icon-btn" onClick={handleClose} title="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mode selector */}
          {!mode && (
            <div className="chat-selector">
              <p className="chat-selector-label">Como posso ajudar?</p>

              <button
                type="button"
                className="chat-selector-btn"
                onClick={() => setMode("gemini")}
                disabled={!isAuthenticated}
              >
                <div className="chat-selector-icon gemini-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L8 8H2l4.5 4L4 18l8-4 8 4-2.5-6L22 8h-6L12 2z"
                      fill="url(#gemini-grad)"
                    />
                    <defs>
                      <linearGradient id="gemini-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#4285F4" />
                        <stop offset="100%" stopColor="#34A853" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="chat-selector-info">
                  <span className="chat-selector-name">Gemini</span>
                  <span className="chat-selector-desc">
                    {isAuthenticated ? "Chat com IA — contexto COMPSOL disponível" : "Faça login para usar"}
                  </span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <button type="button" className="chat-selector-btn" onClick={handleSelectGlean}>
                <div className="chat-selector-icon glean-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="#5B4FCF" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" stroke="#5B4FCF" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="chat-selector-info">
                  <span className="chat-selector-name">Glean</span>
                  <span className="chat-selector-desc">Busca interna Nubank</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}

          {/* Gemini chat */}
          {mode === "gemini" && (
            <>
              {/* Context toggle */}
              <div className="chat-context-bar">
                <label className="chat-context-toggle">
                  <div className={`toggle-track ${usePageContext ? "active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={usePageContext}
                      onChange={(ev) => setUsePageContext(ev.target.checked)}
                    />
                    <span className="toggle-thumb" />
                  </div>
                  <span className="chat-context-label">Reference current page</span>
                </label>
                <span className="chat-context-hint">
                  {usePageContext ? "Contexto COMPSOL" : "Modo geral"}
                </span>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--purple-400)" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p>Como posso ajudar?</p>
                    {usePageContext && (
                      <div className="chat-suggestions">
                        {SUGGESTIONS.map((s) => (
                          <button key={s} type="button" className="chat-suggestion" onClick={() => setInput(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    {msg.attachments?.length ? (
                      <div className="chat-message-attachments">
                        {msg.attachments.map((att, j) => (
                          <div key={j} className="chat-attachment-sent">
                            {att.mimeType.startsWith("image/") ? (
                              <img
                                src={`data:${att.mimeType};base64,${att.data}`}
                                alt={att.name}
                                className="chat-attachment-img"
                              />
                            ) : (
                              <div className="chat-attachment-file">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {msg.content && (
                      <div className="chat-bubble">
                        {msg.content.split("\n").map((line, j, arr) => (
                          <span key={j}>
                            {line}
                            {j < arr.length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="chat-message model">
                    <div className="chat-bubble chat-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="chat-input-area">
                {attachments.length > 0 && (
                  <div className="chat-attachments-preview">
                    {attachments.map((att, i) => (
                      <div key={i} className="chat-attachment-chip">
                        {att.mimeType === "application/pdf" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        )}
                        <span>{att.name.length > 16 ? att.name.substring(0, 13) + "..." : att.name}</span>
                        <button
                          type="button"
                          className="chip-remove"
                          onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="chat-input-row">
                  <div className="chat-attach-wrapper" ref={attachMenuRef}>
                    <button
                      type="button"
                      className="chat-attach-btn"
                      onClick={() => setShowAttachMenu((v) => !v)}
                      title="Anexar"
                      disabled={loading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>

                    {showAttachMenu && (
                      <div className="chat-attach-menu">
                        <button
                          type="button"
                          className="chat-attach-option"
                          onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                        >
                          <div className="attach-option-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                          <div>
                            <span className="attach-option-title">Upload</span>
                            <span className="attach-option-desc">Arquivo local</span>
                            <span className="attach-option-hint">Imagem · Vídeo · Documento · Áudio</span>
                          </div>
                        </button>

                        {showUrlInput ? (
                          <div className="chat-url-input-row">
                            <input
                              className="chat-url-input"
                              placeholder="Cole a URL do documento..."
                              value={urlValue}
                              onChange={(ev) => setUrlValue(ev.target.value)}
                              autoFocus
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter" && urlValue.trim()) {
                                  setInput((prev) => (prev ? prev + "\n" + urlValue.trim() : urlValue.trim()));
                                  setUrlValue("");
                                  setShowUrlInput(false);
                                  setShowAttachMenu(false);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="chat-url-confirm"
                              onClick={() => {
                                if (urlValue.trim()) {
                                  setInput((prev) => (prev ? prev + "\n" + urlValue.trim() : urlValue.trim()));
                                  setUrlValue("");
                                  setShowUrlInput(false);
                                  setShowAttachMenu(false);
                                }
                              }}
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              className="chat-url-cancel"
                              onClick={() => { setShowUrlInput(false); setUrlValue(""); }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="chat-attach-option"
                            onClick={() => setShowUrlInput(true)}
                          >
                            <div className="attach-option-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                            </div>
                            <div>
                              <span className="attach-option-title">By URL</span>
                              <span className="attach-option-desc">Colar link de documento</span>
                            </div>
                          </button>
                        )}

                        <button
                          type="button"
                          className="chat-attach-option"
                          onClick={handleGoogleDrivePick}
                          disabled={!isAuthenticated}
                        >
                          <div className="attach-option-icon" style={{ background: "rgba(66,133,244,0.1)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2">
                              <path d="M22 12.5V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.5" />
                              <polyline points="16 6 12 2 8 6" />
                              <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                          </div>
                          <div>
                            <span className="attach-option-title">Google Drive</span>
                            <span className="attach-option-desc">Importar do Drive</span>
                          </div>
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mkv,.mov,.pdf,.txt,.mp3,.mpga,.wav,.m4a,.opus,.aac,.flac"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />
                  </div>

                  <textarea
                    className="chat-input"
                    placeholder="Digite ou anexe um arquivo..."
                    value={input}
                    onChange={(ev) => setInput(ev.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={(!input.trim() && attachments.length === 0) || loading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        className={`chat-fab ${open ? "open" : ""}`}
        onClick={handleFabClick}
        title={open ? "Fechar" : "Assistente"}
        style={{ background: "#820AD1" }}
      >
        {!open ? (
          <svg viewBox="64 64 896 896" width="22" height="22" fill="#ffffff">
            <path d="M464 512a48 48 0 1096 0 48 48 0 10-96 0zm200 0a48 48 0 1096 0 48 48 0 10-96 0zm-400 0a48 48 0 1096 0 48 48 0 10-96 0zm661.2-173.6c-22.6-53.7-55-101.9-96.3-143.3a444.35 444.35 0 00-143.3-96.3C630.6 75.7 572.2 64 512 64h-2c-60.6.3-119.3 12.3-174.5 35.9a445.35 445.35 0 00-142 96.5c-40.9 41.3-73 89.3-95.2 142.8-23 55.4-34.6 114.3-34.3 174.9A449.4 449.4 0 00112 714v152a46 46 0 0046 46h152.1A449.4 449.4 0 00510 960h2.1c59.9 0 118-11.6 172.7-34.3a444.48 444.48 0 00142.8-95.2c41.3-40.9 73.8-88.7 96.5-142 23.6-55.2 35.6-113.9 35.9-174.5.3-60.9-11.5-120-34.8-175.6zm-151.1 438C704 845.8 611 884 512 884h-1.7c-60.3-.3-120.2-15.3-173.1-43.5l-8.4-4.5H188V695.2l-4.5-8.4C155.3 633.9 140.3 574 140 513.7c-.4-99.7 37.7-193.3 107.6-263.8 69.8-70.5 163.1-109.5 262.8-109.9h1.7c50 0 98.5 9.7 144.2 28.9 44.6 18.7 84.6 45.6 119 80 34.3 34.3 61.3 74.4 80 119 19.4 46.2 29.1 95.2 28.9 145.8-.6 99.6-39.7 192.9-110.1 262.7z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </button>
    </>,
    document.body,
  );
}
