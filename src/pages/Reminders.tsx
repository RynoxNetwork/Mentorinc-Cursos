import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { dateLabel } from '../model';
import { deliveryIsCurrent, reminderQueue } from '../reminders';
import { Heading, Select, Badge, Empty, getText, useLocalClock } from '../ui';

export default function Reminders() {
  const { state, user, run } = useStore();
  const time = useLocalClock();
  if (!user) return null;
  const queue = reminderQueue(state, user, time);
  const due = queue.filter((r) => r.status === 'listo').length;
  const team = user.role !== 'alumno';
  const history = state.reminderDeliveries.filter(
    (d) => user.role === 'admin' || d.userId === user.id,
  );
  return (
    <>
      <Heading title="Un aviso antes de encontrarnos">
        Recordatorios de mentoría · hora de Lima.
      </Heading>
      <div className="notice">
        <p>
          Esta preparación funciona en tu navegador. Las simulaciones crean avisos y correos de
          prueba; no envían mensajes ni se ejecutan con la página cerrada.
        </p>
      </div>
      <div className="help-actions">
        <Link className="action secondary" to="/agenda">
          Ver agenda
        </Link>
        <Link className="action secondary" to="/notificaciones">
          Ver avisos
        </Link>
        <Link className="action secondary" to="/correo">
          Correo de prueba
        </Link>
      </div>
      {user.role === 'admin' ? (
        <details className="editor-panel">
          <summary>
            <h2>Configurar recordatorios</h2>
            <span className="quiet">Editar</span>
          </summary>
          <form
            key={`${state.reminderSettings.enabled}-${state.reminderSettings.hoursBefore}`}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                {
                  type: 'reminderSettings',
                  enabled: getText(e.currentTarget, 'enabled') === 'si',
                  hoursBefore: Number(getText(e.currentTarget, 'hours')),
                },
                'Regla de recordatorios guardada',
              );
            }}
          >
            <div className="fields">
              <Select
                label="Estado de los recordatorios"
                name="enabled"
                defaultValue={state.reminderSettings.enabled ? 'si' : 'no'}
              >
                <option value="si">Preparados para simular</option>
                <option value="no">Pausados</option>
              </Select>
              <Select
                label="Anticipación del aviso"
                name="hours"
                defaultValue={state.reminderSettings.hoursBefore}
              >
                {[1, 2, 12, 24, 48].map((h) => (
                  <option key={h} value={h}>
                    {h} {h === 1 ? 'hora' : 'horas'} antes
                  </option>
                ))}
              </Select>
            </div>
            <p className="support-note">
              Alumno y mentor reciben una simulación por horario reservado. Cambiar esta regla no
              duplica avisos ya simulados.
            </p>
            <button className="action">Guardar regla</button>
          </form>
        </details>
      ) : null}
      <section className="section-spaced">
        <div className="section-title reminders-list-title">
          <h2>Próximas sesiones</h2>
          {team && (
            <button
              className="action secondary"
              disabled={!due}
              onClick={() =>
                run(
                  { type: 'simulateReminders' },
                  'Avisos pendientes simulados en esta copia local',
                )
              }
            >
              Simular avisos que ya corresponden ({due})
            </button>
          )}
        </div>
        <p className="soft">
          {state.reminderSettings.enabled
            ? `Aviso previsto ${state.reminderSettings.hoursBefore} horas antes. Cancelar o reprogramar actualiza esta lista.`
            : 'Los recordatorios están pausados. Se conserva el historial.'}
        </p>
        {!queue.length && (
          <Empty
            title={
              state.reminderSettings.enabled
                ? 'No hay recordatorios próximos'
                : 'Recordatorios pausados'
            }
          >
            Solo aparecen reservas confirmadas, futuras y con acceso vigente.
          </Empty>
        )}
        {queue.map((r) => (
          <article
            className="reservation reminder-card"
            key={`${r.bookingId}-${r.scheduleVersion}`}
          >
            <div className="section-title">
              <h3>{r.topic}</h3>
              <Badge tone={r.status === 'simulado' ? 'good' : 'pending'}>
                {r.status === 'simulado'
                  ? 'Simulado localmente'
                  : r.status === 'listo'
                    ? 'Listo para simular'
                    : 'Programado en la vista local'}
              </Badge>
            </div>
            <p>
              <strong>Sesión:</strong> {dateLabel(r.sessionAt)} · <strong>Aviso previsto:</strong>{' '}
              {dateLabel(r.scheduledAt)}
            </p>
            <p className="soft">Para: {r.recipients.map((p) => p.name).join(' y ')}</p>
            <details className="route-item">
              <summary>Vista previa del mensaje</summary>
              <div className="reminder-preview">
                {r.recipients.map((p) => (
                  <section key={p.userId}>
                    <h4>
                      {p.name} · {p.role}
                    </h4>
                    <strong>{p.subject}</strong>
                    <p>{p.body}</p>
                  </section>
                ))}
              </div>
            </details>
            {team && r.status !== 'simulado' && (
              <div className="actions">
                <button
                  className="action"
                  onClick={() =>
                    run(
                      { type: 'simulateReminders', bookingId: r.bookingId },
                      'Recordatorio simulado para alumno y mentor',
                    )
                  }
                >
                  {r.status === 'programado' ? 'Simular por adelantado' : 'Simular recordatorio'}
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
      <section className="section-spaced">
        <h2>Historial de simulaciones</h2>
        {!history.length && <p className="soft">Todavía no se ha simulado ningún recordatorio.</p>}
        {history.map((d) => (
          <details className="route-item" key={d.id}>
            <summary>
              <span>
                {state.users.find((u) => u.id === d.userId)?.name} · {dateLabel(d.sessionAt)}
              </span>
              <Badge tone={deliveryIsCurrent(state, d) ? 'good' : 'pending'}>
                {deliveryIsCurrent(state, d) ? 'Simulado' : 'Sin efecto'}
              </Badge>
            </summary>
            <div className="reminder-preview">
              {!deliveryIsCurrent(state, d) && (
                <p className="notice warning">
                  La reserva fue cancelada o reprogramada. Este mensaje se conserva como historial y
                  no se vuelve a emitir.
                </p>
              )}
              <p>
                Simulado el {dateLabel(d.simulatedAt)}. Aviso previsto para{' '}
                {dateLabel(d.scheduledAt)}.
              </p>
              <p>{d.body}</p>
            </div>
          </details>
        ))}
      </section>
    </>
  );
}
