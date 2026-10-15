import {
  activeAccess,
  learningPurchase,
  visibleLessons,
  requiredLessonIds,
  purchaseAccessState,
  type AppState,
  type Person,
} from './model';

export const areas = ['El Yo', 'Comunicación', 'Producto', 'Negociación'];
export const questions = [
  'Reconozco mis fortalezas y mantengo la confianza al vender.',
  'Escucho y hago preguntas para entender lo que necesita el cliente.',
  'Explico cómo mi producto ayuda a resolver una necesidad concreta.',
  'Me siento cómodo al conversar sobre objeciones y acuerdos.',
];
export const experienceLabels = {
  empezando: 'Estoy empezando',
  'menos-1': 'Menos de un año',
  '1-3': 'Entre 1 y 3 años',
  'mas-3': 'Más de 3 años',
};
export function canFinish(s: AppState, u: Person) {
  const lessons = visibleLessons(s, u.id);
  const ids = requiredLessonIds(s, u.id);
  return (
    !!u.initialAssessment &&
    !!activeAccess(s, u.id) &&
    lessons.length > 0 &&
    lessons.length === ids.length &&
    lessons.every((l) => u.completed.includes(l.id)) &&
    (!activeAccess(s, u.id)?.requireReviews ||
      lessons.every((l) =>
        s.submissions.some(
          (x) =>
            x.userId === u.id &&
            x.lessonId === l.id &&
            x.status === 'aprobada' &&
            (!x.purchaseId || x.purchaseId === activeAccess(s, u.id)?.id),
        ),
      ))
  );
}
export const hasAttended = (s: AppState, userId: string) =>
  s.bookings.some(
    (b) =>
      b.userId === userId &&
      b.status === 'realizada' &&
      b.purchaseId === learningPurchase(s, userId)?.id,
  );
export const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
export const numberLabel = (value: number | null) =>
  value === null ? '—' : value.toLocaleString('es-PE', { maximumFractionDigits: 1 });
export const deltaLabel = (value: number | null) =>
  value === null ? '—' : `${value > 0 ? '+' : ''}${numberLabel(value)}`;
