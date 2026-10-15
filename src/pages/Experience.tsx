import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { activeAccess, programLessons, visibleLessons, dateLabel, money } from '../model';
import { currentPolicies, recognition } from '../operations';
import { Area, Heading, ButtonLink, Empty, Badge, getText, download } from '../ui';
import { Comparison } from '../measurement-ui';

export function PolicyCheck() {
  return (
    <div className="policy-check">
      <label>
        <input type="checkbox" name="accepted" required /> He leído las condiciones de esta
        demostración y usaré datos ficticios.
      </label>
      <p>
        <Link to="/politicas/privacidad" target="_blank">
          Privacidad
        </Link>{' '}
        ·{' '}
        <Link to="/politicas/compra" target="_blank">
          Compra
        </Link>{' '}
        ·{' '}
        <Link to="/politicas/devoluciones" target="_blank">
          Devoluciones
        </Link>
      </p>
      <p className="support-note">
        Se registra la versión consultada en este navegador. No se contrata ni se cobra un servicio.
      </p>
    </div>
  );
}
export function Policies() {
  const { kind } = useParams(),
    { state } = useStore();
  const policy = currentPolicies(state).find((p) => p.kind === kind);
  if (!policy)
    return (
      <Empty
        title="Documento no disponible"
        action={<ButtonLink to="/ayuda">Ir a ayuda</ButtonLink>}
      />
    );
  return (
    <>
      <Heading title={policy.title}>
        Versión {policy.version} · {dateLabel(policy.updatedAt)}
      </Heading>
      <article className="reading-panel">
        <Badge tone={policy.status === 'aprobada' ? 'good' : 'pending'}>
          {policy.status === 'aprobada'
            ? 'Validación declarada en esta copia local'
            : 'Borrador pendiente de Mentorinc'}
        </Badge>
        <p className="preserve">{policy.body}</p>
        {policy.approvedBy && <p>Revisado por: {policy.approvedBy}</p>}
        <p className="support-note">
          Esta publicación sigue siendo una demostración. El texto definitivo y su aplicación
          operativa requieren conformidad de Mentorinc.
        </p>
        <ButtonLink secondary to="/soporte">
          Solicitar atención
        </ButtonLink>
      </article>
    </>
  );
}
export function ProgramDetail() {
  const { id } = useParams(),
    { state, user, run } = useStore(),
    navigate = useNavigate();
  const p = state.programs.find((p) => p.id === id && p.published);
  if (!p)
    return (
      <Empty
        title="Programa no disponible"
        action={<ButtonLink to="/programas">Ver programas</ButtonLink>}
      />
    );
  const lessons = programLessons(state, p.id),
    access = user && activeAccess(state, user.id);
  return (
    <>
      <Heading title={`Tu recorrido ${p.name}`}>{p.description}</Heading>
      <div className="split">
        <section>
          <h2>Lo que incluye</h2>
          <p className="lead">
            {p.audience ||
              'Para personas que quieren fortalecer su práctica comercial con acompañamiento.'}
          </p>
          <ul className="check-list">
            <li>{lessons.length} lecciones con práctica y feedback.</li>
            <li>
              {p.sessions} sesiones de {p.minutes} minutos.
            </li>
            <li>
              {p.accessDays
                ? `${p.accessDays} días desde la aprobación de acceso.`
                : 'Sin vencimiento configurado en esta demostración.'}
            </li>
            <li>
              {p.requireReviews
                ? 'El cierre requiere lecciones completas y actividades aprobadas.'
                : 'El cierre requiere completar las lecciones; las actividades reciben feedback por separado.'}
            </li>
          </ul>
          {state.modules
            .filter((m) => lessons.some((l) => l.moduleId === m.id))
            .map((m) => (
              <details className="route-item" key={m.id}>
                <summary>
                  <h3>{m.title}</h3>
                </summary>
                <ul>
                  {lessons
                    .filter((l) => l.moduleId === m.id)
                    .map((l) => (
                      <li key={l.id}>
                        {l.title} · {l.minutes} min
                      </li>
                    ))}
                </ul>
              </details>
            ))}
          <p className="support-note">
            Temario y condiciones de muestra, configurables por Mentorinc. La inscripción conserva
            la selección de lecciones y las reglas de acceso de ese momento.
          </p>
        </section>
        <aside className="journey-next">
          <img src="/images/learn.webp" alt="" />
          <h2>{money(p.price)}</h2>
          <p>Precio de ejemplo · sin cobros</p>
          {access ? (
            <ButtonLink to="/compras">Revisar mi programa actual</ButtonLink>
          ) : !user ? (
            <>
              <button
                className="action full"
                onClick={() => {
                  if (run({ type: 'selectProgram', programId: p.id }, '')) navigate('/registro');
                }}
              >
                Crear cuenta y continuar
              </button>
              <Link
                to="/acceso"
                onClick={() => run({ type: 'selectProgram', programId: p.id }, '')}
              >
                Ya tengo una cuenta
              </Link>
            </>
          ) : user.role !== 'alumno' ? (
            <p>Recorre la inscripción con una cuenta de alumno.</p>
          ) : !user.verified ? (
            <ButtonLink to="/correo">Confirmar mi correo</ButtonLink>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  run(
                    {
                      type: 'purchase',
                      programId: p.id,
                      accepted: new FormData(e.currentTarget).get('accepted') === 'on',
                    },
                    'Solicitud de compra creada',
                  )
                )
                  navigate('/compras');
              }}
            >
              <PolicyCheck />
              <button className="action full" disabled={!lessons.length}>
                Solicitar inscripción de prueba
              </button>
            </form>
          )}
          <Link to="/soporte">Necesito ayuda con mi inscripción →</Link>
        </aside>
      </div>
    </>
  );
}

