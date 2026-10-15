import { dateLabel, now, purchaseAccessState, uid, type AppState, type Person } from './model';

type Delivery = AppState['reminderDeliveries'][number];

export function deliveryIsCurrent(s: AppState, d: Delivery) {
  const booking = s.bookings.find((b) => b.id === d.bookingId);
  const slot = s.slots.find((x) => x.id === booking?.slotId);
  return (
    !!booking &&
    !!slot &&
    booking.status !== 'cancelada' &&
    booking.slotId === d.slotId &&
    Date.parse(slot.date) === Date.parse(d.sessionAt) &&
    (booking.reminderVersion ?? 0) === d.scheduleVersion
  );
}

export function reminderQueue(s: AppState, actor: Person, at = Date.now()) {
  if (!actor.active || !s.reminderSettings.enabled) return [];
  return s.bookings
    .flatMap((booking) => {
      const slot = s.slots.find((x) => x.id === booking.slotId);
      const student = s.users.find((u) => u.id === booking.userId);
      const mentor = s.users.find((u) => u.id === slot?.mentorId);
      const purchase = s.purchases.find((p) => p.id === booking.purchaseId);
      if (
        !slot ||
        !slot.active ||
        !student?.active ||
        !student.verified ||
        !mentor?.active ||
        mentor.role !== 'mentor' ||
        student.mentorId !== mentor.id ||
        !purchase ||
        purchaseAccessState(purchase, at) !== 'vigente' ||
        booking.status !== 'confirmada' ||
        !(Date.parse(slot.date) > at) ||
        (purchase.expiresAt &&
          Date.parse(slot.date) + slot.minutes * 60000 > Date.parse(purchase.expiresAt)) ||
        !(
          actor.role === 'admin' ||
          (actor.role === 'mentor' && actor.id === mentor.id) ||
          (actor.role === 'alumno' && actor.id === student.id)
        )
      )
        return [];
      const scheduledAt = new Date(
        Date.parse(slot.date) - s.reminderSettings.hoursBefore * 3600000,
      ).toISOString();
      const recipients = [student, mentor]
        .filter((u) => actor.role !== 'alumno' || u.id === actor.id)
        .map((u) => ({
          userId: u.id,
          name: u.name,
          role: u.role,
          delivered: s.reminderDeliveries.some(
            (d) => d.bookingId === booking.id && d.userId === u.id && deliveryIsCurrent(s, d),
          ),
          subject: 'Recordatorio de mentoría · prueba local',
          body: `Hola, ${u.name}. Tu sesión sobre «${booking.topic}» con ${u.id === student.id ? mentor.name : student.name} está prevista para ${dateLabel(slot.date)} (hora de Lima), durante ${slot.minutes} minutos. ${booking.meeting ? `Enlace: ${booking.meeting}` : 'El enlace de reunión todavía está pendiente; revisa tu agenda.'} Puedes consultar los cambios en /agenda. Este aviso solo existe en esta copia local; no se envió por correo.`,
        }));
      return [
        {
          bookingId: booking.id,
          slotId: slot.id,
          scheduleVersion: booking.reminderVersion ?? 0,
          sessionAt: new Date(slot.date).toISOString(),
          topic: booking.topic,
          scheduledAt,
          recipients,
          status: recipients.every((r) => r.delivered)
            ? ('simulado' as const)
            : Date.parse(scheduledAt) <= at
              ? ('listo' as const)
              : ('programado' as const),
        },
      ];
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export function simulateReminders(s: AppState, actor: Person, bookingId?: string) {
  if (actor.role === 'alumno' || !actor.active)
    throw new Error('La simulación corresponde al equipo.');
  const items = reminderQueue(s, actor);
  const selected = bookingId
    ? items.filter((r) => r.bookingId === bookingId)
    : items.filter((r) => r.status === 'listo');
  if (bookingId && !selected.length)
    throw new Error('La reserva ya no tiene un recordatorio disponible.');
  for (const reminder of selected) {
    for (const recipient of reminder.recipients.filter((r) => !r.delivered)) {
      const noticeId = uid(),
        mailId = uid();
      s.notices.unshift({
        id: noticeId,
        userId: recipient.userId,
        title: recipient.subject,
        body: recipient.body,
        href: '/agenda',
        read: false,
        date: now(),
      });
      s.mails.unshift({
        id: mailId,
        userId: recipient.userId,
        subject: recipient.subject,
        body: recipient.body,
        kind: 'notice',
        used: false,
        expires: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      s.reminderDeliveries.unshift({
        id: uid(),
        bookingId: reminder.bookingId,
        slotId: reminder.slotId,
        scheduleVersion: reminder.scheduleVersion,
        userId: recipient.userId,
        scheduledAt: reminder.scheduledAt,
        sessionAt: reminder.sessionAt,
        simulatedAt: now(),
        subject: recipient.subject,
        body: recipient.body,
        noticeId,
        mailId,
      });
    }
  }
}