export type Period = { from: string; to: string };
export const allTime: Period = { from: '', to: '' };
const limaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
export function inPeriod(date: string | null, period: Period) {
  if (!period.from && !period.to) return true;
  if (!date || !Number.isFinite(Date.parse(date))) return false;
  const day = limaDate.format(new Date(date));
  return (!period.from || day >= period.from) && (!period.to || day <= period.to);
}
// Historical activity uses the scheduled session date, including cancelled/refunded bookings.
export function sessionActivity(s: AppState, userIds: string[], period: Period = allTime) {
  const bookings = s.bookings.filter(
    (b) =>
      userIds.includes(b.userId) &&
      inPeriod(s.slots.find((slot) => slot.id === b.slotId)?.date ?? null, period),
  );
  return {
    total: bookings.length,
    reserved: bookings.filter((b) => b.status === 'confirmada').length,
    attended: bookings.filter((b) => b.status === 'realizada').length,
    cancelled: bookings.filter((b) => b.status === 'cancelada').length,
    minutes: bookings
      .filter((b) => b.status === 'realizada')
      .reduce((sum, b) => sum + (s.slots.find((slot) => slot.id === b.slotId)?.minutes ?? 0), 0),
  };
}
// The current balance is intentionally independent of the historical period filter.
export function sessionBalance(s: AppState, userIds: string[]) {
  const purchases = s.purchases.filter(
    (p) => userIds.includes(p.userId) && purchaseAccessState(p) === 'vigente',
  );
  return purchases.reduce(
    (totals, p) => {
      const bookings = s.bookings.filter((b) => b.purchaseId === p.id);
      const reserved = bookings.filter((b) => b.status === 'confirmada').length;
      const attended = bookings.filter((b) => b.status === 'realizada').length;
      return {
        acquired: totals.acquired + p.sessions,
        reserved: totals.reserved + reserved,
        attended: totals.attended + attended,
        available: totals.available + Math.max(0, p.sessions - reserved - attended),
      };
    },
    { acquired: 0, reserved: 0, attended: 0, available: 0 },
  );
}
export function summarize(s: AppState, users: Person[], period: Period = allTime) {
  const paired = users.filter(
    (u) => u.initialAssessment && u.finalAssessment && inPeriod(u.finalAssessment.date, period),
  );
  const respondents = users.filter(
    (u) => u.satisfaction && inPeriod(u.satisfaction.updatedAt, period),
  );
  const eligible = users.filter((u) => u.finalAssessment);
  return {
    paired,
    respondents,
    eligible,
    areas: areas.map((name, i) => ({
      name,
      initial: mean(paired.map((u) => u.initialAssessment!.values[i])),
      final: mean(paired.map((u) => u.finalAssessment!.values[i])),
      delta: mean(paired.map((u) => u.finalAssessment!.values[i] - u.initialAssessment!.values[i])),
    })),
    delta: mean(
      paired.map((u) => mean(u.finalAssessment!.values)! - mean(u.initialAssessment!.values)!),
    ),
    overall: mean(respondents.map((u) => u.satisfaction!.overall)),
    learning: mean(respondents.map((u) => u.satisfaction!.learning)),
    mentoring: mean(
      respondents.flatMap((u) =>
        u.satisfaction!.mentoring === null ? [] : [u.satisfaction!.mentoring],
      ),
    ),
    mentoringResponses: respondents.filter((u) => u.satisfaction!.mentoring !== null).length,
    balance: sessionBalance(
      s,
      users.map((u) => u.id),
    ),
    activity: sessionActivity(
      s,
      users.map((u) => u.id),
      period,
    ),
  };
}
// Spreadsheet cells can contain learner-supplied text; neutralize formula prefixes including whitespace.
export function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${(/^[\s]*[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`;
}
export function resultsCsv(s: AppState, users: Person[], period: Period) {
  const headings = [
    'Nombre',
    'Correo',
    'Desde (Lima)',
    'Hasta (Lima)',
    'Experiencia',
    'Contexto',
    'Estilo',
    'Objetivo actual',
    'Objetivo inicial',
    'Fecha inicial',
    'Fecha final (en periodo)',
    ...areas.map((a) => `Inicial: ${a}`),
    ...areas.map((a) => `Final: ${a} (en periodo)`),
    'Satisfacción general (1-5)',
    'Utilidad (1-5)',
    'Mentoría (1-5)',
    'Comentario',
    'Actualización encuesta (en periodo)',
    'Cupos habilitados (actual)',
    'Disponibles (actual)',
    'Reservas confirmadas (periodo)',
    'Realizadas (periodo)',
    'Canceladas (periodo)',
    'Minutos realizados (periodo)',
  ];
  const rows = users.map((u) => {
    const final =
      u.finalAssessment && inPeriod(u.finalAssessment.date, period) ? u.finalAssessment : null;
    const survey =
      u.satisfaction && inPeriod(u.satisfaction.updatedAt, period) ? u.satisfaction : null;
    const balance = sessionBalance(s, [u.id]),
      activity = sessionActivity(s, [u.id], period);
    return [
      u.name,
      u.email,
      period.from || 'Todo',
      period.to || 'Todo',
      u.onboarding ? experienceLabels[u.onboarding.experience] : '',
      u.onboarding?.context,
      u.onboarding?.style,
      u.goal,
      u.initialAssessment?.goal,
      u.initialAssessment ? (u.initialAssessment.date ?? 'Registro anterior sin fecha') : '',
      final?.date,
      ...(u.initialAssessment?.values ?? ['', '', '', '']),
      ...(final?.values ?? ['', '', '', '']),
      survey?.overall,
      survey?.learning,
      survey?.mentoring,
      survey?.comment,
      survey?.updatedAt,
      balance.acquired,
      balance.available,
      activity.reserved,
      activity.attended,
      activity.cancelled,
      activity.minutes,
    ];
  });
  return '\uFEFF' + [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}
