import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Play,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../store';
import {
  activeAccess,
  progress,
  visibleLessons,
  suggestedFocus,
  learningPurchase,
  purchaseAccessState,
  type CourseLesson,
} from '../model';
import { Heading, ButtonLink, Badge, Area, Empty, Access, download, getText } from '../ui';

export function RoutePage() {
  const { state, user } = useStore();
  if (!user) return null;
  const scopedLessons = visibleLessons(state, user.id);
  const modules = state.modules
    .filter((m) => scopedLessons.some((l) => l.moduleId === m.id))
    .sort((a, b) => a.order - b.order);
  const focus =
    modules.find((m) => m.id === user.focus) ??
    modules.find((m) => m.id === suggestedFocus(state, user));
  return (
    <>
      <Heading
        title="Tu ruta, a tu ritmo"
        action={
          <ButtonLink to="/resultados" secondary>
            Mi avance y resultados
          </ButtonLink>
        }
      >
        Aprende, ponlo en práctica y conversa sobre lo que descubres.
      </Heading>
      <div className="split">
        <section>
          <div className="progress-summary">
            <strong>{progress(state, user)}% completado</strong>
            <progress value={progress(state, user)} max="100" aria-label="Progreso de la ruta" />
          </div>
          {!activeAccess(state, user.id) && (
            <div className="notice">
              <p>
                {learningPurchase(state, user.id) &&
                purchaseAccessState(learningPurchase(state, user.id)!) === 'vencido'
                  ? 'Tu acceso ha vencido. Conservas el avance y el temario de tu inscripción.'
                  : 'Explora tu ruta. Para abrir las lecciones necesitas un programa aprobado.'}
              </p>
              <Link to="/compras">Revisar acceso →</Link>
            </div>
          )}
          {modules.map((m, i) => {
            const lessons = scopedLessons.filter((l) => l.moduleId === m.id);
            return (
              <details className="route-item" key={m.id} open={m.id === user.focus || undefined}>
                <summary>
                  <span className="route-number">0{i + 1}</span>
                  <div className="route-text">
                    <h2>{m.title}</h2>
                    <span>
                      {lessons.filter((l) => user.completed.includes(l.id)).length}/{lessons.length}{' '}
                      lecciones · {m.description}
                    </span>
                  </div>
                  <span className="route-arrow">→</span>
                </summary>
                <div className="lessons">
                  {lessons.map((l) => (
                    <Link key={l.id} to={`/leccion/${l.id}`}>
                      <span>{l.title}</span>
                      <span className="lesson-meta">
                        {user.completed.includes(l.id) ? (
                          <CheckCircle2 size={19} />
                        ) : (
                          <Play size={17} />
                        )}{' '}
                        {l.minutes} min
                      </span>
                    </Link>
                  ))}
                  {!lessons.length && <p>Este módulo todavía no tiene lecciones publicadas.</p>}
                </div>
              </details>
            );
          })}
        </section>
        <aside className="aside">
          <img src="/images/progress.webp" alt="" />
          <h3>{user.diagnostic.length ? 'Un siguiente paso para ti' : 'Empieza por conocerte'}</h3>
          <p>
            {user.diagnostic.length
              ? focus
                ? `Te sugerimos enfocar tu práctica en ${focus.title}. Puedes explorar toda la ruta y ajustarla con tu mentor.`
                : 'Conversa con tu mentor para definir el siguiente paso cuando tu temario esté disponible.'
              : 'Comparte tu experiencia, tu estilo comercial y cómo te sientes hoy.'}
          </p>
          <ButtonLink to={user.diagnostic.length ? '/consultas' : '/diagnostico'}>
            {user.diagnostic.length ? 'Conversar con mi mentor' : 'Definir mi punto de partida'}
          </ButtonLink>
          <div className="session-mini">
            <h3>{progress(state, user) === 100 ? 'Cierra tu recorrido' : 'Observa tu avance'}</h3>
            <p>
              Conserva tu punto de partida y compáralo con tu evaluación final al completar las
              lecciones.
            </p>
            <Link className="quiet" to="/resultados">
              Ver mis resultados →
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

export function LessonPage() {
  const { id } = useParams();
  const { state, user } = useStore();
  const lesson = visibleLessons(state, user?.id).find((l) => l.id === id);
  return (
    <Access>
      {lesson ? (
        <Lesson key={lesson.id} lesson={lesson} />
      ) : (
        <Empty
          title="Esta lección no está disponible"
          action={<ButtonLink to="/ruta">Volver a mi ruta</ButtonLink>}
        >
          Puede estar en preparación o haber sido archivada.
        </Empty>
      )}
    </Access>
  );
}
function Lesson({ lesson: l }: { lesson: CourseLesson }) {
  const { state, user, run } = useStore();
  const [tab, setTab] = useState('guia'),
    [step, setStep] = useState(0),
    [answer, setAnswer] = useState<number | null>(null),
    [attachment, setAttachment] = useState<{ name: string; data: string } | null>(null),
    [fileError, setFileError] = useState(''),
    [videoError, setVideoError] = useState(false);
  const submission = state.submissions.find(
    (s) =>
      s.userId === user?.id &&
      s.lessonId === l.id &&
      (!s.purchaseId || s.purchaseId === activeAccess(state, user?.id || '')?.id),
  );
  const lessons = visibleLessons(state, user?.id),
    index = lessons.findIndex((x) => x.id === l.id),
    next = lessons[index + 1];
  const done = user?.completed.includes(l.id);
  async function attach(file?: File) {
    setAttachment(null);
    setFileError('');
    if (!file) return;
    if (
      file.size > 500000 ||
      !['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/webp'].includes(
        file.type,
      )
    ) {
      setFileError('Elige un PDF, TXT o imagen de hasta 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachment({ name: file.name, data: String(reader.result) });
    reader.onerror = () => setFileError('No pudimos leer ese archivo.');
    reader.readAsDataURL(file);
  }
  return (
    <>
      <Link className="back quiet" to="/ruta">
        <ArrowLeft size={17} /> Mi ruta
      </Link>
      <Heading title={l.title}>
        {state.modules.find((m) => m.id === l.moduleId)?.title} · {l.minutes} minutos
      </Heading>
      <div className="split lesson-layout">
        <section>
          <div className="tabs" aria-label="Contenido de la lección">
            {[
              ['guia', 'Lección'],
              ['actividad', 'Mi actividad'],
              ['recursos', 'Recursos'],
            ].map(([id, label]) => (
              <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'guia' ? (
            <>
              <section className="media">
                <div>
                  <Badge>
                    Guía interactiva · {step + 1}/{l.steps.length}
                  </Badge>
                  <h2>
                    {step === 0 ? 'Observa.' : step === 1 ? 'Conecta.' : 'Ponlo en práctica.'}
                  </h2>
                  <p>{l.steps[step]}</p>
                  <div className="actions">
                    <button
                      className="action secondary"
                      disabled={step === 0}
                      onClick={() => setStep(step - 1)}
                      aria-label="Paso anterior"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      className="action"
                      disabled={step === l.steps.length - 1}
                      onClick={() => setStep(step + 1)}
                    >
                      Siguiente idea
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
                <img src="/images/learn.webp" alt="" width="250" height="220" />
              </section>
              <p className="lead">{l.intro}</p>
              {l.video ? (
                <div className="video">
                  <video
                    controls
                    preload="metadata"
                    src={l.video}
                    onError={() => setVideoError(true)}
                    aria-label={`Video de ${l.title}`}
                  />
                  {videoError && (
                    <p role="alert">
                      No se pudo cargar el video. Puedes continuar con la guía y consultar con tu
                      mentor.
                    </p>
                  )}
                  <p className="support-note">Video incorporado por Mentorinc.</p>
                </div>
              ) : (
                <p className="support-note">
                  Esta lección incluye una guía de muestra. El video académico está pendiente de
                  incorporación.
                </p>
              )}
              {l.transcript && (
                <details className="route-item">
                  <summary>Texto equivalente / transcripción</summary>
                  <p className="preserve">{l.transcript}</p>
                </details>
              )}
              <section className="quiz">
                <h2>Qué te llevas de esta idea</h2>
                <p>{l.question}</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      run(
                        { type: 'quizAttempt', lessonId: l.id, answer: answer ?? -1 },
                        answer === l.correct
                          ? '¡Lección completada! Ahora puedes compartir tu práctica.'
                          : 'Intento guardado. Revisa la idea y vuelve a intentarlo.',
                      )
                    )
                      if (answer === l.correct) setTab('actividad');
                  }}
                >
                  <fieldset disabled={done}>
                    <legend className="sr-only">Elige una respuesta</legend>
                    {l.options.map((option, i) => (
                      <label className="choice" key={option}>
                        <input
                          type="radio"
                          name="answer"
                          required
                          checked={answer === i}
                          onChange={() => setAnswer(i)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </fieldset>
                  {done ? (
                    <Badge tone="good">
                      <CheckCircle2 size={16} /> Lección completada
                    </Badge>
                  ) : (
                    <button className="action" type="submit">
                      Comprobar y completar
                    </button>
                  )}
                </form>
              </section>
            </>
          ) : tab === 'actividad' ? (
            <>
              <h2>Ahora llévalo a tu realidad</h2>
              <p className="lead">{l.activity}</p>
              <details className="route-item" open>
                <summary>Criterios de evaluación</summary>
                <p>{l.rubric || 'Criterios pendientes de confirmar por Mentorinc.'}</p>
                <p>
                  {l.passScore
                    ? `Nota mínima para aprobar: ${l.passScore}/20.`
                    : 'Sin nota mínima configurada; el mentor revisa la actividad.'}
                </p>
              </details>
              {submission && (
                <>
                  <div className="submission">
                    <Badge tone={submission.status === 'aprobada' ? 'good' : 'pending'}>
                      {submission.status === 'aprobada'
                        ? 'Actividad aprobada'
                        : submission.status === 'revisar'
                          ? 'Ajustes solicitados'
                          : 'En revisión'}
                    </Badge>
                    <h3>Tu última entrega</h3>
                    <p className="preserve">{submission.text}</p>
                    {submission.attachment && (
                      <a
                        className="quiet"
                        download={submission.attachment.name}
                        href={submission.attachment.data}
                      >
                        <FileText size={16} /> {submission.attachment.name}
                      </a>
                    )}
                  </div>
                  {submission.feedback && (
                    <div className="feedback">
                      <h3>Feedback de tu mentor · {submission.score}/20</h3>
                      <p className="preserve">{submission.feedback}</p>
                    </div>
                  )}
                </>
              )}
              {!!submission?.revisions?.length && (
                <details className="route-item">
                  <summary>Versiones anteriores de mi actividad</summary>
                  {submission.revisions.map((r, i) => (
                    <article key={i}>
                      <h3>Entrega {i + 1}</h3>
                      <p className="preserve">{r.text}</p>
                      {r.attachment && (
                        <a download={r.attachment.name} href={r.attachment.data}>
                          {r.attachment.name}
                        </a>
                      )}
                      <p>
                        {r.feedback} {r.score !== null ? ` · ${r.score}/20` : ''}
                      </p>
                    </article>
                  ))}
                </details>
              )}
              {submission?.status !== 'aprobada' && (
                <form
                  key={submission?.date || 'new'}
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(
                      {
                        type: 'submit',
                        lessonId: l.id,
                        text: getText(e.currentTarget, 'activity'),
                        attachment: attachment || submission?.attachment || null,
                      },
                      'Actividad enviada a tu mentor',
                    );
                  }}
                >
                  <Area
                    label={submission ? 'Actualizar mi práctica' : 'Mi práctica'}
                    name="activity"
                    required
                    minLength={20}
                    maxLength={5000}
                    defaultValue={submission?.text || ''}
                    placeholder="Describe una situación concreta y lo que vas a practicar…"
                  />
                  <label htmlFor="attachment">Adjuntar evidencia (opcional)</label>
                  <input
                    id="attachment"
                    type="file"
                    accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => void attach(e.target.files?.[0])}
                  />
                  <p className="support-note">
                    PDF, texto o imagen. Máximo 500 KB; se guardará en este navegador.
                  </p>
                  {fileError && (
                    <p className="error" role="alert">
                      {fileError}
                    </p>
                  )}
                  {attachment && <Badge>{attachment.name}</Badge>}
                  <button className="action" disabled={!!fileError}>
                    Enviar a mi mentor
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h2>Recursos para practicar</h2>
              <p className="lead">Llévate las ideas y la actividad para seguir trabajando.</p>
              <button
                className="resource-row"
                onClick={() =>
                  download(
                    `Mentorinc-${l.id}.txt`,
                    `${l.title}\n\nMaterial formativo de muestra · Mentorinc\n\n${l.intro}\n\n${l.steps.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}\n\nTu actividad\n${l.activity}`,
                  )
                }
              >
                <Download size={23} />
                <span>
                  <strong>Guía de práctica</strong>
                  <span className="soft">Texto descargable con las ideas y el ejercicio</span>
                </span>
                <ArrowRight size={18} />
              </button>
              {l.resource && (
                <a
                  className="resource-row"
                  href={l.resource}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText size={23} />
                  <span>{l.resourceName || 'Recurso complementario'}</span>
                  <ArrowRight size={18} />
                </a>
              )}
              <Link className="resource-row" to="/consultas">
                <MessageCircle size={23} />
                <span>Consultar una duda con mi mentor</span>
                <ArrowRight size={18} />
              </Link>
            </>
          )}
          <div className="lesson-bottom">
            <Link className="quiet" to="/ruta">
              Ver mi ruta
            </Link>
            {next && (
              <ButtonLink to={`/leccion/${next.id}`} secondary>
                Siguiente lección
              </ButtonLink>
            )}
          </div>
        </section>
        <aside className="aside">
          <h3>En este módulo</h3>
          {lessons
            .filter((x) => x.moduleId === l.moduleId)
            .map((x) => (
              <Link
                className={`lesson-nav ${x.id === l.id ? 'current' : ''}`}
                aria-current={x.id === l.id ? 'page' : undefined}
                to={`/leccion/${x.id}`}
                key={x.id}
              >
                {x.title}
                {user?.completed.includes(x.id) && <CheckCircle2 size={17} />}
              </Link>
            ))}
          <details className="route-item">
            <summary>Mis intentos de esta lección</summary>
            {state.quizAttempts
              .filter((a) => a.userId === user?.id && a.lessonId === l.id)
              .slice()
              .reverse()
              .map((a) => (
                <p key={a.id}>
                  {a.answer} · {a.correct ? 'Correcto' : 'Por revisar'}
                </p>
              ))}
          </details>
          <Link to="/practica">Practicar con casos →</Link>
          <p className="soft">
            Completar la lección y recibir feedback son dos pasos distintos de tu práctica.
          </p>
          <Link className="quiet" to="/agenda">
            Preparar una mentoría →
          </Link>
        </aside>
      </div>
    </>
  );
}
