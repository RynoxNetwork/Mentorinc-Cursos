import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../store';
import { activeAccess, progress, visibleLessons, money, dateLabel, STORE_KEY } from '../model';
import { Heading, ButtonLink, Badge, Field, Area, Empty, Avatar, download, getText } from '../ui';

export function Home() {
  const { state, user } = useStore();
  const access = user && activeAccess(state, user.id);
  const next = visibleLessons(state).find((l) => !user?.completed.includes(l.id));
  const mentor = state.users.find((u) => u.id === user?.mentorId);
  return (
    <>
      <section className="welcome">
        <div className="welcome-copy">
          <p className="greeting">
            {user
              ? `Hola, ${user.name.split(' ')[0]}. Este es tu espacio.`
              : 'Tu siguiente paso empieza contigo.'}
          </p>
          <h1>
            Aprende a vender.
            <br />
            Crece contigo.
          </h1>
          <p className="lead">
            Descubre tu forma de conectar, comunicar y construir acuerdos. Con un mentor a tu lado.
          </p>
          <ButtonLink to={access ? '/ruta' : user ? '/programas' : '/registro'}>
            {access ? 'Continuar mi ruta' : 'Encuentra tu programa'}
          </ButtonLink>
        </div>
        <div className="welcome-art">
          <img
            src="/images/learn.webp"
            alt="Una alumna aprende sobre un libro abierto y comparte sus ideas"
            width="640"
            height="533"
            fetchPriority="high"
          />
        </div>
      </section>
      {user && !user.verified && (
        <div className="notice">
          <span>Confirma tu correo para comenzar.</span>
          <Link to="/correo">Revisar correo de prueba →</Link>
        </div>
      )}
      {access && user ? (
        <>
          <div className="progress-summary">
            <strong>{progress(state, user)}% de tu recorrido</strong>
            <progress value={progress(state, user)} max="100" aria-label="Progreso total" />
            <Link to="/ruta">Ver mi avance →</Link>
          </div>
          <section className="feature">
            <div>
              <span className="soft">Tu siguiente paso · {next?.minutes || 0} min</span>
              <h2>{next?.title || 'Llegaste al final de tu recorrido'}</h2>
              <p>
                {next?.intro ||
                  'Revisa tus actividades y conversa con tu mentor sobre lo que sigue.'}
              </p>
            </div>
            <ButtonLink to={next ? `/leccion/${next.id}` : '/ruta'}>
              {next ? 'Comenzar lección' : 'Revisar mi ruta'}
            </ButtonLink>
          </section>
          <div className="lower">
            <section className="mentor-panel">
              <div className="section-title">
                <h2>Crecer, acompañado.</h2>
                <MessageCircle size={23} />
              </div>
              <div className="mentor-line">
                <Avatar name={mentor?.name || 'Mentor'} />
                <div>
                  <h3>{mentor?.name || 'Mentor por asignar'}</h3>
                  <p className="soft">Tu mentor en este recorrido</p>
                </div>
              </div>
              <p>
                Convierte lo que aprendes en una práctica propia. Comparte una duda o prepara tu
                próxima conversación.
              </p>
              <div className="actions">
                <ButtonLink to="/consultas">Escribir a mi mentor</ButtonLink>
                <Link className="quiet" to="/agenda">
                  Reservar sesión →
                </Link>
              </div>
            </section>
            <section>
              <div className="section-title">
                <h2>Lo que viene</h2>
                <Link to="/agenda" className="quiet">
                  Mi agenda
                </Link>
              </div>
              {[
                ['/diagnostico', 'Tu punto de partida', 'Conócete y define tu objetivo', BookOpen],
                [
                  '/agenda',
                  'Una conversación para avanzar',
                  `${access.sessions} sesiones de ${access.minutes} minutos en tu programa`,
                  CalendarDays,
                ],
                [
                  '/notificaciones',
                  'Feedback que te hace crecer',
                  'Tus respuestas y novedades en un solo lugar',
                  MessageCircle,
                ],
              ].map(([to, title, desc, Icon]) => {
                const I = Icon as typeof BookOpen;
                return (
                  <Link className="simple-row" to={String(to)} key={String(to)}>
                    <I size={22} />
                    <div className="row-copy">
                      <h3>{String(title)}</h3>
                      <p className="soft">{String(desc)}</p>
                    </div>
                    <ArrowRight size={19} />
                  </Link>
                );
              })}
            </section>
          </div>
          <section className="wellbeing">
            <img src="/images/progress.webp" alt="" width="100" height="100" />
            <div>
              <h3>Tu bienestar también es parte del camino.</h3>
              <p className="soft">
                Haz espacio para una pausa y una forma de crecer que puedas sostener.
              </p>
              <Link to="/leccion/bien-1" className="quiet">
                Explorar mentalidad y bienestar →
              </Link>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="three-up public-values">
            <section>
              <span className="big-number">01</span>
              <h2>Conócete</h2>
              <p>Identifica tu punto de partida y elige una intención para crecer.</p>
            </section>
            <section>
              <span className="big-number">02</span>
              <h2>Practica</h2>
              <p>Aprende con situaciones concretas, actividades y una ruta a tu ritmo.</p>
            </section>
            <section>
              <span className="big-number">03</span>
              <h2>Conecta</h2>
              <p>Recibe acompañamiento, feedback y espacio para tus preguntas.</p>
            </section>
          </div>
          <Programs embedded />
        </>
      )}
    </>
  );
}

