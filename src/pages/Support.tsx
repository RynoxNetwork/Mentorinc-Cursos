import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { dateLabel } from '../model';
import { Area, Field, Select, Heading, Empty, ButtonLink, Badge, getText, download } from '../ui';

const labels = {
  abierta: 'Abierta',
  en_revision: 'En revisión',
  respondida: 'Respondida',
  cerrada: 'Cerrada',
};
export default function Support() {
  const { id } = useParams(),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    { state, user, run } = useStore();
  const [creating, setCreating] = useState(params.get('tipo') === 'reclamo'),
    [filter, setFilter] = useState('todas'),
    [kind, setKind] = useState<'soporte' | 'reclamo'>(
      params.get('tipo') === 'reclamo' ? 'reclamo' : 'soporte',
    );
  if (!user)
    return (
      <>
        <Heading title="Ayuda con tu cuenta o programa">
          Puedes revisar la guía sin iniciar sesión.
        </Heading>
        <div className="reading-panel">
          <p>
            Para conservar una solicitud y su respuesta en esta demostración, entra o crea una
            cuenta con datos ficticios. No necesitas comprar un programa.
          </p>
          <div className="actions">
            <ButtonLink to="/acceso">Entrar a mi cuenta</ButtonLink>
            <ButtonLink secondary to="/registro">
              Crear cuenta
            </ButtonLink>
            <ButtonLink secondary to="/ayuda">
              Consultar la guía
            </ButtonLink>
          </div>
        </div>
      </>
    );
  if (user.role === 'mentor')
    return (
      <Empty
        title="El equipo administrativo atiende estas solicitudes"
        action={<ButtonLink to="/consultas">Consultas académicas</ButtonLink>}
      />
    );
  const admin = user.role === 'admin',
    tickets = state.tickets.filter((t) => admin || t.userId === user.id),
    ticket = tickets.find((t) => t.id === id);
  if (id && !ticket)
    return (
      <Empty
        title="Solicitud no disponible"
        action={<ButtonLink to="/soporte">Volver a soporte</ButtonLink>}
      />
    );
  if (ticket) {
    const owner = state.users.find((u) => u.id === ticket.ownerId);
    const receipt = () =>
      download(
        `Mentorinc-${ticket.reference}.txt`,
        `CONSTANCIA LOCAL DE PRUEBA — NO ENVIADA\n\n${ticket.reference}\nTipo: ${ticket.kind}\nCreada: ${dateLabel(ticket.createdAt)}\nSolicitante: ${state.users.find((u) => u.id === ticket.userId)?.name}\nAsunto: ${ticket.subject}\nSolicitud: ${ticket.request || 'Atención de soporte'}\nEstado: ${labels[ticket.status]}\nResponsable: ${owner?.name || 'Pendiente'}\n\n${ticket.messages.map((m) => `${dateLabel(m.date)} · ${state.users.find((u) => u.id === m.authorId)?.name}\n${m.text}`).join('\n\n')}\n\n${ticket.events.map((e) => `${dateLabel(e.date)} · ${e.text}`).join('\n')}\n\nEste archivo acredita solo la simulación en este navegador. No sustituye una recepción oficial ni un envío al negocio.`,
      );
    return (
      <>
        <Link to="/soporte" className="quiet">
          ← Todas las solicitudes
        </Link>
        <Heading
          title={ticket.subject}
          action={
            <button className="action secondary" onClick={receipt}>
              Descargar constancia
            </button>
          }
        >
          {ticket.reference} · {ticket.kind === 'reclamo' ? 'Reclamo de prueba' : 'Soporte'} ·{' '}
          {dateLabel(ticket.createdAt)}
        </Heading>
        <div className="split">
          <section>
            <Badge tone={ticket.status === 'cerrada' ? 'good' : 'pending'}>
              {labels[ticket.status]}
            </Badge>
            {ticket.request && (
              <div className="notice">
                <strong>Lo que solicitas</strong>
                <p>{ticket.request}</p>
              </div>
            )}
            <div className="thread">
              {ticket.messages.map((m) => (
                <article className={`message ${m.authorId === user.id ? 'mine' : ''}`} key={m.id}>
                  <strong>
                    {state.users.find((u) => u.id === m.authorId)?.name || 'Cuenta archivada'}
                  </strong>
                  <p className="soft">{dateLabel(m.date)}</p>
                  <p className="preserve">{m.text}</p>
                </article>
              ))}
            </div>
            {ticket.status !== 'cerrada' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  if (
                    run(
                      { type: 'ticketReply', id: ticket.id, text: getText(f, 'reply') },
                      'Respuesta guardada',
                    )
                  )
                    f.reset();
                }}
              >
                <Area label="Tu respuesta" name="reply" required minLength={2} maxLength={4000} />
                <button className="action">Guardar respuesta</button>
              </form>
            ) : (
              !admin && (
                <button
                  className="action secondary"
                  onClick={() =>
                    run(
                      {
                        type: 'ticketManage',
                        id: ticket.id,
                        status: 'abierta',
                        ownerId: ticket.ownerId,
                      },
                      'Solicitud reabierta',
                    )
                  }
                >
                  Reabrir solicitud
                </button>
              )
            )}
          </section>
          <aside className="journey-next">
            <h2>Seguimiento</h2>
            <p>Responsable: {owner?.name || 'Por asignar'}</p>
            {admin && (
              <form
                key={`${ticket.status}-${ticket.ownerId}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(
                    {
                      type: 'ticketManage',
                      id: ticket.id,
                      status: getText(e.currentTarget, 'status') as typeof ticket.status,
                      ownerId: getText(e.currentTarget, 'owner'),
                    },
                    'Seguimiento actualizado',
                  );
                }}
              >
                <Select label="Responsable" name="owner" defaultValue={ticket.ownerId}>
                  <option value="">Sin asignar</option>
                  {state.users
                    .filter((u) => u.role === 'admin' && u.active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </Select>
                <Select label="Estado" name="status" defaultValue={ticket.status}>
                  {Object.entries(labels).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </Select>
                <button className="action">Actualizar seguimiento</button>
              </form>
            )}
            <h3>Historial</h3>
            {ticket.events.map((e, i) => (
              <p key={i}>
                {dateLabel(e.date)}
                <br />
                {e.text}
              </p>
            ))}
            <p className="support-note">
              Registro de prueba guardado localmente. No se ha enviado al negocio ni a una
              autoridad.
            </p>
          </aside>
        </div>
      </>
    );
  }
  return (
    <>
      <Heading
        title={admin ? 'Atención del equipo' : 'Ayuda y solicitudes'}
        action={
          !admin && (
            <button className="action" onClick={() => setCreating(!creating)}>
              {creating ? 'Volver a mis solicitudes' : 'Nueva solicitud'}
            </button>
          )
        }
      >
        Atención de acceso, compra y experiencia, incluso sin un programa aprobado.
      </Heading>
      {creating && !admin ? (
        <form
          className="reading-panel"
          onSubmit={(e) => {
            e.preventDefault();
            const f = e.currentTarget;
            if (
              run(
                {
                  type: 'ticket',
                  kind,
                  category: getText(f, 'category') as 'acceso',
                  subject: getText(f, 'subject'),
                  text: getText(f, 'text'),
                  request: getText(f, 'request'),
                },
                'Solicitud guardada con constancia local',
              )
            ) {
              setCreating(false);
              navigate('/soporte');
            }
          }}
        >
          <h2>
            {kind === 'reclamo' ? 'Registrar un reclamo de prueba' : 'Cuéntanos qué necesitas'}
          </h2>
          <Select
            label="Tipo de solicitud"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="soporte">Ayuda y soporte</option>
            <option value="reclamo">Reclamo de prueba</option>
          </Select>
          <Select label="Tema" name="category">
            <option value="acceso">Acceso o registro</option>
            <option value="pago">Compra o pago</option>
            <option value="contenido">Contenido</option>
            <option value="mentoria">Mentoría</option>
            <option value="otro">Otro</option>
          </Select>
          <Field label="Asunto" name="subject" required minLength={3} maxLength={120} />
          <Area label="¿Qué ocurrió?" name="text" required minLength={10} maxLength={4000} />
          <Area
            label="¿Qué solución solicitas?"
            name="request"
            required={kind === 'reclamo'}
            minLength={kind === 'reclamo' ? 10 : undefined}
            maxLength={2000}
          />
          <p className="notice">
            Esta solicitud y su constancia se guardan solo en este navegador. Usa datos ficticios.
            El canal oficial y los plazos requieren aprobación de Mentorinc.
          </p>
          <button className="action">Guardar solicitud local</button>
        </form>
      ) : (
        <>
          <Select
            label="Filtrar por estado"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="todas">Todas</option>
            {Object.entries(labels).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </Select>
          {tickets
            .filter((t) => filter === 'todas' || t.status === filter)
            .map((t) => (
              <Link className="conversation-row" to={`/soporte/${t.id}`} key={t.id}>
                <div>
                  <h2>{t.subject}</h2>
                  <p>
                    {t.reference} · {t.kind} ·{' '}
                    {admin
                      ? state.users.find((u) => u.id === t.userId)?.name
                      : dateLabel(t.createdAt)}
                  </p>
                </div>
                <Badge>{labels[t.status]}</Badge>
              </Link>
            ))}
          {!tickets.some((t) => filter === 'todas' || t.status === filter) && (
            <Empty title="No hay solicitudes en esta vista" />
          )}
        </>
      )}
      <div className="section-spaced">
        <Link to="/ayuda">Guía de uso y preguntas frecuentes →</Link>
      </div>
    </>
  );
}
