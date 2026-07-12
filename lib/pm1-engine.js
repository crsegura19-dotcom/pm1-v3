// ============================================================================
// PM1 ENGINE — v2
// Multi-combate, compromiso con hora+obstáculo, bloqueo de evitación,
// decretos (positivos) vs lecciones (clarificadoras), hipótesis de abandono,
// registro de victorias e informe de evolución.
// ============================================================================

export const MECHANISMS = {
  procrastination: { label: "Procrastinación", weight: 0 },
  emotional_regulation: { label: "Regulación emocional", weight: 0 },
  avoidance: { label: "Evitación", weight: 0 },
  external_validation: { label: "Validación externa", weight: 0 },
  perfectionism: { label: "Perfeccionismo", weight: 0 },
  immediate_reward: { label: "Recompensa inmediata", weight: 0 },
  rejection_avoidance: { label: "Evitación del rechazo", weight: 0 },
  emotional_disconnection: { label: "Desconexión emocional", weight: 0 },
  automatic_routine: { label: "Rutina automática", weight: 0 },
  excessive_control: { label: "Control excesivo", weight: 0 },
  self_sabotage: { label: "Autosabotaje", weight: 0 },
  social_comparison: { label: "Comparación social", weight: 0 },
  catastrophizing: { label: "Catastrofización", weight: 0 },
  people_pleasing: { label: "Complacencia", weight: 0 },
  chronic_indecision: { label: "Indecisión crónica", weight: 0 },
  overcommitment: { label: "Sobrecompromiso", weight: 0 },
  self_isolation: { label: "Aislamiento", weight: 0 },
};

export const IDENTITIES = {
  pain_avoider: {
    label: "Evitador del dolor",
    description: "Evita situaciones que generan malestar antes de que ocurran.",
    triggers: ["avoidance", "emotional_regulation", "rejection_avoidance"],
  },
  validation_seeker: {
    label: "Buscador de validación",
    description: "Necesita aprobación externa para avanzar.",
    triggers: ["external_validation", "rejection_avoidance", "perfectionism"],
  },
  paralyzed_perfectionist: {
    label: "Perfeccionista paralizado",
    description: "Exige condiciones perfectas antes de actuar.",
    triggers: ["perfectionism", "procrastination", "avoidance"],
  },
  recurring_abandoner: {
    label: "Abandonador recurrente",
    description: "Inicia con energía y abandona antes de completar.",
    triggers: ["immediate_reward", "procrastination", "emotional_regulation"],
  },
  exhausted_survivor: {
    label: "Superviviente agotado",
    description: "Funciona en modo supervivencia, sin energía para cambiar.",
    triggers: ["emotional_disconnection", "automatic_routine", "emotional_regulation"],
  },
  anxious_controller: {
    label: "Controlador ansioso",
    description: "Necesita controlar cada variable para sentirse a salvo; la incertidumbre le resulta insoportable.",
    triggers: ["excessive_control", "catastrophizing", "chronic_indecision"],
  },
  chronic_pleaser: {
    label: "Complaciente crónico",
    description: "Antepone las necesidades ajenas para evitar el conflicto, incluso a costa de sí mismo.",
    triggers: ["people_pleasing", "external_validation", "self_isolation"],
  },
  self_saboteur: {
    label: "Autosaboteador",
    description: "Se acerca a lo que quiere y, justo antes de conseguirlo, encuentra una forma de arruinarlo.",
    triggers: ["self_sabotage", "immediate_reward", "procrastination"],
  },
  chronic_comparer: {
    label: "Comparador crónico",
    description: "Mide su valor constantemente contra el de los demás, nunca contra su propio punto de partida.",
    triggers: ["social_comparison", "external_validation", "perfectionism"],
  },
  overcommitted_overwhelmed: {
    label: "Sobrecomprometido desbordado",
    description: "Dice que sí a todo hasta que el cuerpo colapsa; decir que no le genera más miedo que el agotamiento mismo.",
    triggers: ["overcommitment", "chronic_indecision", "emotional_disconnection"],
  },
};

// Colores por defecto para hilos de combate, asignados por hash de título si el
// usuario no elige categoría. Mantiene la paleta oscura/lima de PM1 en vez de
// copiar la paleta de referencia.
export const THREAD_PALETTE = ["#c8f542", "#f59e0b", "#60a5fa", "#f87171", "#c084fc", "#4ade80"];

