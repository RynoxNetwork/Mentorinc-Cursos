import { describe, expect, it, vi } from 'vitest';
import { createSeed } from './seed';
import { execute } from './domain';
import { availableSlots, parseStoredState, visibleLessons } from './model';
import { loadState } from './store';
import {
  allTime,
  canFinish,
  csvCell,
  inPeriod,
  resultsCsv,
  sessionActivity,
  sessionBalance,
  summarize,
} from './insights';

const context = {
  experience: '1-3' as const,
  context: 'Vendo servicios a pequeñas empresas.',
  style: 'Me gusta escuchar antes de presentar una propuesta.',
};
function completed() {
  const s = createSeed();
  s.users[0].completed = visibleLessons(s).map((l) => l.id);
  return s;
}
function withFinal() {
  return execute(completed(), {
    type: 'finalAssessment',
    values: [4, 4, 3, 3],
    reflection: 'Ahora pregunto por el contexto antes de ofrecer una solución.',
  });
}
describe('Medición y contexto local', () => {
  it('migra v1 sin perder datos ni inventar fechas o encuestas y es idempotente', () => {
    const legacy = JSON.parse(JSON.stringify(createSeed()));
    legacy.version = 1;
    for (const user of legacy.users) {
      delete user.onboarding;
      delete user.initialAssessment;
      delete user.finalAssessment;
      delete user.satisfaction;
    }
    const before = JSON.stringify(legacy);
    const loaded = loadState({ getItem: () => before });
    expect(loaded.error).toBe('');
    expect(loaded.state.version).toBe(3);
    expect(loaded.state.users[0].initialAssessment).toMatchObject({
      values: [3, 2, 4, 3],
      date: null,
      source: 'anterior',
    });
    expect(loaded.state.users[0].satisfaction).toBeNull();
    expect(loaded.state.users[0].completed).toEqual(legacy.users[0].completed);
    expect(loaded.state.purchases).toMatchObject(legacy.purchases);
    expect(loaded.state.session).toBe(legacy.session);
    expect(parseStoredState(loaded.state)).toEqual(loaded.state);
    expect(JSON.stringify(legacy)).toBe(before);
    legacy.users[0].diagnostic = [];
    expect(parseStoredState(legacy).users[0].initialAssessment).toBeNull();
  });
  it('captura el inicio una vez y actualizar contexto u objetivo no lo reemplaza ni cambia el foco del mentor', () => {
    const fresh = createSeed();
    fresh.users[0].initialAssessment = null;
    let s = execute(fresh, {
      type: 'diagnostic',
      accepted: true,
      values: [3, 2, 4, 3],
      goal: 'Aprender a iniciar conversaciones.',
      context,
    });
    const baseline = structuredClone(s.users[0].initialAssessment);
    s.session = 'ana';
    s = execute(s, { type: 'route', userId: 'maria', focus: 'neg' });
    s.session = 'maria';
    s = execute(s, {
      type: 'onboarding',
      context: { ...context, experience: 'mas-3' },
      goal: 'Preparar mejores acuerdos comerciales.',
    });
    expect(s.users[0].initialAssessment).toEqual(baseline);
    expect(s.users[0].focus).toBe('neg');
    expect(s.users[0].onboarding?.experience).toBe('mas-3');
    expect(() =>
      execute(s, {
        type: 'diagnostic',
        accepted: true,
        values: [5, 5, 5, 5],
        goal: 'Reemplazar mis respuestas.',
        context,
      }),
    ).toThrow('ya está guardada');
    expect(() =>
      execute(s, {
        type: 'onboarding',
        goal: 'Objetivo válido.',
        context: { ...context, style: ' ' },
      }),
    ).toThrow();
  });
  it('el cierre requiere acceso, inicio y todas las lecciones, sin usar el redondeo del porcentaje', () => {
    const s = createSeed();
    expect(canFinish(s, s.users[0])).toBe(false);
    expect(() =>
      execute(s, {
        type: 'finalAssessment',
        values: [5, 5, 5, 5],
        reflection: 'Una reflexión suficiente.',
      }),
    ).toThrow('Completa todas');
    s.users[0].completed = visibleLessons(s).map((l) => l.id);
    s.lessons = [];
    expect(canFinish(s, s.users[0])).toBe(false);
    const noAccess = completed();
    noAccess.purchases[0].approval = 'pendiente';
    expect(() =>
      execute(noAccess, {
        type: 'finalAssessment',
        values: [5, 5, 5, 5],
        reflection: 'Una reflexión suficiente.',
      }),
    ).toThrow('aprobación');
    const noInitial = completed();
    noInitial.users[0].initialAssessment = null;
    expect(() =>
      execute(noInitial, {
        type: 'finalAssessment',
        values: [5, 5, 5, 5],
        reflection: 'Una reflexión suficiente.',
      }),
    ).toThrow('punto de partida');
  });
  it('conserva inicio, cierre y reflexión tras recargar, admite disminuciones y bloquea otro cierre', () => {
    const s = withFinal(),
      u = s.users[0];
    expect(u.initialAssessment?.values).toEqual([3, 2, 4, 3]);
    expect(u.finalAssessment?.values).toEqual([4, 4, 3, 3]);
    expect(loadState({ getItem: () => JSON.stringify(s) }).state).toEqual(s);
    expect(summarize(s, [u]).areas.map((a) => a.delta)).toEqual([1, 2, -1, 0]);
    expect(() =>
      execute(s, {
        type: 'finalAssessment',
        values: [1, 1, 1, 1],
        reflection: 'Intento de reemplazo.',
      }),
    ).toThrow('ya está guardada');
    expect(() =>
      execute(completed(), {
        type: 'finalAssessment',
        values: [1, 2, 3, 5.5],
        reflection: 'Una reflexión suficiente.',
      }),
    ).toThrow('cuatro');
  });
  it('rechaza cambios de medición, onboarding y satisfacción desde otro rol o sin verificar', () => {
    const s = withFinal();
    s.session = 'ana';
    expect(() => execute(s, { type: 'onboarding', context, goal: 'Un objetivo válido.' })).toThrow(
      'alumno',
    );
    expect(() =>
      execute(s, {
        type: 'finalAssessment',
        values: [5, 5, 5, 5],
        reflection: 'Una reflexión suficiente.',
      }),
    ).toThrow('alumno');
    expect(() =>
      execute(s, { type: 'satisfaction', overall: 5, learning: 5, mentoring: null, comment: '' }),
    ).toThrow('alumno');
    s.session = 'maria';
    s.users[0].verified = false;
    expect(() => execute(s, { type: 'onboarding', context, goal: 'Un objetivo válido.' })).toThrow(
      'Confirma',
    );
  });
});
describe('Satisfacción y métricas verificables', () => {
  it('no inventa respuestas en estados vacíos y no permite encuesta antes del cierre', () => {
    const s = createSeed(),
      summary = summarize(
        s,
        s.users.filter((u) => u.role === 'alumno'),
      );
    expect(summary.overall).toBeNull();
    expect(summary.delta).toBeNull();
    expect(summary.respondents).toHaveLength(0);
    expect(() =>
      execute(s, { type: 'satisfaction', overall: 5, learning: 5, mentoring: null, comment: '' }),
    ).toThrow('evaluación final');
  });
  it('una corrección sustituye la respuesta sin duplicar el conteo, mantiene su fecha inicial y no puntúa mentorías no realizadas', () => {
    let s = execute(withFinal(), {
      type: 'satisfaction',
      overall: 4,
      learning: 5,
      mentoring: null,
      comment: 'Me ayudó a escuchar.',
    });
    const date = s.users[0].satisfaction!.createdAt;
    s = execute(s, {
      type: 'satisfaction',
      overall: 2,
      learning: 3,
      mentoring: null,
      comment: 'Me gustaría más práctica.',
    });
    const summary = summarize(s, s.users);
    expect(summary.overall).toBe(2);
    expect(summary.respondents).toHaveLength(1);
    expect(summary.mentoring).toBeNull();
    expect(summary.mentoringResponses).toBe(0);
    expect(s.users[0].satisfaction!.createdAt).toBe(date);
    expect(() =>
      execute(s, { type: 'satisfaction', overall: 5, learning: 5, mentoring: 5, comment: '' }),
    ).toThrow('sesión realizada');
    expect(() =>
      execute(s, { type: 'satisfaction', overall: 0, learning: 5, mentoring: null, comment: '' }),
    ).toThrow();
  });
  it('reserva, reprogramación, asistencia, cancelación y reembolso mantienen denominadores coherentes', () => {
    let s = withFinal();
    s = execute(s, {
      type: 'book',
      slotId: availableSlots(s, 'maria')[0].id,
      topic: 'Practicar mi presentación.',
    });
    const id = s.bookings[0].id;
    s = execute(s, {
      type: 'book',
      slotId: availableSlots(s, 'maria', id).find((x) => x.id !== s.bookings[0].slotId)!.id,
      bookingId: id,
      topic: 'Practicar mis preguntas.',
    });
    expect(sessionActivity(s, ['maria']).total).toBe(1);
    expect(sessionBalance(s, ['maria'])).toEqual({
      acquired: 2,
      reserved: 1,
      attended: 0,
      available: 1,
    });
    s = execute(s, {
      type: 'book',
      slotId: availableSlots(s, 'maria')[0].id,
      topic: 'Conversar sobre acuerdos.',
    });
    s = execute(s, { type: 'cancel', id: s.bookings[1].id });
    const slot = s.slots.find((slot) => slot.id === s.bookings[0].slotId)!;
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(Date.parse(slot.date) + 3600000));
      s.session = 'ana';
      s = execute(s, { type: 'attend', id });
      s.session = 'maria';
      expect(() =>
        execute(s, { type: 'satisfaction', overall: 4, learning: 4, mentoring: null, comment: '' }),
      ).toThrow('Valora');
      s = execute(s, { type: 'satisfaction', overall: 4, learning: 4, mentoring: 3, comment: '' });
    } finally {
      vi.useRealTimers();
    }
    expect(sessionActivity(s, ['maria'])).toEqual({
      total: 2,
      reserved: 0,
      attended: 1,
      cancelled: 1,
      minutes: 30,
    });
    expect(sessionBalance(s, ['maria'])).toEqual({
      acquired: 2,
      reserved: 0,
      attended: 1,
      available: 1,
    });
    expect(summarize(s, [s.users[0]]).mentoring).toBe(3);
    s.session = 'admin';
    s = execute(s, { type: 'payment', id: 'purchase-maria', status: 'reembolsado' });
    expect(sessionBalance(s, ['maria']).acquired).toBe(0);
    expect(sessionActivity(s, ['maria']).attended).toBe(1);
    expect(sessionActivity(s, ['diego']).total).toBe(0);
  });
  it('filtra fechas en Lima por evaluación, última respuesta y fecha programada sin afectar saldo', () => {
    const s = withFinal();
    s.users[0].finalAssessment!.date = '2026-10-15T02:00:00Z';
    const period = { from: '2026-10-14', to: '2026-10-14' };
    expect(inPeriod('2026-10-15T04:59:59Z', period)).toBe(true);
    expect(inPeriod('2026-10-15T05:00:00Z', period)).toBe(false);
    expect(inPeriod(null, period)).toBe(false);
    expect(summarize(s, [s.users[0]], period).paired).toHaveLength(1);
    expect(summarize(s, [s.users[0]], { from: '2026-10-15', to: '' }).paired).toHaveLength(0);
    expect(summarize(s, [s.users[0]], period).balance.acquired).toBe(2);
  });
  it('exporta respuestas y contexto sin fórmulas ejecutables y aplica el periodo de los resultados', () => {
    let s = execute(withFinal(), {
      type: 'satisfaction',
      overall: 4,
      learning: 3,
      mentoring: null,
      comment: ' =1+1',
    });
    s = execute(s, { type: 'onboarding', context, goal: 'Practicar preguntas abiertas.' });
    const csv = resultsCsv(s, [s.users[0]], allTime);
    expect(csv).toContain('Vendo servicios a pequeñas empresas.');
    expect(csv).toContain('"\'=1+1"');
    expect(csvCell(' \t=1+1')).toBe('"\' \t=1+1"');
    expect(csv).toContain('Satisfacción general');
    expect(csvCell('"texto", otra celda')).toBe('"""texto"", otra celda"');
    const filtered = resultsCsv(s, [s.users[0]], { from: '2099-01-01', to: '' });
    expect(filtered).not.toContain('=1+1');
  });
});
