import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createSeed } from './seed';
import { execute } from './domain';
import {
  activeAccess,
  parseStoredState,
  progress,
  purchaseAccessState,
  visibleLessons,
} from './model';
import { canFinish, sessionBalance } from './insights';
import { readBackup } from './transfer';
import { Provider } from './store';
import { Purchases } from './pages/General';
import { LessonPage } from './pages/Learning';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Continuidad de la inscripción y avisos de pago', () => {
  it('la navegación del aula conserva lecciones archivadas y excluye contenido añadido después', () => {
    const s = createSeed();
    s.modules.find((m) => m.id === 'com')!.archived = true;
    s.lessons.push({
      ...s.lessons.find((l) => l.id === 'com-1')!,
      id: 'com-extra',
      title: 'Lección posterior a la inscripción',
    });
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(s) });
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/leccion/com-1']}>
        <Provider>
          <Routes>
            <Route path="/leccion/:id" element={<LessonPage />} />
          </Routes>
        </Provider>
      </MemoryRouter>,
    );
    expect(html).toContain('Preguntas que abren conversaciones');
    expect(html).not.toContain('Lección posterior a la inscripción');
    expect(html).not.toContain('Esta lección no está disponible');
  });
  it('archivar lecciones no aumenta el avance ni habilita el cierre; se pueden seguir completando', () => {
    let s = createSeed();
    const ids = s.purchases[0].lessonIds!;
    s.session = 'admin';
    for (const l of s.lessons.filter((l) => !s.users[0].completed.includes(l.id)))
      s = execute(s, { type: 'saveLesson', lesson: { ...l, published: false } });
    expect(visibleLessons(s)).toHaveLength(4);
    expect(visibleLessons(s, 'maria').map((l) => l.id)).toEqual(ids);
    expect(progress(s, s.users[0])).toBe(27);
    expect(canFinish(s, s.users[0])).toBe(false);
    s.session = 'maria';
    for (const l of visibleLessons(s, 'maria'))
      s = execute(s, { type: 'quizAttempt', lessonId: l.id, answer: l.correct });
    s = execute(s, {
      type: 'submit',
      lessonId: 'neg-3',
      text: 'Mi propuesta de acuerdo incluye intereses y próximos pasos.',
      attachment: null,
    });
    expect(s.submissions[0].lessonId).toBe('neg-3');
    expect(progress(s, s.users[0])).toBe(100);
    expect(canFinish(s, s.users[0])).toBe(true);
  });

  it('un módulo archivado permanece en la inscripción anterior y desaparece de las nuevas', () => {
    let s = createSeed();
    s.session = 'admin';
    s = execute(s, {
      type: 'saveModule',
      module: { ...s.modules.find((m) => m.id === 'com')!, archived: true },
    });
    expect(visibleLessons(s).some((l) => l.moduleId === 'com')).toBe(false);
    expect(visibleLessons(s, 'maria').filter((l) => l.moduleId === 'com')).toHaveLength(3);
    s.session = 'ana';
    s = execute(s, { type: 'route', userId: 'maria', focus: 'com' });
    s = execute(s, {
      type: 'register',
      name: 'Nuevo alumno',
      email: 'curriculum@example.test',
      accepted: true,
    });
    s = execute(s, { type: 'useLink', id: s.mails[0].id });
    s = execute(s, { type: 'purchase', programId: 'junior', accepted: true });
    expect(s.purchases[0].lessonIds?.some((id) => id.startsWith('com-'))).toBe(false);
    expect(s.purchases.find((p) => p.id === 'purchase-maria')?.lessonIds).toHaveLength(15);
  });

  it('fija el temario de copias anteriores antes de permitir cambios editoriales', () => {
    const old = createSeed();
    delete old.purchases[0].lessonIds;
    const loaded = parseStoredState(old);
    expect(loaded.purchases[0].lessonIds).toHaveLength(15);
    old.session = 'admin';
    const s = execute(old, { type: 'saveModule', module: { ...old.modules[0], archived: true } });
    expect(visibleLessons(s, 'maria')).toHaveLength(15);
    expect(progress(s, s.users[0])).toBe(27);
  });

  it('un temario incompleto nunca se considera terminado y no se importa', () => {
    const s = createSeed();
    s.purchases[0].lessonIds!.push('missing');
    s.users[0].completed = s.lessons.map((l) => l.id);
    expect(progress(s, s.users[0])).toBe(94);
    expect(canFinish(s, s.users[0])).toBe(false);
    expect(() => readBackup(JSON.stringify(s))).toThrow('temario');
  });

  it('avisa al alumno y administradores activos una sola vez por confirmación', () => {
    let s = createSeed();
    s.users.push({ ...s.users.find((u) => u.id === 'admin')!, id: 'inactive', active: false });
    s.session = 'diego';
    const notices = s.notices.length,
      mails = s.mails.length;
    s = execute(s, { type: 'payment', id: 'purchase-diego', status: 'confirmado' });
    expect(
      s.notices
        .slice(0, 2)
        .map((n) => n.userId)
        .sort(),
    ).toEqual(['admin', 'diego']);
    expect(s.notices[0].href).toBe('/admin/compras');
    expect(s.notices[0].body).toContain('purchase-diego');
    expect(s.mails[0].userId).toBe('admin');
    expect(activeAccess(s, 'diego')).toBeUndefined();
    s = execute(s, { type: 'payment', id: 'purchase-diego', status: 'confirmado' });
    expect(s.notices).toHaveLength(notices + 2);
    expect(s.mails).toHaveLength(mails + 2);
    s.session = 'admin';
    s = execute(s, { type: 'approval', id: 'purchase-diego', status: 'aprobado' });
    const count = s.notices.length;
    s = execute(s, { type: 'payment', id: 'purchase-diego', status: 'confirmado' });
    expect(s.notices).toHaveLength(count);
    expect(activeAccess(s, 'diego')).toBeDefined();
  });

  it('solo avisa al negocio al confirmar, después de un intento fallido', () => {
    let s = createSeed();
    s.session = 'diego';
    const prior = s.notices.length;
    s = execute(s, { type: 'payment', id: 'purchase-diego', status: 'fallido' });
    expect(s.notices).toHaveLength(prior + 1);
    expect(s.notices[0].userId).toBe('diego');
    s = execute(s, { type: 'payment', id: 'purchase-diego', status: 'confirmado' });
    expect(s.notices).toHaveLength(prior + 3);
  });

  it('al vencer, compra, acceso, cupos y cierre comparten el mismo criterio', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    const s = createSeed();
    const p = s.purchases[0];
    p.expiresAt = new Date().toISOString();
    s.users[0].completed = p.lessonIds!;
    expect(purchaseAccessState(p)).toBe('vencido');
    expect(activeAccess(s, 'maria')).toBeUndefined();
    expect(sessionBalance(s, ['maria']).available).toBe(0);
    expect(canFinish(s, s.users[0])).toBe(false);
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(s) });
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Provider>
          <Purchases />
        </Provider>
      </MemoryRouter>,
    );
    expect(html).toContain('Acceso vencido');
    expect(html).toContain('Consultar mi historial');
    expect(html).not.toContain('Entrar al aula');
    expect(html).not.toContain('Acceso habilitado');
    expect(progress(s, s.users[0])).toBe(100);
    p.payment = 'reembolsado';
    expect(purchaseAccessState(p)).toBe('reembolsado');
  });
});
