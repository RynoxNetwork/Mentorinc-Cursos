import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Plus, Send } from 'lucide-react';
import { useStore } from '../store';
import { activeAccess, dateLabel } from '../model';
import { Heading, Badge, Field, Area, Empty, Access, Avatar, getText } from '../ui';

export function Consultations() {
  const { state, user, run } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false),
    [filter, setFilter] = useState('todas');
  if (!user) return null;
  const items = state.threads.filter(
    (t) =>
      user.role === 'admin' ||
      (user.role === 'alumno' ? t.userId === user.id : t.mentorId === user.id),
  );
  const thread = items.find((t) => t.id === id);
  const canStart = user.role === 'alumno' && !!activeAccess(state, user.id);
  const mentor = state.users.find((u) => u.id === user.mentorId);
  if (user.role === 'alumno' && !activeAccess(state, user.id))
    return (
      <Access>
        <span />
      </Access>
    );
  return (
    <>
      <Heading
        title={
          user.role === 'alumno' ? 'Un espacio para tus preguntas' : 'Consultas de tus alumnos'
        }
        action={
          canStart && !id ? (
            <button className="action" onClick={() => setCreating(!creating)}>
              <Plus size={18} /> Nueva consulta
            </button>
          ) : undefined
        }
      >
        {user.role === 'alumno'
          ? `Conversa con ${mentor?.name || 'tu mentor'} y guarda el hilo de tus avances.`
          : 'Responde, da seguimiento y cierra cada conversación cuando esté resuelta.'}
      </Heading>
      {creating && !id ? (
        <form
          className="compose"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              run(
                {
                  type: 'thread',
                  subject: getText(e.currentTarget, 'subject'),
                  text: getText(e.currentTarget, 'message'),
                },
                'Consulta enviada a tu mentor',
              )
            ) {
              setCreating(false);
              e.currentTarget.reset();
            }
          }}
        >
          <Field label="Asunto" name="subject" required minLength={3} maxLength={100} />
          <Area
            label="¿Qué te gustaría conversar?"
            name="message"
            required
            minLength={10}
            maxLength={3000}
          />
          <div className="actions">
            <button className="action">
              Enviar consulta
              <Send size={17} />
            </button>
            <button className="action secondary" type="button" onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
      {id ? (
        thread ? (
          <>
            <Link className="quiet back" to="/consultas">
              <ArrowLeft size={17} /> Todas las consultas
            </Link>
            <div className="split">
              <section className="thread">
                <h2>{thread.subject}</h2>
                <Badge tone={thread.status === 'resuelta' ? 'good' : 'pending'}>
                  {thread.status}
                </Badge>
                {thread.messages.map((m) => (
                  <div className={`message ${m.authorId === user.id ? 'mine' : ''}`} key={m.id}>
                    <div className="message-author">
                      <Avatar name={state.users.find((u) => u.id === m.authorId)?.name || ''} />
                      <div>
                        <strong>
                          {state.users.find((u) => u.id === m.authorId)?.name || 'Cuenta archivada'}
                        </strong>
                        <span className="soft">{dateLabel(m.date)}</span>
                      </div>
                    </div>
                    <p>{m.text}</p>
                  </div>
                ))}
                {thread.status !== 'resuelta' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (
                        run(
                          { type: 'reply', id: thread.id, text: getText(e.currentTarget, 'reply') },
                          'Respuesta enviada',
                        )
                      )
                        e.currentTarget.reset();
                    }}
                  >
                    <Area
                      label="Tu respuesta"
                      name="reply"
                      required
                      minLength={2}
                      maxLength={3000}
                    />
                    <button className="action">
                      Enviar respuesta
                      <Send size={17} />
                    </button>
                  </form>
                )}
              </section>
              <aside className="aside">
                <MessageCircle size={30} />
                <h3>Seguimiento de la consulta</h3>
                <p>
                  Marca la conversación como resuelta cuando hayan aclarado la pregunta. Puedes
                  reabrirla si necesitas continuar.
                </p>
                <button
                  className="action secondary"
                  onClick={() =>
                    run(
                      { type: 'resolve', id: thread.id, resolved: thread.status !== 'resuelta' },
                      thread.status === 'resuelta' ? 'Consulta reabierta' : 'Consulta resuelta',
                    )
                  }
                >
                  {thread.status === 'resuelta' ? 'Reabrir consulta' : 'Marcar resuelta'}
                </button>
              </aside>
            </div>
          </>
        ) : (
          <Empty
            title="Esta consulta no está disponible"
            action={
              <button className="action" onClick={() => navigate('/consultas')}>
                Volver a mis consultas
              </button>
            }
          />
        )
      ) : (
        <>
          <div className="tabs">
            {['todas', 'abierta', 'respondida', 'resuelta'].map((v) => (
              <button key={v} aria-pressed={filter === v} onClick={() => setFilter(v)}>
                {v === 'todas'
                  ? 'Todas'
                  : v === 'abierta'
                    ? 'Por responder'
                    : v === 'respondida'
                      ? 'Respondidas'
                      : 'Resueltas'}
              </button>
            ))}
          </div>
          {items
            .filter((t) => filter === 'todas' || t.status === filter)
            .map((t) => (
              <Link className="conversation-row" to={`/consultas/${t.id}`} key={t.id}>
                <Avatar
                  name={
                    state.users.find(
                      (u) => u.id === (user.role === 'alumno' ? t.mentorId : t.userId),
                    )?.name || ''
                  }
                />
                <div>
                  <h3>{t.subject}</h3>
                  <p className="soft">
                    {state.users.find((u) => u.id === t.userId)?.name} · {t.messages.length}{' '}
                    mensajes
                  </p>
                  <p className="excerpt">{t.messages.at(-1)?.text}</p>
                </div>
                <Badge tone={t.status === 'resuelta' ? 'good' : 'pending'}>{t.status}</Badge>
              </Link>
            ))}
          {!items.some((t) => filter === 'todas' || t.status === filter) && (
            <Empty title="Aquí comienza la conversación">
              Comparte una duda concreta, un avance o una situación que quieras practicar.
            </Empty>
          )}
        </>
      )}
    </>
  );
}
