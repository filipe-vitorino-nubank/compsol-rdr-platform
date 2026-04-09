const PROJECT_ID = import.meta.env.VITE_GCP_PROJECT_ID || '';
const LOCATION   = import.meta.env.VITE_GCP_LOCATION   || 'us-central1';
const MODEL      = import.meta.env.VITE_GEMINI_MODEL    || 'gemini-2.0-flash-001';
const VERTEX_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

export interface ChatAttachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  attachments?: ChatAttachment[];
}

const COMPSOL_SYSTEM = `Você é um assistente especializado na plataforma COMPSOL RDR do Nubank.

Você conhece profundamente:
- Formulário de Solicitação de Evidências RDR
- Trilhas: Customer Security e Inv Ops (Victim / Fraudster)
- Subreasons Victim: Infração Pix, Infração tipo Fraud, Com Contestação, Sem Contestação, Sem dados para Contestação
- Subreasons Fraudster: Regras Preventivas, Bloqueio Cautelar, Desinteresse Comercial, JiggluPuff Externo, JiggluPuff Interno
- Campos: TFO Concluído pelo Nubank, Conta sem saldo, TFO Parcial, Devolução à Origem (BC)
- Status MED: ACATADO, NEGADO, NEGADO PELA POLÍTICA DE AUTO ARQUIVAMENTO
- Devolução: Manual Concluída, Automática Concluída, Sem saldo, Com saldo
- Marcação DICT, Data de notificação ao cliente
- Fluxo completo do dossiê RDR com Google Sheets e UiPath

Responda sempre em português brasileiro de forma clara e objetiva.`;

const GENERAL_SYSTEM = `Você é um assistente útil. Responda sempre em português brasileiro.`;

export async function sendGeminiMessage(
  messages: ChatMessage[],
  usePageContext: boolean,
  accessToken: string,
): Promise<string> {
  const contents = messages.map((m) => {
    const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [];

    if (m.attachments?.length) {
      for (const att of m.attachments) {
        parts.push({ inline_data: { mime_type: att.mimeType, data: att.data } });
      }
    }

    if (m.content) {
      parts.push({ text: m.content });
    }

    return { role: m.role, parts };
  });

  const res = await fetch(VERTEX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: usePageContext ? COMPSOL_SYSTEM : GENERAL_SYSTEM }],
      },
      contents,
      generation_config: {
        temperature: 0.7,
        max_output_tokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Erro Vertex AI");
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