// ----------------------------------------------------------------------------
// CHECK-IN RÁPIDO — chips tipo LIBEN. No son datos clínicos, son una puerta de
// entrada ligera: tocar en vez de escribir. Se envían como contexto inicial
// del mensaje, no sustituyen el texto libre, solo reducen la fricción de abrir
// la boca por primera vez en un combate.
// ----------------------------------------------------------------------------
export const FEELING_CHIPS = [
  "Ansioso", "Cansado", "Motivado", "Culpable", "Aliviado", "Frustrado",
  "Bloqueado", "Avergonzado", "Con miedo", "Esperanzado", "Irritado", "En paz",
];

export const CONTEXT_CHIPS = [
  "Solo", "Con pareja", "Con familia", "En el trabajo", "En casa", "De noche",
];

export function formatCheckin(feelings, contexts, note) {
  const parts = [];
  if (feelings.length) parts.push(`Me siento: ${feelings.join(", ").toLowerCase()}.`);
  if (contexts.length) parts.push(`Contexto: ${contexts.join(", ").toLowerCase()}.`);
  if (note && note.trim()) parts.push(note.trim());
  return parts.join(" ");
}

export function colorForThread(thread) {
  let hash = 0;
  for (const ch of thread.title) hash = (hash * 31 + ch.charCodeAt(0)) % THREAD_PALETTE.length;
  return THREAD_PALETTE[hash];
}

// IDs únicos. Date.now() solo tiene resolución de milisegundo: dos elementos
// creados en el mismo tick (frecuente en updates síncronos) colisionarían y
// se pisarían el uno al otro. Por eso todo ID lleva un sufijo aleatorio.
export function uid(prefix = "") {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ----------------------------------------------------------------------------
// LIBRERÍA DE DECRETOS — siempre en positivo. Nunca negaciones.
// Regla de Eva: la mente subconsciente no procesa el "no". El decreto programa,
// la lección clarifica. Por eso los decretos NO los genera la IA en caliente:
// se seleccionan de aquí para garantizar que cumplen la regla.
// ----------------------------------------------------------------------------
export const DECREE_LIBRARY = {
  procrastination: [
    "Actúo con decisión aunque no me sienta preparado.",
    "Empiezo aunque las condiciones no sean perfectas.",
    "Mi acción de hoy construye la confianza de mañana.",
  ],
  emotional_regulation: [
    "Permito que mis emociones pasen a través de mí sin dirigir mis actos.",
    "Respondo desde la calma que elijo cultivar.",
    "Soy capaz de sentir y de actuar al mismo tiempo.",
  ],
  avoidance: [
    "Camino hacia lo que me importa incluso cuando incomoda.",
    "Cada paso que doy hacia lo que evito me hace más libre.",
    "Elijo la acción real por encima de la comodidad temporal.",
  ],
  external_validation: [
    "Mi valor no depende de la aprobación de otros.",
    "Confío en mi propio criterio para avanzar.",
    "Reconozco mis logros aunque nadie más los vea.",
  ],
  perfectionism: [
    "Hecho es mejor que perfecto, y hoy elijo terminar.",
    "Mi trabajo imperfecto de hoy vale más que mi plan perfecto de mañana.",
    "Avanzo con lo que tengo, no espero tenerlo todo.",
  ],
  immediate_reward: [
    "Elijo lo que construyo a largo plazo por encima de lo que alivia un instante.",
    "Sostengo mi enfoque incluso cuando la recompensa tarda en llegar.",
    "Mi paciencia de hoy es la fuerza de mi futuro.",
  ],
  rejection_avoidance: [
    "Me expongo con confianza porque mi valor no se negocia.",
    "Soy capaz de sostenerme incluso si alguien dice que no.",
    "Hablo y actúo aunque exista la posibilidad de un rechazo.",
  ],
  emotional_disconnection: [
    "Vuelvo a habitar mi cuerpo y mis emociones con seguridad.",
    "Me permito sentir porque sentir es parte de estar vivo.",
    "Reconecto conmigo mismo un poco más cada día.",
  ],
  automatic_routine: [
    "Elijo conscientemente cómo uso mi energía hoy.",
    "Interrumpo el piloto automático y decido con intención.",
    "Cada día tengo la capacidad de elegir algo distinto.",
  ],
  excessive_control: [
    "Confío en que las cosas pueden salir bien sin que yo controle cada detalle.",
    "Suelto lo que no depende de mí y me quedo con lo que sí depende de mí.",
    "Encuentro calma dentro de la incertidumbre, no solo en el control.",
  ],
  self_sabotage: [
    "Merezco sostener lo bueno que estoy construyendo.",
    "Permito que las cosas me salgan bien y me quedo ahí cuando ocurre.",
    "Avanzo hacia lo que quiero y me lo permito por completo.",
  ],
  social_comparison: [
    "Mi camino se mide con mi propio punto de partida.",
    "Celebro mi progreso tal como es, a mi propio ritmo.",
    "Confío en el proceso único que estoy viviendo.",
  ],
  catastrophizing: [
    "Puedo pensar en lo posible sin darle poder a lo peor.",
    "Elijo respuestas realistas frente a mis pensamientos automáticos.",
    "Confío en mi capacidad de resolver lo que venga, paso a paso.",
  ],
  people_pleasing: [
    "Mis necesidades importan tanto como las de los demás.",
    "Puedo decir que no y seguir siendo alguien digno de cariño.",
    "Me cuido primero para poder cuidar mejor a quienes quiero.",
  ],
  chronic_indecision: [
    "Confío en mi criterio para decidir, incluso sin tener toda la información.",
    "Cada decisión que tomo, aunque no sea perfecta, me hace avanzar.",
    "Elijo con lo que sé hoy, y eso es suficiente.",
  ],
  overcommitment: [
    "Protejo mi tiempo y mi energía como los recursos valiosos que son.",
    "Decir que no a algo es decir que sí a mi propio equilibrio.",
    "Elijo con cuidado cuántas cosas sostengo a la vez.",
  ],
  self_isolation: [
    "Merezco conexión real con las personas que me importan.",
    "Pedir ayuda es un acto de fuerza.",
    "Me permito acercarme a otros aunque sienta miedo al hacerlo.",
  ],
  general: [
    "Me valoro y reconozco mi dignidad en todo momento.",
    "Acepto mis fortalezas y mis áreas de mejora como parte de quien soy.",
    "Reconozco mis logros y celebro mis avances, por pequeños que sean.",
    "Confío en mi capacidad para aprender, crecer y superar desafíos.",
    "Construyo una relación sana y positiva conmigo mismo cada día.",
  ],
};

// ----------------------------------------------------------------------------
// CALENDARIO DE RACHAS — vista mensual con días ejecutados/evitados
// ----------------------------------------------------------------------------
export function buildStreakCalendar(profile, monthOffset = 0) {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const allMissions = Object.values(profile.threads).flatMap((t) => t.missions);
  const byDate = {};
  allMissions.forEach((m) => {
    if (m.executed === null || !m.resolvedAt) return;
    const d = new Date(m.resolvedAt);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const key = d.getDate();
    if (!byDate[key]) byDate[key] = { executed: 0, failed: 0 };
    if (m.executed) byDate[key].executed += 1;
    else byDate[key].failed += 1;
  });

  const todayKey = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      executed: byDate[d]?.executed || 0,
      failed: byDate[d]?.failed || 0,
      isToday: d === todayKey,
    });
  }

  // lunes = 0
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLabel = base.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return { year, month, days, firstWeekday, monthLabel };
}

