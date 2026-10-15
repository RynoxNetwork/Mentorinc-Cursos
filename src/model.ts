import { z } from 'zod';
import {
  Policy,
  Consent,
  SupportTicket,
  PracticeCase,
  CaseAttempt,
  QuizAttempt,
  DeliverySettings,
  defaultDelivery,
  initialPolicies,
  initialCases,
} from './operations-model';

export const Role = z.enum(['alumno', 'mentor', 'admin']);
export const Scores = z.array(z.number().int().min(1).max(5)).length(4);
export const Onboarding = z.object({
  experience: z.enum(['empezando', 'menos-1', '1-3', 'mas-3']),
  context: z.string().trim().min(10).max(500),
  style: z.string().trim().min(10).max(500),
  updatedAt: z.iso.datetime(),
});
export const Assessment = z.object({
  values: Scores,
  date: z.iso.datetime().nullable(),
  source: z.enum(['registro', 'anterior']),
  goal: z.string().max(500),
  reflection: z.string().max(1000),
});
export const Satisfaction = z.object({
  overall: z.number().int().min(1).max(5),
  learning: z.number().int().min(1).max(5),
  mentoring: z.number().int().min(1).max(5).nullable(),
  comment: z.string().trim().max(1000),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const User = z.object({
  id: z.string(),
  name: z.string().min(2).max(80),
  email: z.email(),
  role: Role,
  mentorId: z.string(),
  verified: z.boolean(),
  active: z.boolean(),
  goal: z.string(),
  focus: z.string(),
  diagnostic: z.array(z.number().min(1).max(5)),
  completed: z.array(z.string()),
  registeredAt: z.string().nullable().optional(),
  firstLearningAt: z.string().nullable().optional(),
  journeyId: z.string().optional(),
  history: z
    .array(
      z.object({
        purchaseId: z.string(),
        completed: z.array(z.string()),
        initialAssessment: Assessment.nullable(),
        finalAssessment: Assessment.nullable(),
        satisfaction: Satisfaction.nullable(),
      }),
    )
    .optional(),
  onboarding: Onboarding.nullable().default(null),
  initialAssessment: Assessment.nullable().default(null),
  finalAssessment: Assessment.nullable().default(null),
  satisfaction: Satisfaction.nullable().default(null),
});
export const Program = z.object({
  id: z.string(),
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(500),
  price: z.number().min(0),
  moduleIds: z.array(z.string()).optional(),
  accessDays: z.number().int().min(0).max(1095).optional(),
  requireReviews: z.boolean().optional(),
  audience: z.string().max(500).optional(),
  sessions: z.number().int().min(0).max(20),
  minutes: z.number().int().min(15).max(120),
  published: z.boolean(),
});
export const Module = z.object({
  id: z.string(),
  title: z.string().min(2).max(100),
  description: z.string().max(300),
  order: z.number(),
  archived: z.boolean(),
});
export const Lesson = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string().min(2).max(120),
  minutes: z.number().min(1).max(180),
  intro: z.string().min(10).max(1000),
  steps: z.array(z.string().min(10).max(2000)).min(1),
  activity: z.string().min(10).max(1000),
  question: z.string().min(5),
  options: z.array(z.string()).length(3),
  correct: z.number().int().min(0).max(2),
  video: z.string(),
  resource: z.string(),
  resourceName: z.string().max(120).optional(),
  transcript: z.string().max(20000).optional(),
  rubric: z.string().max(3000).optional(),
  passScore: z.number().min(0).max(20).optional(),
  contentStatus: z.enum(['muestra', 'validado']).optional(),
  published: z.boolean(),
});
export const Purchase = z.object({
  id: z.string(),
  userId: z.string(),
  programId: z.string(),
  amount: z.number(),
  lessonIds: z.array(z.string()).optional(),
  requireReviews: z.boolean().optional(),
  accessDays: z.number().optional(),
  approvedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  sessions: z.number(),
  minutes: z.number(),
  payment: z.enum(['pendiente', 'confirmado', 'fallido', 'reembolsado']),
  approval: z.enum(['pendiente', 'aprobado', 'rechazado']),
  date: z.string(),
});
export const Submission = z.object({
  id: z.string(),
  purchaseId: z.string().optional(),
  userId: z.string(),
  lessonId: z.string(),
  text: z.string(),
  attachment: z.object({ name: z.string(), data: z.string() }).nullable(),
  status: z.enum(['pendiente', 'aprobada', 'revisar']),
  feedback: z.string(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
  rubric: z.string().optional(),
  revisions: z
    .array(
      z.object({
        text: z.string(),
        attachment: z.object({ name: z.string(), data: z.string() }).nullable(),
        feedback: z.string(),
        score: z.number().nullable(),
        date: z.string(),
        reviewedBy: z.string().optional(),
        reviewedAt: z.string().optional(),
      }),
    )
    .optional(),
  score: z.number().min(0).max(20).nullable(),
  date: z.string(),
});
export const Slot = z.object({
  id: z.string(),
  mentorId: z.string(),
  date: z.string(),
  minutes: z.number(),
  active: z.boolean(),
});
export const Booking = z.object({
  id: z.string(),
  userId: z.string(),
  purchaseId: z.string(),
  slotId: z.string(),
  status: z.enum(['confirmada', 'cancelada', 'realizada']),
  topic: z.string(),
  meeting: z.string(),
});
export const Thread = z.object({
  id: z.string(),
  userId: z.string(),
  mentorId: z.string(),
  subject: z.string(),
  status: z.enum(['abierta', 'respondida', 'resuelta']),
  messages: z.array(
    z.object({ id: z.string(), authorId: z.string(), text: z.string(), date: z.string() }),
  ),
});
export const Notice = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  href: z.string(),
  read: z.boolean(),
  date: z.string(),
});
export const Mail = z.object({
  id: z.string(),
  userId: z.string(),
  subject: z.string(),
  body: z.string(),
  kind: z.enum(['confirm', 'login', 'notice']),
  used: z.boolean(),
  expires: z.string(),
});
export const State = z.object({
  version: z.literal(3),
  users: z.array(User),
  programs: z.array(Program),
  modules: z.array(Module),
  lessons: z.array(Lesson),
  purchases: z.array(Purchase),
  submissions: z.array(Submission),
  slots: z.array(Slot),
  bookings: z.array(Booking),
  threads: z.array(Thread),
  notices: z.array(Notice),
  mails: z.array(Mail),
  session: z.string().nullable(),
  pendingProgramId: z.string().default(''),
  policies: z.array(Policy).default([]),
  consents: z.array(Consent).default([]),
  tickets: z.array(SupportTicket).default([]),
  cases: z.array(PracticeCase).default([]),
  caseAttempts: z.array(CaseAttempt).default([]),
  quizAttempts: z.array(QuizAttempt).default([]),
  delivery: DeliverySettings.default(defaultDelivery),
});
export type AppState = z.infer<typeof State>;
export type Person = z.infer<typeof User>;
export type CourseLesson = z.infer<typeof Lesson>;
export type CourseModule = z.infer<typeof Module>;
export type CourseProgram = z.infer<typeof Program>;
export type UserRole = z.infer<typeof Role>;
export type LearnerContext = z.infer<typeof Onboarding>;
// Keep the same key so existing browsers retain their data after the schema upgrade.
export const STORE_KEY = 'mentorinc.impulso.v1';
const LegacyState = State.extend({
  version: z.literal(1),
  users: z.array(
    User.omit({
      onboarding: true,
      initialAssessment: true,
      finalAssessment: true,
      satisfaction: true,
    }),
  ),
});
export function parseStoredState(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null || !('version' in raw)) return State.parse(raw);
  if (raw.version === 1 || raw.version === 2) {
    const old =
      raw.version === 1
        ? LegacyState.parse(raw)
        : State.extend({ version: z.literal(2) }).parse(raw);
    const allLessons = old.modules
      .filter((m) => !m.archived)
      .flatMap((m) =>
        old.lessons.filter((l) => l.moduleId === m.id && l.published).map((l) => l.id),
      );
    return State.parse({
      ...old,
      version: 3,
      policies: initialPolicies(),
      cases: initialCases(),
      programs: old.programs.map((p) => ({
        ...p,
        moduleIds:
          p.moduleIds ||
          (
            {
              junior: ['yo', 'com', 'pro'],
              senior: ['yo', 'com', 'pro', 'neg'],
              master: old.modules.map((m) => m.id),
            } as Record<string, string[]>
          )[p.id],
      })),
      submissions: old.submissions.map((x) => ({
        ...x,
        purchaseId:
          x.purchaseId ||
          old.purchases.find((p) => p.userId === x.userId && p.approval === 'aprobado')?.id,
      })),
      purchases: old.purchases.map((p) => ({
        ...p,
        lessonIds: allLessons,
        accessDays: 0,
        expiresAt: null,
      })),
      users: old.users.map((u) => ({
        ...u,
        journeyId: old.purchases.find(
          (p) => p.userId === u.id && p.approval === 'aprobado' && p.payment === 'confirmado',
        )?.id,
        initialAssessment:
          raw.version === 1
            ? u.role === 'alumno' && Scores.safeParse(u.diagnostic).success
              ? {
                  values: u.diagnostic,
                  date: null,
                  source: 'anterior',
                  goal: u.goal,
                  reflection: '',
                }
              : null
            : 'initialAssessment' in u
              ? u.initialAssessment
              : null,
      })),
    });
  }
  return State.parse(raw);
}
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function safeUrl(value: string) {
  if (!value) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
export function activeAccess(s: AppState, userId: string) {
  return s.purchases.find(
    (p) =>
      p.userId === userId &&
      p.payment === 'confirmado' &&
      p.approval === 'aprobado' &&
      (!p.expiresAt || Date.parse(p.expiresAt) > Date.now()),
  );
}
export function programLessons(s: AppState, programId: string) {
  const program = s.programs.find((p) => p.id === programId);
  return visibleLessons(s).filter(
    (l) => !program?.moduleIds || program.moduleIds.includes(l.moduleId),
  );
}
export function learningPurchase(s: AppState, userId: string) {
  return (
    activeAccess(s, userId) ||
    s.purchases.find((p) => p.id === s.users.find((u) => u.id === userId)?.journeyId)
  );
}
export function visibleLessons(s: AppState, userId?: string) {
  return s.modules
    .filter((m) => !m.archived)
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => s.lessons.filter((l) => l.moduleId === m.id && l.published))
    .filter((l) => {
      const p = userId ? learningPurchase(s, userId) : undefined;
      return !p || !p.lessonIds || p.lessonIds.includes(l.id);
    });
}
export function progress(s: AppState, u: Person) {
  const lessons = visibleLessons(s, u.id);
  return lessons.length
    ? Math.round((100 * lessons.filter((l) => u.completed.includes(l.id)).length) / lessons.length)
    : 0;
}
export function suggestedFocus(s: AppState, u: Person) {
  const included = [...new Set(visibleLessons(s, u.id).map((l) => l.moduleId))];
  return (
    ['yo', 'com', 'pro', 'neg']
      .map((id, i) => ({ id, score: u.diagnostic[i] ?? 5 }))
      .filter((m) => included.includes(m.id))
      .sort((a, b) => a.score - b.score)[0]?.id ??
    included[0] ??
    ''
  );
}
export function overlaps(a: z.infer<typeof Slot>, b: z.infer<typeof Slot>) {
  const x = Date.parse(a.date),
    y = Date.parse(b.date);
  return a.mentorId === b.mentorId && x < y + b.minutes * 60000 && y < x + a.minutes * 60000;
}
export function availableSlots(s: AppState, userId: string, exceptBooking?: string) {
  const u = s.users.find((u) => u.id === userId);
  const p = activeAccess(s, userId);
  return s.slots
    .filter(
      (slot) =>
        slot.active &&
        slot.mentorId === u?.mentorId &&
        slot.minutes === p?.minutes &&
        new Date(slot.date).getTime() > Date.now() &&
        (!p?.expiresAt ||
          Date.parse(slot.date) + slot.minutes * 60000 <= Date.parse(p.expiresAt)) &&
        !s.bookings.some((b) => {
          const booked = s.slots.find((x) => x.id === b.slotId);
          return (
            b.id !== exceptBooking && b.status !== 'cancelada' && booked && overlaps(slot, booked)
          );
        }),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
export const dateLabel = (s: string) =>
  new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(s));
export const money = (n: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(n);
