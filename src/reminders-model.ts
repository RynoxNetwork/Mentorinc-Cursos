import { z } from 'zod';

export const ReminderSettings = z.object({
  enabled: z.boolean(),
  hoursBefore: z
    .number()
    .int()
    .refine((n) => [1, 2, 12, 24, 48].includes(n)),
});

// Delivery evidence is local only; it never represents an email sent by a provider.
export const ReminderDelivery = z.object({
  id: z.string(),
  bookingId: z.string(),
  slotId: z.string(),
  scheduleVersion: z.number().int().nonnegative(),
  userId: z.string(),
  scheduledAt: z.iso.datetime(),
  sessionAt: z.iso.datetime(),
  simulatedAt: z.iso.datetime(),
  subject: z.string(),
  body: z.string(),
  noticeId: z.string(),
  mailId: z.string(),
});