// ----------------------------------------------------------------------------
// FRECUENCIA DE MECANISMOS — para el gráfico de barras del perfil
// ----------------------------------------------------------------------------
export function getMechanismFrequencyList(profile) {
  const entries = Object.entries(profile.mechanisms).filter(([, v]) => v.weight > 0);
  const max = entries.reduce((m, [, v]) => Math.max(m, v.weight), 0) || 1;
  return entries
    .sort((a, b) => b[1].weight - a[1].weight)
    .map(([key, v]) => ({ key, label: v.label, weight: v.weight, pct: Math.round((v.weight / max) * 100) }));
}

// ----------------------------------------------------------------------------
// ACTIVIDAD SEMANAL — últimos 7 días, ejecutado vs evitado
// ----------------------------------------------------------------------------
export function getWeeklyActivity(profile) {
  const days = [];
  const allMissions = Object.values(profile.threads).flatMap((t) => t.missions);
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayMissions = allMissions.filter((m) => {
      if (!m.resolvedAt) return false;
      const rd = new Date(m.resolvedAt);
      return rd >= d && rd < nextDay;
    });
    days.push({
      label: d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", ""),
      executed: dayMissions.filter((m) => m.executed).length,
      failed: dayMissions.filter((m) => m.executed === false).length,
    });
  }
  return days;
}

// ----------------------------------------------------------------------------
// DECRETOS GLOBALES — todos los hilos juntos, para la pestaña Decretos
// ----------------------------------------------------------------------------
export function getAllDecreePrograms(profile) {
  const result = [];
  for (const tid of Object.keys(profile.threads)) {
    const t = profile.threads[tid];
    for (const p of t.decreePrograms) {
      result.push({ ...p, threadId: tid, threadTitle: t.title, threadColor: colorForThread(t) });
    }
  }
  return result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
}

