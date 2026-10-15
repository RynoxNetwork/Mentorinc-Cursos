import {
  State,
  activeAccess,
  learningPurchase,
  visibleLessons,
  now,
  uid,
  type AppState,
} from './model';
import { Policy, PracticeCase, DeliverySettings } from './operations-model';
import type { z } from 'zod';

export type OperationsCommand =
  | { type: 'selectProgram'; programId: string }
  | {
      type: 'ticket';
      kind: 'soporte' | 'reclamo';
      category: 'acceso' | 'pago' | 'contenido' | 'mentoria' | 'otro';
      subject: string;
      text: string;
      request: string;
    }
  | { type: 'ticketReply'; id: string; text: string }
  | {
      type: 'ticketManage';
      id: string;
      status: 'abierta' | 'en_revision' | 'respondida' | 'cerrada';
      ownerId: string;
    }
  | { type: 'policy'; policy: z.infer<typeof Policy> }
  | { type: 'practiceCase'; practice: z.infer<typeof PracticeCase> }
  | { type: 'caseAttempt'; caseId: string; answers: number[]; reflection: string }
  | { type: 'quizAttempt'; lessonId: string; answer: number }
  | { type: 'delivery'; value: z.infer<typeof DeliverySettings> }
  | { type: 'mentorThread'; userId: string; subject: string; text: string };