export function Practice() {
  const { id } = useParams(),
    { state, user, run } = useStore();
  const [answers, setAnswers] = useState<number[]>([]),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    setAnswers([]);
    setSaved(false);
  }, [id]);
  if (!user || user.role !== 'alumno')
    return (
      <Empty
        title="Practica desde tu cuenta de alumno"
        action={<ButtonLink to="/acceso">Entrar</ButtonLink>}
      />
    );
  const lessons = visibleLessons(state, user.id),
    available = state.cases.filter(
      (c) => c.published && lessons.some((l) => l.moduleId === c.moduleId),
    );
  const access = activeAccess(state, user.id),
    caseItem = available.find((c) => c.id === id);
  const attempts = state.caseAttempts.filter(
    (a) => a.userId === user.id && (!access || a.purchaseId === access.id),
  );
  if (id && !caseItem)
    return (
      <Empty
        title="Este caso no pertenece a tu ruta"
        action={<ButtonLink to="/practica">Ver casos</ButtonLink>}
      />
    );
  if (caseItem) {
    if (!access)
      return (
        <Empty
          title="Revisa el acceso a tu programa"
          action={<ButtonLink to="/compras">Mis compras</ButtonLink>}
        />
      );
    const last = attempts.filter((a) => a.caseId === id).at(-1);
    return (
      <>
        <Heading title={caseItem.title}>{caseItem.intro}</Heading>
        <div className="reading-panel">
          <Badge>Caso guiado de muestra · sin IA</Badge>
          {saved && last ? (
            <>
              <h2>De la decisión a tu práctica</h2>
              <p>
                {last.score} de {last.maximum} puntos de práctica. No es una calificación académica.
              </p>
              {last.feedback.map((f, i) => (
                <p key={i}>
                  <strong>Decisión {i + 1}.</strong> {f}
                </p>
              ))}
              <blockquote>{last.reflection}</blockquote>
              <div className="actions">
                <ButtonLink to="/practica">Ver mis reconocimientos</ButtonLink>
                <button
                  className="action secondary"
                  onClick={() => {
                    setSaved(false);
                    setAnswers([]);
                  }}
                >
                  Volver a practicar
                </button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  run(
                    {
                      type: 'caseAttempt',
                      caseId: caseItem.id,
                      answers,
                      reflection: getText(e.currentTarget, 'reflection'),
                    },
                    'Práctica guardada',
                  )
                )
                  setSaved(true);
              }}
            >
              {caseItem.steps.map((step, i) => (
                <fieldset
                  className="case-step"
                  key={i}
                  disabled={i > 0 && answers[i - 1] === undefined}
                >
                  <legend>
                    {i + 1}. {step.question}
                  </legend>
                  {step.options.map((o, j) => (
                    <label className="choice" key={j}>
                      <input
                        type="radio"
                        required
                        name={`decision-${i}`}
                        checked={answers[i] === j}
                        onChange={() => setAnswers([...answers.slice(0, i), j])}
                      />
                      <span>{o.text}</span>
                    </label>
                  ))}
                  {answers[i] !== undefined && (
                    <p className="notice">{step.options[answers[i]].feedback}</p>
                  )}
                </fieldset>
              ))}
              <Area
                label="¿Qué aplicarás en una conversación real?"
                name="reflection"
                required
                minLength={10}
                maxLength={2000}
              />
              <button className="action" disabled={answers.length !== caseItem.steps.length}>
                Guardar mi práctica
              </button>
            </form>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <Heading title="Aprender también es practicar">
        Decide, observa las consecuencias y prepara tu siguiente conversación.
      </Heading>
      <Recognition />
      <div className="three-up">
        {available.map((c) => (
          <article className="program" key={c.id}>
            <h2>{c.title}</h2>
            <p>{c.intro}</p>
            <p>{attempts.filter((a) => a.caseId === c.id).length} intentos guardados</p>
            <ButtonLink to={`/practica/${c.id}`}>{access ? 'Practicar' : 'Ver caso'}</ButtonLink>
          </article>
        ))}
      </div>
      {!available.length && <Empty title="No hay casos publicados para esta ruta" />}
      <section className="section-spaced">
        <h2>Tu historial de práctica</h2>
        {attempts.length ? (
          attempts
            .slice()
            .reverse()
            .map((a) => (
              <details className="route-item" key={a.id}>
                <summary>
                  <strong>{a.title}</strong>
                  <span>
                    {a.score}/{a.maximum} · {dateLabel(a.date)}
                  </span>
                </summary>
                <p>{a.reflection}</p>
                {a.feedback.map((f, i) => (
                  <p key={i}>
                    {i + 1}. {f}
                  </p>
                ))}
              </details>
            ))
        ) : (
          <p>
            Al guardar un caso aparecerá aquí. Los reintentos conservan su resultado y no duplican
            los 20 puntos por caso.
          </p>
        )}
      </section>
    </>
  );
}
export function Recognition({ userId }: { userId?: string }) {
  const { state, user } = useStore();
  const id = userId || user?.id;
  if (!id) return null;
  const r = recognition(state, id);
  return (
    <section className="recognition">
      <div>
        <h2>Pequeños pasos, progreso visible</h2>
        <p>
          <strong>{r.points} puntos</strong> · 10 por lección y 20 por caso, una vez por recorrido.
          Reconocimientos internos, sin certificación.
        </p>
      </div>
      <div className="three-up">
        {r.badges.map((b) => (
          <div key={b.name} className={b.earned ? 'award earned' : 'award'}>
            <span aria-hidden="true">{b.earned ? '✦' : '○'}</span>
            <h3>{b.name}</h3>
            <p>{b.description}</p>
            <Badge tone={b.earned ? 'good' : ''}>{b.earned ? 'Conseguido' : 'Por alcanzar'}</Badge>
          </div>
        ))}
      </div>
    </section>
  );
}
export function LearningHistory({ userId }: { userId?: string }) {
  const { state, user: currentUser } = useStore();
  const user = userId ? state.users.find((u) => u.id === userId) : currentUser;
  if (!user?.history?.length) return null;
  return (
    <section className="section-spaced">
      <h2>Recorridos anteriores</h2>
      {user.history.map((h, i) => (
        <details className="route-item" key={`${h.purchaseId}-${i}`}>
          <summary>
            {state.programs.find(
              (p) => p.id === state.purchases.find((p) => p.id === h.purchaseId)?.programId,
            )?.name || 'Programa anterior'}{' '}
            · {h.completed.length} lecciones
          </summary>
          <Comparison user={{ ...user, ...h }} />
          {h.satisfaction && (
            <p>
              Satisfacción guardada: {h.satisfaction.overall}/5 · {h.satisfaction.comment}
            </p>
          )}
        </details>
      ))}
    </section>
  );
}