export function Programs({ embedded = false }: { embedded?: boolean }) {
  const { state, user, run } = useStore();
  const navigate = useNavigate();
  const access = user && activeAccess(state, user.id);
  return (
    <>
      {embedded ? (
        <h2 className="section-spaced">Una etapa para cada momento</h2>
      ) : (
        <Heading title="Encuentra tu siguiente impulso">
          Tres niveles de acompañamiento. Un mismo propósito: crecer desde quien eres.
        </Heading>
      )}
      <div className="three-up programs">
        {state.programs
          .filter((p) => p.published)
          .map((p, i) => (
            <article className={`program program-${i}`} key={p.id}>
              {i === 1 && <Badge>Más acompañamiento</Badge>}
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <p className="price">
                {money(p.price)}
                <span>precio de muestra</span>
              </p>
              <ul className="check-list">
                <li>
                  <Check size={18} /> Ruta con {visibleLessons(state).length} lecciones
                </li>
                <li>
                  <Check size={18} /> Actividades y feedback
                </li>
                <li>
                  <Check size={18} /> Consultas privadas
                </li>
                <li>
                  <Check size={18} /> {p.sessions} mentorías de {p.minutes} minutos
                </li>
              </ul>
              {access ? (
                <Link className="action secondary" to="/compras">
                  {access.programId === p.id ? 'Mi programa actual' : 'Consultar mi acceso'}
                </Link>
              ) : (
                <button
                  className="action"
                  onClick={() => {
                    if (!user) {
                      navigate('/registro');
                      return;
                    }
                    if (run({ type: 'purchase', programId: p.id }, 'Solicitud creada'))
                      navigate('/compras');
                  }}
                >
                  Elegir {p.name}
                  <ArrowRight size={18} />
                </button>
              )}
            </article>
          ))}
      </div>
      <p className="support-note">
        Los importes y cupos son ejemplos para revisar la experiencia. No se realiza ningún cobro.
      </p>
      {!embedded && (
        <section className="section-spaced">
          <h2>Lo que vas a trabajar</h2>
          {state.modules
            .filter((m) => !m.archived)
            .map((m, i) => (
              <details className="route-item" key={m.id}>
                <summary>
                  <span className="route-number">0{i + 1}</span>
                  <div className="route-text">
                    <h3>{m.title}</h3>
                    <span>{m.description}</span>
                  </div>
                  <span className="route-arrow">→</span>
                </summary>
                <div className="lessons">
                  {state.lessons
                    .filter((l) => l.moduleId === m.id && l.published)
                    .map((l) => (
                      <p key={l.id}>
                        {l.title} <span className="soft">· {l.minutes} min</span>
                      </p>
                    ))}
                </div>
              </details>
            ))}
        </section>
      )}
    </>
  );
}