export const operationTypes = [
  'selectProgram',
  'ticket',
  'ticketReply',
  'ticketManage',
  'policy',
  'practiceCase',
  'caseAttempt',
  'quizAttempt',
  'delivery',
  'mentorThread',
];
function check(test: unknown, message: string): asserts test {
  if (!test) throw new Error(message);
}
function clean(text: string, min = 2, max = 4000) {
  const v = text.trim();
  check(v.length >= min && v.length <= max, `Escribe entre ${min} y ${max} caracteres.`);
  return v;
}
export function localNotice(s: AppState, userId: string, title: string, href: string) {
  if (!userId) return;
  s.notices.unshift({ id: uid(), userId, title, body: title, href, read: false, date: now() });
  s.mails.unshift({
    id: uid(),
    userId,
    subject: title,
    body: `${title}. Abre la plataforma para ver el detalle.`,
    kind: 'notice',
    used: false,
    expires: new Date(Date.now() + 604800000).toISOString(),
  });
}
export function currentPolicies(s: AppState) {
  return (['privacidad', 'compra', 'devoluciones'] as const).flatMap((kind) =>
    s.policies
      .filter((p) => p.kind === kind)
      .sort((a, b) => b.version - a.version)
      .slice(0, 1),
  );
}
export function recordConsent(
  s: AppState,
  userId: string,
  purpose: AppState['consents'][number]['purpose'],
) {
  s.consents.push({
    id: uid(),
    userId,
    purpose,
    policyIds: currentPolicies(s)
      .filter((p) => purpose !== 'diagnostico' || p.kind === 'privacidad')
      .map((p) => p.id),
    date: now(),
    demo: true,
  });
}
export function executeOperation(s: AppState, c: OperationsCommand): AppState {
  if (c.type === 'selectProgram') {
    check(
      !c.programId || s.programs.some((p) => p.id === c.programId && p.published),
      'El programa no está disponible.',
    );
    s.pendingProgramId = c.programId;
    return s;
  }
  const actor = s.users.find((u) => u.id === s.session && u.active);
  check(actor, 'Inicia sesión para continuar.');
  const admin = () => check(actor.role === 'admin', 'Esta acción corresponde a administración.');
  const access = () => {
    const p = activeAccess(s, actor.id);
    check(
      actor.role === 'alumno' && actor.verified && p,
      'Necesitas un programa aprobado y vigente.',
    );
    return p;
  };
  switch (c.type) {
    case 'ticket': {
      check(actor.role === 'alumno', 'Abre esta solicitud desde tu cuenta de alumno.');
      const ownerId = s.users.find((u) => u.role === 'admin' && u.active)?.id || '';
      const id = uid(),
        date = now();
      s.tickets.unshift({
        id,
        reference: `MI-${id.slice(0, 8).toUpperCase()}`,
        userId: actor.id,
        ownerId,
        kind: c.kind,
        category: c.category,
        subject: clean(c.subject, 3, 120),
        request:
          c.kind === 'reclamo' ? clean(c.request, 10, 2000) : c.request.trim().slice(0, 2000),
        status: 'abierta',
        createdAt: date,
        messages: [{ id: uid(), authorId: actor.id, text: clean(c.text, 10), date }],
        events: [{ authorId: actor.id, text: 'Solicitud creada', date }],
      });
      localNotice(
        s,
        actor.id,
        'Tu solicitud local tiene una constancia disponible',
        `/soporte/${id}`,
      );
      localNotice(s, ownerId, 'Nueva solicitud de atención', `/soporte/${id}`);
      break;
    }
    case 'ticketReply': {
      const t = s.tickets.find((t) => t.id === c.id);
      check(
        t && (t.userId === actor.id || actor.role === 'admin'),
        'No puedes ver esta solicitud.',
      );
      check(t.status !== 'cerrada', 'Reabre la solicitud antes de responder.');
      t.messages.push({ id: uid(), authorId: actor.id, text: clean(c.text), date: now() });
      t.status = actor.role === 'admin' ? 'respondida' : 'abierta';
      localNotice(
        s,
        actor.role === 'admin' ? t.userId : t.ownerId,
        'Hay una respuesta en tu solicitud',
        `/soporte/${t.id}`,
      );
      break;
    }
    case 'ticketManage': {
      const t = s.tickets.find((t) => t.id === c.id);
      check(
        t &&
          (actor.role === 'admin' ||
            (actor.id === t.userId && c.status === 'abierta' && c.ownerId === t.ownerId)),
        'No puedes gestionar esta solicitud.',
      );
      check(
        !c.ownerId || s.users.some((u) => u.id === c.ownerId && u.active && u.role === 'admin'),
        'Selecciona un responsable de administración.',
      );
      check(
        c.status !== 'cerrada' ||
          t.messages.some((m) => s.users.find((u) => u.id === m.authorId)?.role === 'admin'),
        'Responde al alumno antes de cerrar.',
      );
      t.ownerId = c.ownerId;
      t.status = c.status;
      t.events.push({
        authorId: actor.id,
        text: `Estado: ${c.status}. Responsable: ${s.users.find((u) => u.id === c.ownerId)?.name || 'sin asignar'}.`,
        date: now(),
      });
      localNotice(s, t.userId, 'Estado de tu solicitud actualizado', `/soporte/${t.id}`);
      break;
    }
    case 'policy': {
      admin();
      const policy = Policy.parse(c.policy);
      check(
        policy.status !== 'aprobada' || policy.approvedBy.trim().length >= 3,
        'Identifica a quien validó el texto.',
      );
      const previous = s.policies.filter((p) => p.kind === policy.kind);
      s.policies.push({
        ...policy,
        id: uid(),
        version: Math.max(0, ...previous.map((p) => p.version)) + 1,
        updatedAt: now(),
      });
      break;
    }
    case 'practiceCase': {
      admin();
      const practice = PracticeCase.parse(c.practice);
      check(
        s.modules.some((m) => m.id === practice.moduleId && !m.archived),
        'Selecciona un módulo disponible.',
      );
      const prior = s.cases.find((x) => x.id === practice.id);
      if (prior) Object.assign(prior, { ...practice, version: prior.version + 1 });
      else s.cases.push({ ...practice, id: uid(), version: 1 });
      break;
    }
    case 'caseAttempt': {
      const p = access(),
        practice = s.cases.find((x) => x.id === c.caseId && x.published);
      check(
        practice && visibleLessons(s, actor.id).some((l) => l.moduleId === practice.moduleId),
        'Este caso no pertenece a tu programa.',
      );
      check(
        c.answers.length === practice.steps.length &&
          c.answers.every((n) => Number.isInteger(n) && n >= 0 && n < 3),
        'Responde cada decisión.',
      );
      const choices = practice.steps.map((step, i) => step.options[c.answers[i]]);
      s.caseAttempts.push({
        id: uid(),
        userId: actor.id,
        purchaseId: p.id,
        caseId: practice.id,
        version: practice.version,
        title: practice.title,
        answers: c.answers,
        score: choices.reduce((n, o) => n + o.points, 0),
        maximum: practice.steps.length * 2,
        feedback: choices.map((o) => o.feedback),
        reflection: clean(c.reflection, 10, 2000),
        date: now(),
      });
      localNotice(s, actor.mentorId, 'Un alumno completó un caso guiado', '/mentor');
      break;
    }
    case 'quizAttempt': {
      const p = access(),
        l = visibleLessons(s, actor.id).find((l) => l.id === c.lessonId);
      check(
        l && Number.isInteger(c.answer) && c.answer >= 0 && c.answer < 3,
        'Selecciona una respuesta válida.',
      );
      const correct = l.correct === c.answer;
      s.quizAttempts.push({
        id: uid(),
        userId: actor.id,
        purchaseId: p.id,
        lessonId: l.id,
        question: l.question,
        answer: l.options[c.answer],
        correct,
        date: now(),
      });
      if (correct && !actor.completed.includes(l.id)) actor.completed.push(l.id);
      if (correct && !actor.firstLearningAt) actor.firstLearningAt = now();
      break;
    }
    case 'delivery':
      admin();
      s.delivery = DeliverySettings.parse(c.value);
      break;
    case 'mentorThread': {
      const student = s.users.find((u) => u.id === c.userId && u.role === 'alumno' && u.active);
      check(
        student &&
          (actor.role === 'admin' || (actor.role === 'mentor' && student.mentorId === actor.id)),
        'Selecciona un alumno asignado.',
      );
      const id = uid();
      s.threads.unshift({
        id,
        userId: student.id,
        mentorId: student.mentorId,
        subject: clean(c.subject, 3, 100),
        status: 'respondida',
        messages: [{ id: uid(), authorId: actor.id, text: clean(c.text, 10, 3000), date: now() }],
      });
      localNotice(s, student.id, 'Tu mentor inició una conversación', `/consultas/${id}`);
      break;
    }
  }
  return State.parse(s);
}
export function recognition(s: AppState, userId: string) {
  const u = s.users.find((u) => u.id === userId),
    p = learningPurchase(s, userId);
  const lessons = visibleLessons(s, userId),
    completed = lessons.filter((l) => u?.completed.includes(l.id)).length;
  const cases = new Set(
    s.caseAttempts
      .filter((a) => a.userId === userId && (!p || a.purchaseId === p.id))
      .map((a) => a.caseId),
  ).size;
  return {
    points: completed * 10 + cases * 20,
    completed,
    cases,
    badges: [
      { name: 'Primer paso', earned: completed > 0, description: 'Completar tu primera lección.' },
      {
        name: 'De la idea a la práctica',
        earned: cases > 0,
        description: 'Resolver un caso guiado con reflexión.',
      },
      {
        name: 'Recorrido completo',
        earned: !!u?.finalAssessment,
        description: 'Guardar tu evaluación final.',
      },
    ],
  };
}
