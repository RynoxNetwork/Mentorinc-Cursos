import {
  type AppState,
  type CourseLesson,
  type CourseModule,
  type CourseProgram,
  type UserRole,
  Lesson,
  Module,
  Program,
  State,
  activeAccess,
  availableSlots,
  now,
  safeUrl,
  uid,
} from './model';

export type Command =
  | { type: 'demo'; userId: string }
  | { type: 'logout' }
  | { type: 'register'; name: string; email: string }
  | { type: 'sendLink'; email: string }
  | { type: 'useLink'; id: string }
  | { type: 'profile'; name: string; goal: string }
  | { type: 'diagnostic'; values: number[]; goal: string }
  | { type: 'purchase'; programId: string }
  | { type: 'payment'; id: string; status: 'confirmado' | 'fallido' | 'reembolsado' }
  | { type: 'approval'; id: string; status: 'aprobado' | 'rechazado' }
  | { type: 'complete'; lessonId: string; answer: number }
  | {
      type: 'submit';
      lessonId: string;
      text: string;
      attachment: { name: string; data: string } | null;
    }
  | { type: 'review'; id: string; feedback: string; score: number; status: 'aprobada' | 'revisar' }
  | { type: 'thread'; subject: string; text: string }
  | { type: 'reply'; id: string; text: string }
  | { type: 'resolve'; id: string; resolved: boolean }
  | { type: 'book'; slotId: string; topic: string; bookingId?: string }
  | { type: 'cancel'; id: string }
  | { type: 'meeting'; id: string; url: string }
  | { type: 'attend'; id: string }
  | { type: 'slot'; date: string; minutes: number }
  | { type: 'closeSlot'; id: string }
  | { type: 'route'; userId: string; focus: string }
  | { type: 'user'; userId: string; role: UserRole; mentorId: string; active: boolean }
  | { type: 'saveProgram'; program: CourseProgram }
  | { type: 'saveModule'; module: CourseModule }
  | { type: 'saveLesson'; lesson: CourseLesson }
  | { type: 'read'; id?: string };