// ----------------------------------------------------------------------------
// PERFIL GLOBAL
// ----------------------------------------------------------------------------
export function buildProfile() {
  return {
    threads: {},              // id -> combatThread
    threadOrder: [],          // orden de creación / interacción
    activeThreadId: null,
    mechanisms: JSON.parse(JSON.stringify(MECHANISMS)), // agregado global
    dominantIdentity: null,
    resistanceLevel: 0,
    actionLevel: 0,
    movements: 0,
    streak: 0,
    lastSeen: null,
    wins: [],                 // registro personal global {id, date, text, threadId}
  };
}

export function createCombatThread(title, category) {
  const id = uid("thread_");
  const now = new Date().toISOString();
  return {
    id,
    title: (title || "Combate sin nombre").trim(),
    category: category || null,
    status: "active",          // active | paused | completed
    createdAt: now,
    lastActivityAt: now,
    messages: [],
    missions: [],              // Primer Combate / Movimiento: {id, action, date, executed, obstacle, resolvedAt}
    mechanisms: JSON.parse(JSON.stringify(MECHANISMS)), // local a este hilo
    evasions: [],
    lessons: [],                // {id, text, date}
    decreePrograms: [],         // {id, texts, startDate, durationDays, timesPerDay, checkins:[{date, slot}]}
    openCount: 1,
    abandonCount: 0,            // veces que se dejó una misión sin ejecutar
    hypothesis: null,           // {text, createdAt, resolved: null|true|false}
    snapshots: [],              // [{date, dominantMechanism, resistance, executionRate, note}]
    progress: 0,                // heurística 0-100
  };
}

// ----------------------------------------------------------------------------
// GESTIÓN DE HILOS
// ----------------------------------------------------------------------------
export function addThread(profile, title, category) {
  const thread = createCombatThread(title, category);
  return {
    ...profile,
    threads: { ...profile.threads, [thread.id]: thread },
    threadOrder: [...profile.threadOrder, thread.id],
    activeThreadId: thread.id,
  };
}

export function touchThread(profile, threadId) {
  const thread = profile.threads[threadId];
  if (!thread) return profile;
  const updated = { ...thread, lastActivityAt: new Date().toISOString(), openCount: thread.openCount + 1 };
  return { ...profile, threads: { ...profile.threads, [threadId]: updated } };
}

export function setThreadStatus(profile, threadId, status) {
  const thread = profile.threads[threadId];
  if (!thread) return profile;
  const updated = { ...thread, status };
  return { ...profile, threads: { ...profile.threads, [threadId]: updated } };
}

