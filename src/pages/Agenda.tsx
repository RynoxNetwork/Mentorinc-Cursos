import { useState } from 'react';
import { CalendarDays, ArrowRight, ExternalLink } from 'lucide-react';
import { useStore } from '../store';
import { activeAccess, availableSlots, dateLabel, type AppState } from '../model';
import { Heading, Access, Badge, Area, Field, Select, Empty, getText, ButtonLink } from '../ui';

export function Agenda() {
  const { user } = useStore();
  return user?.role === 'alumno' ? (
    <Access>
      <StudentAgenda />
    </Access>
  ) : (
    <TeamAgenda />
  );
}
function StudentAgenda() {
  const { state, user, run } = useStore();
  const [editing, setEditing] = useState<string>(),
    [day, setDay] = useState(''),
    [slotId, setSlotId] = useState('');
  if (!user) return null;
  const purchase = activeAccess(state, user.id)!;
  const bookings = state.bookings.filter((b) => b.userId === user.id);
  const used = bookings.filter(
    (b) => b.purchaseId === purchase.id && b.status !== 'cancelada',
  ).length;
  const slots = availableSlots(state, user.id, editing);
  const days = [...new Set(slots.map((s) => s.date.slice(0, 10)))];
  const selectedDay = days.includes(day) ? day : days[0];
  const selectedBooking = bookings.find((b) => b.id === editing);
  return (
    <>
      <Heading
        title="Una conversación para avanzar"
        action={
          <ButtonLink to="/recordatorios" secondary>
            Recordatorios
          </ButtonLink>
        }
      >
        Reserva un espacio con tu mentor. Zona horaria: Lima, Perú (UTC−5).
      </Heading>
      <div className="split">
        <section>
          <h2>{editing ? 'Reprogramar mi sesión' : 'Elige tu próximo espacio'}</h2>
          {slots.length ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  run(
                    {
                      type: 'book',
                      slotId,
                      topic: getText(e.currentTarget, 'topic'),
                      bookingId: editing,
                    },
                    editing ? 'Sesión reprogramada' : 'Tu sesión está confirmada',
                  )
                ) {
                  setEditing(undefined);
                  setSlotId('');
                  e.currentTarget.reset();
                }
              }}
            >
              <div className="day-picker">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="day"
                    aria-pressed={selectedDay === d}
                    onClick={() => {
                      setDay(d);
                      setSlotId('');
                    }}
                  >
                    <span>
                      {new Intl.DateTimeFormat('es-PE', {
                        weekday: 'short',
                        timeZone: 'UTC',
                      }).format(new Date(`${d}T12:00:00Z`))}
                    </span>
                    <strong>{d.slice(-2)}</strong>
                    <span>
                      {new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' }).format(
                        new Date(`${d}T12:00:00Z`),
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <fieldset>
                <legend>Horarios disponibles · {purchase.minutes} minutos</legend>
                <div className="slots">
                  {slots
                    .filter((s) => s.date.startsWith(selectedDay || 'none'))
                    .map((s) => (
                      <label className="slot" key={s.id}>
                        <input
                          type="radio"
                          name="slot"
                          value={s.id}
                          required
                          checked={slotId === s.id}
                          onChange={() => setSlotId(s.id)}
                        />
                        <span>
                          {new Intl.DateTimeFormat('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'America/Lima',
                          }).format(new Date(s.date))}
                        </span>
                      </label>
                    ))}
                </div>
              </fieldset>
              <Area
                key={editing || 'new'}
                label="¿Qué te gustaría trabajar?"
                name="topic"
                required
                minLength={5}
                maxLength={300}
                defaultValue={selectedBooking?.topic || ''}
                placeholder="Por ejemplo, preparar una conversación difícil con un cliente."
              />
              <div className="actions">
                <button className="action" disabled={!editing && used >= purchase.sessions}>
                  {editing ? 'Confirmar nuevo horario' : 'Confirmar reserva'}
                  <ArrowRight size={18} />
                </button>
                {editing && (
                  <button
                    className="action secondary"
                    type="button"
                    onClick={() => {
                      setEditing(undefined);
                      setSlotId('');
                    }}
                  >
                    Conservar horario actual
                  </button>
                )}
              </div>
            </form>
          ) : (
            <Empty title="No hay horarios disponibles">
              Tu mentor puede añadir nuevos espacios desde su agenda.
            </Empty>
          )}
          <section className="section-spaced">
            <h2>Mis sesiones</h2>
            {bookings.length ? (
              bookings.toReversed().map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  edit={() => {
                    setEditing(b.id);
                    setSlotId('');
                    window.scrollTo({ top: 0 });
                  }}
                />
              ))
            ) : (
              <p className="soft">Aquí aparecerán tus reservas y el enlace de cada sesión.</p>
            )}
          </section>
        </section>
        <aside className="aside">
          <CalendarDays size={30} />
          <h3>Tu espacio de mentoría</h3>
          <div className="metric-inline">
            <strong>{Math.max(0, purchase.sessions - used)}</strong>
            <span>de {purchase.sessions} sesiones disponibles</span>
          </div>
          <p>
            Sesiones de {purchase.minutes} minutos con{' '}
            {state.users.find((u) => u.id === user.mentorId)?.name || 'tu mentor'}.
          </p>
          <p className="soft">
            Puedes cancelar o reprogramar antes de la sesión. Una cancelación devuelve el cupo. El
            mentor incorporará el enlace de la reunión.
          </p>
        </aside>
      </div>
    </>
  );
}
function BookingCard({
  booking: b,
  edit,
}: {
  booking: AppState['bookings'][number];
  edit?: () => void;
}) {
  const { state, user, run } = useStore();
  const [confirm, setConfirm] = useState(false);
  const slot = state.slots.find((s) => s.id === b.slotId)!;
  const future = Date.parse(slot.date) > Date.now();
  return (
    <article className="reservation">
      <div className="section-title">
        <Badge tone={b.status === 'confirmada' ? 'good' : ''}>
          {b.status === 'confirmada'
            ? 'Confirmada'
            : b.status === 'realizada'
              ? 'Realizada'
              : 'Cancelada'}
        </Badge>
        <CalendarDays size={22} />
      </div>
      <h3>{dateLabel(slot.date)}</h3>
      <p>{b.topic}</p>
      <p className="soft">
        {slot.minutes} minutos ·{' '}
        {user?.role === 'alumno'
          ? state.users.find((u) => u.id === slot.mentorId)?.name
          : state.users.find((u) => u.id === b.userId)?.name}
      </p>
      {b.status === 'confirmada' && (
        <>
          {b.meeting ? (
            <a
              className="action secondary"
              href={b.meeting}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir enlace de reunión
              <ExternalLink size={16} />
            </a>
          ) : (
            <p className="support-note">Enlace de reunión pendiente.</p>
          )}
          {user?.role !== 'alumno' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  { type: 'meeting', id: b.id, url: getText(e.currentTarget, 'url') },
                  'Enlace actualizado',
                );
              }}
            >
              <Field
                label="Enlace de reunión"
                name="url"
                type="url"
                placeholder="https://…"
                defaultValue={b.meeting}
              />
              <button className="quiet">Guardar enlace</button>
            </form>
          )}
          <div className="actions">
            {edit && future && (
              <button className="quiet" onClick={edit}>
                Reprogramar
              </button>
            )}
            {future && (
              <button className="quiet danger" onClick={() => setConfirm(!confirm)}>
                Cancelar sesión
              </button>
            )}
            {!future && user?.role !== 'alumno' && (
              <button
                className="action secondary"
                onClick={() => run({ type: 'attend', id: b.id }, 'Sesión marcada como realizada')}
              >
                Marcar realizada
              </button>
            )}
          </div>
          {confirm && (
            <div className="notice warning">
              <p>¿Cancelar esta reserva y liberar el cupo?</p>
              <div className="actions">
                <button
                  className="action secondary"
                  onClick={() => {
                    run({ type: 'cancel', id: b.id }, 'Sesión cancelada. Cupo disponible.');
                    setConfirm(false);
                  }}
                >
                  Sí, cancelar reserva
                </button>
                <button className="quiet" onClick={() => setConfirm(false)}>
                  Conservar reserva
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
function TeamAgenda() {
  const { state, user, run } = useStore();
  const [filter, setFilter] = useState('confirmada'),
    [view, setView] = useState('sesiones');
  if (!user) return null;
  const bookings = state.bookings.filter(
    (b) =>
      user.role === 'admin' || state.users.find((u) => u.id === b.userId)?.mentorId === user.id,
  );
  const slots = state.slots
    .filter((s) => s.mentorId === user.id && s.active && Date.parse(s.date) > Date.now())
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <Heading
        title="Tu agenda de mentoría"
        action={
          <ButtonLink to="/recordatorios" secondary>
            Recordatorios
          </ButtonLink>
        }
      >
        Sesiones y disponibilidad · Lima, Perú (UTC−5).
      </Heading>
      <div className="tabs">
        <button aria-pressed={view === 'sesiones'} onClick={() => setView('sesiones')}>
          Sesiones
        </button>
        <button aria-pressed={view === 'horarios'} onClick={() => setView('horarios')}>
          Mi disponibilidad
        </button>
      </div>
      {view === 'sesiones' ? (
        <>
          <Select
            label="Mostrar sesiones"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="confirmada">Confirmadas</option>
            <option value="realizada">Realizadas</option>
            <option value="cancelada">Canceladas</option>
            <option value="todas">Todas</option>
          </Select>
          <div className="two-up section-spaced">
            {bookings
              .filter((b) => filter === 'todas' || b.status === filter)
              .map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
          </div>
          {!bookings.some((b) => filter === 'todas' || b.status === filter) && (
            <Empty title="Tu agenda está libre">Las reservas de tus alumnos aparecerán aquí.</Empty>
          )}
        </>
      ) : (
        <div className="split">
          <section>
            <h2>Abrir un nuevo horario</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget;
                const date = new Date(
                  `${getText(f, 'date')}T${getText(f, 'time')}:00-05:00`,
                ).toISOString();
                run(
                  { type: 'slot', date, minutes: Number(getText(f, 'minutes')) },
                  'Horario disponible para tus alumnos',
                );
              }}
            >
              <div className="fields">
                <Field
                  label="Fecha"
                  name="date"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  required
                />
                <Field label="Hora de Lima" name="time" type="time" required />
              </div>
              <Select name="minutes" label="Duración">
                <option value="30">30 minutos · Junior</option>
                <option value="45">45 minutos · Senior</option>
                <option value="60">60 minutos · Master</option>
              </Select>
              <button className="action">Añadir disponibilidad</button>
            </form>
            <p className="support-note">
              La reserva bloquea cualquier horario que se solape, aunque tenga otra duración.
            </p>
          </section>
          <section>
            <h2>Horarios abiertos</h2>
            <div className="availability-list">
              {slots.map((s) => (
                <div className="simple-row" key={s.id}>
                  <div>
                    <strong>{dateLabel(s.date)}</strong>
                    <p className="soft">{s.minutes} minutos</p>
                  </div>
                  <button
                    className="quiet"
                    onClick={() => run({ type: 'closeSlot', id: s.id }, 'Horario cerrado')}
                  >
                    Cerrar
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
