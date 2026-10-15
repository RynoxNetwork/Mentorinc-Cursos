import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSeed } from './seed';
import { execute } from './domain';
import { reminderQueue, deliveryIsCurrent } from './reminders';
import { readBackup } from './transfer';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

function reserved() {
  let s = createSeed();
  s.slots.push({
    id: 'reminder-slot',
    mentorId: 'ana',
    date: '2026-10-17T12:00:00.000Z',
    minutes: 30,
    active: true,
  });
  s = execute(s, { type: 'book', slotId: 'reminder-slot', topic: 'Revisar mi propuesta de valor' });
  s.session = 'admin';
  return s;
}

describe('Recordatorios locales conectados a la agenda', () => {
  it('previsualiza destinatarios y hora sin emitir hasta que corresponde o se simula manualmente', () => {
    let s = reserved();
    const admin = s.users.find((u) => u.id === 'admin')!;
    let queue = reminderQueue(s, admin);
    expect(queue[0].scheduledAt).toBe('2026-10-16T12:00:00.000Z');
    expect(queue[0].recipients.map((r) => r.userId)).toEqual(['maria', 'ana']);
    expect(queue[0].recipients[0].body).toContain('enlace de reunión todavía está pendiente');
    expect(queue[0].status).toBe('programado');
    s = execute(s, { type: 'simulateReminders' });
    expect(s.reminderDeliveries).toHaveLength(0);
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
    expect(reminderQueue(s, admin)[0].status).toBe('listo');
    s = execute(s, { type: 'simulateReminders' });
    expect(s.reminderDeliveries).toHaveLength(2);
    expect(s.mails.slice(0, 2).every((m) => m.body.includes('no se envió por correo'))).toBe(true);
    const count = s.notices.length;
    s = execute(s, { type: 'simulateReminders', bookingId: s.bookings[0].id });
    expect(s.notices).toHaveLength(count);
    expect(reminderQueue(s, admin)[0].status).toBe('simulado');
  });

  it('actualiza el enlace pendiente antes de simular y conserva la copia del mensaje', () => {
    let s = reserved();
    s = execute(s, { type: 'meeting', id: s.bookings[0].id, url: 'https://example.test/reunion' });
    s = execute(s, { type: 'simulateReminders', bookingId: s.bookings[0].id });
    expect(s.reminderDeliveries[0].body).toContain('https://example.test/reunion');
    expect(s.reminderDeliveries[0].simulatedAt).toBe('2026-10-15T12:00:00.000Z');
  });

  it('reprogramar invalida el aviso anterior y permite uno nuevo, incluso al volver al horario inicial', () => {
    let s = reserved();
    const id = s.bookings[0].id;
    s = execute(s, { type: 'simulateReminders', bookingId: id });
    const original = s.reminderDeliveries[0];
    s.slots.push({
      ...s.slots.find((x) => x.id === 'reminder-slot')!,
      id: 'rescheduled',
      date: '2026-10-18T12:00:00.000Z',
    });
    s.session = 'maria';
    s = execute(s, {
      type: 'book',
      bookingId: id,
      slotId: 'rescheduled',
      topic: 'Revisar mi nueva propuesta',
    });
    expect(deliveryIsCurrent(s, original)).toBe(false);
    s.session = 'admin';
    expect(
      reminderQueue(
        s,
        s.users.find((u) => u.id === 'admin')!,
      )[0].scheduledAt,
    ).toBe('2026-10-17T12:00:00.000Z');
    s = execute(s, { type: 'simulateReminders', bookingId: id });
    expect(s.reminderDeliveries).toHaveLength(4);
    s.session = 'maria';
    s = execute(s, {
      type: 'book',
      bookingId: id,
      slotId: 'reminder-slot',
      topic: 'Volver al horario inicial',
    });
    s.session = 'admin';
    s = execute(s, { type: 'simulateReminders', bookingId: id });
    expect(s.reminderDeliveries).toHaveLength(6);
    expect(s.reminderDeliveries.filter((d) => deliveryIsCurrent(s, d))).toHaveLength(2);
  });

  it('cancelar retira la cola e identifica las simulaciones anteriores como sin efecto', () => {
    let s = reserved();
    const id = s.bookings[0].id;
    s = execute(s, { type: 'simulateReminders', bookingId: id });
    s = execute(s, { type: 'cancel', id });
    expect(
      reminderQueue(
        s,
        s.users.find((u) => u.id === 'admin')!,
      ),
    ).toEqual([]);
    expect(s.reminderDeliveries.every((d) => !deliveryIsCurrent(s, d))).toBe(true);
    expect(() => execute(s, { type: 'simulateReminders', bookingId: id })).toThrow('disponible');
  });

  it('solo permite al mentor sus sesiones y al alumno la vista de su propio mensaje', () => {
    let s = reserved();
    const student = s.users.find((u) => u.id === 'maria')!;
    expect(reminderQueue(s, student)[0].recipients.map((u) => u.userId)).toEqual(['maria']);
    s.session = 'maria';
    expect(() => execute(s, { type: 'simulateReminders' })).toThrow('mentor');
    expect(() => execute(s, { type: 'reminderSettings', enabled: false, hoursBefore: 1 })).toThrow(
      'administración',
    );
    const other = { ...s.users.find((u) => u.id === 'ana')!, id: 'other' };
    s.users.push(other);
    s.session = other.id;
    expect(reminderQueue(s, other)).toEqual([]);
    expect(() => execute(s, { type: 'simulateReminders', bookingId: s.bookings[0].id })).toThrow(
      'disponible',
    );
    s.session = 'ana';
    s = execute(s, { type: 'simulateReminders', bookingId: s.bookings[0].id });
    expect(s.reminderDeliveries).toHaveLength(2);
  });

  it('pausar o cambiar anticipación no duplica simulaciones; el respaldo conserva regla e historial', () => {
    let s = reserved();
    const admin = s.users.find((u) => u.id === 'admin')!;
    s = execute(s, { type: 'reminderSettings', enabled: false, hoursBefore: 1 });
    expect(reminderQueue(s, admin)).toEqual([]);
    expect(() => execute(s, { type: 'reminderSettings', enabled: true, hoursBefore: 0 })).toThrow();
    s = execute(s, { type: 'reminderSettings', enabled: true, hoursBefore: 1 });
    expect(reminderQueue(s, admin)[0].scheduledAt).toBe('2026-10-17T11:00:00.000Z');
    s = execute(s, { type: 'simulateReminders', bookingId: s.bookings[0].id });
    s = execute(s, { type: 'reminderSettings', enabled: true, hoursBefore: 48 });
    s = execute(s, { type: 'simulateReminders' });
    expect(s.reminderDeliveries).toHaveLength(2);
    const copy = readBackup(JSON.stringify(s));
    expect(copy.reminderSettings.hoursBefore).toBe(48);
    expect(copy.reminderDeliveries).toEqual(s.reminderDeliveries);
    expect(copy.session).toBeNull();
  });

  it('no genera avisos de sesiones pasadas, vencidas, reembolsadas o alumnos desactivados', () => {
    const s = reserved();
    const admin = s.users.find((u) => u.id === 'admin')!;
    vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
    expect(reminderQueue(s, admin)).toEqual([]);
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    const expired = structuredClone(s);
    expired.purchases[0].expiresAt = '2026-10-16T12:00:00Z';
    expect(reminderQueue(expired, admin)).toEqual([]);
    const refunded = execute(s, { type: 'payment', id: 'purchase-maria', status: 'reembolsado' });
    expect(reminderQueue(refunded, admin)).toEqual([]);
    s.users[0].active = false;
    expect(reminderQueue(s, admin)).toEqual([]);
  });
});