export const helpSections = [
  {
    title: 'Alumno: de la inscripción al cierre',
    steps: [
      'Elige un programa y revisa su temario, vigencia y mentorías. Crea tu cuenta con un correo ficticio y confirma desde Correo de prueba.',
      'Completa tu contexto y medición inicial. Solicita la inscripción, simula el pago y espera la aprobación desde administración.',
      'En Mi ruta abre la lección, responde la comprobación y envía tu actividad. Consulta la rúbrica y conserva el feedback; puedes corregir si el mentor solicita ajustes.',
      'En Práctica resuelve casos guiados. En Agenda reserva, reprograma o cancela según los cupos de tu programa.',
      'Mi avance muestra tu medición inicial. Al cumplir los requisitos del programa, guarda la evaluación final y la encuesta.',
      'Para problemas de acceso, pago o atención utiliza Ayuda y soporte. Puedes abrir solicitudes incluso sin acceso al aula.',
    ],
  },
  {
    title: 'Mentor: acompañar y evaluar',
    steps: [
      'Elige el perfil de Ana en la demostración. Mis alumnos muestra solo tus asignados.',
      'Revisa su contexto, mediciones y práctica. Ajusta el foco de la ruta e inicia una conversación si necesita seguimiento.',
      'Abre Entregas, consulta la rúbrica y califica. Aprueba si cumple el mínimo o solicita ajustes explicando qué mejorar.',
      'Gestiona disponibilidad y reuniones en Agenda. Añade un enlace HTTPS de videollamada y registra la asistencia después de la sesión.',
      'Resultados permite revisar comparación, satisfacción y mentoría. El filtro de fechas usa Lima; el saldo actual se muestra separado.',
    ],
  },
  {
    title: 'Administración: operar la plataforma',
    steps: [
      'En Programas configura temario, precio de muestra, vigencia, sesiones y si el cierre exige actividades aprobadas. Los cambios se aplican a nuevas inscripciones.',
      'En Compras confirma el resultado simulado y aprueba el acceso. Un reembolso revoca esa compra y cancela sus reservas pendientes.',
      'En Contenido edita guías, actividades, preguntas, recursos y criterios. Identifica el material de muestra y marca validado solo con conformidad académica.',
      'En Operación edita casos y políticas; cada cambio de política conserva su versión anterior. Registra quién aprobó el texto antes de declararlo validado.',
      'En Soporte asigna un responsable, responde y cierra solicitudes. El alumno puede reabrirlas y descargar la constancia local.',
      'Revisa resultados y exporta CSV. Datos locales permite exportar y restaurar una copia validada; antes de reemplazar se descarga el respaldo actual.',
      'Preparación de entrega lista los insumos y servicios pendientes. Documenta responsables y capacitación; el checklist no conecta proveedores.',
    ],
  },
];
export function Help() {
  const { state, user } = useStore();
  return (
    <>
      <Heading title="Estamos para acompañarte">
        Encuentra el siguiente paso, aprende a usar tu espacio o solicita atención.
      </Heading>
      <div className="help-actions">
        <ButtonLink to="/soporte">Abrir ayuda y soporte</ButtonLink>
        <ButtonLink secondary to="/soporte?tipo=reclamo">
          Registrar reclamo de prueba
        </ButtonLink>
        <ButtonLink secondary to="/programas">
          Conocer programas
        </ButtonLink>
      </div>
      <div className="split">
        <section>
          {helpSections.map((h) => (
            <details className="route-item" key={h.title}>
              <summary>
                <h2>{h.title}</h2>
              </summary>
              <ol>
                {h.steps.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </details>
          ))}
          <button
            className="action secondary"
            onClick={() =>
              download(
                'Mentorinc-guia-de-uso.txt',
                helpSections
                  .map(
                    (h) => `${h.title}\n\n${h.steps.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}`,
                  )
                  .join('\n\n---\n\n'),
              )
            }
          >
            Descargar guía por roles
          </button>
          <h2 className="section-spaced">Preguntas frecuentes</h2>
          {[
            [
              'Pagué, pero no puedo entrar',
              'En esta demo, confirmar el pago y aprobar el acceso son pasos distintos. Revisa Mis compras o abre una solicitud de soporte. También verifica si el programa tiene vencimiento.',
            ],
            [
              '¿Por qué cambia mi temario respecto al catálogo?',
              'Tu inscripción conserva las lecciones contratadas. Los cambios de módulos del catálogo se aplican a nuevas compras; archivar una lección puede retirarla temporalmente.',
            ],
            [
              '¿Cómo se habilita la evaluación final?',
              'Necesitas diagnóstico inicial, acceso vigente y todas las lecciones completas. Si tu programa exige revisión académica, también deben estar aprobadas sus actividades.',
            ],
            [
              '¿Cuándo puedo valorar la mentoría?',
              'La encuesta de cierre muestra esta valoración después de al menos una sesión registrada como realizada.',
            ],
            [
              '¿Dónde están mis datos?',
              'Solo en este navegador y dirección web. Exporta una copia desde Datos locales. Para trasladarla a otro navegador, utiliza Restaurar copia. No hay sincronización con otras personas.',
            ],
            [
              '¿Se realizan cobros o envíos?',
              'No. Pagos, correos, reclamaciones y permisos son demostraciones locales. Las integraciones reales se habilitarán en una etapa posterior.',
            ],
          ].map(([q, a]) => (
            <details className="route-item" key={q}>
              <summary>
                <h3>{q}</h3>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <aside className="aside">
          <img src="/images/mail.webp" alt="" />
          <h2>Atención del equipo</h2>
          <p>
            {state.delivery.supportOwner ||
              'Responsable operativo pendiente de confirmar por Mentorinc.'}
          </p>
          <p>{state.delivery.supportHours || 'Horario de atención pendiente de confirmar.'}</p>
          <p>Las solicitudes de esta versión permanecen en tu navegador.</p>
          <Link to="/ajustes">Copia y recuperación de datos →</Link>
          {user && <Link to="/cuenta">Mi cuenta →</Link>}
        </aside>
      </div>
    </>
  );
}