export function Auth({
  register = false,
  recover = false,
}: {
  register?: boolean;
  recover?: boolean;
}) {
  const { state, run } = useStore();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className="email-state">
        <img src="/images/mail.webp" alt="Un sobre con una marca de confirmación" />
        <h1>Tu enlace está listo</h1>
        <p>
          Abre el correo de prueba para continuar. En esta versión el mensaje se guarda en el
          navegador.
        </p>
        <ButtonLink to="/correo">Abrir correo de prueba</ButtonLink>
        <button className="quiet" onClick={() => setSent(false)}>
          Usar otro correo
        </button>
      </div>
    );
  return (
    <div className="auth-layout">
      <div>
        <img
          className="auth-art"
          src={register ? '/images/learn.webp' : '/images/mail.webp'}
          alt=""
        />
        <h2>
          {register ? 'Tu crecimiento tiene un punto de partida.' : 'Qué bueno tenerte de vuelta.'}
        </h2>
        <p className="soft">Aprendizaje, práctica y acompañamiento en un mismo espacio.</p>
      </div>
      <section className="account-form">
        <Heading
          title={
            register ? 'Crea tu cuenta' : recover ? 'Recupera tu acceso' : 'Entra a tu espacio'
          }
        >
          {register
            ? 'Comienza con tu nombre y correo.'
            : 'Recibe un enlace para entrar a tu cuenta.'}
        </Heading>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            if (
              run(
                register
                  ? { type: 'register', name: getText(form, 'name'), email: getText(form, 'email') }
                  : { type: 'sendLink', email: getText(form, 'email') },
                '',
              )
            )
              setSent(true);
          }}
        >
          {register && (
            <Field
              label="Nombre y apellido"
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          )}
          <Field
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <p className="support-note">
            Acceso por enlace simulado. Usa datos de prueba, no contraseñas reales.
          </p>
          <button className="action full" type="submit">
            {register ? 'Crear cuenta' : 'Crear enlace de acceso'}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="support-note">
          {register ? '¿Ya tienes una cuenta?' : '¿Primera vez por aquí?'}{' '}
          <Link to={register ? '/acceso' : '/registro'}>
            {register ? 'Entrar' : 'Crear cuenta'}
          </Link>
        </p>
        {!register && !recover && (
          <Link to="/recuperar" className="quiet">
            Recuperar acceso
          </Link>
        )}
        <div className="demo-access">
          <h3>Recorrer con una cuenta de prueba</h3>
          <div className="actions">
            {state.users
              .filter((u) => ['maria', 'ana', 'admin'].includes(u.id) && u.active)
              .map((u) => (
                <button
                  key={u.id}
                  className="action secondary"
                  onClick={() => {
                    if (run({ type: 'demo', userId: u.id }, '')) navigate('/');
                  }}
                >
                  {u.role === 'alumno'
                    ? 'Alumno'
                    : u.role === 'mentor'
                      ? 'Mentor'
                      : 'Administración'}
                </button>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function Mailbox() {
  const { state, user, run } = useStore();
  const navigate = useNavigate();
  const mails = state.mails.filter((m) => !user || m.userId === user.id);
  return (
    <>
      <Heading title="Correo de prueba">
        Aquí aparecen los mensajes de esta demostración. No se envían correos reales.
      </Heading>
      {!mails.length ? (
        <Empty
          title="Todavía no tienes mensajes"
          action={<ButtonLink to="/acceso">Solicitar enlace de acceso</ButtonLink>}
        >
          Las confirmaciones de cuenta, actividades y sesiones aparecerán aquí.
        </Empty>
      ) : (
        <div className="narrow">
          {mails.map((m) => (
            <article className="mail-item" key={m.id}>
              <Badge>{m.kind === 'notice' ? 'Notificación' : 'Acceso local'}</Badge>
              <h2>{m.subject}</h2>
              <p className="soft">Para: {state.users.find((u) => u.id === m.userId)?.email}</p>
              <p>{m.body}</p>
              {m.kind !== 'notice' &&
                (m.used ? (
                  <Badge tone="good">Enlace utilizado</Badge>
                ) : (
                  <button
                    className="action"
                    onClick={() => {
                      if (
                        run(
                          { type: 'useLink', id: m.id },
                          m.kind === 'confirm' ? 'Correo confirmado' : 'Sesión iniciada',
                        )
                      )
                        navigate(m.kind === 'confirm' ? '/diagnostico' : '/');
                    }}
                  >
                    {m.kind === 'confirm' ? 'Confirmar mi correo' : 'Entrar a mi cuenta'}
                  </button>
                ))}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export function Diagnostic() {
  const { user, run } = useStore();
  const navigate = useNavigate();
  const [values, setValues] = useState(
    user?.diagnostic.length === 4 ? user.diagnostic : [0, 0, 0, 0],
  );
  if (!user || user.role !== 'alumno')
    return <Empty title="El diagnóstico es parte del recorrido del alumno" />;
  return (
    <>
      <Heading title="Tu punto de partida">
        No hay respuestas buenas o malas. Piensa en cómo te sientes hoy.
      </Heading>
      <div className="split">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              run(
                { type: 'diagnostic', values, goal: getText(e.currentTarget, 'goal') },
                'Tu punto de partida está guardado',
              )
            )
              navigate('/ruta');
          }}
        >
          {[
            'Reconozco mis fortalezas y mantengo la confianza al vender.',
            'Escucho y hago preguntas para entender lo que necesita el cliente.',
            'Explico cómo mi producto ayuda a resolver una necesidad concreta.',
            'Me siento cómodo al conversar sobre objeciones y acuerdos.',
          ].map((q, i) => (
            <fieldset className="diagnostic-question" key={q}>
              <legend>
                {i + 1}. {q}
              </legend>
              <div className="rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n}>
                    <input
                      type="radio"
                      name={`q-${i}`}
                      value={n}
                      required
                      checked={values[i] === n}
                      onChange={() => setValues(values.map((x, j) => (j === i ? n : x)))}
                    />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
              <div className="range-labels">
                <span>Quiero fortalecerlo</span>
                <span>Me siento seguro</span>
              </div>
            </fieldset>
          ))}
          <Area
            label="¿Qué te gustaría lograr?"
            name="goal"
            required
            minLength={10}
            maxLength={500}
            defaultValue={user.goal}
            placeholder="Quiero aprender a…"
          />
          <button className="action" type="submit">
            Guardar y ver mi ruta
            <ArrowRight size={18} />
          </button>
        </form>
        <aside className="aside">
          <img src="/images/progress.webp" alt="" />
          <h3>Una orientación, no una etiqueta.</h3>
          <p>
            La sugerencia local prioriza el área con la puntuación más baja. Tu mentor puede
            ajustarla contigo.
          </p>
          <p className="soft">
            Esta muestra no utiliza IA ni constituye una evaluación clínica, DISC o PPDC.
          </p>
        </aside>
      </div>
    </>
  );
}

export function Account() {
  const { user, run } = useStore();
  return (
    <>
      <Heading title="Mi cuenta">Tu información y el propósito de tu recorrido.</Heading>
      <div className="split">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              {
                type: 'profile',
                name: getText(e.currentTarget, 'name'),
                goal: getText(e.currentTarget, 'goal'),
              },
              'Tu perfil está actualizado',
            );
          }}
        >
          <Field
            label="Nombre completo"
            name="name"
            defaultValue={user?.name}
            required
            minLength={2}
            maxLength={80}
          />
          <Field label="Correo electrónico" value={user?.email || ''} readOnly />
          <p className="support-note">El correo identifica esta cuenta local.</p>
          <Area label="Mi objetivo" name="goal" defaultValue={user?.goal} maxLength={500} />
          <button className="action">Guardar cambios</button>
        </form>
        <aside className="aside">
          <Avatar name={user?.name || ''} />
          <h3>{user?.name}</h3>
          <Badge tone={user?.verified ? 'good' : 'pending'}>
            {user?.verified ? 'Correo confirmado' : 'Correo pendiente'}
          </Badge>
          <div className="vertical-links">
            <Link to="/diagnostico">Revisar mi punto de partida →</Link>
            <Link to="/compras">Compras y acceso →</Link>
            <Link to="/correo">Correo de prueba →</Link>
          </div>
        </aside>
      </div>
    </>
  );
}

export function Purchases() {
  const { state, user, run } = useStore();
  const purchases = state.purchases.filter((p) => p.userId === user?.id);
  return (
    <>
      <Heading
        title="Mis compras"
        action={
          <ButtonLink to="/programas" secondary>
            Ver programas
          </ButtonLink>
        }
      >
        El pago y la aprobación de tu acceso son dos pasos distintos.
      </Heading>
      {!purchases.length ? (
        <Empty
          title="Elige cómo quieres avanzar"
          action={<ButtonLink to="/programas">Conocer los programas</ButtonLink>}
        >
          Encuentra el acompañamiento que necesitas.
        </Empty>
      ) : (
        purchases.map((p) => (
          <article className="purchase-card" key={p.id}>
            <div className="section-title">
              <div>
                <h2>Programa {state.programs.find((x) => x.id === p.programId)?.name}</h2>
                <p className="soft">{dateLabel(p.date)}</p>
              </div>
              <strong className="price">{money(p.amount)}</strong>
            </div>
            <div className="purchase-steps">
              <span className={p.payment === 'confirmado' ? 'done' : ''}>
                <CheckCircle2 /> Pago {p.payment}
              </span>
              <span className={p.approval === 'aprobado' ? 'done' : ''}>
                <CheckCircle2 /> Acceso {p.approval}
              </span>
            </div>
            <p>
              {p.sessions} sesiones de {p.minutes} minutos · Aula y acompañamiento
            </p>
            {p.approval === 'pendiente' &&
            p.payment !== 'confirmado' &&
            p.payment !== 'reembolsado' ? (
              <div className="payment-simulation">
                <h3>Probar el resultado del pago</h3>
                <p className="soft">No se solicita tarjeta ni se mueve dinero.</p>
                <div className="actions">
                  <button
                    className="action"
                    onClick={() =>
                      run(
                        { type: 'payment', id: p.id, status: 'confirmado' },
                        'Pago simulado. Falta la aprobación de Mentorinc.',
                      )
                    }
                  >
                    Simular pago confirmado
                  </button>
                  <button
                    className="action secondary"
                    onClick={() =>
                      run(
                        { type: 'payment', id: p.id, status: 'fallido' },
                        'El intento de pago falló. Puedes reintentarlo.',
                      )
                    }
                  >
                    Simular pago fallido
                  </button>
                </div>
              </div>
            ) : p.approval === 'pendiente' ? (
              <div className="notice">
                Tu pago de prueba está confirmado. El equipo Mentorinc revisará tu solicitud antes
                de habilitar el acceso.
              </div>
            ) : p.approval === 'aprobado' && p.payment === 'confirmado' ? (
              <div className="actions">
                <Badge tone="good">Acceso habilitado</Badge>
                <ButtonLink to="/ruta">Entrar al aula</ButtonLink>
              </div>
            ) : (
              <div className="notice">
                Esta solicitud está cerrada y no habilita el acceso. Puedes elegir otro programa.
              </div>
            )}
          </article>
        ))
      )}
    </>
  );
}

export function Notices() {
  const { state, user, run } = useStore();
  const items = state.notices.filter((n) => n.userId === user?.id);
  return (
    <>
      <Heading
        title="Tus novedades"
        action={
          <button
            className="action secondary"
            onClick={() => run({ type: 'read' }, 'Todas las novedades están leídas')}
          >
            Marcar todas como leídas
          </button>
        }
      >
        Lo que ocurre en tu recorrido, en un solo lugar.
      </Heading>
      {!items.length ? (
        <Empty title="Estás al día">Las respuestas, revisiones y reservas aparecerán aquí.</Empty>
      ) : (
        items.map((n) => (
          <Link
            className={`notification-item ${n.read ? '' : 'unread'}`}
            key={n.id}
            to={n.href}
            onClick={() => run({ type: 'read', id: n.id }, '')}
          >
            <div>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <span className="soft">{dateLabel(n.date)}</span>
            </div>
            <ArrowRight size={20} />
          </Link>
        ))
      )}
    </>
  );
}

export function Settings() {
  const { state, reset } = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Heading title="Tu espacio de prueba">
        Todo lo que haces aquí se guarda únicamente en este navegador.
      </Heading>
      <div className="split">
        <section>
          <h2>Guardar una copia</h2>
          <p className="soft">
            Descarga tus datos antes de cambiar de navegador o restablecer la demostración. El
            archivo puede incluir los nombres y correos que escribiste.
          </p>
          <div className="actions">
            <button
              className="action secondary"
              onClick={() =>
                download(
                  'mentorinc-datos-locales.json',
                  JSON.stringify(state, null, 2),
                  'application/json',
                )
              }
            >
              Exportar mis datos
            </button>
            <button
              className="quiet"
              onClick={() =>
                download(
                  'mentorinc-almacenamiento-original.json',
                  localStorage.getItem(STORE_KEY) || '{}',
                  'application/json',
                )
              }
            >
              Exportar almacenamiento original
            </button>
          </div>
          <div className="section-spaced">
            <h2>Volver al inicio</h2>
            <p className="soft">
              Restablecer sustituye los cambios locales por los datos de muestra. Primero se
              descargará una copia de los datos actuales.
            </p>
            {!confirm ? (
              <button className="action secondary" onClick={() => setConfirm(true)}>
                Restablecer demostración
              </button>
            ) : (
              <div className="notice warning">
                <p>Se reemplazarán las cuentas, actividades y reservas de este navegador.</p>
                <div className="actions">
                  <button
                    className="action"
                    onClick={() => {
                      download(
                        'mentorinc-respaldo-antes-de-restablecer.json',
                        localStorage.getItem(STORE_KEY) || JSON.stringify(state),
                        'application/json',
                      );
                      reset();
                      setConfirm(false);
                    }}
                  >
                    Descargar copia y restablecer
                  </button>
                  <button className="action secondary" onClick={() => setConfirm(false)}>
                    Conservar mis cambios
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
        <aside className="aside">
          <h3>Qué puedes probar</h3>
          <p>
            Crear una cuenta, confirmar el correo local, elegir un programa, simular un pago y
            aprobar el acceso desde administración.
          </p>
          <p>
            Aprender, entregar actividades, recibir feedback, conversar con un mentor y reservar
            sesiones.
          </p>
          <h3>Alcance de esta versión</h3>
          <p>
            Las cuentas y roles son una simulación pública. No hay autenticación segura, pagos,
            correo real ni datos compartidos entre dispositivos.
          </p>
          <p>Usa información ficticia. El material académico es de muestra.</p>
        </aside>
      </div>
    </>
  );
}

export function About() {
  return (
    <>
      <Heading title="Crecer desde quien eres">
        Una forma ética y personal de aprender a vender.
      </Heading>
      <div className="split">
        <div>
          <h2>Primero tú. Después, la técnica.</h2>
          <p className="lead">
            Mentorinc conecta el autoconocimiento con la práctica comercial y el acompañamiento. La
            ruta parte de tu situación y se revisa junto a tu mentor.
          </p>
          {[
            ['Diagnóstico', 'Reconoce dónde estás y qué quieres fortalecer.'],
            ['El Yo', 'Construye confianza desde tus fortalezas.'],
            ['Comunicación', 'Escucha y expresa ideas con claridad.'],
            ['Producto', 'Conecta necesidades con una propuesta de valor.'],
            ['Negociación', 'Llega a acuerdos que respeten a ambas partes.'],
          ].map(([title, text], i) => (
            <div className="simple-row" key={title}>
              <span className="route-number">0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p className="soft">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <aside className="aside">
          <img src="/images/progress.webp" alt="Escalones de crecimiento y una bandera" />
          <h3>Con acompañamiento humano</h3>
          <p>
            Las actividades, consultas y sesiones conectan lo que aprendes con los retos de tu día a
            día.
          </p>
          <ButtonLink to="/programas">Conoce los programas</ButtonLink>
        </aside>
      </div>
    </>
  );
}