function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function clean(value: string, label: string, min = 2, max = 2000) {
  const s = value.trim();
  requireThat(
    s.length >= min && s.length <= max,
    `${label}: escribe entre ${min} y ${max} caracteres.`,
  );
  return s;
}
function notify(s: AppState, userId: string, title: string, body: string, href: string) {
  s.notices.unshift({ id: uid(), userId, title, body, href, read: false, date: now() });
  s.mails.unshift({
    id: uid(),
    userId,
    subject: title,
    body,
    kind: 'notice',
    used: false,
    expires: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
}

// These are browser-side demo rules, not a security boundary. A future backend must enforce them again.
export function execute(current: AppState, command: Command): AppState {
  const s = structuredClone(current),
    c = command;
  if (c.type === 'logout') {
    s.session = null;
    return s;
  }
  if (c.type === 'demo') {
    const u = s.users.find((u) => u.id === c.userId);
    requireThat(u?.active, 'Esta cuenta está desactivada.');
    s.session = u.id;
    return s;
  }
  if (c.type === 'register') {
    const name = clean(c.name, 'Nombre', 2, 80),
      email = c.email.trim().toLowerCase();
    requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Escribe un correo válido.');
    requireThat(
      !s.users.some((u) => u.email.toLowerCase() === email),
      'Este correo ya tiene una cuenta local. Solicita un enlace de acceso.',
    );
    const id = uid();
    s.users.push({
      id,
      name,
      email,
      role: 'alumno',
      mentorId: s.users.find((u) => u.role === 'mentor' && u.active)?.id || '',
      verified: false,
      active: true,
      goal: '',
      focus: 'yo',
      diagnostic: [],
      completed: [],
    });
    s.mails.unshift({
      id: uid(),
      userId: id,
      subject: 'Confirma tu correo',
      body: 'Confirma tu cuenta para comenzar tu recorrido en Mentorinc.',
      kind: 'confirm',
      used: false,
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
    s.session = id;
    return State.parse(s);
  }
  if (c.type === 'sendLink') {
    const u = s.users.find(
      (u) => u.email.toLowerCase() === c.email.trim().toLowerCase() && u.active,
    );
    requireThat(
      u,
      'No encontramos esa cuenta en este navegador. Puedes crear una cuenta de prueba.',
    );
    s.mails.unshift({
      id: uid(),
      userId: u.id,
      subject: u.verified ? 'Tu enlace de acceso' : 'Confirma tu correo',
      body: 'Este enlace local permite continuar en tu cuenta de prueba durante una hora.',
      kind: u.verified ? 'login' : 'confirm',
      used: false,
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
    return s;
  }
  if (c.type === 'useLink') {
    const mail = s.mails.find((m) => m.id === c.id);
    requireThat(
      mail && !mail.used && mail.kind !== 'notice' && Date.parse(mail.expires) > Date.now(),
      'El enlace ya se usó o caducó. Solicita uno nuevo.',
    );
    const u = s.users.find((u) => u.id === mail.userId);
    requireThat(u?.active, 'Esta cuenta no está disponible.');
    mail.used = true;
    u.verified = true;
    s.session = u.id;
    return s;
  }
  const actor = s.users.find((u) => u.id === s.session);
  requireThat(actor?.active, 'Inicia sesión para continuar.');
  const admin = () =>
    requireThat(actor.role === 'admin', 'Esta acción corresponde a administración.');
  const learner = () => {
    requireThat(actor.role === 'alumno', 'Esta acción corresponde a un alumno.');
    requireThat(actor.verified, 'Confirma tu correo para continuar.');
  };
  const access = () => {
    learner();
    const p = activeAccess(s, actor.id);
    requireThat(p, 'Necesitas un pago confirmado y la aprobación de Mentorinc.');
    return p;
  };
  const canMentor = (userId: string) =>
    actor.role === 'admin' ||
    (actor.role === 'mentor' && s.users.find((u) => u.id === userId)?.mentorId === actor.id);
  const lessonFor = (id: string) => {
    const l = s.lessons.find(
      (l) => l.id === id && l.published && !s.modules.find((m) => m.id === l.moduleId)?.archived,
    );
    requireThat(l, 'Esta lección no está disponible.');
    return l;
  };
  switch (c.type) {
    case 'profile':
      actor.name = clean(c.name, 'Nombre', 2, 80);
      actor.goal = c.goal.trim().slice(0, 500);
      break;
    case 'diagnostic': {
      learner();
      requireThat(
        c.values.length === 4 && c.values.every((n) => Number.isInteger(n) && n >= 1 && n <= 5),
        'Responde las cuatro preguntas.',
      );
      actor.diagnostic = c.values;
      actor.goal = clean(c.goal, 'Objetivo', 10, 500);
      actor.focus = ['yo', 'com', 'pro', 'neg'][c.values.indexOf(Math.min(...c.values))];
      notify(
        s,
        actor.id,
        'Tu punto de partida está listo',
        'La sugerencia se basa en tus respuestas y puede ajustarse con tu mentor.',
        '/ruta',
      );
      break;
    }
    case 'purchase': {
      learner();
      requireThat(
        !activeAccess(s, actor.id),
        'Ya tienes un programa activo. Consulta con administración para cambiarlo.',
      );
      requireThat(
        !s.purchases.some(
          (p) => p.userId === actor.id && p.approval === 'pendiente' && p.payment !== 'reembolsado',
        ),
        'Ya tienes una solicitud en curso. Revísala en Mis compras.',
      );
      const p = s.programs.find((p) => p.id === c.programId && p.published);
      requireThat(p, 'Este programa no está disponible.');
      s.purchases.unshift({
        id: uid(),
        userId: actor.id,
        programId: p.id,
        amount: p.price,
        sessions: p.sessions,
        minutes: p.minutes,
        payment: 'pendiente',
        approval: 'pendiente',
        date: now(),
      });
      break;
    }
    case 'payment': {
      const p = s.purchases.find((p) => p.id === c.id);
      requireThat(p, 'Compra no encontrada.');
      requireThat(
        actor.role === 'admin' || (actor.id === p.userId && c.status !== 'reembolsado'),
        'No puedes modificar este pago.',
      );
      if (c.status === 'reembolsado') admin();
      else
        requireThat(
          p.approval === 'pendiente' && p.payment !== 'reembolsado',
          'Este pago ya está cerrado.',
        );
      p.payment = c.status;
      if (c.status === 'reembolsado') {
        p.approval = 'rechazado';
        s.bookings
          .filter((b) => b.purchaseId === p.id && b.status === 'confirmada')
          .forEach((b) => (b.status = 'cancelada'));
      }
      notify(
        s,
        p.userId,
        c.status === 'confirmado' ? 'Pago de prueba confirmado' : 'Estado de pago actualizado',
        c.status === 'confirmado'
          ? 'Falta la aprobación de Mentorinc para habilitar el acceso.'
          : `Tu pago está ${c.status}.`,
        '/compras',
      );
      break;
    }
    case 'approval': {
      admin();
      const p = s.purchases.find((p) => p.id === c.id);
      requireThat(p, 'Compra no encontrada.');
      if (c.status === 'aprobado') {
        requireThat(p.payment === 'confirmado', 'Primero se necesita el pago confirmado.');
        requireThat(
          !s.purchases.some(
            (x) =>
              x.id !== p.id &&
              x.userId === p.userId &&
              x.payment === 'confirmado' &&
              x.approval === 'aprobado',
          ),
          'El alumno ya tiene otro programa activo.',
        );
      }
      p.approval = c.status;
      if (c.status === 'rechazado')
        s.bookings
          .filter((b) => b.purchaseId === p.id && b.status === 'confirmada')
          .forEach((b) => (b.status = 'cancelada'));
      notify(
        s,
        p.userId,
        c.status === 'aprobado' ? '¡Tu acceso está habilitado!' : 'Solicitud revisada',
        c.status === 'aprobado'
          ? 'Ya puedes entrar al aula y reservar tus mentorías.'
          : 'Tu acceso no está habilitado. Contacta al equipo desde tu cuenta.',
        '/compras',
      );
      break;
    }
    case 'complete': {
      access();
      const l = lessonFor(c.lessonId);
      requireThat(c.answer === l.correct, 'Revisa la idea central y vuelve a intentarlo.');
      if (!actor.completed.includes(l.id)) actor.completed.push(l.id);
      break;
    }
    case 'submit': {
      access();
      const l = lessonFor(c.lessonId);
      const text = clean(c.text, 'Tu actividad', 20, 5000);
      const previous = s.submissions.find((x) => x.userId === actor.id && x.lessonId === l.id);
      requireThat(previous?.status !== 'aprobada', 'Esta actividad ya fue aprobada.');
      if (c.attachment)
        requireThat(
          c.attachment.data.length < 700000 &&
            /^data:(application\/pdf|text\/plain|image\/(png|jpeg|webp));base64,/.test(
              c.attachment.data,
            ),
          'Adjunta un PDF, TXT o imagen de hasta 500 KB.',
        );
      const payload = {
        text,
        attachment: c.attachment,
        status: 'pendiente' as const,
        feedback: '',
        score: null,
        date: now(),
      };
      if (previous) Object.assign(previous, payload);
      else s.submissions.push({ id: uid(), userId: actor.id, lessonId: l.id, ...payload });
      if (actor.mentorId)
        notify(
          s,
          actor.mentorId,
          'Nueva actividad para revisar',
          `${actor.name} entregó ${l.title}.`,
          '/mentor/entregas',
        );
      break;
    }
    case 'review': {
      const sub = s.submissions.find((x) => x.id === c.id);
      requireThat(sub && canMentor(sub.userId), 'No puedes revisar esta actividad.');
      requireThat(
        Number.isFinite(c.score) && c.score >= 0 && c.score <= 20,
        'La calificación debe estar entre 0 y 20.',
      );
      sub.feedback = clean(c.feedback, 'Feedback', 10, 3000);
      sub.score = c.score;
      sub.status = c.status;
      notify(
        s,
        sub.userId,
        'Tu mentor revisó tu actividad',
        sub.feedback,
        `/leccion/${sub.lessonId}`,
      );
      break;
    }
    case 'thread': {
      access();
      requireThat(
        s.users.some((u) => u.id === actor.mentorId && u.active && u.role === 'mentor'),
        'Aún no tienes mentor asignado.',
      );
      const thread = {
        id: uid(),
        userId: actor.id,
        mentorId: actor.mentorId,
        subject: clean(c.subject, 'Asunto', 3, 100),
        status: 'abierta' as const,
        messages: [
          { id: uid(), authorId: actor.id, text: clean(c.text, 'Consulta', 10, 3000), date: now() },
        ],
      };
      s.threads.unshift(thread);
      notify(s, actor.mentorId, 'Nueva consulta', thread.subject, `/consultas/${thread.id}`);
      break;
    }
    case 'reply': {
      const t = s.threads.find((t) => t.id === c.id);
      requireThat(
        t && (t.userId === actor.id || canMentor(t.userId)),
        'No puedes responder esta consulta.',
      );
      if (actor.id === t.userId) access();
      requireThat(t.status !== 'resuelta', 'Reabre la consulta antes de responder.');
      t.messages.push({
        id: uid(),
        authorId: actor.id,
        text: clean(c.text, 'Mensaje', 2, 3000),
        date: now(),
      });
      t.status = actor.id === t.userId ? 'abierta' : 'respondida';
      notify(
        s,
        actor.id === t.userId ? t.mentorId : t.userId,
        'Nueva respuesta',
        t.subject,
        `/consultas/${t.id}`,
      );
      break;
    }
    case 'resolve': {
      const t = s.threads.find((t) => t.id === c.id);
      requireThat(
        t && (t.userId === actor.id || canMentor(t.userId)),
        'No puedes cambiar esta consulta.',
      );
      t.status = c.resolved ? 'resuelta' : 'abierta';
      break;
    }
    case 'book': {
      const p = access();
      const old = c.bookingId ? s.bookings.find((b) => b.id === c.bookingId) : undefined;
      if (c.bookingId)
        requireThat(
          old &&
            old.userId === actor.id &&
            old.status === 'confirmada' &&
            Date.parse(s.slots.find((x) => x.id === old.slotId)!.date) > Date.now(),
          'Esta reserva ya no se puede reprogramar.',
        );
      const used = s.bookings.filter(
        (b) => b.purchaseId === p.id && b.status !== 'cancelada' && b.id !== old?.id,
      ).length;
      requireThat(used < p.sessions, 'Ya utilizaste los cupos de tu programa.');
      requireThat(
        availableSlots(s, actor.id, old?.id).some((x) => x.id === c.slotId),
        'El horario ya no está disponible o no corresponde a tu plan.',
      );
      const topic = clean(c.topic, 'Tema de la sesión', 5, 300);
      if (old) {
        old.slotId = c.slotId;
        old.topic = topic;
        old.meeting = '';
      } else
        s.bookings.push({
          id: uid(),
          userId: actor.id,
          purchaseId: p.id,
          slotId: c.slotId,
          status: 'confirmada',
          topic,
          meeting: '',
        });
      notify(s, actor.id, old ? 'Sesión reprogramada' : 'Sesión confirmada', topic, '/agenda');
      notify(s, actor.mentorId, 'Agenda actualizada', `${actor.name}: ${topic}`, '/agenda');
      break;
    }
    case 'cancel': {
      const b = s.bookings.find((x) => x.id === c.id);
      requireThat(b && (actor.id === b.userId || canMentor(b.userId)), 'Reserva no disponible.');
      requireThat(
        b.status === 'confirmada' &&
          Date.parse(s.slots.find((x) => x.id === b.slotId)!.date) > Date.now(),
        'Solo puedes cancelar sesiones futuras confirmadas.',
      );
      b.status = 'cancelada';
      notify(
        s,
        b.userId,
        'Sesión cancelada',
        'El cupo vuelve a estar disponible en tu programa.',
        '/agenda',
      );
      break;
    }
    case 'meeting': {
      const b = s.bookings.find((x) => x.id === c.id);
      requireThat(b && canMentor(b.userId), 'Reserva no disponible.');
      requireThat(safeUrl(c.url), 'Utiliza un enlace HTTPS válido.');
      b.meeting = c.url.trim();
      notify(
        s,
        b.userId,
        'Enlace de la sesión actualizado',
        'Puedes consultar el enlace desde tu agenda.',
        '/agenda',
      );
      break;
    }
    case 'attend': {
      const b = s.bookings.find((x) => x.id === c.id);
      requireThat(
        b && canMentor(b.userId) && b.status === 'confirmada',
        'No puedes completar esta sesión.',
      );
      requireThat(
        Date.parse(s.slots.find((x) => x.id === b.slotId)!.date) <= Date.now(),
        'La sesión todavía no ha comenzado.',
      );
      b.status = 'realizada';
      break;
    }
    case 'slot': {
      requireThat(actor.role === 'mentor', 'Configura disponibilidad desde tu cuenta de mentor.');
      requireThat(
        Date.parse(c.date) > Date.now() && [30, 45, 60].includes(c.minutes),
        'Elige una fecha futura y una duración válida.',
      );
      requireThat(
        !s.slots.some(
          (x) =>
            x.mentorId === actor.id && x.active && x.date === c.date && x.minutes === c.minutes,
        ),
        'Ese horario ya existe.',
      );
      s.slots.push({
        id: uid(),
        mentorId: actor.id,
        date: c.date,
        minutes: c.minutes,
        active: true,
      });
      break;
    }
    case 'closeSlot': {
      const slot = s.slots.find((x) => x.id === c.id);
      requireThat(
        slot && (slot.mentorId === actor.id || actor.role === 'admin'),
        'Horario no disponible.',
      );
      requireThat(
        !s.bookings.some((b) => b.slotId === slot.id && b.status === 'confirmada'),
        'Cancela o reprograma la reserva antes de cerrar el horario.',
      );
      slot.active = false;
      break;
    }
    case 'route': {
      requireThat(canMentor(c.userId), 'No puedes ajustar la ruta de este alumno.');
      const u = s.users.find((u) => u.id === c.userId);
      requireThat(
        u && s.modules.some((m) => m.id === c.focus && !m.archived),
        'Elige un módulo disponible.',
      );
      u.focus = c.focus;
      notify(
        s,
        u.id,
        'Tu mentor ajustó tu ruta',
        'Consulta el módulo recomendado para tu siguiente paso.',
        '/ruta',
      );
      break;
    }
    case 'user': {
      admin();
      const u = s.users.find((u) => u.id === c.userId);
      requireThat(u, 'Usuario no encontrado.');
      requireThat(u.id !== actor.id, 'No puedes cambiar tu propio rol ni desactivar tu cuenta.');
      requireThat(
        !c.mentorId || s.users.some((m) => m.id === c.mentorId && m.role === 'mentor' && m.active),
        'Selecciona un mentor activo.',
      );
      if (u.role === 'mentor' && (c.role !== 'mentor' || !c.active))
        requireThat(
          !s.users.some((x) => x.mentorId === u.id),
          'Reasigna sus alumnos antes de cambiar este mentor.',
        );
      if (u.role !== c.role)
        requireThat(
          !s.bookings.some((b) => b.userId === u.id && b.status === 'confirmada'),
          'Cancela las reservas antes de cambiar el rol.',
        );
      u.role = c.role;
      u.active = c.active;
      if (u.mentorId !== c.mentorId) {
        s.bookings
          .filter((b) => b.userId === u.id && b.status === 'confirmada')
          .forEach((b) => (b.status = 'cancelada'));
        s.threads.filter((t) => t.userId === u.id).forEach((t) => (t.mentorId = c.mentorId));
      }
      u.mentorId = c.role === 'alumno' ? c.mentorId : '';
      if (!u.active)
        s.bookings
          .filter((b) => b.userId === u.id && b.status === 'confirmada')
          .forEach((b) => (b.status = 'cancelada'));
      break;
    }
    case 'saveProgram': {
      admin();
      const value = Program.parse(c.program);
      const i = s.programs.findIndex((x) => x.id === value.id);
      if (i < 0) s.programs.push(value);
      else s.programs[i] = value;
      break;
    }
    case 'saveModule': {
      admin();
      const value = Module.parse(c.module);
      const i = s.modules.findIndex((x) => x.id === value.id);
      if (i < 0) s.modules.push(value);
      else s.modules[i] = value;
      break;
    }
    case 'saveLesson': {
      admin();
      const value = Lesson.parse(c.lesson);
      requireThat(
        safeUrl(value.video) && safeUrl(value.resource),
        'Los recursos deben usar enlaces HTTPS válidos.',
      );
      requireThat(
        s.modules.some((m) => m.id === value.moduleId),
        'Selecciona un módulo existente.',
      );
      const i = s.lessons.findIndex((x) => x.id === value.id);
      if (i < 0) s.lessons.push(value);
      else s.lessons[i] = value;
      break;
    }
    case 'read':
      s.notices
        .filter((n) => n.userId === actor.id && (!c.id || c.id === n.id))
        .forEach((n) => (n.read = true));
      break;
  }
  return State.parse(s);
}