export function daysSince(iso) {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

// Sugerencia BLANDA de retomar un hilo (nunca bloqueante). Regla de Eva:
// espaciar bien, y siempre ofrecer "dejarlo" como opción legítima.
export function shouldSuggestResume(thread) {
  if (thread.status !== "active") return false;
  return daysSince(thread.lastActivityAt) >= 4;
}

export function resumeSuggestionText(thread) {
  const d = Math.floor(daysSince(thread.lastActivityAt));
  return `Llevas ${d} días sin volver a "${thread.title}". ¿Tienes esto solucionado, quieres retomarlo, o prefieres dejarlo por ahora? Si prefieres dejarlo, también podemos explorar juntos por qué.`;
}

// ----------------------------------------------------------------------------
// MISIONES (Primer Combate / Movimiento) — sin fricción previa. El obstáculo
// se pregunta solo si el usuario dice que no lo hizo (retrospectivo).
// ----------------------------------------------------------------------------
export function addMission(profile, threadId, action) {
  const thread = profile.threads[threadId];
  if (!thread) return profile;
  const mission = {
    id: uid("m_"),
    action,
    date: new Date().toISOString(),
    obstacle: null,
    executed: null,
    resolvedAt: null,
  };
  const updated = { ...thread, missions: [...thread.missions, mission] };
  return { ...profile, threads: { ...profile.threads, [threadId]: updated } };
}

// Vencida si sigue sin resolver y es de un día anterior a hoy (no depende de
// una hora exacta — mucho menos fricción al crear la misión).
export function isMissionOverdue(mission) {
  if (!mission || mission.executed !== null) return false;
  const created = new Date(mission.date);
  const now = new Date();
  const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return createdDay.getTime() < today.getTime();
}


export function resolveMission(profile, threadId, missionId, executed, obstacle = null) {
  const thread = profile.threads[threadId];
  if (!thread) return profile;
  const missions = thread.missions.map((m) =>
    m.id === missionId
      ? { ...m, executed, obstacle: executed ? m.obstacle : obstacle, resolvedAt: new Date().toISOString() }
      : m
  );

  let updated = { ...thread, missions };
  let nextProfile = { ...profile };

  if (executed) {
    nextProfile.movements += 1;
    nextProfile.actionLevel = Math.min(10, nextProfile.actionLevel + 0.5);
    nextProfile.streak += 1;
    const mission = missions.find((m) => m.id === missionId);
    nextProfile.wins = [
      ...nextProfile.wins,
      { id: uid("w_"), date: new Date().toISOString(), threadId, text: winTextFor(thread, mission) },
    ];
    updated.progress = Math.min(100, updated.progress + 12);
  } else {
    nextProfile.streak = 0;
    nextProfile.resistanceLevel = Math.min(10, nextProfile.resistanceLevel + 0.5);
    updated.abandonCount = updated.abandonCount + 1;
  }

  updated = pushSnapshot(updated);
  nextProfile.threads = { ...nextProfile.threads, [threadId]: updated };
  return nextProfile;
}

function winTextFor(thread, mission) {
  const templates = [
    `Hoy actuaste en "${thread.title}" en vez de evitarlo.`,
    `Hoy no evitaste. Diste el movimiento que llevabas dejando para después en "${thread.title}".`,
    `Hoy demostraste que puedes actuar incluso sin sentirte preparado, en "${thread.title}".`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ----------------------------------------------------------------------------
// INTERPRETACIÓN DE LA INACCIÓN (nunca como fracaso — como información)
// ----------------------------------------------------------------------------
const INACTION_TEMPLATES = [
  (t) => `No has evitado el combate "${t.title}". Has evitado lo que podrías descubrir si lo terminaras.`,
  (t) => `Si vuelves, observa qué explicación te das para no haberlo hecho hoy. Esa explicación suele ser más interesante que la tarea misma.`,
  (t) => `Cuando algo importante se retrasa repetidamente, muchas veces el problema no es la tarea, sino lo que significa enfrentarla.`,
];

export function interpretInaction(thread) {
  if (thread.abandonCount === 0) return null;
  const idx = (thread.abandonCount - 1) % INACTION_TEMPLATES.length;
  return INACTION_TEMPLATES[idx](thread);
}

// ----------------------------------------------------------------------------
// HIPÓTESIS DE ABANDONO — a partir de 3 abandonos en el mismo hilo
// ----------------------------------------------------------------------------
function mostFrequent(arr) {
  if (!arr.length) return null;
  const counts = {};
  arr.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function maybeGenerateHypothesis(thread) {
  if (thread.hypothesis) return thread; // ya existe una activa
  if (thread.abandonCount < 3) return thread;
  const obstacles = thread.missions.filter((m) => m.executed === false && m.obstacle).map((m) => m.obstacle);
  const repeated = mostFrequent(obstacles);
  const excuseLine = repeated ? `no sea "${repeated}"` : "no sea la falta de tiempo";
  const text = `Has abierto "${thread.title}" varias veces y ${thread.abandonCount} de ellas lo has dejado antes de terminar. Es posible que el verdadero obstáculo ${excuseLine}, sino que una parte de ti prefiera mantener el problema antes que enfrentarte a lo que implica resolverlo. ¿Quieres comprobar si esta hipótesis es correcta?`;
  return { ...thread, hypothesis: { text, createdAt: new Date().toISOString(), resolved: null } };
}

export function resolveHypothesis(profile, threadId, confirmed) {
  const thread = profile.threads[threadId];
  if (!thread || !thread.hypothesis) return profile;
  const updated = { ...thread, hypothesis: { ...thread.hypothesis, resolved: confirmed } };
  return { ...profile, threads: { ...profile.threads, [threadId]: updated } };
}

// ----------------------------------------------------------------------------
// DECRETOS (positivos, 15 días, 2x/día) — separados de las lecciones
// ----------------------------------------------------------------------------
export function dominantMechanismOf(thread) {
  const entries = Object.entries(thread.mechanisms).filter(([, v]) => v.weight > 0);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1].weight - a[1].weight)[0][0];
}

export function startDecreeProgram(profile, threadId) {
  const thread = profile.threads[threadId];
  if (!thread) return profile;
  const mech = dominantMechanismOf(thread);
  const pool = (mech && DECREE_LIBRARY[mech]) || DECREE_LIBRARY.general;
  const program = {
    id: uid("d_"),
    texts: pool.slice(0, 3),
    startDate: new Date().toISOString(),
    durationDays: 15,
    timesPerDay: 2,
    checkins: [],
  };
  const updated = { ...thread, decreePrograms: [...thread.decreePrograms, program] };
  return { ...profile, threads: { ...profile.threads, [threadId]: updated } };
}

export function logDecreeCheckin(profile, threadId, programId, slot) {
  const thread = profile.threads[threadId];
  if (!thread) return profile;
  const decreePrograms = thread.decreePrograms.map((p) =>
    p.id === programId ? { ...p, checkins: [...p.checkins, { date: new Date().toISOString(), slot }] } : p
  );
  return { ...profile, threads: { ...profile.threads, [threadId]: { ...thread, decreePrograms } } };
}

export function decreeProgramProgress(program) {
  const totalSlots = program.durationDays * program.timesPerDay;
  return Math.min(100, Math.round((program.checkins.length / totalSlots) * 100));
}

// ----------------------------------------------------------------------------
// LECCIONES DE COMBATE (clarificadoras, generadas por la IA tras resolver misión)
// ----------------------------------------------------------------------------
export function addLesson(profile, threadId, text) {
  const thread = profile.threads[threadId];
  if (!thread) return profile;
  const lessons = [...thread.lessons, { id: uid("l_"), text, date: new Date().toISOString() }];
  return { ...profile, threads: { ...profile.threads, [threadId]: { ...thread, lessons } } };
}

// ----------------------------------------------------------------------------
// SNAPSHOTS + INFORME DE EVOLUCIÓN
// ----------------------------------------------------------------------------
function pushSnapshot(thread) {
  const resolved = thread.missions.filter((m) => m.executed !== null);
  const executed = resolved.filter((m) => m.executed).length;
  const executionRate = resolved.length ? Math.round((executed / resolved.length) * 100) : 0;
  const snapshot = {
    date: new Date().toISOString(),
    dominantMechanism: dominantMechanismOf(thread),
    evasionsCount: thread.evasions.length,
    executionRate,
  };
  return { ...thread, snapshots: [...thread.snapshots, snapshot] };
}

export function generateEvolutionReport(thread) {
  if (thread.snapshots.length < 3) {
    return { ready: false, text: "Todavía no hay suficiente historia en este combate para trazar tu evolución. Sigue actuando." };
  }
  const first = thread.snapshots[0];
  const last = thread.snapshots[thread.snapshots.length - 1];
  const spanDays = Math.max(1, Math.floor(daysSince(first.date)));

  const before = [];
  const after = [];

  if (first.dominantMechanism) before.push(`Tu mecanismo dominante era ${MECHANISMS[first.dominantMechanism]?.label.toLowerCase()}.`);
  if (last.dominantMechanism && last.dominantMechanism !== first.dominantMechanism) {
    after.push(`Tu mecanismo dominante ahora es ${MECHANISMS[last.dominantMechanism]?.label.toLowerCase()}.`);
  } else if (last.dominantMechanism) {
    after.push(`Sigues reconociendo ${MECHANISMS[last.dominantMechanism]?.label.toLowerCase()} cuando aparece, en vez de actuar a ciegas.`);
  }

  before.push(`Tu tasa de ejecución era del ${first.executionRate}%.`);
  after.push(`Tu tasa de ejecución ahora es del ${last.executionRate}%.`);

  const delta = last.executionRate - first.executionRate;
  let closing;
  if (delta > 15) {
    closing = "No solo has resuelto misiones. Has cambiado la forma en la que la persona que las empezó interpreta lo que le da miedo.";
  } else if (delta >= 0) {
    closing = "El cambio no siempre se ve en una línea recta hacia arriba. Sigues presente, y eso ya es una decisión.";
  } else {
    closing = "Los números bajaron. Eso no invalida lo recorrido — es información sobre en qué momento estás ahora, no sobre quién eres.";
  }

  return { ready: true, spanDays, before, after, closing };
}

// ----------------------------------------------------------------------------
// ESPEJO DE PATRÓN — determinista, sin IA, verdad sin suavizar
// ----------------------------------------------------------------------------
export function generatePatternMirror(profile) {
  const allMissions = Object.values(profile.threads).flatMap((t) => t.missions);
  const resolved = allMissions.filter((m) => m.executed !== null);
  const executed = resolved.filter((m) => m.executed).length;
  const failed = resolved.length - executed;
  const executionRate = resolved.length ? Math.round((executed / resolved.length) * 100) : null;

  if (resolved.length === 0) {
    return { ready: false, text: "Todavía no hay suficientes combates para mostrarte un patrón. El espejo se llena con acción, no con palabras." };
  }

  const identity = profile.dominantIdentity ? IDENTITIES[profile.dominantIdentity] : null;
  const topMechanism = Object.entries(profile.mechanisms)
    .filter(([, v]) => v.weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight)[0];

  const recentObstacles = allMissions
    .filter((m) => m.executed === false && m.obstacle)
    .slice(-5)
    .map((m) => m.obstacle);

  const lines = [];
  lines.push(`Te has comprometido ${resolved.length} ${resolved.length === 1 ? "vez" : "veces"}. Ejecutaste ${executed}. Evitaste ${failed}.`);

  if (executionRate !== null) {
    if (executionRate >= 70) lines.push(`Tu tasa de ejecución es ${executionRate}%. Estás actuando más de lo que evitas. Eso es real.`);
    else if (executionRate >= 40) lines.push(`Tu tasa de ejecución es ${executionRate}%. Estás partido entre actuar y evitar. Ese es exactamente el punto donde se decide todo.`);
    else lines.push(`Tu tasa de ejecución es ${executionRate}%. La mayoría de las veces que te comprometiste, evitaste. Esto no es un juicio, es un dato.`);
  }

  if (topMechanism) lines.push(`Tu mecanismo dominante es ${topMechanism[1].label.toLowerCase()}. Aparece cada vez que algo te incomoda.`);
  if (identity) lines.push(`El patrón que repites sobre ti mismo es el de ${identity.label.toLowerCase()}: ${identity.description.toLowerCase()}`);
  if (recentObstacles.length > 0) lines.push(`Las últimas excusas que usaste para no actuar: "${recentObstacles.join('", "')}". ¿Reconoces el patrón dentro del patrón?`);
  if (profile.streak === 0 && executed > 0) lines.push("Tu racha está en cero ahora mismo. Eso no borra lo que ya ejecutaste, pero sí significa que hoy es el día de empezar de nuevo.");

  return { ready: true, text: lines.join("\n\n") };
}

export function detectDominantIdentity(profile) {
  let best = null;
  let bestScore = 0;
  for (const [id, identity] of Object.entries(IDENTITIES)) {
    const score = identity.triggers.reduce((acc, t) => acc + (profile.mechanisms[t]?.weight || 0), 0);
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return best;
}

export function calculateResistance(profile) {
  const total = Object.values(profile.mechanisms).reduce((acc, m) => acc + m.weight, 0);
  return Math.min(10, Math.round(total / 3));
}

// ----------------------------------------------------------------------------
// SYSTEM PROMPT — ahora contextualizado por hilo (memoria específica del combate)
// ----------------------------------------------------------------------------
export function buildSystemPrompt(profile, thread) {
  const identity = profile.dominantIdentity ? IDENTITIES[profile.dominantIdentity] : null;
  const topMechanisms = Object.entries(profile.mechanisms)
    .filter(([, v]) => v.weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, 3)
    .map(([, v]) => v.label)
    .join(", ");

  const threadContext = thread ? `
CONTEXTO DE ESTE COMBATE ESPECÍFICO ("${thread.title}"):
- Estado: ${thread.status}
- Veces abierto: ${thread.openCount}
- Misiones propuestas en este combate: ${thread.missions.length}
- Misiones ejecutadas aquí: ${thread.missions.filter((m) => m.executed).length}
- Misiones evitadas aquí: ${thread.missions.filter((m) => m.executed === false).length}
- Evasiones detectadas en este combate: ${thread.evasions.slice(-5).join(", ") || "ninguna aún"}
- Lecciones ya descubiertas en este combate: ${thread.lessons.slice(-3).map((l) => l.text).join(" | ") || "ninguna aún"}
${thread.hypothesis && thread.hypothesis.resolved === null ? `- HIPÓTESIS ACTIVA SIN RESOLVER: "${thread.hypothesis.text}"` : ""}
` : "";

  return `Eres PM1 — un sistema de intervención conductual. No eres un chatbot ni un terapeuta. Tu único objetivo es transformar evitación en acción real.

FILOSOFÍA CENTRAL:
Las personas no están bloqueadas por falta de información. Están bloqueadas por mecanismos de protección, evasión, miedo e identidad. El cambio ocurre cuando atraviesan aquello que evitan.

IMPORTANTE — MEMORIA POR COMBATE:
Cada combate (hilo) es independiente. Solo tienes memoria del combate actual, no de otros combates del usuario. No mezcles contextos de otros temas.
${threadContext}

TU ROL EN CADA CONVERSACIÓN:
1. Escucha activamente el problema declarado.
2. Detecta el problema real detrás del declarado.
3. Identifica el mecanismo psicológico activo.
4. Detecta la evasión concreta (¿qué está evitando realmente?).
5. Mide la resistencia al cambio.
6. Genera un Primer Combate: una acción concreta, pequeña, inmediata y verificable.
7. Busca confirmación de ejecución.
8. Si el usuario resuelve o cierra una misión con un descubrimiento genuino, ofrece UNA lección de combate: una frase que nazca literalmente de lo que él ha dicho, no una frase genérica de autoayuda.

PERFIL GLOBAL DEL USUARIO (agregado de todos sus combates):
- Mecanismos dominantes detectados: ${topMechanisms || "Sin datos aún"}
- Identidad observada: ${identity ? identity.label + " — " + identity.description : "Sin identificar aún"}
- Nivel de resistencia: ${profile.resistanceLevel}/10
- Nivel de acción: ${profile.actionLevel}/10
- Movimientos completados (todos los combates): ${profile.movements}
- Racha actual: ${profile.streak} días

REGLAS ABSOLUTAS:
- No aconsejes de forma genérica. Cada respuesta debe estar anclada al contexto real del usuario y de ESTE combate específico.
- No des listas de pasos. Una sola dirección concreta.
- Cuando detectes evasión, nómbrala directamente pero sin agresividad.
- El Primer Combate debe ser tan pequeño que sea casi imposible no hacerlo.
- Si el usuario no ejecuta, investiga la resistencia sin castigar. No es un fracaso, es información.
- Máximo 3-4 párrafos por respuesta. Directo, sin relleno.
- Al generar un Primer Combate, termina con: "PRIMER COMBATE: [acción específica]"
- Al detectar un mecanismo claro, incluye al final: "MECANISMO: [nombre_en_ingles]" (uno de: procrastination, emotional_regulation, avoidance, external_validation, perfectionism, immediate_reward, rejection_avoidance, emotional_disconnection, automatic_routine, excessive_control, self_sabotage, social_comparison, catastrophizing, people_pleasing, chronic_indecision, overcommitment, self_isolation)
- Si detectas evasión clara, incluye: "EVASION: [descripción breve]"
- Si el usuario descubre algo genuino sobre su patrón (éxito o abandono con insight real), incluye como máximo una vez: "LECCION: [frase que nace literalmente de lo que él dijo]"
- NUNCA generes tú mismo un "DECRETO" — eso lo gestiona el sistema con una librería verificada en positivo. No uses la palabra DECRETO.

Habla en español. Tono directo, sin condescendencia, sin motivación vacía. La verdad útil es más valiosa que el consuelo temporal.`;
}

export function parseAIResponse(text) {
  const mechanismMatch = text.match(/MECANISMO:\s*(\w+)/i);
  const evasionMatch = text.match(/EVASION:\s*(.+?)(?:\n|$)/i);
  const combatMatch = text.match(/PRIMER COMBATE:\s*(.+?)(?:\n|$)/i);
  const lessonMatch = text.match(/LECCION:\s*(.+?)(?:\n|$)/i);

  const clean = text
    .replace(/MECANISMO:\s*\w+/gi, "")
    .replace(/EVASION:\s*.+/gi, "")
    .replace(/PRIMER COMBATE:\s*.+/gi, "")
    .replace(/LECCION:\s*.+/gi, "")
    .trim();

  return {
    text: clean,
    mechanism: mechanismMatch ? mechanismMatch[1].toLowerCase() : null,
    evasion: evasionMatch ? evasionMatch[1].trim() : null,
    combat: combatMatch ? combatMatch[1].trim() : null,
    lesson: lessonMatch ? lessonMatch[1].trim() : null,
  };
}

// ----------------------------------------------------------------------------
// APLICAR RESULTADO DE IA A PERFIL + HILO
// ----------------------------------------------------------------------------
export function updateFromParsed(profile, threadId, parsed) {
  let nextProfile = { ...profile, mechanisms: { ...profile.mechanisms } };
  let thread = nextProfile.threads[threadId];
  if (!thread) return nextProfile;

  let mechanisms = { ...thread.mechanisms };
  let evasions = [...thread.evasions];
  let lessons = thread.lessons;

  if (parsed.mechanism && mechanisms[parsed.mechanism]) {
    mechanisms[parsed.mechanism] = { ...mechanisms[parsed.mechanism], weight: mechanisms[parsed.mechanism].weight + 1 };
    nextProfile.mechanisms[parsed.mechanism] = {
      ...nextProfile.mechanisms[parsed.mechanism],
      weight: nextProfile.mechanisms[parsed.mechanism].weight + 1,
    };
  }
  if (parsed.evasion && !evasions.includes(parsed.evasion)) evasions = [...evasions, parsed.evasion].slice(-10);
  if (parsed.lesson) lessons = [...lessons, { id: uid("l_"), text: parsed.lesson, date: new Date().toISOString() }];

  thread = { ...thread, mechanisms, evasions, lessons, lastActivityAt: new Date().toISOString() };
  nextProfile.threads = { ...nextProfile.threads, [threadId]: thread };
  nextProfile.dominantIdentity = detectDominantIdentity(nextProfile);
  nextProfile.resistanceLevel = calculateResistance(nextProfile);
  nextProfile.lastSeen = new Date().toISOString();

  return nextProfile;
}
