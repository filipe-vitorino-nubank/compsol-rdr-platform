import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { env } from "../../config/env";
import {
  fetchChannelMembers,
  buildSlackDMLink,
  buildSlackWebLink,
  type SlackMember,
} from "../../services/slackService";
import { LoadingScreen } from "../ui/LoadingScreen";

function MemberCard({ member, t }: { member: SlackMember; t: (k: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="member-card" onClick={() => setExpanded((p) => !p)}>
      <div className="member-avatar">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} referrerPolicy="no-referrer" />
        ) : (
          <span className="member-initials">
            {member.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
        )}
        {member.is_admin && <span className="member-admin">★</span>}
      </div>
      <div className="member-info">
        <span className="member-name">{member.name}</span>
        {member.title && <span className="member-title">{member.title}</span>}
      </div>
      {expanded && (
        <div className="member-expanded" onClick={(e) => e.stopPropagation()}>
          {member.email && (
            <div className="member-email-row">
              <span className="member-email">{member.email}</span>
              <button
                type="button"
                className="btn-copy"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(member.email);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                title="Copiar e-mail"
              >
                {copied ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          )}
          <div className="member-actions">
            <a href={buildSlackDMLink(member.id)} className="btn-slack" onClick={(e) => e.stopPropagation()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
              </svg>
              {t("profile.openSlack")}
            </a>
            <a
              href={buildSlackWebLink(member.id)}
              target="_blank"
              rel="noreferrer"
              className="btn-slack-web"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {t("profile.openSlackWeb")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

type ErrorState = null | "empty" | "failed";

export function TeamDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { getAccessTokenForSheets } = useAuth();
  const { t } = useLanguage();
  const [members, setMembers] = useState<SlackMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<ErrorState>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (env.isAppsScript && (window as any).google?.script?.run) {
        const result = await new Promise<{ members: SlackMember[]; error: string | null }>((resolve, reject) => {
          (window as any).google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(reject)
            .getEquipeMembers();
        });
        if (result.error) throw new Error(result.error);
        setMembers(result.members);
        if (!result.members.length) setError("empty");
      } else {
        const token = await getAccessTokenForSheets({ interactive: false });
        const membersList = await fetchChannelMembers(token);
        setMembers(membersList);
        if (!membersList || membersList.length === 0) {
          setError("empty");
        }
      }
    } catch (err) {
      console.error("[TeamDrawer] Erro:", (err as Error).message);
      setError("failed");
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenForSheets]);

  useEffect(() => {
    if (!open) return;
    void fetchMembers();
  }, [open, fetchMembers]);

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.display_name.toLowerCase().includes(search.toLowerCase()),
  );

  if (!open) return null;

  return (
    <>
      <div className="profile-overlay" onClick={onClose} />

      <div className="profile-drawer">
        <div className="profile-drawer-header">
          <div>
            <h3>Equipe</h3>
            <span className="profile-last-sync" style={{ color: "var(--text-secondary)" }}>
              COE de Ops · opsdef_boas_squad
            </span>
          </div>
          <button className="profile-drawer-close" onClick={onClose} type="button" aria-label={t("common.close")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="profile-section-label" style={{ paddingTop: 16 }}>
          {t("profile.teamLabel")}
        </div>

        <div className="profile-search-wrapper">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="profile-search"
            placeholder={t("profile.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="profile-members-list">
          {loading ? (
            <LoadingScreen message={t("profile.loadingTeam")} />
          ) : error === "empty" ? (
            <div className="profile-loading" style={{ flexDirection: "column", gap: 6 }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Nenhum membro encontrado.
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                A sincronização pode estar pendente.
              </p>
            </div>
          ) : error === "failed" ? (
            <div className="profile-loading" style={{ flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Não foi possível carregar a equipe.
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Verifique sua conexão e tente novamente.
              </p>
              <button
                type="button"
                className="btn-sync"
                onClick={fetchMembers}
                style={{ marginTop: 4 }}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            filtered.map((member) => (
              <MemberCard key={member.id} member={member} t={t} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
