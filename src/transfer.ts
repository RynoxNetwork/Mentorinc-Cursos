import { parseStoredState, safeUrl } from './model';
export function readBackup(text: string) {
  if (text.length > 7_000_000)
    throw new Error('La copia supera el límite de 7 MB de esta demostración.');
  let s;
  try {
    s = parseStoredState(JSON.parse(text));
  } catch {
    throw new Error('El archivo no es una copia válida de Impulso o su versión no es compatible.');
  }
  const unique = (items: { id: string }[]) => new Set(items.map((i) => i.id)).size === items.length;
  if (
    ![s.users, s.programs, s.modules, s.lessons, s.purchases, s.tickets, s.policies, s.cases].every(
      unique,
    )
  )
    throw new Error('La copia contiene identificadores duplicados.');
  if (
    s.lessons.some(
      (l) =>
        !safeUrl(l.video) || !safeUrl(l.resource) || !s.modules.some((m) => m.id === l.moduleId),
    ) ||
    s.bookings.some((b) => !safeUrl(b.meeting)) ||
    s.notices.some((n) => !/^\/(?!\/)/.test(n.href))
  )
    throw new Error('La copia contiene enlaces o módulos inválidos.');
  if (
    s.purchases.some(
      (p) =>
        !s.users.some((u) => u.id === p.userId) ||
        !s.programs.some((x) => x.id === p.programId) ||
        (p.lessonIds &&
          (new Set(p.lessonIds).size !== p.lessonIds.length ||
            p.lessonIds.some((id) => !s.lessons.some((l) => l.id === id)))),
    )
  )
    throw new Error('Una compra no tiene alumno, programa o temario válido.');
  if (
    s.submissions
      .flatMap((a) => [a.attachment, ...(a.revisions ?? []).map((r) => r.attachment)])
      .some(
        (attachment) =>
          attachment &&
          (attachment.data.length > 700000 ||
            !/^data:(application\/pdf|text\/plain|image\/(png|jpeg|webp));base64,/.test(
              attachment.data,
            )),
      )
  )
    throw new Error('La copia contiene adjuntos no admitidos.');
  const dates = [
    ...s.purchases.map((p) => p.date),
    ...s.slots.map((p) => p.date),
    ...s.notices.map((p) => p.date),
    ...s.submissions.map((p) => p.date),
    ...s.threads.flatMap((t) => t.messages.map((m) => m.date)),
  ];
  if (dates.some((d) => !Number.isFinite(Date.parse(d))))
    throw new Error('La copia contiene fechas inválidas.');
  const dateKeys = new Set([
    'date',
    'expires',
    'updatedAt',
    'createdAt',
    'registeredAt',
    'firstLearningAt',
    'approvedAt',
    'expiresAt',
    'reviewedAt',
    'trainingAt',
  ]);
  function validateDates(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (
        dateKeys.has(key) &&
        typeof item === 'string' &&
        item &&
        !Number.isFinite(Date.parse(item))
      )
        throw new Error('La copia contiene fechas inválidas.');
      validateDates(item);
    }
  }
  validateDates(s);
  return { ...s, session: null };
}
