import { describe, expect, it, vi } from 'vitest';
import { createSeed } from './seed';
import { execute } from './domain';
import {
  activeAccess,
  availableSlots,
  programLessons,
  parseStoredState,
  visibleLessons,
} from './model';
import { recognition, currentPolicies } from './operations';
import { canFinish, hasAttended, sessionBalance } from './insights';
import { readBackup } from './transfer';

function freshLearner() {
  let s = createSeed();
  s = execute(s, {
    type: 'register',
    name: 'Alumno de prueba',
    email: 'nuevo@example.test',
    accepted: true,
  });
  s = execute(s, { type: 'useLink', id: s.mails[0].id });
  return s;
}
function enroll() {
  let s = freshLearner();
  s = execute(s, { type: 'purchase', programId: 'junior', accepted: true });
  s = execute(s, { type: 'payment', id: s.purchases[0].id, status: 'confirmado' });
  s.session = 'admin';
  s = execute(s, { type: 'approval', id: s.purchases[0].id, status: 'aprobado' });
  s.session = s.purchases[0].userId;
  return s;
}

describe('Preparación completa sin servicios externos', () => {
  it('conserva la intención de compra y registra versiones de políticas sin fingir aprobación', () => {
    let s = createSeed();
    s.session = null;
    s = execute(s, { type: 'selectProgram', programId: 'senior' });
    expect(() =>
      execute(s, { type: 'register', name: 'Alumno prueba', email: 'sin@example.test' }),
    ).toThrow('condiciones');
    s = execute(s, {
      type: 'register',
      name: 'Alumno prueba',
      email: 'con@example.test',
      accepted: true,
    });
    expect(s.pendingProgramId).toBe('senior');
    expect(s.consents[0].policyIds).toEqual(currentPolicies(s).map((p) => p.id));
    expect(s.consents[0].demo).toBe(true);
    expect(currentPolicies(s).every((p) => p.status === 'borrador')).toBe(true);
    s = execute(s, { type: 'useLink', id: s.mails[0].id });
    s = execute(s, { type: 'purchase', programId: 'senior', accepted: true });
    expect(s.pendingProgramId).toBe('');
    expect(s.purchases[0].programId).toBe('senior');
    expect(s.consents).toHaveLength(2);
  });
  it('cada programa entrega su temario y la compra conserva reglas aunque se edite después', () => {
    let s = enroll();
    const p = activeAccess(s, s.session!)!;
    expect(p.lessonIds).toHaveLength(9);
    expect(visibleLessons(s, s.session!).some((l) => l.moduleId === 'neg')).toBe(false);
    expect(() => execute(s, { type: 'complete', lessonId: 'neg-1', answer: 0 })).toThrow(
      'programa',
    );
    const student = s.session;
    s.session = 'admin';
    s = execute(s, {
      type: 'saveProgram',
      program: { ...s.programs[0], moduleIds: ['neg'], accessDays: 30, requireReviews: true },
    });
    s.session = student;
    expect(programLessons(s, 'junior')).toHaveLength(3);
    expect(visibleLessons(s, student!)).toHaveLength(9);
    expect(activeAccess(s, student!)?.requireReviews).toBe(false);
  });
  it('empieza la vigencia en la aprobación, no en la compra, y excluye saldos vencidos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-14T12:00:00Z'));
    try {
      let s = freshLearner();
      s.programs[0].accessDays = 2;
      s = execute(s, { type: 'purchase', programId: 'junior', accepted: true });
      const id = s.purchases[0].id,
        student = s.session!;
      expect(s.purchases[0].expiresAt).toBeNull();
      s = execute(s, { type: 'payment', id, status: 'confirmado' });
      s.session = 'admin';
      s = execute(s, { type: 'approval', id, status: 'aprobado' });
      expect(s.purchases[0].expiresAt).toBe('2026-10-16T12:00:00.000Z');
      const learner = s.users.find((u) => u.id === student)!;
      learner.mentorId = 'ana';
      s.slots.push({
        id: 'expiry-edge',
        mentorId: 'ana',
        date: '2026-10-16T11:45:00Z',
        minutes: s.purchases[0].minutes,
        active: true,
      });
      expect(availableSlots(s, student).some((slot) => slot.id === 'expiry-edge')).toBe(false);
      vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
      expect(activeAccess(s, student)).toBeUndefined();
      expect(sessionBalance(s, [student]).acquired).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it('el diagnóstico requiere aceptación explícita y registra solo la política de privacidad', () => {
    let s = freshLearner();
    const command = {
      type: 'diagnostic' as const,
      values: [2, 3, 2, 3],
      goal: 'Mejorar mi escucha comercial',
      context: {
        experience: 'menos-1' as const,
        context: 'Venta de servicios de muestra',
        style: 'Escucho y resumo antes de proponer',
      },
    };
    expect(() => execute(s, command)).toThrow('Confirma');
    s = execute(s, { ...command, accepted: true });
    expect(s.consents.at(-1)?.policyIds).toEqual(
      currentPolicies(s)
        .filter((p) => p.kind === 'privacidad')
        .map((p) => p.id),
    );
  });
  it('el foco recomendado se limita a los módulos incluidos en el recorrido', () => {
    let s = enroll();
    s.purchases[0].lessonIds = s.lessons.filter((l) => l.moduleId === 'com').map((l) => l.id);
    const student = s.session!;
    s = execute(s, {
      type: 'diagnostic',
      accepted: true,
      values: [1, 4, 2, 2],
      goal: 'Mejorar mis preguntas de escucha',
      context: {
        experience: 'menos-1',
        context: 'Servicios ficticios para empresas',
        style: 'Pregunto antes de presentar la propuesta',
      },
    });
    expect(s.users.find((u) => u.id === student)?.focus).toBe('com');
    s.session = 'admin';
    expect(() => execute(s, { type: 'route', userId: student, focus: 'yo' })).toThrow('módulo');
  });
  it('una nueva inscripción conserva el cierre anterior y no hereda progreso ni evaluaciones', () => {
    let s = createSeed();
    s.users[0].finalAssessment = {
      ...s.users[0].initialAssessment!,
      reflection: 'Cierre anterior registrado.',
    };
    const old = structuredClone(s.users[0]);
    s.session = 'admin';
    s = execute(s, { type: 'payment', id: 'purchase-maria', status: 'reembolsado' });
    s.session = 'maria';
    s = execute(s, { type: 'purchase', programId: 'master', accepted: true });
    const id = s.purchases[0].id;
    s = execute(s, { type: 'payment', id, status: 'confirmado' });
    s.session = 'admin';
    s = execute(s, { type: 'approval', id, status: 'aprobado' });
    const u = s.users[0];
    expect(u.history?.[0].completed).toEqual(old.completed);
    expect(u.history?.[0].finalAssessment).toEqual(old.finalAssessment);
    expect(u.completed).toEqual([]);
    expect(u.initialAssessment).toBeNull();
    expect(u.finalAssessment).toBeNull();
    expect(u.journeyId).toBe(id);
  });
  it('migra v2 sin perder mediciones ni acortar el temario adquirido', () => {
    const old = JSON.parse(JSON.stringify(createSeed()));
    old.version = 2;
    delete old.users[0].journeyId;
    delete old.purchases[0].lessonIds;
    for (const key of [
      'policies',
      'consents',
      'tickets',
      'cases',
      'caseAttempts',
      'quizAttempts',
      'delivery',
    ])
      delete old[key];
    const s = parseStoredState(old);
    expect(s.version).toBe(3);
    expect(s.users[0].initialAssessment).toEqual(old.users[0].initialAssessment);
    expect(s.purchases[0].lessonIds).toHaveLength(15);
    expect(s.users[0].journeyId).toBe('purchase-maria');
    expect(parseStoredState(s)).toEqual(s);
  });
  it('la nueva inscripción no hereda sesiones ni puntos de casos de recorridos anteriores, incluso al vencer', () => {
    let s = createSeed();
    s = execute(s, {
      type: 'caseAttempt',
      caseId: 'escucha',
      answers: [0, 1, 0],
      reflection: 'Escuchar antes de proponer una respuesta.',
    });
    s.bookings.push({
      id: 'past-session',
      userId: 'maria',
      purchaseId: 'purchase-maria',
      slotId: s.slots[0].id,
      status: 'realizada',
      topic: 'Prueba anterior',
      meeting: '',
    });
    expect(hasAttended(s, 'maria')).toBe(true);
    const previous = s.purchases.find((p) => p.id === 'purchase-maria')!;
    previous.expiresAt = '2020-01-01T00:00:00Z';
    s.purchases.unshift({ ...previous, id: 'new-journey' });
    s.users[0].journeyId = 'new-journey';
    expect(hasAttended(s, 'maria')).toBe(false);
    expect(recognition(s, 'maria').cases).toBe(0);
  });
  it('permite soporte y reclamo sin pago, conserva constancia y exige respuesta antes de cerrar', () => {
    let s = createSeed();
    s.session = 'diego';
    s = execute(s, {
      type: 'ticket',
      kind: 'reclamo',
      category: 'pago',
      subject: 'Revisión de compra',
      text: 'Mi compra local sigue pendiente de aprobación.',
      request: 'Solicito revisar el estado de mi acceso.',
    });
    const t = s.tickets[0];
    expect(t.reference).toMatch(/^MI-/);
    expect(t.ownerId).toBe('admin');
    s.session = 'admin';
    expect(() =>
      execute(s, { type: 'ticketManage', id: t.id, status: 'cerrada', ownerId: 'admin' }),
    ).toThrow('Responde');
    s = execute(s, {
      type: 'ticketReply',
      id: t.id,
      text: 'Revisamos tu solicitud local y te explicamos los siguientes pasos.',
    });
    s = execute(s, { type: 'ticketManage', id: t.id, status: 'cerrada', ownerId: 'admin' });
    s.session = 'diego';
    s = execute(s, { type: 'ticketManage', id: t.id, status: 'abierta', ownerId: 'admin' });
    expect(s.tickets[0].messages).toHaveLength(2);
    expect(s.tickets[0].events).toHaveLength(3);
    expect(s.tickets[0].status).toBe('abierta');
  });
  it('aísla soporte por alumno y administración y restringe la asignación', () => {
    let s = createSeed();
    s.session = 'diego';
    s = execute(s, {
      type: 'ticket',
      kind: 'soporte',
      category: 'acceso',
      subject: 'No puedo entrar',
      text: 'Necesito ayuda para acceder a mi programa.',
      request: '',
    });
    const id = s.tickets[0].id;
    s.session = 'maria';
    expect(() => execute(s, { type: 'ticketReply', id, text: 'No me pertenece.' })).toThrow();
    s.session = 'ana';
    expect(() => execute(s, { type: 'ticketReply', id, text: 'No soy administración.' })).toThrow();
    s.session = 'admin';
    expect(() =>
      execute(s, { type: 'ticketManage', id, status: 'en_revision', ownerId: 'ana' }),
    ).toThrow('responsable');
  });
  it('versiona las políticas y conserva la versión aceptada', () => {
    let s = freshLearner();
    const accepted = [...s.consents[0].policyIds],
      p = s.policies[0];
    s.session = 'admin';
    expect(() =>
      execute(s, { type: 'policy', policy: { ...p, status: 'aprobada', approvedBy: '' } }),
    ).toThrow('validó');
    s = execute(s, {
      type: 'policy',
      policy: {
        ...p,
        body: 'Nuevo texto editorial de prueba, conservando la versión anterior.',
        status: 'borrador',
      },
    });
    expect(currentPolicies(s)[0].version).toBe(2);
    expect(s.consents[0].policyIds).toEqual(accepted);
    expect(s.policies.find((p) => p.id === accepted[0])?.version).toBe(1);
  });
  it('registra intentos incorrectos, activa al aprender y no duplica puntos', () => {
    let s = enroll();
    s = execute(s, { type: 'quizAttempt', lessonId: 'yo-1', answer: 1 });
    expect(s.quizAttempts[0].correct).toBe(false);
    expect(s.users.at(-1)?.firstLearningAt).toBeUndefined();
    s = execute(s, { type: 'quizAttempt', lessonId: 'yo-1', answer: 0 });
    s = execute(s, { type: 'quizAttempt', lessonId: 'yo-1', answer: 0 });
    expect(s.quizAttempts).toHaveLength(3);
    expect(recognition(s, s.session!).points).toBe(10);
    expect(s.users.at(-1)?.firstLearningAt).toBeTruthy();
  });
  it('aplica la rúbrica y conserva versiones de reentrega y revisión', () => {
    let s = createSeed();
    s = execute(s, {
      type: 'submit',
      lessonId: 'yo-1',
      text: 'Primera práctica con un contexto y una situación concreta.',
      attachment: null,
    });
    const id = s.submissions[0].id;
    s.session = 'ana';
    expect(() =>
      execute(s, {
        type: 'review',
        id,
        feedback: 'Falta sustentar con un ejemplo concreto.',
        score: 5,
        status: 'aprobada',
      }),
    ).toThrow('12');
    s = execute(s, {
      type: 'review',
      id,
      feedback: 'Añade evidencia y un siguiente paso.',
      score: 10,
      status: 'revisar',
    });
    s.session = 'maria';
    s = execute(s, {
      type: 'submit',
      lessonId: 'yo-1',
      text: 'Segunda práctica corregida con evidencia y siguiente paso.',
      attachment: null,
    });
    expect(s.submissions[0].revisions?.[0].score).toBe(10);
    expect(s.submissions[0].revisions?.[0].reviewedBy).toBe('ana');
    expect(s.submissions[0].score).toBeNull();
    s.session = 'ana';
    s = execute(s, {
      type: 'review',
      id,
      feedback: 'La evidencia y el siguiente paso son claros.',
      score: 16,
      status: 'aprobada',
    });
    expect(s.submissions[0].rubric).toContain('situación');
  });
  it('el cierre con revisión requiere actividades de la inscripción actual', () => {
    const s = createSeed(),
      u = s.users[0];
    s.purchases[0].requireReviews = true;
    u.completed = visibleLessons(s, u.id).map((l) => l.id);
    expect(canFinish(s, u)).toBe(false);
    s.submissions = visibleLessons(s, u.id).map((l) => ({
      id: l.id,
      userId: u.id,
      purchaseId: 'otra-compra',
      lessonId: l.id,
      text: 'Actividad de otro recorrido',
      attachment: null,
      status: 'aprobada',
      feedback: 'Bien',
      score: 20,
      date: new Date().toISOString(),
    }));
    expect(canFinish(s, u)).toBe(false);
    s.submissions.forEach((a) => (a.purchaseId = 'purchase-maria'));
    expect(canFinish(s, u)).toBe(true);
  });
  it('los casos guardan decisiones y feedback sin duplicar reconocimientos', () => {
    let s = createSeed();
    const p = s.cases[0];
    s = execute(s, {
      type: 'caseAttempt',
      caseId: p.id,
      answers: [0, 1, 0],
      reflection: 'Preguntaré por el contexto antes de presentar una solución.',
    });
    const points = recognition(s, 'maria').points;
    s = execute(s, {
      type: 'caseAttempt',
      caseId: p.id,
      answers: [1, 0, 1],
      reflection: 'Voy a mejorar la manera de explorar las necesidades del cliente.',
    });
    expect(s.caseAttempts).toHaveLength(2);
    expect(s.caseAttempts[0].score).toBe(6);
    expect(s.caseAttempts[1].score).toBe(0);
    expect(recognition(s, 'maria').points).toBe(points);
    const previous = structuredClone(s.caseAttempts[0]);
    s.session = 'admin';
    s = execute(s, {
      type: 'practiceCase',
      practice: { ...p, title: 'Caso editorial actualizado' },
    });
    expect(s.caseAttempts[0]).toEqual(previous);
    expect(s.cases[0].version).toBe(2);
  });
  it('no permite practicar casos fuera del temario ni editar como alumno', () => {
    const s = enroll();
    expect(() =>
      execute(s, {
        type: 'caseAttempt',
        caseId: 'acuerdo',
        answers: [0, 1, 0],
        reflection: 'Quiero practicar con mi nueva ruta.',
      }),
    ).toThrow('programa');
    expect(() => execute(s, { type: 'practiceCase', practice: s.cases[0] })).toThrow(
      'administración',
    );
  });
  it('el mentor inicia conversación con asignados, que responden sin acceso vigente', () => {
    let s = createSeed();
    s.session = 'ana';
    s = execute(s, {
      type: 'mentorThread',
      userId: 'diego',
      subject: 'Tu siguiente paso',
      text: 'Cuéntame qué te gustaría practicar mientras activas tu programa.',
    });
    s.session = 'diego';
    s = execute(s, {
      type: 'reply',
      id: s.threads[0].id,
      text: 'Me interesa mejorar la escucha y las preguntas.',
    });
    expect(s.threads[0].messages).toHaveLength(2);
    s.session = 'ana';
    s.users.find((u) => u.id === 'diego')!.mentorId = '';
    expect(() =>
      execute(s, {
        type: 'mentorThread',
        userId: 'diego',
        subject: 'No asignado',
        text: 'No debería poder enviar este mensaje.',
      }),
    ).toThrow('asignado');
  });
  it('la copia se valida sin modificar el origen, cierra sesión y rechaza enlaces peligrosos', () => {
    const s = createSeed(),
      text = JSON.stringify(s);
    const restored = readBackup(text);
    expect(restored.session).toBeNull();
    expect(s.session).toBe('maria');
    expect(restored.users).toEqual(s.users);
    const bad = structuredClone(s);
    bad.lessons[0].resource = 'javascript:alert(1)';
    expect(() => readBackup(JSON.stringify(bad))).toThrow('enlaces');
    bad.lessons[0].resource = '';
    bad.purchases[0].userId = 'missing';
    expect(() => readBackup(JSON.stringify(bad))).toThrow('compra');
    expect(() => readBackup('{bad')).toThrow();
    expect(() => readBackup(JSON.stringify({ ...s, version: 100 }))).toThrow();
    const invalidDate = structuredClone(s);
    invalidDate.users[0].registeredAt = 'invalid';
    expect(() => readBackup(JSON.stringify(invalidDate))).toThrow('fechas');
  });
});
