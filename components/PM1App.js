"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  IDENTITIES,
  buildProfile,
  addThread,
  touchThread,
  setThreadStatus,
  colorForThread,
  shouldSuggestResume,
  resumeSuggestionText,
  addMission,
  isMissionOverdue,
  resolveMission,
  interpretInaction,
  maybeGenerateHypothesis,
  resolveHypothesis,
  startDecreeProgram,
  logDecreeCheckin,
  decreeProgramProgress,
  generateEvolutionReport,
  generatePatternMirror,
  updateFromParsed,
  buildStreakCalendar,
  getMechanismFrequencyList,
  getWeeklyActivity,
  getAllDecreePrograms,
  FEELING_CHIPS,
  CONTEXT_CHIPS,
  formatCheckin,
  STARTER_CHIPS,
  confirmThreadTitle,
  dismissSuggestedTitle,
} from "../lib/pm1-engine";

// ============================================================================
// Subcomponentes
// ============================================================================

function ResetButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ marginTop: 4 }}>
      {!confirming ? (
        <button style={styles.resetBtn} onClick={() => setConfirming(true)}>Resetear todo</button>
      ) : (
        <div style={styles.resetConfirm}>
          <span style={styles.resetConfirmText}>¿Seguro? Se perderán todos los combates.</span>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={styles.resetConfirmYes} onClick={() => { setConfirming(false); onConfirm(); }}>Sí, resetear</button>
            <button style={styles.resetConfirmNo} onClick={() => setConfirming(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status, stale }) {
  let color = "#4ade80";
  if (status === "paused") color = "#666";
  else if (status === "completed") color = "#60a5fa";
  else if (stale) color = "#f59e0b";
  return <span style={{ ...styles.statusDot, background: color }} />;
}

function BottomNav({ active, onChange }) {
  const items = [
    { id: "map", label: "Mapa", icon: "⚔" },
    { id: "mirror", label: "Espejo", icon: "◈" },
    { id: "decrees", label: "Decretos", icon: "✦" },
    { id: "profile", label: "Perfil", icon: "●" },
  ];
  return (
    <div style={styles.bottomNav}>
      {items.map((it) => (
        <button
          key={it.id}
          style={styles.bottomNavBtn}
          onClick={() => onChange(it.id)}
        >
          <span style={{ ...styles.bottomNavIcon, color: active === it.id ? "#c8f542" : "#444" }}>{it.icon}</span>
          <span style={{ ...styles.bottomNavLabel, color: active === it.id ? "#c8f542" : "#555" }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function Bar({ pct, color = "#c8f542" }) {
  return (
    <div style={styles.barTrack}>
      <div style={{ ...styles.barFill, width: `${pct}%`, background: color }} />
    </div>
  );
}

// Captura ligera de obstáculo — solo aparece cuando el usuario dice "no pude".
// Un único campo, opcional, sin bloquear: se puede omitir con un toque.
function ObstacleCapture({ onConfirm, onSkip }) {
  const [text, setText] = useState("");
  return (
    <div style={styles.obstacleCapture}>
      <p style={styles.obstacleQuestion}>¿Qué te lo impidió?</p>
      <input
        style={styles.obstacleInput}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Una frase, lo primero que se te ocurra..."
        autoFocus
      />
      <div style={styles.combatBarBtns}>
        <button style={{ ...styles.combatBtn, ...styles.combatBtnNo }} onClick={() => onConfirm(text.trim())}>Confirmar</button>
        <button style={styles.obstacleSkipBtn} onClick={() => onSkip()}>Prefiero no decirlo</button>
      </div>
    </div>
  );
}

// Fila de chips con opción de añadir uno propio, tipo LIBEN ("+"). No sustituye
// el texto libre, solo evita escribir cuando la opción ya existe en la lista.
function ChipRow({ items, selected, onToggle, onAddCustom }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  function submit() {
    const v = text.trim();
    if (v) onAddCustom(v);
    setText("");
    setAdding(false);
  }

  return (
    <div style={styles.chipRow}>
      {items.map((item) => (
        <button
          key={item}
          style={{ ...styles.chip, ...(selected.includes(item) ? styles.chipActive : {}) }}
          onClick={() => onToggle(item)}
        >
          {item}
        </button>
      ))}
      {!adding ? (
        <button style={styles.chipAddBtn} onClick={() => setAdding(true)}>+ Añadir</button>
      ) : (
        <div style={styles.chipAddRow}>
          <input
            style={styles.chipAddInput}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") { setAdding(false); setText(""); }
            }}
            placeholder="Escribe y pulsa Enter"
            autoFocus
          />
          <button style={styles.chipAddConfirm} onClick={submit}>✓</button>
        </div>
      )}
    </div>
  );
}

// Botón "+" independiente, para chips que insertan texto en vez de seleccionar
// (p.ej. los chips de arranque). Reutiliza el mismo patrón visual que ChipRow.
function AddChipInline({ onAdd }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  function submit() {
    const v = text.trim();
    if (v) onAdd(v);
    setText("");
    setAdding(false);
  }

  if (!adding) {
    return <button style={styles.chipAddBtn} onClick={() => setAdding(true)}>+ Añadir</button>;
  }
  return (
    <div style={styles.chipAddRow}>
      <input
        style={styles.chipAddInput}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setAdding(false); setText(""); }
        }}
        placeholder="Es otra cosa: descríbela..."
        autoFocus
      />
      <button style={styles.chipAddConfirm} onClick={submit}>✓</button>
    </div>
  );
}

export default function PM1App() {
  const [view, setView] = useState("map");
  const [profile, setProfile] = useState(buildProfile);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openingText, setOpeningText] = useState("");
  const [customStarters, setCustomStarters] = useState([]);
  const [titleNameInput, setTitleNameInput] = useState(null); // threadId cuando el usuario prefiere escribir su propio nombre
  const [confrontMission, setConfrontMission] = useState(null);
  const [dismissedResume, setDismissedResume] = useState({});
  const [evolutionOpenThreadId, setEvolutionOpenThreadId] = useState(null);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [obstacleCapture, setObstacleCapture] = useState(null); // { threadId, missionId, context: 'confront'|'bar' }
  const [checkinFeelings, setCheckinFeelings] = useState([]);
  const [checkinContexts, setCheckinContexts] = useState([]);
  const [customFeelings, setCustomFeelings] = useState([]);
  const [customContexts, setCustomContexts] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pm1_profile_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        checkForOverdue(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [view, profile.activeThreadId, loading]);

  function persist(p) {
    setProfile(p);
    try { localStorage.setItem("pm1_profile_v3", JSON.stringify(p)); } catch {}
  }

  function checkForOverdue(p) {
    for (const tid of Object.keys(p.threads)) {
      const t = p.threads[tid];
      const pending = t.missions.find((m) => m.executed === null);
      if (pending && isMissionOverdue(pending)) {
        setConfrontMission({ threadId: tid, mission: pending });
        return;
      }
    }
  }

  const activeThread = profile.activeThreadId ? profile.threads[profile.activeThreadId] : null;

  // ============================================================================
  // MAPA DE COMBATES — arranque sin título manual
  // ============================================================================
  function handleStartCombat() {
    if (!openingText.trim()) return;
    const next = addThread(profile); // sin título: lo sugiere la IA tras leer esto
    const threadId = next.activeThreadId;
    const text = openingText.trim();
    persist(next);
    setOpeningText("");
    setCheckinFeelings([]);
    setCheckinContexts([]);
    setView("chat");
    sendMessageTo(threadId, next, text);
  }

  function insertStarter(phrase) {
    setOpeningText((t) => (t.trim() ? `${t.trim()} ` : `${phrase}: `));
  }

  function openThread(threadId) {
    const next = touchThread(profile, threadId);
    persist({ ...next, activeThreadId: threadId });
    setCheckinFeelings([]);
    setCheckinContexts([]);
    setView("chat");
    const t = next.threads[threadId];
    const pending = t.missions.find((m) => m.executed === null);
    if (pending && isMissionOverdue(pending)) setConfrontMission({ threadId, mission: pending });
  }

  function toggleThreadStatus(threadId, current) {
    const nextStatus = current === "active" ? "paused" : "active";
    persist(setThreadStatus(profile, threadId, nextStatus));
  }

  function goToNav(id) {
    setCalendarOffset(0);
    setView(id);
  }

  // ============================================================================
  // CHECK-IN RÁPIDO (chips)
  // ============================================================================
  function toggleChip(list, setList, item) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function addCustomFeeling(value) {
    setCustomFeelings((c) => (c.includes(value) ? c : [...c, value]));
    setCheckinFeelings((c) => (c.includes(value) ? c : [...c, value]));
  }

  function addCustomContext(value) {
    setCustomContexts((c) => (c.includes(value) ? c : [...c, value]));
    setCheckinContexts((c) => (c.includes(value) ? c : [...c, value]));
  }

  function useCheckinAsInput() {
    const text = formatCheckin(checkinFeelings, checkinContexts, input);
    setInput(text);
  }

  // ============================================================================
  // CHAT
  // ============================================================================
  async function sendMessageTo(threadId, profileSnapshot, text) {
    const thread = profileSnapshot.threads[threadId];
    if (!thread) return;
    const userMsg = { role: "user", content: text };
    const threadWithMsg = { ...thread, messages: [...thread.messages, userMsg] };
    let next = { ...profileSnapshot, threads: { ...profileSnapshot.threads, [threadId]: threadWithMsg } };
    persist(next);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: threadWithMsg.messages, profile: next, thread: threadWithMsg }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const { parsed } = data;

      const hasPendingMission = threadWithMsg.missions.some((m) => m.executed === null);

      const assistantMsg = {
        role: "assistant",
        content: parsed.text,
        mechanism: parsed.mechanism,
        evasion: parsed.evasion,
        lesson: parsed.lesson,
        proposedCombat: !hasPendingMission ? parsed.combat : null,
      };

      const threadWithReply = { ...threadWithMsg, messages: [...threadWithMsg.messages, assistantMsg] };
      next = { ...next, threads: { ...next.threads, [threadId]: threadWithReply } };
      next = updateFromParsed(next, threadId, parsed);
      persist(next);
    } catch (err) {
      const errMsg = { role: "assistant", content: "Error de conexión. Inténtalo de nuevo." };
      const threadWithErr = { ...threadWithMsg, messages: [...threadWithMsg.messages, errMsg] };
      persist({ ...next, threads: { ...next.threads, [threadId]: threadWithErr } });
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading || !activeThread) return;
    const text = input.trim();
    setInput("");
    setCheckinFeelings([]);
    setCheckinContexts([]);
    await sendMessageTo(activeThread.id, profile, text);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // ============================================================================
  // COMPROMISO — instantáneo, sin modal. Tocar "Comprometerme" activa la misión ya.
  // ============================================================================
  function handleCommit(actionText) {
    if (!activeThread) return;
    persist(addMission(profile, activeThread.id, actionText));
  }

  // ============================================================================
  // RESOLUCIÓN DE MISIÓN
  // ============================================================================
  function finalizeResolution(threadId, missionId, executed, obstacle = null) {
    let next = resolveMission(profile, threadId, missionId, executed, obstacle);
    let thread = next.threads[threadId];

    if (!executed) {
      const reflection = interpretInaction(thread);
      thread = maybeGenerateHypothesis(thread);
      const sysMsg = { role: "system-reflection", content: reflection };
      thread = { ...thread, messages: [...thread.messages, sysMsg] };
      next = { ...next, threads: { ...next.threads, [threadId]: thread } };
    }

    persist(next);
    setConfrontMission(null);
    setObstacleCapture(null);
  }

  function handleYes(threadId, missionId) {
    finalizeResolution(threadId, missionId, true, null);
  }

  function handleNo(threadId, missionId, context) {
    setObstacleCapture({ threadId, missionId, context });
  }

  function handleHypothesisAnswer(threadId, confirmed) {
    persist(resolveHypothesis(profile, threadId, confirmed));
  }

  // ============================================================================
  // DECRETOS
  // ============================================================================
  function handleStartDecrees() {
    if (!activeThread) return;
    persist(startDecreeProgram(profile, activeThread.id));
  }

  function handleDecreeCheckin(threadId, programId, slot) {
    persist(logDecreeCheckin(profile, threadId, programId, slot));
  }

  // ============================================================================
  // RESET
  // ============================================================================
  function resetAll() {
    persist(buildProfile());
    setConfrontMission(null);
    setObstacleCapture(null);
    setView("map");
  }

  const identity = profile.dominantIdentity ? IDENTITIES[profile.dominantIdentity] : null;
  const mirror = useMemo(() => generatePatternMirror(profile), [profile]);
  const threadList = profile.threadOrder.map((id) => profile.threads[id]).filter(Boolean).reverse();
  const pendingMissionInThread = activeThread ? activeThread.missions.find((m) => m.executed === null) : null;
  const activeDecreePrograms = activeThread ? activeThread.decreePrograms : [];
  const calendar = useMemo(() => buildStreakCalendar(profile, calendarOffset), [profile, calendarOffset]);
  const mechanismFreq = useMemo(() => getMechanismFrequencyList(profile), [profile]);
  const weeklyActivity = useMemo(() => getWeeklyActivity(profile), [profile]);
  const allDecreePrograms = useMemo(() => getAllDecreePrograms(profile), [profile]);

  // ==========================================================================
  // CONFRONTACIÓN (bloqueante, solo para misiones de días anteriores)
  // ==========================================================================
  if (confrontMission) {
    const { threadId, mission } = confrontMission;
    const thread = profile.threads[threadId];
    const capturing = obstacleCapture && obstacleCapture.missionId === mission.id;
    return (
      <div style={styles.root}>
        <div style={styles.confrontOverlay}>
          <span style={styles.confrontLabel}>PENDIENTE SIN RESOLVER</span>
          <h2 style={styles.confrontTitle}>"{thread?.title}"</h2>
          <p style={styles.confrontAction}>{mission.action}</p>
          {!capturing ? (
            <>
              <p style={styles.confrontQuestion}>¿Lo hiciste?</p>
              <div style={styles.confrontBtns}>
                <button style={{ ...styles.combatBtn, ...styles.combatBtnYes }} onClick={() => handleYes(threadId, mission.id)}>Sí, lo hice</button>
                <button style={{ ...styles.combatBtn, ...styles.combatBtnNo }} onClick={() => handleNo(threadId, mission.id, "confront")}>No pude</button>
              </div>
            </>
          ) : (
            <ObstacleCapture
              onConfirm={(text) => finalizeResolution(threadId, mission.id, false, text || null)}
              onSkip={() => finalizeResolution(threadId, mission.id, false, null)}
            />
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MAPA
  // ==========================================================================
  if (view === "map") {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>PM1</span>
            <span style={styles.logoSub}>PRIMER MOVIMIENTO</span>
          </div>
        </div>

        <div style={styles.scrollArea}>
          <div style={styles.starterCard}>
            <p style={styles.starterQuestion}>¿Qué es eso que sabes que deberías hacer y no haces?</p>
            <p style={styles.starterSub}>No hace falta que sepas ponerle nombre. Solo cuéntalo.</p>

            <div style={styles.chipRow}>
              {[...STARTER_CHIPS, ...customStarters].map((s) => (
                <button key={s} style={styles.chip} onClick={() => insertStarter(s)}>{s}</button>
              ))}
              <AddChipInline onAdd={(v) => { setCustomStarters((c) => [...c, v]); insertStarter(v); }} />
            </div>

            <textarea
              style={styles.starterTextarea}
              value={openingText}
              onChange={(e) => setOpeningText(e.target.value)}
              placeholder="O escribe con tus propias palabras, sin filtros..."
              rows={4}
            />
            <button
              style={{ ...styles.newThreadBtn, ...styles.starterBtn, opacity: openingText.trim() ? 1 : 0.4 }}
              disabled={!openingText.trim()}
              onClick={handleStartCombat}
            >
              Continuar →
            </button>
          </div>

          {threadList.length > 0 && <p style={styles.mapIntro}>Mis Combates</p>}

          {threadList.map((t) => {
            const stale = shouldSuggestResume(t);
            const pending = t.missions.find((m) => m.executed === null);
            const executedCount = t.missions.filter((m) => m.executed).length;
            return (
              <div key={t.id} style={styles.threadCard} onClick={() => openThread(t.id)}>
                <div style={styles.threadCardTop}>
                  <div style={styles.threadCardTitleRow}>
                    <StatusDot status={t.status} stale={stale} />
                    <span style={styles.threadCardTitle}>{t.title}</span>
                  </div>
                  <button
                    style={styles.threadPauseBtn}
                    onClick={(e) => { e.stopPropagation(); toggleThreadStatus(t.id, t.status); }}
                  >
                    {t.status === "paused" ? "reanudar" : "pausar"}
                  </button>
                </div>
                <p style={styles.threadCardMeta}>
                  {t.status === "paused" ? "Pausado" : pending ? "Misión pendiente" : `${executedCount} movimiento${executedCount === 1 ? "" : "s"} ejecutado${executedCount === 1 ? "" : "s"}`}
                  {stale ? " · lleva días sin tocarse" : ""}
                </p>
                <div style={styles.threadProgressTrack}>
                  <div style={{ ...styles.threadProgressFill, width: `${t.progress}%`, background: colorForThread(t) }} />
                </div>
              </div>
            );
          })}
        </div>
        <BottomNav active="map" onChange={goToNav} />
      </div>
    );
  }

  // ==========================================================================
  // ESPEJO
  // ==========================================================================
  if (view === "mirror") {
    const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
    const maxWeekly = Math.max(1, ...weeklyActivity.map((d) => d.executed + d.failed));

    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>PM1</span>
            <span style={styles.logoSub}>ESPEJO</span>
          </div>
        </div>

        <div style={styles.scrollArea}>
          <div style={styles.mirrorCard}>
            <span style={styles.sectionLabel}>ESPEJO DE PATRÓN</span>
            <p style={styles.mirrorText}>{mirror.text}</p>
          </div>

          <div style={styles.section}>
            <div style={styles.calendarHeader}>
              <button style={styles.calendarNavBtn} onClick={() => setCalendarOffset((o) => o - 1)}>‹</button>
              <span style={styles.calendarMonthLabel}>{calendar.monthLabel}</span>
              <button style={styles.calendarNavBtn} onClick={() => setCalendarOffset((o) => Math.min(0, o + 1))}>›</button>
            </div>
            <div style={styles.calendarWeekdays}>
              {weekdays.map((w) => <span key={w} style={styles.calendarWeekday}>{w}</span>)}
            </div>
            <div style={styles.calendarGrid}>
              {Array.from({ length: calendar.firstWeekday }).map((_, i) => <div key={"empty" + i} />)}
              {calendar.days.map((d) => {
                let bg = "transparent";
                let border = "1px solid #1a1a1a";
                let color = "#555";
                if (d.executed > 0) { bg = "rgba(74,222,128,0.15)"; border = "1px solid rgba(74,222,128,0.35)"; color = "#4ade80"; }
                else if (d.failed > 0) { bg = "rgba(248,113,113,0.1)"; border = "1px solid rgba(248,113,113,0.25)"; color = "#f87171"; }
                if (d.isToday) border = "1px solid #c8f542";
                return (
                  <div key={d.day} style={{ ...styles.calendarDay, background: bg, border, color }}>
                    {d.day}
                  </div>
                );
              })}
            </div>
            <div style={styles.calendarLegend}>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#4ade80" }} /> ejecutado</span>
              <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#f87171" }} /> evitado</span>
            </div>
          </div>

          <div style={styles.section}>
            <span style={styles.sectionLabel}>ACTIVIDAD — ÚLTIMOS 7 DÍAS</span>
            <div style={styles.weeklyChart}>
              {weeklyActivity.map((d, i) => {
                const total = d.executed + d.failed;
                const execH = total ? (d.executed / maxWeekly) * 60 : 0;
                const failH = total ? (d.failed / maxWeekly) * 60 : 0;
                return (
                  <div key={i} style={styles.weeklyCol}>
                    <div style={styles.weeklyBarStack}>
                      {total === 0 ? (
                        <div style={styles.weeklyEmptyBar} />
                      ) : (
                        <>
                          {d.failed > 0 && <div style={{ ...styles.weeklyBarSeg, height: failH, background: "#f87171" }} />}
                          {d.executed > 0 && <div style={{ ...styles.weeklyBarSeg, height: execH, background: "#4ade80" }} />}
                        </>
                      )}
                    </div>
                    <span style={styles.weeklyLabel}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {mechanismFreq.length > 0 && (
            <div style={styles.section}>
              <span style={styles.sectionLabel}>MECANISMOS DETECTADOS</span>
              {mechanismFreq.map((m) => (
                <div key={m.key} style={styles.freqRow}>
                  <span style={styles.freqLabel}>{m.label}</span>
                  <Bar pct={m.pct} />
                  <span style={styles.freqCount}>{m.weight}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <BottomNav active="mirror" onChange={goToNav} />
      </div>
    );
  }

  // ==========================================================================
  // DECRETOS
  // ==========================================================================
  if (view === "decrees") {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>PM1</span>
            <span style={styles.logoSub}>DECRETOS</span>
          </div>
        </div>

        <div style={styles.scrollArea}>
          {allDecreePrograms.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>✦</div>
              <p style={styles.emptyTitle}>Ningún decreto activo</p>
              <p style={styles.emptyText}>Los decretos se activan desde un combate, después de resolver tu primera misión ahí. Siempre en positivo — programan tu mente, no la castigan.</p>
            </div>
          ) : (
            allDecreePrograms.map((p) => {
              const pct = decreeProgramProgress(p);
              return (
                <div key={p.id} style={styles.decreeCard}>
                  <div style={styles.decreeCardHeader}>
                    <span style={{ ...styles.decreeThreadTag, color: p.threadColor, borderColor: p.threadColor }}>{p.threadTitle}</span>
                    <span style={styles.decreeProgress}>{pct}%</span>
                  </div>
                  {p.texts.map((t, i) => <p key={i} style={styles.decreeCardText}>"{t}"</p>)}
                  <Bar pct={pct} color="#60a5fa" />
                  <div style={styles.resumeBannerBtns}>
                    <button style={styles.resumeBtnSmall} onClick={() => handleDecreeCheckin(p.threadId, p.id, "manana")}>Marcar mañana</button>
                    <button style={styles.resumeBtnSmall} onClick={() => handleDecreeCheckin(p.threadId, p.id, "noche")}>Marcar noche</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <BottomNav active="decrees" onChange={goToNav} />
      </div>
    );
  }

  // ==========================================================================
  // PERFIL
  // ==========================================================================
  if (view === "profile") {
    return (
      <div style={styles.root}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>PM1</span>
            <span style={styles.logoSub}>PERFIL</span>
          </div>
        </div>

        <div style={styles.scrollArea}>
          <div style={styles.identityCard}>
            <span style={styles.identityLabel}>IDENTIDAD OBSERVADA</span>
            {identity ? (
              <>
                <h2 style={styles.identityName}>{identity.label}</h2>
                <p style={styles.identityDesc}>{identity.description}</p>
              </>
            ) : (
              <p style={styles.identityEmpty}>Aún sin datos suficientes para detectar un patrón.</p>
            )}
          </div>

          <div style={styles.statsRow}>
            {[
              { num: profile.movements, label: "Movimientos" },
              { num: profile.streak, label: "Racha" },
              { num: threadList.length, label: "Combates" },
              { num: profile.resistanceLevel, label: "Resistencia" },
            ].map(({ num, label }) => (
              <div key={label} style={styles.statCard}>
                <span style={styles.statNum}>{num}</span>
                <span style={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>

          {profile.wins.length > 0 && (
            <div style={styles.section}>
              <span style={styles.sectionLabel}>REGISTRO DE VICTORIAS</span>
              {profile.wins.slice(-8).reverse().map((w) => (
                <div key={w.id} style={styles.winItem}>
                  <span style={styles.winIcon}>✓</span>
                  <span style={styles.winText}>{w.text}</span>
                </div>
              ))}
            </div>
          )}

          {threadList.length > 0 && (
            <div style={styles.section}>
              <span style={styles.sectionLabel}>EVOLUCIÓN POR COMBATE</span>
              {threadList.map((t) => {
                const open = evolutionOpenThreadId === t.id;
                const report = open ? generateEvolutionReport(t) : null;
                return (
                  <div key={t.id} style={styles.evolutionRow}>
                    <button style={styles.evolutionToggle} onClick={() => setEvolutionOpenThreadId(open ? null : t.id)}>
                      {open ? "▾" : "▸"} {t.title}
                    </button>
                    {open && report && (
                      report.ready ? (
                        <div style={styles.evolutionCard}>
                          <p style={styles.evolutionSpan}>Últimos {report.spanDays} días</p>
                          <p style={styles.evolutionSubhead}>Antes</p>
                          {report.before.map((l, i) => <p key={i} style={styles.evolutionLine}>— {l}</p>)}
                          <p style={styles.evolutionSubhead}>Ahora</p>
                          {report.after.map((l, i) => <p key={i} style={styles.evolutionLine}>— {l}</p>)}
                          <p style={styles.evolutionClosing}>{report.closing}</p>
                        </div>
                      ) : (
                        <p style={styles.evolutionEmpty}>{report.text}</p>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(threadList.length > 0 || profile.wins.length > 0) && <ResetButton onConfirm={resetAll} />}
        </div>
        <BottomNav active="profile" onChange={goToNav} />
      </div>
    );
  }

  // ==========================================================================
  // CHAT DE UN COMBATE
  // ==========================================================================
  if (!activeThread) {
    setView("map");
    return null;
  }

  const stale = shouldSuggestResume(activeThread);
  const showResumeBanner = stale && !dismissedResume[activeThread.id];
  const showCheckinChips = activeThread.messages.length === 0;
  const barCapturing = obstacleCapture && pendingMissionInThread && obstacleCapture.missionId === pendingMissionInThread.id;

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => setView("map")}>←</button>
          <span style={{ ...styles.threadHeaderTitle, color: colorForThread(activeThread) }}>{activeThread.title}</span>
        </div>
      </div>

      <div style={styles.chatContainer}>
        <div style={styles.messages}>
          {activeThread.suggestedTitle && !activeThread.titleConfirmed && (
            <div style={styles.titleSuggestBanner}>
              <span style={styles.sectionLabel}>NOMBRE SUGERIDO PARA ESTE COMBATE</span>
              {titleNameInput !== activeThread.id ? (
                <>
                  <p style={styles.titleSuggestText}>"{activeThread.suggestedTitle}"</p>
                  <div style={styles.resumeBannerBtns}>
                    <button style={styles.resumeBtnSmall} onClick={() => persist(confirmThreadTitle(profile, activeThread.id, activeThread.suggestedTitle))}>Sí, así es</button>
                    <button style={styles.resumeBtnSmall} onClick={() => setTitleNameInput(activeThread.id)}>Prefiero otro nombre</button>
                    <button style={styles.resumeBtnSmall} onClick={() => persist(dismissSuggestedTitle(profile, activeThread.id))}>Ahora no</button>
                  </div>
                </>
              ) : (
                <div style={styles.titleSuggestEditRow}>
                  <input
                    style={styles.chipAddInput}
                    placeholder="Escribe el nombre que prefieras"
                    defaultValue={activeThread.suggestedTitle}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { persist(confirmThreadTitle(profile, activeThread.id, e.target.value)); setTitleNameInput(null); }
                    }}
                    id="title-rename-input"
                  />
                  <button
                    style={styles.chipAddConfirm}
                    onClick={() => {
                      const val = document.getElementById("title-rename-input").value;
                      persist(confirmThreadTitle(profile, activeThread.id, val));
                      setTitleNameInput(null);
                    }}
                  >✓</button>
                </div>
              )}
            </div>
          )}

          {showResumeBanner && (
            <div style={styles.resumeBanner}>
              <p style={styles.resumeBannerText}>{resumeSuggestionText(activeThread)}</p>
              <div style={styles.resumeBannerBtns}>
                <button style={styles.resumeBtnSmall} onClick={() => setDismissedResume((d) => ({ ...d, [activeThread.id]: true }))}>Ya lo tengo resuelto</button>
                <button style={styles.resumeBtnSmall} onClick={() => setDismissedResume((d) => ({ ...d, [activeThread.id]: true }))}>Quiero retomarlo</button>
                <button style={styles.resumeBtnSmall} onClick={() => { toggleThreadStatus(activeThread.id, "active"); setDismissedResume((d) => ({ ...d, [activeThread.id]: true })); }}>Prefiero dejarlo por ahora</button>
              </div>
            </div>
          )}

          {activeThread.hypothesis && activeThread.hypothesis.resolved === null && (
            <div style={styles.hypothesisBanner}>
              <span style={styles.hypothesisLabel}>HIPÓTESIS</span>
              <p style={styles.hypothesisText}>{activeThread.hypothesis.text}</p>
              <div style={styles.resumeBannerBtns}>
                <button style={styles.resumeBtnSmall} onClick={() => handleHypothesisAnswer(activeThread.id, true)}>Creo que sí es eso</button>
                <button style={styles.resumeBtnSmall} onClick={() => handleHypothesisAnswer(activeThread.id, false)}>No creo que sea eso</button>
              </div>
            </div>
          )}

          {showCheckinChips && (
            <div style={styles.checkinCard}>
              <span style={styles.sectionLabel}>CHECK-IN RÁPIDO — TOCA, NO ESCRIBAS</span>
              <p style={styles.checkinQuestion}>¿Cómo te sientes ahora mismo?</p>
              <ChipRow
                items={[...FEELING_CHIPS, ...customFeelings]}
                selected={checkinFeelings}
                onToggle={(f) => toggleChip(checkinFeelings, setCheckinFeelings, f)}
                onAddCustom={addCustomFeeling}
              />
              <p style={styles.checkinQuestion}>¿Dónde/con quién estás?</p>
              <ChipRow
                items={[...CONTEXT_CHIPS, ...customContexts]}
                selected={checkinContexts}
                onToggle={(c) => toggleChip(checkinContexts, setCheckinContexts, c)}
                onAddCustom={addCustomContext}
              />
              {(checkinFeelings.length > 0 || checkinContexts.length > 0) && (
                <button style={styles.checkinUseBtn} onClick={useCheckinAsInput}>Usar esto para empezar →</button>
              )}
            </div>
          )}

          {activeThread.messages.length === 0 && !showCheckinChips && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⚔</div>
              <p style={styles.emptyTitle}>¿Qué es eso que quieres y no puedes hacer?</p>
            </div>
          )}

          {activeThread.messages.map((msg, i) => {
            if (msg.role === "system-reflection") {
              return (
                <div key={i} style={styles.reflectionRow}>
                  <span style={styles.reflectionText}>{msg.content}</span>
                </div>
              );
            }
            return (
              <div key={i} style={{ ...styles.msgRow, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ ...styles.bubble, ...(msg.role === "user" ? styles.bubbleUser : styles.bubbleAI) }}>
                  <p style={styles.bubbleText}>{msg.content}</p>
                  {msg.evasion && (
                    <div style={styles.evasionTag}>
                      <span style={styles.evasionTagLabel}>EVASIÓN DETECTADA</span>
                      <span style={styles.evasionTagText}>{msg.evasion}</span>
                    </div>
                  )}
                  {msg.lesson && (
                    <div style={styles.lessonTag}>
                      <span style={styles.lessonTagLabel}>LECCIÓN DE COMBATE</span>
                      <span style={styles.lessonTagText}>{msg.lesson}</span>
                    </div>
                  )}
                  {msg.proposedCombat && (
                    <div style={styles.combatTag}>
                      <span style={styles.combatTagLabel}>PRIMER COMBATE PROPUESTO</span>
                      <span style={styles.combatTagText}>{msg.proposedCombat}</span>
                      <button style={styles.commitBtn} onClick={() => handleCommit(msg.proposedCombat)}>Me comprometo →</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
              <div style={{ ...styles.bubble, ...styles.bubbleAI }}>
                <div style={styles.typingDots}>
                  <span style={styles.dot} />
                  <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                  <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {pendingMissionInThread && (
          <div style={styles.combatBar}>
            <p style={styles.combatBarQuestion}>¿Ya lo hiciste?</p>
            <p style={styles.combatBarAction}>{pendingMissionInThread.action}</p>
            {!barCapturing ? (
              <div style={styles.combatBarBtns}>
                <button style={{ ...styles.combatBtn, ...styles.combatBtnYes }} onClick={() => handleYes(activeThread.id, pendingMissionInThread.id)}>Sí, lo hice</button>
                <button style={{ ...styles.combatBtn, ...styles.combatBtnNo }} onClick={() => handleNo(activeThread.id, pendingMissionInThread.id, "bar")}>No pude</button>
              </div>
            ) : (
              <ObstacleCapture
                onConfirm={(text) => finalizeResolution(activeThread.id, pendingMissionInThread.id, false, text || null)}
                onSkip={() => finalizeResolution(activeThread.id, pendingMissionInThread.id, false, null)}
              />
            )}
          </div>
        )}

        {activeDecreePrograms.length > 0 && (
          <div style={styles.decreeBar}>
            <span style={styles.sectionLabel}>DECRETOS ACTIVOS EN ESTE COMBATE</span>
            {activeDecreePrograms.map((p) => (
              <div key={p.id} style={styles.decreeProgramRow}>
                {p.texts.map((t, i) => <p key={i} style={styles.decreeText}>"{t}"</p>)}
                <Bar pct={decreeProgramProgress(p)} color="#60a5fa" />
                <div style={styles.resumeBannerBtns}>
                  <button style={styles.resumeBtnSmall} onClick={() => handleDecreeCheckin(activeThread.id, p.id, "manana")}>Marcar mañana</button>
                  <button style={styles.resumeBtnSmall} onClick={() => handleDecreeCheckin(activeThread.id, p.id, "noche")}>Marcar noche</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!pendingMissionInThread && activeDecreePrograms.length === 0 && activeThread.missions.some((m) => m.executed !== null) && (
          <div style={styles.decreeStartRow}>
            <button style={styles.decreeStartBtn} onClick={handleStartDecrees}>+ Empezar programa de decretos para este combate</button>
          </div>
        )}

        <div style={styles.inputArea}>
          <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe tu situación..." rows={2} />
          <button style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1 }} onClick={sendMessage} disabled={loading || !input.trim()}>→</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================
const styles = {
  root: { fontFamily: "'Space Grotesk', sans-serif", background: "#0a0a0a", color: "#e8e8e8", height: "100vh", display: "flex", flexDirection: "column", maxWidth: 680, margin: "0 auto", border: "1px solid #1a1a1a", position: "relative" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1a1a", background: "#0a0a0a", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { background: "none", border: "1px solid #222", color: "#888", width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 14 },
  logo: { fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 22, color: "#c8f542", letterSpacing: "-1px" },
  logoSub: { fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#333", letterSpacing: "3px", textTransform: "uppercase" },
  threadHeaderTitle: { fontSize: 16, fontWeight: 600 },

  scrollArea: { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 90 },

  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", borderTop: "1px solid #1a1a1a", background: "#0a0a0a", flexShrink: 0 },
  bottomNavBtn: { flex: 1, background: "none", border: "none", padding: "10px 4px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" },
  bottomNavIcon: { fontSize: 18 },
  bottomNavLabel: { fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: "0.5px" },

  mapIntro: { fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#444", letterSpacing: "2px", textTransform: "uppercase" },

  starterCard: { padding: "20px", background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 },
  starterQuestion: { fontSize: 17, fontWeight: 600, color: "#e8e8e8", lineHeight: 1.4 },
  starterSub: { fontSize: 12.5, color: "#555", marginBottom: 4 },
  starterTextarea: { background: "#0a0a0a", border: "1px solid #222", borderRadius: 8, color: "#e8e8e8", fontSize: 14, padding: "12px 14px", resize: "none", lineHeight: 1.6, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4 },
  starterBtn: { width: "100%", padding: "12px", fontSize: 13.5 },

  titleSuggestBanner: { margin: "0 0 4px", padding: "12px 14px", background: "#0d0d0d", border: "1px solid rgba(200,245,66,0.25)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 6 },
  titleSuggestText: { fontSize: 15, color: "#c8f542", fontWeight: 600 },
  titleSuggestEditRow: { display: "flex", gap: 6, marginTop: 4 },
  newThreadBtn: { background: "#c8f542", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "0 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  threadCard: { padding: "16px 18px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 },
  threadCardTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  threadCardTitleRow: { display: "flex", alignItems: "center", gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  threadCardTitle: { fontSize: 15, fontWeight: 600, color: "#e8e8e8" },
  threadPauseBtn: { background: "none", border: "1px solid #222", color: "#555", fontSize: 10, padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontFamily: "'Space Mono', monospace" },
  threadCardMeta: { fontSize: 12, color: "#555" },
  threadProgressTrack: { height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" },
  threadProgressFill: { height: "100%", borderRadius: 2, transition: "width 0.4s ease" },

  emptyState: { textAlign: "center", padding: "40px 20px", margin: "auto", maxWidth: 360 },
  emptyIcon: { fontSize: 40, marginBottom: 16, filter: "grayscale(1)", opacity: 0.4 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#888", marginBottom: 10 },
  emptyText: { fontSize: 13, color: "#444", lineHeight: 1.7 },

  chatContainer: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  messages: { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 },
  msgRow: { display: "flex", width: "100%" },
  bubble: { maxWidth: "78%", padding: "12px 16px", borderRadius: 10, lineHeight: 1.6 },
  bubbleUser: { background: "#141414", border: "1px solid #222", borderBottomRightRadius: 2 },
  bubbleAI: { background: "#0f0f0f", border: "1px solid #1e1e1e", borderBottomLeftRadius: 2 },
  bubbleText: { fontSize: 14, color: "#d4d4d4", whiteSpace: "pre-wrap", lineHeight: 1.7 },

  checkinCard: { padding: "18px 18px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 },
  checkinQuestion: { fontSize: 13, color: "#999", marginTop: 6 },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { background: "#141414", border: "1px solid #262626", color: "#999", fontSize: 12.5, padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" },
  chipActive: { background: "rgba(200,245,66,0.12)", border: "1px solid #c8f542", color: "#c8f542" },
  chipAddBtn: { background: "none", border: "1px dashed #333", color: "#666", fontSize: 12.5, padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" },
  chipAddRow: { display: "flex", gap: 6, alignItems: "center" },
  chipAddInput: { background: "#0a0a0a", border: "1px solid #c8f542", borderRadius: 20, color: "#e8e8e8", fontSize: 12.5, padding: "7px 13px", fontFamily: "'Space Grotesk', sans-serif", minWidth: 140 },
  chipAddConfirm: { background: "#c8f542", color: "#0a0a0a", border: "none", borderRadius: "50%", width: 28, height: 28, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  checkinUseBtn: { marginTop: 10, background: "#c8f542", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  combatTag: { marginTop: 12, padding: "10px 12px", background: "rgba(200,245,66,0.06)", border: "1px solid rgba(200,245,66,0.2)", borderRadius: 6, display: "flex", flexDirection: "column", gap: 8 },
  combatTagLabel: { display: "block", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#c8f542", letterSpacing: "2px" },
  combatTagText: { fontSize: 13, color: "#c8f542", fontWeight: 500 },
  commitBtn: { alignSelf: "flex-start", background: "#c8f542", color: "#0a0a0a", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" },

  evasionTag: { marginTop: 8, padding: "8px 12px", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 6 },
  evasionTagLabel: { display: "block", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#f87171", letterSpacing: "2px", marginBottom: 4 },
  evasionTagText: { fontSize: 12, color: "#f87171", opacity: 0.8 },

  lessonTag: { marginTop: 8, padding: "10px 12px", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 6 },
  lessonTagLabel: { display: "block", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#60a5fa", letterSpacing: "2px", marginBottom: 4 },
  lessonTagText: { fontSize: 13, color: "#93c5fd", fontStyle: "italic" },

  reflectionRow: { display: "flex", justifyContent: "center", padding: "4px 20px" },
  reflectionText: { fontSize: 12, color: "#666", fontStyle: "italic", textAlign: "center", maxWidth: "85%", lineHeight: 1.6 },

  typingDots: { display: "flex", gap: 5, padding: "4px 2px", alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#333", animation: "pulse 1.2s ease-in-out infinite" },

  resumeBanner: { margin: "0 0 4px", padding: "12px 14px", background: "#0d0d0d", border: "1px solid #2a2410", borderRadius: 8 },
  resumeBannerText: { fontSize: 12.5, color: "#c9b878", lineHeight: 1.6, marginBottom: 10 },
  resumeBannerBtns: { display: "flex", gap: 6, flexWrap: "wrap" },
  resumeBtnSmall: { background: "none", border: "1px solid #333", color: "#999", fontSize: 11, padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" },

  hypothesisBanner: { margin: "0 0 4px", padding: "12px 14px", background: "#0d0d0d", border: "1px solid rgba(192,132,252,0.3)", borderRadius: 8 },
  hypothesisLabel: { fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#c084fc", letterSpacing: "2px" },
  hypothesisText: { fontSize: 12.5, color: "#d8b4fe", lineHeight: 1.6, margin: "6px 0 10px" },

  combatBar: { margin: "0 16px 12px", padding: "14px 16px", background: "#0d0d0d", border: "1px solid rgba(200,245,66,0.25)", borderRadius: 8, flexShrink: 0 },
  combatBarQuestion: { fontSize: 11, color: "#666", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 6 },
  combatBarAction: { fontSize: 14, color: "#c8f542", fontWeight: 500, marginBottom: 12, lineHeight: 1.5 },
  combatBarBtns: { display: "flex", gap: 8 },
  combatBtn: { flex: 1, padding: "9px", border: "none", borderRadius: 5, fontSize: 13, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 },
  combatBtnYes: { background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" },
  combatBtnNo: { background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" },

  obstacleCapture: { display: "flex", flexDirection: "column", gap: 8, marginTop: 6 },
  obstacleQuestion: { fontSize: 13, color: "#ccc" },
  obstacleInput: { background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, color: "#e8e8e8", fontSize: 13, padding: "9px 12px", fontFamily: "'Space Grotesk', sans-serif" },
  obstacleSkipBtn: { flex: 1, background: "none", border: "1px solid #222", color: "#666", padding: "9px", borderRadius: 5, fontSize: 12, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" },

  decreeBar: { margin: "0 16px 12px", padding: "14px 16px", background: "#0d0d0d", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 8, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 },
  decreeProgramRow: { display: "flex", flexDirection: "column", gap: 6 },
  decreeText: { fontSize: 12.5, color: "#93c5fd", fontStyle: "italic" },
  decreeStartRow: { padding: "0 16px 12px" },
  decreeStartBtn: { width: "100%", background: "none", border: "1px dashed #333", color: "#666", padding: "10px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" },

  decreeCard: { padding: "16px 18px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 },
  decreeCardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  decreeThreadTag: { fontSize: 11, padding: "3px 8px", borderRadius: 4, border: "1px solid", fontFamily: "'Space Mono', monospace" },
  decreeProgress: { fontSize: 12, color: "#666", fontFamily: "'Space Mono', monospace" },
  decreeCardText: { fontSize: 13, color: "#93c5fd", fontStyle: "italic", lineHeight: 1.5 },

  inputArea: { display: "flex", alignItems: "flex-end", gap: 10, padding: "12px 16px 16px", borderTop: "1px solid #141414", flexShrink: 0 },
  textarea: { flex: 1, background: "#0f0f0f", border: "1px solid #222", borderRadius: 8, color: "#e8e8e8", fontSize: 14, padding: "10px 14px", resize: "none", lineHeight: 1.6, fontFamily: "'Space Grotesk', sans-serif" },
  sendBtn: { background: "#c8f542", color: "#0a0a0a", border: "none", borderRadius: 8, width: 40, height: 40, fontSize: 20, cursor: "pointer", fontWeight: 700, flexShrink: 0 },

  confrontOverlay: { position: "absolute", inset: 0, background: "#0a0a0a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 28px", gap: 6, zIndex: 10 },
  confrontLabel: { fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#f87171", letterSpacing: "3px" },
  confrontTitle: { fontSize: 18, color: "#888", margin: "8px 0 4px", fontWeight: 500 },
  confrontAction: { fontSize: 20, color: "#e8e8e8", fontWeight: 600, lineHeight: 1.4, margin: "6px 0 16px" },
  confrontQuestion: { fontSize: 16, color: "#c8f542", fontWeight: 600, marginBottom: 16 },
  confrontBtns: { display: "flex", gap: 10 },

  identityCard: { padding: "20px", background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 10 },
  identityLabel: { display: "block", fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#444", letterSpacing: "3px", marginBottom: 10 },
  identityName: { fontSize: 22, fontWeight: 700, color: "#c8f542", marginBottom: 8, letterSpacing: "-0.5px" },
  identityDesc: { fontSize: 13, color: "#666", lineHeight: 1.6 },
  identityEmpty: { fontSize: 13, color: "#333", lineHeight: 1.6 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  statCard: { padding: "14px 10px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, textAlign: "center", display: "flex", flexDirection: "column", gap: 4 },
  statNum: { fontFamily: "'Space Mono', monospace", fontSize: 24, fontWeight: 700, color: "#e8e8e8" },
  statLabel: { fontSize: 10, color: "#444", letterSpacing: "1px", textTransform: "uppercase" },

  mirrorCard: { padding: "20px", background: "#0d0d0d", border: "1px solid #2a2a1a", borderRadius: 10, display: "flex", flexDirection: "column", gap: 10 },
  mirrorText: { fontSize: 13.5, color: "#d4d4d4", lineHeight: 1.9, whiteSpace: "pre-line" },

  section: { padding: "18px 20px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, display: "flex", flexDirection: "column", gap: 12 },
  sectionLabel: { fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#444", letterSpacing: "3px" },

  winItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  winIcon: { color: "#4ade80", fontSize: 13, flexShrink: 0, marginTop: 1, fontFamily: "'Space Mono', monospace" },
  winText: { fontSize: 13, color: "#999", lineHeight: 1.5 },

  evolutionRow: { display: "flex", flexDirection: "column", gap: 8 },
  evolutionToggle: { background: "none", border: "none", color: "#999", fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", padding: 0 },
  evolutionCard: { padding: "12px 14px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 },
  evolutionSpan: { fontSize: 11, color: "#444", marginBottom: 6 },
  evolutionSubhead: { fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#666", letterSpacing: "2px", marginTop: 8 },
  evolutionLine: { fontSize: 12.5, color: "#999", lineHeight: 1.6 },
  evolutionClosing: { fontSize: 13, color: "#c8f542", marginTop: 10, lineHeight: 1.6, fontStyle: "italic" },
  evolutionEmpty: { fontSize: 12, color: "#444", paddingLeft: 4 },

  resetBtn: { background: "none", border: "1px solid #1e1e1e", color: "#333", padding: "10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "'Space Mono', monospace", letterSpacing: "1px", width: "100%" },
  resetConfirm: { padding: "14px 16px", background: "#0d0d0d", border: "1px solid #2a1a1a", borderRadius: 8 },
  resetConfirmText: { fontSize: 12, color: "#666" },
  resetConfirmYes: { flex: 1, padding: "8px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 5, fontSize: 12, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" },
  resetConfirmNo: { flex: 1, padding: "8px", background: "none", border: "1px solid #222", color: "#555", borderRadius: 5, fontSize: 12, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" },

  barTrack: { height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden", flex: 1 },
  barFill: { height: "100%", borderRadius: 3, transition: "width 0.4s ease" },

  calendarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  calendarNavBtn: { background: "none", border: "1px solid #222", color: "#888", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14 },
  calendarMonthLabel: { fontSize: 13, color: "#ccc", textTransform: "capitalize", fontWeight: 600 },
  calendarWeekdays: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  calendarWeekday: { fontSize: 10, color: "#444", textAlign: "center", fontFamily: "'Space Mono', monospace" },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  calendarDay: { aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 11, fontFamily: "'Space Mono', monospace" },
  calendarLegend: { display: "flex", gap: 14, marginTop: 4 },
  legendItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#666" },
  legendDot: { width: 7, height: 7, borderRadius: "50%" },

  weeklyChart: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 90, paddingTop: 10 },
  weeklyCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 },
  weeklyBarStack: { display: "flex", flexDirection: "column-reverse", height: 60, width: 16, justifyContent: "flex-start" },
  weeklyBarSeg: { width: "100%", borderRadius: 3, minHeight: 2 },
  weeklyEmptyBar: { width: "100%", height: 2, background: "#1a1a1a", borderRadius: 2, alignSelf: "flex-end" },
  weeklyLabel: { fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", textTransform: "uppercase" },

  freqRow: { display: "flex", alignItems: "center", gap: 10 },
  freqLabel: { fontSize: 12, color: "#999", width: 130, flexShrink: 0 },
  freqCount: { fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace", width: 18, textAlign: "right" },
};
