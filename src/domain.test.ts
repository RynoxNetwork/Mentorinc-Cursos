import { describe, it, expect } from 'vitest';
import { createSeed } from './seed';
import { execute, type Command } from './domain';
import { State, activeAccess, availableSlots, progress, visibleLessons } from './model';
import { loadState } from './store';

describe('Recorridos locales de Mentorinc', () => {
  it('inicia con identidad, cinco módulos y quince lecciones válidas', () => {
    const s = State.parse(createSeed());
    expect(s.modules).toHaveLength(5);
    expect(visibleLessons(s)).toHaveLength(15);
    expect(progress(s, s.users[0])).toBe(27);
  });
  it('pago confirmado no da acceso hasta la aprobación manual', () => {
    let s = createSeed();
    s.session = 'diego';
    expect(activeAccess(s, 'diego')).toBeUndefined();
    s = execute(s, { type: 'payment', id: 'purchase-diego', status: 'confirmado' });
    expect(activeAccess(s, 'diego')).toBeUndefined();
    expect(() =>
      execute(s, { type: 'approval', id: 'purchase-diego', status: 'aprobado' }),
    ).toThrow('administración');
    s.session = 'admin';
    s = execute(s, { type: 'approval', id: 'purchase-diego', status: 'aprobado' });
    expect(activeAccess(s, 'diego')).toBeDefined();
  });
  it('no permite aprobar sin pago ni crear compras duplicadas', () => {
    const s = createSeed();
    s.session = 'admin';
    expect(() =>
      execute(s, { type: 'approval', id: 'purchase-diego', status: 'aprobado' }),
    ).toThrow('pago confirmado');
    s.session = 'diego';
    expect(() => execute(s, { type: 'purchase', accepted: true, programId: 'senior' })).toThrow(
      'solicitud en curso',
    );
  });
  it('registra, confirma y consume una sola vez el enlace local', () => {
    let s = execute(createSeed(), {
      type: 'register',
      accepted: true,
      name: 'Alumno de prueba',
      email: 'nuevo@example.test',
    });
    const userId = s.session!;
    expect(s.users.find((u) => u.id === userId)?.verified).toBe(false);
    expect(() => execute(s, { type: 'purchase', accepted: true, programId: 'junior' })).toThrow(
      'Confirma tu correo',
    );
    const id = s.mails[0].id;
    s = execute(s, { type: 'useLink', id });
    expect(s.users.find((u) => u.id === userId)?.verified).toBe(true);
    expect(() => execute(s, { type: 'useLink', id })).toThrow('ya se usó');
    s = execute(s, { type: 'purchase', accepted: true, programId: 'junior' });
    expect(s.purchases[0].userId).toBe(userId);
  });
  it('rechaza correos duplicados y enlaces caducados', () => {
    const s = createSeed();
    expect(() =>
      execute(s, {
        type: 'register',
        accepted: true,
        name: 'Duplicado',
        email: 'MARIA@example.test',
      }),
    ).toThrow('ya tiene');
    const next = execute(s, { type: 'sendLink', email: 'maria@example.test' });
    next.mails[0].expires = '2020-01-01T00:00:00Z';
    expect(() => execute(next, { type: 'useLink', id: next.mails[0].id })).toThrow('caducó');
  });
  it('diagnóstico deriva el foco de las cuatro respuestas', () => {
    const fresh = createSeed();
    fresh.users[0].initialAssessment = null;
    const context = {
      experience: '1-3' as const,
      context: 'Vendo servicios a empresas.',
      style: 'Escucho antes de presentar mi propuesta.',
    };
    const s = execute(fresh, {
      type: 'diagnostic',
      accepted: true,
      context,
      values: [4, 2, 5, 3],
      goal: 'Quiero mejorar mis conversaciones.',
    });
    expect(s.users[0].focus).toBe('com');
    expect(() =>
      execute(s, {
        type: 'diagnostic',
        accepted: true,
        values: [1],
        goal: 'Completar mi ruta',
        context,
      }),
    ).toThrow('cuatro');
  });
  it('no completa con respuesta incorrecta y completar es idempotente', () => {
    const s = createSeed();
    expect(() => execute(s, { type: 'complete', lessonId: 'com-2', answer: 1 })).toThrow('Revisa');
    const command: Command = { type: 'complete', lessonId: 'com-2', answer: 0 };
    const one = execute(s, command),
      two = execute(one, command);
    expect(two.users[0].completed.filter((x) => x === 'com-2')).toHaveLength(1);
    expect(s.users[0].completed).not.toContain('com-2');
  });
  it('bloquea aula y actividades cuando no hay acceso', () => {
    const s = createSeed();
    s.session = 'diego';
    expect(() => execute(s, { type: 'complete', lessonId: 'yo-1', answer: 0 })).toThrow(
      'aprobación',
    );
    expect(() =>
      execute(s, {
        type: 'submit',
        lessonId: 'yo-1',
        text: 'Mi entrega de prueba con suficiente contenido.',
        attachment: null,
      }),
    ).toThrow('aprobación');
  });
  it('entrega → revisión → ajustes → reentrega → aprobación', () => {
    let s = execute(createSeed(), {
      type: 'submit',
      lessonId: 'com-2',
      text: 'Escucharé el contexto y preguntaré por el resultado que desea el cliente.',
      attachment: null,
    });
    const id = s.submissions[0].id;
    s.session = 'ana';
    s = execute(s, {
      type: 'review',
      id,
      feedback: 'Agrega una pregunta sobre el impacto actual.',
      score: 14,
      status: 'revisar',
    });
    s.session = 'maria';
    s = execute(s, {
      type: 'submit',
      lessonId: 'com-2',
      text: '¿Cómo lo resuelves hoy? ¿Qué impacto tiene? ¿Qué resultado te gustaría?',
      attachment: null,
    });
    expect(s.submissions[0].feedback).toBe('');
    s.session = 'ana';
    s = execute(s, {
      type: 'review',
      id,
      feedback: 'Las tres preguntas distinguen contexto, impacto y resultado.',
      score: 18,
      status: 'aprobada',
    });
    s.session = 'maria';
    expect(s.notices.some((n) => n.userId === 'maria' && n.title.includes('revisó'))).toBe(true);
    expect(() =>
      execute(s, {
        type: 'submit',
        lessonId: 'com-2',
        text: 'Una nueva respuesta con suficientes caracteres.',
        attachment: null,
      }),
    ).toThrow('aprobada');
  });
  it('un mentor ajeno no puede revisar ni ajustar la ruta', () => {
    let s = execute(createSeed(), {
      type: 'submit',
      lessonId: 'com-2',
      text: 'Una práctica concreta para entender al cliente.',
      attachment: null,
    });
    s.users.push({
      ...s.users.find((u) => u.id === 'ana')!,
      id: 'otro',
      email: 'otro@example.test',
    });
    s.session = 'otro';
    expect(() =>
      execute(s, {
        type: 'review',
        id: s.submissions[0].id,
        feedback: 'Feedback con suficiente contenido.',
        score: 18,
        status: 'aprobada',
      }),
    ).toThrow('No puedes');
    expect(() => execute(s, { type: 'route', userId: 'maria', focus: 'neg' })).toThrow('No puedes');
  });
  it('rechaza adjuntos ejecutables y enlaces inseguros', () => {
    const s = createSeed();
    expect(() =>
      execute(s, {
        type: 'submit',
        lessonId: 'com-2',
        text: 'Actividad de prueba con suficiente contenido.',
        attachment: { name: 'bad.html', data: 'data:text/html;base64,PHNjcmlwdD4=' },
      }),
    ).toThrow('Adjunta');
    s.session = 'admin';
    expect(() =>
      execute(s, {
        type: 'saveLesson',
        lesson: { ...s.lessons[0], resource: 'javascript:alert(1)' },
      }),
    ).toThrow('HTTPS');
  });
  it('reservas bloquean horarios solapados de diferentes duraciones', () => {
    let s = createSeed();
    const slot = availableSlots(s, 'maria')[0];
    s = execute(s, { type: 'book', slotId: slot.id, topic: 'Practicar mis preguntas abiertas.' });
    s.session = 'admin';
    s = execute(s, { type: 'approval', id: 'purchase-lucia', status: 'aprobado' });
    expect(availableSlots(s, 'lucia').some((x) => x.date === slot.date)).toBe(false);
  });
  it('el cupo no se duplica al reprogramar y se recupera al cancelar', () => {
    let s = createSeed();
    const first = availableSlots(s, 'maria')[0];
    s = execute(s, { type: 'book', slotId: first.id, topic: 'Practicar mi propuesta.' });
    const booking = s.bookings[0].id;
    const next = availableSlots(s, 'maria', booking).find((x) => x.id !== first.id)!;
    s = execute(s, {
      type: 'book',
      slotId: next.id,
      bookingId: booking,
      topic: 'Practicar objeciones.',
    });
    expect(s.bookings).toHaveLength(1);
    expect(availableSlots(s, 'maria').some((x) => x.id === first.id)).toBe(true);
    s = execute(s, { type: 'cancel', id: booking });
    expect(s.bookings[0].status).toBe('cancelada');
    expect(availableSlots(s, 'maria').some((x) => x.id === next.id)).toBe(true);
  });
  it('impide exceder cupos o reservar horarios pasados', () => {
    let s = createSeed();
    for (let i = 0; i < 2; i++)
      s = execute(s, {
        type: 'book',
        slotId: availableSlots(s, 'maria')[0].id,
        topic: 'Preparar la siguiente conversación.',
      });
    expect(() =>
      execute(s, {
        type: 'book',
        slotId: availableSlots(s, 'maria')[0].id,
        topic: 'Una tercera sesión.',
      }),
    ).toThrow('cupos');
    const fresh = createSeed();
    fresh.slots[0].date = '2020-01-01T10:00:00Z';
    expect(() =>
      execute(fresh, { type: 'book', slotId: fresh.slots[0].id, topic: 'Sesión pasada.' }),
    ).toThrow('no está disponible');
  });
  it('no marca como realizada una sesión futura', () => {
    let s = createSeed();
    s = execute(s, {
      type: 'book',
      slotId: availableSlots(s, 'maria')[0].id,
      topic: 'Una sesión futura.',
    });
    s.session = 'ana';
    expect(() => execute(s, { type: 'attend', id: s.bookings[0].id })).toThrow('todavía');
  });
  it('la revocación y el reembolso cierran acceso y liberan reservas', () => {
    let s = execute(createSeed(), {
      type: 'book',
      slotId: availableSlots(createSeed(), 'maria')[0].id,
      topic: 'Practicar preguntas.',
    });
    s.session = 'admin';
    s = execute(s, { type: 'payment', id: 'purchase-maria', status: 'reembolsado' });
    expect(activeAccess(s, 'maria')).toBeUndefined();
    expect(s.bookings[0].status).toBe('cancelada');
  });
  it('conversación privada → respuesta → resolución → reapertura', () => {
    let s = execute(createSeed(), {
      type: 'thread',
      subject: 'Mi práctica comercial',
      text: '¿Cómo puedo mejorar la pregunta de apertura?',
    });
    const id = s.threads[0].id;
    s.session = 'ana';
    s = execute(s, { type: 'reply', id, text: 'Empieza preguntando por su contexto actual.' });
    expect(s.threads[0].status).toBe('respondida');
    s = execute(s, { type: 'resolve', id, resolved: true });
    expect(() => execute(s, { type: 'reply', id, text: 'Otra respuesta' })).toThrow('Reabre');
    s = execute(s, { type: 'resolve', id, resolved: false });
    s = execute(s, { type: 'reply', id, text: 'Podemos practicarlo en la próxima sesión.' });
    expect(s.threads[0].messages).toHaveLength(3);
  });
  it('programas conservan el contrato de compras previas', () => {
    let s = createSeed();
    s.session = 'admin';
    s = execute(s, {
      type: 'saveProgram',
      program: { ...s.programs[0], price: 999, sessions: 10, minutes: 60 },
    });
    expect(activeAccess(s, 'maria')?.amount).toBe(199);
    expect(activeAccess(s, 'maria')?.sessions).toBe(2);
    expect(activeAccess(s, 'maria')?.minutes).toBe(30);
  });
  it('archivar contenido lo retira del catálogo y conserva el acceso de alumnos inscritos', () => {
    let s = createSeed();
    s.session = 'admin';
    s = execute(s, { type: 'saveModule', module: { ...s.modules[0], archived: true } });
    expect(visibleLessons(s)).toHaveLength(12);
    expect(s.users[0].completed).toContain('yo-1');
    s.session = 'maria';
    expect(visibleLessons(s, 'maria')).toHaveLength(15);
    s = execute(s, { type: 'complete', lessonId: 'yo-1', answer: 0 });
    expect(progress(s, s.users[0])).toBe(27);
  });
  it('no puede desactivar a un mentor con alumnos ni a sí mismo', () => {
    const s = createSeed();
    s.session = 'admin';
    expect(() =>
      execute(s, { type: 'user', userId: 'ana', role: 'mentor', mentorId: '', active: false }),
    ).toThrow('Reasigna');
    expect(() =>
      execute(s, { type: 'user', userId: 'admin', role: 'alumno', mentorId: 'ana', active: false }),
    ).toThrow('propio');
  });
  it('un estado persistido se recupera y los datos corruptos no se destruyen al leer', () => {
    const s = execute(createSeed(), {
      type: 'profile',
      name: 'María de prueba',
      goal: 'Avanzar en mi práctica.',
    });
    const loaded = loadState({ getItem: () => JSON.stringify(s) });
    expect(loaded.state.users[0].name).toBe('María de prueba');
    const broken = loadState({ getItem: () => '{bad json' });
    expect(broken.error).toContain('no se pudieron abrir');
    expect(broken.state.version).toBe(3);
  });
  it('un estado fallido no modifica el estado original', () => {
    const s = createSeed(),
      before = JSON.stringify(s);
    expect(() =>
      execute(s, { type: 'submit', lessonId: 'com-2', text: '', attachment: null }),
    ).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
});
